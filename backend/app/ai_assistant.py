"""AI assistant: natural-language question -> read-only SQL -> answer.

Uses a local Ollama model to generate SQL against the known schema. SQL is
validated to be a single read-only SELECT before execution, run inside a
read-only transaction with a statement timeout. If Ollama is unavailable, a
small library of canned queries covers the required report questions.
"""
from __future__ import annotations

import re

import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import settings

SCHEMA_DESCRIPTION = """
Tables (PostgreSQL):
  categories(id, code, name)            -- code in ('General','OBC','SC','ST')
  students(id, roll_no, name, marks, category_id, application_date)
  courses(id, name, total_seats)
  course_quotas(id, course_id, category_id, reserved_seats)
  preferences(id, student_id, course_id, priority)   -- priority 1..3
  allocations(id, student_id, course_id, seat_type, preference_rank, allocated_at)
Notes:
  - allocations has at most one row per student (the allocated course).
  - A student "did not receive their first preference" if their allocation's
    preference_rank > 1, or they have no allocation row at all.
  - open seats of a course = total_seats - sum(course_quotas.reserved_seats).
"""

FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|"
    r"copy|merge|replace|attach|pragma)\b",
    re.IGNORECASE,
)

# Canned answers used when the LLM is unavailable. Keyed by intent keywords.
FALLBACK_QUERIES: list[tuple[re.Pattern, str, str]] = [
    (
        re.compile(r"how many.*each course|allocated to each course|per course", re.I),
        "How many students were allocated to each course",
        """SELECT c.name AS course, COUNT(a.id) AS allocated
           FROM courses c LEFT JOIN allocations a ON a.course_id = c.id
           GROUP BY c.name ORDER BY allocated DESC;""",
    ),
    (
        re.compile(r"first preference|not.*first|did not.*first", re.I),
        "Students who did not receive their first preference",
        """SELECT s.roll_no, s.name, c.name AS allocated_course, a.preference_rank
           FROM students s
           LEFT JOIN allocations a ON a.student_id = s.id
           LEFT JOIN courses c ON c.id = a.course_id
           WHERE a.id IS NULL OR a.preference_rank > 1
           ORDER BY s.name;""",
    ),
    (
        re.compile(r"highest rejection|rejection rate|most rejection", re.I),
        "Course with the highest rejection rate",
        # Must stay identical to the dashboard's definition
        # (app/routers/dashboard.py): (applicants - allocated) / applicants,
        # rounded to 4 dp, and 0 (not NULL) when there are no applicants.
        """SELECT c.name AS course,
                  COUNT(DISTINCT p.student_id) AS applicants,
                  COUNT(DISTINCT a.student_id) AS allocated,
                  ROUND(COALESCE(
                      (COUNT(DISTINCT p.student_id) - COUNT(DISTINCT a.student_id))::numeric
                      / NULLIF(COUNT(DISTINCT p.student_id), 0), 0), 4) AS rejection_rate
           FROM courses c
           LEFT JOIN preferences p ON p.course_id = c.id
           LEFT JOIN allocations a ON a.course_id = c.id AND a.student_id = p.student_id
           GROUP BY c.name ORDER BY rejection_rate DESC;""",
    ),
    (
        re.compile(r"category.*allocation|category-wise|by category|category summary", re.I),
        "Category-wise allocation summary",
        """SELECT cat.code AS category, COUNT(a.id) AS allocated
           FROM categories cat
           LEFT JOIN students s ON s.category_id = cat.id
           LEFT JOIN allocations a ON a.student_id = s.id
           GROUP BY cat.code ORDER BY allocated DESC;""",
    ),
]


def _is_safe_select(sql: str) -> bool:
    cleaned = sql.strip().rstrip(";").strip()
    if not cleaned.lower().startswith(("select", "with")):
        return False
    if ";" in cleaned:  # disallow multiple statements
        return False
    if FORBIDDEN.search(cleaned):
        return False
    return True


def _run_sql(db: Session, sql: str) -> list[dict]:
    """Execute SELECT in a read-only transaction with a statement timeout."""
    sql = sql.strip().rstrip(";")
    db.execute(text("SET TRANSACTION READ ONLY"))
    db.execute(text("SET LOCAL statement_timeout = 5000"))
    result = db.execute(text(sql))
    rows = [dict(r._mapping) for r in result.fetchall()]
    db.rollback()  # end the read-only transaction cleanly
    return rows


def _ask_ollama(prompt: str, system: str) -> str:
    resp = httpx.post(
        f"{settings.ollama_url}/api/generate",
        json={
            "model": settings.ollama_model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {"temperature": 0},
        },
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json().get("response", "")


def _extract_sql(textval: str) -> str:
    fence = re.search(r"```(?:sql)?\s*(.*?)```", textval, re.S | re.I)
    candidate = fence.group(1) if fence else textval
    # Trim to the first statement.
    m = re.search(r"(with|select)\b.*", candidate, re.S | re.I)
    return (m.group(0) if m else candidate).strip()


def answer_question(db: Session, question: str) -> dict:
    """Return {sql, rows, answer, source} for a natural-language question."""
    # 1) Try the LLM (text-to-SQL).
    try:
        sql_system = (
            "You are a PostgreSQL expert. Given a question, return ONLY a single "
            "read-only SELECT query (no prose, no markdown) that answers it using "
            f"this schema:\n{SCHEMA_DESCRIPTION}"
        )
        raw = _ask_ollama(question, sql_system)
        sql = _extract_sql(raw)
        if _is_safe_select(sql):
            rows = _run_sql(db, sql)
            answer = _summarize(question, rows)
            return {"sql": sql, "rows": rows, "answer": answer, "source": "llm"}
    except Exception:
        pass  # fall back below

    # 2) Fallback: canned query matching the required report questions.
    for pattern, label, sql in FALLBACK_QUERIES:
        if pattern.search(question):
            rows = _run_sql(db, sql)
            return {
                "sql": sql.strip(),
                "rows": rows,
                "answer": f"{label}: {len(rows)} row(s). "
                + _summarize(question, rows),
                "source": "fallback",
            }

    return {
        "sql": None,
        "rows": [],
        "answer": (
            "I couldn't reach the local LLM and this question doesn't match a "
            "built-in report. Try: 'How many students per course?', "
            "'Who didn't get their first preference?', 'Which course has the "
            "highest rejection rate?', or 'Category-wise allocation summary'."
        ),
        "source": "fallback",
    }


def _summarize(question: str, rows: list[dict]) -> str:
    """Optionally let the LLM phrase results; otherwise a compact text summary."""
    if not rows:
        return "No matching records found."
    try:
        sys = "Answer the user's question in 1-3 sentences using ONLY the JSON rows provided."
        prompt = f"Question: {question}\nRows: {rows[:50]}"
        text_answer = _ask_ollama(prompt, sys).strip()
        if text_answer:
            return text_answer
    except Exception:
        pass
    # Plain fallback summary.
    preview = ", ".join(
        " / ".join(f"{k}={v}" for k, v in row.items()) for row in rows[:5]
    )
    more = "" if len(rows) <= 5 else f" (+{len(rows) - 5} more)"
    return f"{preview}{more}"
