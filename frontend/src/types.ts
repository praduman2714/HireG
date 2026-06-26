export type AuthMode = "login" | "register";

export type Recruiter = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  recruiter: Recruiter;
};

export type JobStatus = "open" | "closed";

export type Job = {
  id: string;
  recruiter_id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  status: JobStatus;
  description: string;
  requirements: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobFormState = {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string;
};

export type DashboardStats = {
  active_jobs: number;
  total_jobs: number;
  closed_jobs: number;
  total_candidates: number;
  applications_received: number;
  shortlisted_candidates: number;
  scored_candidates: number;
  average_fit_score: number;
  pipeline: Array<{ name: string; value: number }>;
};

export type AppSection = "dashboard" | "jobs" | "candidates" | "applications";
