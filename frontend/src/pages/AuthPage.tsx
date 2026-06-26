import { FormEvent, useState } from "react";
import heroImage from "../assets/hiring-hero.png";
import { loginRecruiter, registerRecruiter } from "../api";
import type { AuthMode, AuthResponse } from "../types";

type AuthPageProps = {
  onAuthenticated: (authResponse: AuthResponse) => void;
};

export function AuthPage({ onAuthenticated }: AuthPageProps) {
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
