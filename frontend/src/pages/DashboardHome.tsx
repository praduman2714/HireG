import { BriefcaseBusiness, FileText, MoreHorizontal, Plus, TrendingUp, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardStats, getJobs } from "../api";
import type { AppSection, DashboardStats, Job, Recruiter } from "../types";

type DashboardHomeProps = {
  token: string;
  recruiter: Recruiter;
  onNavigate: (section: AppSection) => void;
};

export function DashboardHome({ token, recruiter, onNavigate }: DashboardHomeProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDashboardStats(token), getJobs(token)])
      .then(([loadedStats, loadedJobs]) => {
        setStats(loadedStats);
        setJobs(loadedJobs.slice(0, 5));
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Could not load dashboard");
      });
  }, [token]);

  const statCards = [
    {
      label: "Active jobs",
      value: stats?.active_jobs ?? 0,
      delta: "+12%",
      icon: <BriefcaseBusiness size={20} />,
    },
    {
      label: "Total candidates",
      value: stats?.total_candidates ?? 0,
      delta: "+18%",
      icon: <UsersRound size={20} />,
    },
    {
      label: "Applications received",
      value: stats?.applications_received ?? 0,
      delta: "+9%",
      icon: <FileText size={20} />,
    },
    {
      label: "Avg. fit score",
      value: stats?.average_fit_score ?? 0,
      delta: "+4%",
      icon: <TrendingUp size={20} />,
    },
  ];

  return (
    <section className="dashboard-content">
      <div className="dashboard-hero">
        <div>
          <span>Welcome back, {recruiter.name}</span>
          <h1>Hiring overview</h1>
          <p>Track job openings, applications, candidate volume, and AI scoring signals.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate("jobs")}>
          <Plus size={18} />
          Create job
        </button>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="stats-grid">
        {statCards.map((card) => (
          <article className="stat-card" key={card.label}>
            <div className="stat-icon">{card.icon}</div>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.delta} from last period</small>
          </article>
        ))}
      </div>

      <div className="analytics-grid">
        <section className="analytics-card">
          <div className="card-heading">
            <div>
              <h2>Pipeline analytics</h2>
              <p>Current recruiter-owned hiring activity</p>
            </div>
            <MoreHorizontal size={20} />
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats?.pipeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(20, 116, 111, 0.08)" }} />
                <Bar dataKey="value" fill="#14746f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="analytics-card">
          <div className="card-heading">
            <div>
              <h2>Recent jobs</h2>
              <p>Latest openings in your workspace</p>
            </div>
            <button className="text-button" type="button" onClick={() => onNavigate("jobs")}>
              View all
            </button>
          </div>
          <div className="compact-job-list">
            {jobs.length === 0 ? <p className="muted-text">No jobs created yet.</p> : null}
            {jobs.map((job) => (
              <div className="compact-job" key={job.id}>
                <div>
                  <strong>{job.title}</strong>
                  <span>{job.location || "Location not set"}</span>
                </div>
                <span className={`status-pill ${job.status}`}>{job.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
