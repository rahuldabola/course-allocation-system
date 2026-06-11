"use client";
import { useEffect, useState } from "react";
import {
  Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api, DashboardStats } from "@/lib/api";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? "text-slate-800"}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  const load = () => api.stats().then(setStats).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  if (error) return <div className="card text-red-600">Failed to load: {error}</div>;
  if (!stats) return <div className="card">Loading…</div>;

  const seatData = stats.course_stats.map((c) => ({
    name: c.course_name,
    Allocated: c.allocated,
    Available: c.available_seats,
  }));
  const rejectionData = stats.course_stats.map((c) => ({
    name: c.course_name,
    Rejection: Math.round(c.rejection_rate * 100),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button className="btn-ghost" onClick={load}>↻ Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Students" value={stats.total_students} />
        <Stat label="Allocated" value={stats.total_allocated} accent="text-emerald-600" />
        <Stat label="Unallocated" value={stats.total_unallocated} accent="text-red-500" />
        <Stat label="Highest Rejection" value={stats.highest_rejection_course ?? "—"} accent="text-amber-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Seats: Allocated vs Available</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={seatData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Allocated" stackId="a" fill="#4f46e5" />
              <Bar dataKey="Available" stackId="a" fill="#cbd5e1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Category-wise Allocation</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.category_stats}
                dataKey="allocated"
                nameKey="category_code"
                outerRadius={90}
                label={(e) => `${e.category_code}: ${e.allocated}`}
              >
                {stats.category_stats.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card md:col-span-2">
          <h2 className="font-semibold mb-3">Rejection Rate by Course (%)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rejectionData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="Rejection" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-semibold mb-3">Course Statistics</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Course</th><th className="th">Total</th>
              <th className="th">Allocated</th><th className="th">Available</th>
              <th className="th">Applicants</th><th className="th">Rejection %</th>
            </tr>
          </thead>
          <tbody>
            {stats.course_stats.map((c) => (
              <tr key={c.course_id}>
                <td className="td font-medium">{c.course_name}</td>
                <td className="td">{c.total_seats}</td>
                <td className="td">{c.allocated}</td>
                <td className="td">{c.available_seats}</td>
                <td className="td">{c.applicants}</td>
                <td className="td">{Math.round(c.rejection_rate * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
