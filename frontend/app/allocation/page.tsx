"use client";
import { useEffect, useState } from "react";
import { api, Allocation } from "@/lib/api";

export default function AllocationPage() {
  const [rows, setRows] = useState<Allocation[]>([]);
  const [summary, setSummary] = useState<{ total: number; allocated: number; unallocated: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.listAllocations().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function run() {
    setBusy(true); setError("");
    try {
      const r = await api.runAllocation();
      setRows(r.allocations);
      setSummary({ total: r.total_students, allocated: r.allocated, unallocated: r.unallocated });
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  const badge = (rank: number) =>
    rank === 1 ? "bg-emerald-100 text-emerald-700"
      : rank === 2 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Allocation</h1>
        <button className="btn" onClick={run} disabled={busy}>
          {busy ? "Processing…" : "▶ Run allocation"}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card"><p className="label">Total</p><p className="text-2xl font-bold">{summary.total}</p></div>
          <div className="card"><p className="label">Allocated</p><p className="text-2xl font-bold text-emerald-600">{summary.allocated}</p></div>
          <div className="card"><p className="label">Unallocated</p><p className="text-2xl font-bold text-red-500">{summary.unallocated}</p></div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Student</th><th className="th">Marks</th>
              <th className="th">Category</th><th className="th">Course</th>
              <th className="th">Seat</th><th className="th">Preference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.student_id}>
                <td className="td">
                  <div className="font-medium">{a.student_name}</div>
                  <div className="font-mono text-xs text-slate-400">{a.roll_no}</div>
                </td>
                <td className="td">{a.marks}</td>
                <td className="td">{a.category_code}</td>
                <td className="td font-medium">{a.course_name}</td>
                <td className="td">
                  <span className={`badge ${a.seat_type === "open" ? "bg-slate-100 text-slate-600" : "bg-indigo-100 text-indigo-700"}`}>
                    {a.seat_type}
                  </span>
                </td>
                <td className="td">
                  <span className={`badge ${badge(a.preference_rank)}`}>#{a.preference_rank}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="td text-slate-400" colSpan={6}>No allocations yet. Click “Run allocation”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
