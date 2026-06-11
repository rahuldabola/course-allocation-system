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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Courses</h1>

      <form onSubmit={submit} className="card grid md:grid-cols-6 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="label">Course name</label>
          <input className="input" value={name} required onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Total seats</label>
          <input type="number" min={0} className="input" value={seats}
            onChange={(e) => setSeats(+e.target.value)} />
        </div>
        {CATEGORIES.map((c) => (
          <div key={c}>
            <label className="label">{c} reserved</label>
            <input type="number" min={0} className="input" value={reserved[c]}
              onChange={(e) => setReserved({ ...reserved, [c]: +e.target.value })} />
          </div>
        ))}
        <button className="btn" disabled={busy}>{busy ? "Saving…" : "Add course"}</button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Course</th><th className="th">Total</th>
              <th className="th">Open</th><th className="th">Reserved (OBC/SC/ST)</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const r = (code: string) => c.quotas.find((q) => q.category_code === code)?.reserved_seats ?? 0;
              return (
                <tr key={c.id}>
                  <td className="td font-medium">{c.name}</td>
                  <td className="td">{c.total_seats}</td>
                  <td className="td">{c.open_seats}</td>
                  <td className="td">{r("OBC")} / {r("SC")} / {r("ST")}</td>
                </tr>
              );
            })}
            {courses.length === 0 && (
              <tr><td className="td text-slate-400" colSpan={4}>No courses yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
