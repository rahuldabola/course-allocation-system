"use client";
import { useEffect, useState } from "react";
import { api, Course, Student } from "@/lib/api";

const CATS = ["General", "OBC", "SC", "ST"];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({ roll_no: "", name: "", marks: 75, category_code: "General" });
  const [prefs, setPrefs] = useState<(number | "")[]>(["", "", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.listStudents().then(setStudents).catch((e) => setError(e.message));
    api.listCourses().then(setCourses);
  };
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const preferences = prefs
        .map((cid, i) => (cid === "" ? null : { course_id: Number(cid), priority: i + 1 }))
        .filter(Boolean);
      await api.createStudent({ ...form, marks: Number(form.marks), preferences });
      setForm({ roll_no: "", name: "", marks: 75, category_code: "General" });
      setPrefs(["", "", ""]);
      load();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  const courseName = (id: number) => courses.find((c) => c.id === id)?.name ?? `#${id}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Students</h1>

      <form onSubmit={submit} className="card space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="label">Student ID</label>
            <input className="input" required value={form.roll_no}
              onChange={(e) => setForm({ ...form, roll_no: e.target.value })} />
          </div>
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Marks (0–100)</label>
            <input type="number" step="0.1" min={0} max={100} className="input" value={form.marks}
              onChange={(e) => setForm({ ...form, marks: +e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_code}
              onChange={(e) => setForm({ ...form, category_code: e.target.value })}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <label className="label">Preference {i + 1}</label>
              <select className="input" value={prefs[i]}
                onChange={(e) => {
                  const next = [...prefs];
                  next[i] = e.target.value === "" ? "" : Number(e.target.value);
                  setPrefs(next);
                }}>
                <option value="">— none —</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button className="btn" disabled={busy}>{busy ? "Saving…" : "Register student"}</button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="card overflow-x-auto">
        <h2 className="font-semibold mb-3">{students.length} registered (sorted by marks)</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">ID</th><th className="th">Name</th><th className="th">Marks</th>
              <th className="th">Category</th><th className="th">Applied</th>
              <th className="th">Preferences</th><th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td className="td font-mono text-xs">{s.roll_no}</td>
                <td className="td font-medium">{s.name}</td>
                <td className="td">{s.marks}</td>
                <td className="td">{s.category.code}</td>
                <td className="td">{s.application_date}</td>
                <td className="td text-xs text-slate-500">
                  {[...s.preferences].sort((a, b) => a.priority - b.priority)
                    .map((p) => courseName(p.course_id)).join(" › ")}
                </td>
                <td className="td">
                  <button className="text-red-500 hover:underline text-xs"
                    onClick={() => api.deleteStudent(s.id).then(load)}>Delete</button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td className="td text-slate-400" colSpan={7}>No students yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
