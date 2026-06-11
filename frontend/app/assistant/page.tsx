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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-sm text-slate-500">Ask questions about allocations in plain English. Powered by a local LLM (text-to-SQL).</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(question); }} className="card flex gap-3">
        <input className="input" placeholder="e.g. Which course had the highest rejection rate?"
          value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="btn" disabled={busy}>{busy ? "Thinking…" : "Ask"}</button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button key={s} className="btn-ghost text-xs" onClick={() => ask(s)} disabled={busy}>{s}</button>
        ))}
      </div>

      <div className="space-y-4">
        {turns.map((t, i) => (
          <div key={i} className="card space-y-3">
            <p className="font-medium">🧑 {t.q}</p>
            {t.error && <p className="text-red-600 text-sm">{t.error}</p>}
            {t.res && (
              <>
                <p className="text-slate-800">🤖 {t.res.answer}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className={`badge ${t.res.source === "llm" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                    {t.res.source === "llm" ? "LLM" : "built-in report"}
                  </span>
                </div>
                {t.res.sql && (
                  <pre className="bg-slate-900 text-slate-100 text-xs rounded-lg p-3 overflow-x-auto">{t.res.sql}</pre>
                )}
                {t.res.rows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>{Object.keys(t.res.rows[0]).map((k) => <th key={k} className="th">{k}</th>)}</tr>
                      </thead>
                      <tbody>
                        {t.res.rows.slice(0, 25).map((row, ri) => (
                          <tr key={ri}>
                            {Object.values(row).map((v, vi) => <td key={vi} className="td">{String(v)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
