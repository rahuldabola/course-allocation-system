"use client";
import { useEffect, useState } from "react";
import {
  Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api, DashboardStats } from "@/lib/api";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface StatProps {
  label: string;
  value: number | string;
  accent?: string;
  icon?: string;
  trend?: number;
}

function Stat({ label, value, accent, icon, trend }: StatProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${accent ?? "text-slate-800"}`}>{value}</p>
        </div>
        {icon && <span className="text-4xl opacity-80">{icon}</span>}
      </div>
      {trend !== undefined && (
        <p className={`text-xs mt-3 font-semibold ${trend > 0 ? "text-emerald-600" : "text-red-600"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last run
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.stats().then(setStats).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (error) return (
    <div className="error-box">
      <strong>Failed to load:</strong> {error}
    </div>
  );
  if (loading || !stats) return (
    <div className="card text-center py-12">
      <div className="inline-block animate-spin text-3xl">⏳</div>
      <p className="mt-3 text-slate-600">Loading dashboard…</p>
    </div>
  );

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
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">Real-time allocation overview and analytics</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>↻ Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Stat
          label="Total Students"
          value={stats.total_students}
          icon="👥"
          accent="text-brand-600"
        />
        <Stat
          label="Successfully Allocated"
          value={stats.total_allocated}
          icon="✓"
          accent="text-emerald-600"
        />
        <Stat
          label="Pending Allocation"
          value={stats.total_unallocated}
          icon="⏱"
          accent="text-amber-600"
        />
        <Stat
          label="Highest Rejection Rate"
          value={stats.highest_rejection_course ?? "—"}
          icon="📉"
          accent="text-red-600"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Seats Allocation</h2>
            <span className="text-sm text-slate-500">by course</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={seatData} margin={{ top: 10, right: 20, left: -20, bottom: 50 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar dataKey="Allocated" stackId="a" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Available" stackId="a" fill="#e2e8f0" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Category Distribution</h2>
            <span className="text-sm text-slate-500">allocation by quota</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Rejection Rates</h2>
            <span className="text-sm text-slate-500">percentage by course</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rejectionData} margin={{ top: 10, right: 20, left: -20, bottom: 50 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="Rejection" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
