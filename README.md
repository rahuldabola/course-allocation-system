# 🎓 AI-Powered Student Course Allocation System

A full-stack system that allocates university course seats by **merit and
reservation rules**, with a dashboard for analytics and an **AI assistant**
that answers questions about the allocation in plain English (text-to-SQL via a
local LLM).

> Stack: **Next.js + Tailwind** · **FastAPI** · **PostgreSQL** · **Ollama (local LLM)**

---

## ✨ Features

- Normalized (3NF) PostgreSQL schema.
- REST APIs for student registration, course management, and allocation.
- Merit + reservation **allocation engine** (unit-tested, pure-function core).
- Dashboard: allocated students, available seats, course statistics, category-wise allocation, rejection rates.
- AI Assistant answering the required report questions — and arbitrary ones — by
  generating safe read-only SQL.

---

## 🚀 Quick start (Docker — recommended)

```bash
docker compose up --build
# one-time: pull a model for the AI assistant
docker compose exec ollama ollama pull llama3.1
# seed sample data (5 courses, 50 students)
docker compose exec backend python -m app.seed
```

- Frontend → http://localhost:3000
- API docs (Swagger) → http://localhost:8000/docs

> The AI assistant works **without** Ollama too: it falls back to built-in
> report queries for the four required questions.

---

## 🛠️ Local development (without Docker)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# point DATABASE_URL at a running Postgres (see .env.example)
cp .env.example .env
python -m app.seed                       # create tables + sample data
uvicorn app.main:app --reload            # http://localhost:8000
pytest                                   # run allocation unit tests
```

**Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                              # http://localhost:3000
```

---

## 🗄️ Database schema (3NF)

```
categories(id, code, name)
students(id, roll_no, name, marks, category_id→categories, application_date)
courses(id, name, total_seats)
course_quotas(id, course_id→courses, category_id→categories, reserved_seats)   UNIQUE(course_id, category_id)
preferences(id, student_id→students, course_id→courses, priority)              UNIQUE(student_id, priority), UNIQUE(student_id, course_id)
allocations(id, student_id→students UNIQUE, course_id→courses, seat_type, preference_rank, allocated_at)
```

`open_seats(course) = total_seats − Σ reserved_seats`. The `UNIQUE` constraint on
`allocations.student_id` enforces **one course per student** at the schema level.

---

## 🧮 Allocation algorithm

Implemented in [`backend/app/allocation.py`](backend/app/allocation.py) as a pure,
unit-tested function.

1. **Merit order** — students sorted by `marks DESC`, ties broken by earlier
   `application_date`.
2. Walk students in that order; for each, try preferences **1 → 2 → 3**:
   - A **General** student can take only an **open** seat.
   - A **reserved** (OBC/SC/ST) student takes an **open** seat if available
     (earned on merit), otherwise a **reserved** seat of their own category.
   - The first preference with an available seat wins; the student is then done.
3. A student matching none of their preferences remains **unallocated**.

This treats reserved seats as a **floor guarantee**: high-merit reserved students
consume open seats, leaving reserved seats for lower-merit peers of the same
category. `POST /allocation/run` is **idempotent** — it clears and recomputes.

**Worked example** — course with `total=2, SC reserved=1` (so 1 open + 1 SC):
- General@95 → open seat
- SC@60 → SC reserved seat ✅ (floor honored)

If instead SC@99 and SC@70 apply: SC@99 → open seat, SC@70 → SC reserved seat.

---

## 🔌 API overview

| Method | Path | Purpose |
|---|---|---|
| POST | `/students` | Register a student + up to 3 preferences |
| GET | `/students` | List students (by marks) |
| DELETE | `/students/{id}` | Remove a student |
| POST | `/courses` | Create a course with category quotas |
| GET | `/courses` | List courses (with open/reserved seats) |
| PUT | `/courses/{id}` | Update course / quotas |
| POST | `/allocation/run` | Run (idempotent) allocation |
| GET | `/allocation` | List current allocations |
| GET | `/dashboard/stats` | Aggregated dashboard statistics |
| POST | `/assistant/query` | Ask the AI assistant a question |

Full interactive docs at `/docs`.

---

## 🤖 AI Assistant (text-to-SQL)

`POST /assistant/query` sends the schema + question to the local LLM, which
returns a query. Safety: only a **single read-only `SELECT`** is allowed
(keyword blocklist + single-statement check), executed in a **read-only
transaction with a 5s statement timeout**. Results are summarized back in
natural language. If the LLM is unreachable, built-in queries answer the four
required questions:

- How many students were allocated to each course?
- Which students did not receive their first preference?
- Which course had the highest rejection rate?
- Category-wise allocation summary.

---

## ☁️ Deployment (optional)

- **Frontend** → Vercel (set `NEXT_PUBLIC_API_URL`).
- **Backend** → Render / Fly.io / Railway (set `DATABASE_URL`, `OLLAMA_URL`).
- **DB** → managed Postgres (Neon / Supabase / RDS).

---

## 🧪 Tests

```bash
cd backend && pytest -q     # allocation engine unit tests
```
