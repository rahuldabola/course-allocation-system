"use client";
import { useEffect, useState } from "react";
import { api, Course } from "@/lib/api";

const CATEGORIES = ["OBC", "SC", "ST"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(10);
  const [reserved, setReserved] = useState<Record<string, number>>({ OBC: 0, SC: 0, ST: 0 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.listCourses().then(setCourses).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await api.createCourse({
        name,
        total_seats: Number(seats),
        quotas: CATEGORIES.map((c) => ({ category_code: c, reserved_seats: Number(reserved[c]) })),
      });
      setName(""); setSeats(10); setReserved({ OBC: 0, SC: 0, ST: 0 });
      load();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">📚 Courses Management</h1>
        <p className="text-slate-600 text-sm mt-1">Create courses and set reservation quotas</p>
      </div>

      <form onSubmit={submit} className="card space-y-6">
        <div className="section-header">
          <h2 className="text-lg font-semibold">Add New Course</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 form-group">
            <label className="label">Course Name</label>
            <input className="input" value={name} required placeholder="e.g., Data Structures" 
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Total Seats</label>
            <input type="number" min={0} className="input" placeholder="e.g., 30" value={seats}
              onChange={(e) => setSeats(+e.target.value)} />
          </div>
        </div>
        <div className="divider pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Reservation Quotas</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {CATEGORIES.map((c) => (
            <div key={c} className="form-group">
              <label className="label">{c} Reserved Seats</label>
              <input type="number" min={0} className="input" placeholder="0" value={reserved[c]}
                onChange={(e) => setReserved({ ...reserved, [c]: +e.target.value })} />
            </div>
          ))}
        </div>
        <button className="btn w-full md:w-auto" disabled={busy}>
          {busy ? "⏳ Creating…" : "✓ Add Course"}
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}

      <div className="card overflow-x-auto">
        <div className="section-header mb-6">
          <div>
            <h2 className="text-lg font-semibold">Active Courses</h2>
            <p className="text-sm text-slate-500 mt-1">{courses.length} course{courses.length !== 1 ? "s" : ""} available</p>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="th">Course Name</th>
              <th className="th">Total Seats</th>
              <th className="th">Open Seats</th>
              <th className="th">Quotas (OBC / SC / ST)</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const r = (code: string) => c.quotas.find((q) => q.category_code === code)?.reserved_seats ?? 0;
              return (
                <tr key={c.id} className="tr-hover">
                  <td className="td font-semibold text-slate-800">{c.name}</td>
                  <td className="td">
                    <span className="badge badge-info">{c.total_seats}</span>
                  </td>
                  <td className="td">
                    <span className="badge badge-success">{c.open_seats}</span>
                  </td>
                  <td className="td">
                    <div className="flex gap-2">
                      <span className="badge badge-warning">{r("OBC")}</span>
                      <span className="badge badge-warning">{r("SC")}</span>
                      <span className="badge badge-warning">{r("ST")}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {courses.length === 0 && (
              <tr><td className="td text-slate-400 py-8 text-center" colSpan={4}>No courses created yet. Add one to get started!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
