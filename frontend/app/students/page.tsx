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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">👥 Students Management</h1>
        <p className="text-slate-600 text-sm mt-1">Register students and set course preferences</p>
      </div>

      <form onSubmit={submit} className="card space-y-6">
        <div className="section-header">
          <h2 className="text-lg font-semibold">Register New Student</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          <div className="form-group">
            <label className="label">Student ID</label>
            <input className="input" required placeholder="e.g., STU001" value={form.roll_no}
              onChange={(e) => setForm({ ...form, roll_no: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input className="input" required placeholder="Enter name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Entrance Marks</label>
            <input type="number" step="0.1" min={0} max={100} className="input" placeholder="0–100" value={form.marks}
              onChange={(e) => setForm({ ...form, marks: +e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Category</label>
            <select className="input" value={form.category_code}
              onChange={(e) => setForm({ ...form, category_code: e.target.value })}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="divider pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Course Preferences (in order)</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="form-group">
              <label className="label">Preference {i + 1}</label>
              <select className="input" value={prefs[i]}
                onChange={(e) => {
                  const next = [...prefs];
                  next[i] = e.target.value === "" ? "" : Number(e.target.value);
                  setPrefs(next);
                }}>
                <option value="">— select course —</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button className="btn w-full md:w-auto" disabled={busy}>
          {busy ? "⏳ Registering…" : "✓ Register Student"}
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}

      <div className="card overflow-x-auto">
        <div className="section-header mb-6">
          <div>
            <h2 className="text-lg font-semibold">Registered Students</h2>
            <p className="text-sm text-slate-500 mt-1">{students.length} student{students.length !== 1 ? "s" : ""} registered</p>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="th">ID</th>
              <th className="th">Name</th>
              <th className="th">Marks</th>
              <th className="th">Category</th>
              <th className="th">Applied</th>
              <th className="th">Preferences</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="tr-hover">
                <td className="td font-mono text-xs text-brand-600 font-semibold">{s.roll_no}</td>
                <td className="td font-semibold text-slate-800">{s.name}</td>
                <td className="td">
                  <span className="badge badge-primary">{s.marks}</span>
                </td>
                <td className="td">
                  <span className={`badge ${s.category.code === "General" ? "badge-info" : "badge-warning"}`}>
                    {s.category.code}
                  </span>
                </td>
                <td className="td text-xs text-slate-500">{s.application_date}</td>
                <td className="td text-xs text-slate-600">
                  {[...s.preferences].sort((a, b) => a.priority - b.priority)
                    .map((p, idx) => (
                      <div key={p.course_id} className="mb-1">
                        <span className="badge badge-secondary">{idx + 1}</span> {courseName(p.course_id)}
                      </div>
                    ))}
                </td>
                <td className="td">
                  <button className="text-red-500 hover:text-red-700 text-xs font-semibold hover:underline transition-colors"
                    onClick={() => api.deleteStudent(s.id).then(load)}>Delete</button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td className="td text-slate-400 py-8 text-center" colSpan={7}>No students registered yet. Add one to get started!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
