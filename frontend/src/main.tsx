import React, { FormEvent, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

type AuthMode = "login" | "register";

type Recruiter = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

type AuthResponse = {
  access_token: string;
  token_type: string;
  recruiter: Recruiter;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const TOKEN_STORAGE_KEY = "hireg_access_token";

function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setRecruiter(null);
      setIsLoadingSession(false);
      return;
    }

    getCurrentRecruiter(token)
      .then(setRecruiter)
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setIsLoadingSession(false));
  }, [token]);

  function handleAuthenticated(authResponse: AuthResponse) {
    localStorage.setItem(TOKEN_STORAGE_KEY, authResponse.access_token);
    setToken(authResponse.access_token);
    setRecruiter(authResponse.recruiter);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setRecruiter(null);
  }

  if (isLoadingSession) {
    return (
      <main className="auth-page">
        <section className="auth-card compact">
          <p className="eyebrow">HireG</p>
          <h1>Checking session</h1>
        </section>
      </main>
    );
  }

  if (recruiter && token) {
    return <Workspace recruiter={recruiter} onLogout={handleLogout} />;
  }

  return <AuthScreen onAuthenticated={handleAuthenticated} />;
}

function AuthScreen({
  onAuthenticated,
}: {
  onAuthenticated: (authResponse: AuthResponse) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = mode === "login" ? "Sign in" : "Create recruiter account";
  const submitLabel = mode === "login" ? "Sign in" : "Create account";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const authResponse =
        mode === "login"
          ? await loginRecruiter({ email, password })
          : await registerRecruiter({ name, email, password });
      onAuthenticated(authResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Authentication failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-block">
          <p className="eyebrow">HireG</p>
          <h1>Recruiter workspace</h1>
          <p>
            Manage openings, upload resumes, and review AI-assisted candidate
            fit from one focused dashboard.
          </p>
        </div>

        <div className="segmented-control" aria-label="Authentication mode">
          <button
            className={mode === "login" ? "active" : ""}
            type="button"
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            type="button"
            onClick={() => switchMode("register")}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{title}</h2>

          {mode === "register" ? (
            <label>
              <span>Name</span>
              <input
                autoComplete="name"
                minLength={2}
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                required
                type="text"
                value={name}
              />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              maxLength={255}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "login" ? 1 : 8}
              maxLength={128}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="error-message">{error}</p> : null}

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Please wait" : submitLabel}
          </button>
        </form>
      </section>
    </main>
  );
}

function Workspace({
  recruiter,
  onLogout,
}: {
  recruiter: Recruiter;
  onLogout: () => void;
}) {
  const joinedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(new Date(recruiter.created_at)),
    [recruiter.created_at],
  );

  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">HireG</p>
          <h1>Welcome, {recruiter.name}</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onLogout}>
          Logout
        </button>
      </header>

      <section className="workspace-grid">
        <article className="metric-card">
          <span>Signed in as</span>
          <strong>{recruiter.email}</strong>
        </article>
        <article className="metric-card">
          <span>Account created</span>
          <strong>{joinedDate}</strong>
        </article>
        <article className="metric-card">
          <span>Next workflow</span>
          <strong>Jobs dashboard</strong>
        </article>
      </section>
    </main>
  );
}

async function registerRecruiter(payload: {
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

async function loginRecruiter(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login-json", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

async function getCurrentRecruiter(token: string): Promise<Recruiter> {
  return request<Recruiter>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
