import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <main className="app-shell">
      <section className="panel">
        <p className="eyebrow">HireG</p>
        <h1>Recruiter workspace</h1>
        <p>
          Phase 2 scaffold is ready. Auth, jobs, candidates, resume parsing,
          and fit scoring will be added in the next phases.
        </p>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
