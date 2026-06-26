import React, { FormEvent, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import heroImage from "./assets/hiring-hero.png";
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
    <main className="landing-page">
      <nav className="topbar" aria-label="Main navigation">
        <div className="brand-mark">
          <span>H</span>
          <strong>HireG</strong>
        </div>
        <div className="topbar-links">
          <a href="#workflow">Workflow</a>
          <a href="#signals">AI signals</a>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Recruiter command center</p>
          <h1>Move from resume pile to ranked shortlist faster.</h1>
          <p className="hero-text">
            HireG helps recruiters manage openings, upload resumes, extract
            candidate details, and compare fit with job requirements in one
            focused workspace.
          </p>

          <div className="hero-actions">
            <a className="primary-link" href="#auth-panel">
              Start screening
            </a>
            <a className="secondary-link" href="#workflow">
              See workflow
            </a>
          </div>

          <div className="hero-proof" aria-label="Product highlights">
            <div>
              <strong>AI parsing</strong>
              <span>Structured candidate profiles</span>
            </div>
            <div>
              <strong>Fit scoring</strong>
              <span>Ranked by job relevance</span>
            </div>
            <div>
              <strong>JWT auth</strong>
              <span>Recruiter-owned data</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Hiring dashboard preview">
          <img src={heroImage} alt="Hiring dashboard with candidate scoring" />
        </div>
      </section>

      <section className="content-band" id="workflow">
        <div className="section-heading">
          <p className="eyebrow">Workflow</p>
          <h2>Built around the daily recruiter loop</h2>
        </div>
        <div className="feature-grid">
          <article>
            <span>01</span>
            <h3>Create openings</h3>
            <p>Track job details, requirements, status, location, and hiring context.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Upload resumes</h3>
            <p>Accept PDF, DOCX, or TXT files and extract clean resume text.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Review fit</h3>
            <p>Use AI-generated scores, skill matches, gaps, and explanations.</p>
          </article>
        </div>
      </section>

      <section className="auth-band" id="auth-panel">
        <div className="auth-intro" id="signals">
          <p className="eyebrow">Secure access</p>
          <h2>Sign in to manage your hiring pipeline</h2>
          <p>
            Each recruiter sees only their own jobs and candidates. The
            workspace is ready for job management, resume uploads, parsing, and
            fit scoring.
          </p>
        </div>

        <div className="auth-card">
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
        </div>
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
