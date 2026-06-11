"use client";
import { useState } from "react";
import { api, AssistantResponse } from "@/lib/api";

const SAMPLES = [
  "How many students were allocated to each course?",
  "Which students did not receive their first preference?",
  "Which course had the highest rejection rate?",
  "Show category-wise allocation summary.",
];

interface Turn { q: string; res?: AssistantResponse; error?: string }

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  async function ask(q: string) {
    if (!q.trim()) return;
    setBusy(true);
    setTurns((t) => [{ q }, ...t]);
    try {
      const res = await api.ask(q);
      setTurns((t) => t.map((turn, i) => (i === 0 ? { ...turn, res } : turn)));
    } catch (e: any) {
      setTurns((t) => t.map((turn, i) => (i === 0 ? { ...turn, error: e.message } : turn)));
    } finally {
      setBusy(false); setQuestion("");
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">🤖 AI Assistant</h1>
        <p className="text-slate-600 text-sm mt-1">Ask questions about allocations in natural language. Powered by local LLM (text-to-SQL).</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(question); }} className="card flex gap-3">
        <input className="input flex-1" placeholder="e.g. Which course had the highest rejection rate?" 
          value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="btn whitespace-nowrap" disabled={busy}>{busy ? "⏳ Thinking…" : "🔍 Ask"}</button>
      </form>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-600">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button key={s} className="btn-ghost text-xs px-3 py-1.5" onClick={() => ask(s)} disabled={busy}>
              → {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {turns.map((t, i) => (
          <div key={i} className="card space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👤</span>
              <p className="font-semibold text-slate-800 pt-1">{t.q}</p>
            </div>
            {t.error && <div className="error-box">{t.error}</div>}
            {t.res && (
              <>
                <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-4">
                  <span className="text-2xl flex-shrink-0">🤖</span>
                  <div className="flex-1">
                    <p className="text-slate-800">{t.res.answer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`badge ${t.res.source === "llm" ? "badge-primary" : "badge-success"}`}>
                    {t.res.source === "llm" ? "🧠 LLM Generated" : "📊 Built-in Report"}
                  </span>
                </div>
                {t.res.sql && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-semibold text-slate-600 hover:text-slate-800">Show SQL query</summary>
                    <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto mt-2 text-xs">{t.res.sql}</pre>
                  </details>
                )}
                {t.res.rows.length > 0 && (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {Object.keys(t.res.rows[0]).map((k) => (
                            <th key={k} className="th">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {t.res.rows.slice(0, 10).map((row, ri) => (
                          <tr key={ri} className="tr-hover">
                            {Object.values(row).map((v, vi) => (
                              <td key={vi} className="td">{String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {t.res.rows.length > 10 && (
                      <p className="text-xs text-slate-500 p-3 border-t border-slate-200">
                        Showing 10 of {t.res.rows.length} results
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
