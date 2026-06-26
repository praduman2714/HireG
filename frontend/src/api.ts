import type { AuthResponse, DashboardStats, Job, Recruiter } from "./types";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
export const TOKEN_STORAGE_KEY = "hireg_access_token";

export async function registerRecruiter(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export async function loginRecruiter(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login-json", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export async function getCurrentRecruiter(token: string): Promise<Recruiter> {
  return request<Recruiter>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  return apiRequest<DashboardStats>("/dashboard/stats", token);
}

export async function getJobs(token: string, query = ""): Promise<Job[]> {
  return apiRequest<Job[]>(query ? `/jobs?${query}` : "/jobs", token);
}

export async function createJob(
  token: string,
  payload: Record<string, string | null>,
): Promise<Job> {
  return apiRequest<Job>("/jobs", token, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export async function updateJob(
  token: string,
  jobId: string,
  payload: Record<string, string | null>,
): Promise<Job> {
  return apiRequest<Job>(`/jobs/${jobId}`, token, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
}

export async function closeJob(token: string, jobId: string): Promise<Job> {
  return apiRequest<Job>(`/jobs/${jobId}/close`, token, { method: "POST" });
}

export async function deleteJob(token: string, jobId: string): Promise<void> {
  return apiRequest<void>(`/jobs/${jobId}`, token, { method: "DELETE" });
}

export async function apiRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload.detail === "string"
        ? payload.detail
        : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}
