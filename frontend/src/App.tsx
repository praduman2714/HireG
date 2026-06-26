import { useEffect, useState } from "react";
import { getCurrentRecruiter, TOKEN_STORAGE_KEY } from "./api";
import { AuthPage } from "./pages/AuthPage";
import { Workspace } from "./pages/Workspace";
import type { AuthResponse, Recruiter } from "./types";

export function App() {
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
    return <Workspace recruiter={recruiter} token={token} onLogout={handleLogout} />;
  }

  return <AuthPage onAuthenticated={handleAuthenticated} />;
}
