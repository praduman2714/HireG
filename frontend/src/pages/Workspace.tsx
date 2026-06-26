import { FileText } from "lucide-react";
import { useState } from "react";
import { PlaceholderSection } from "../components/PlaceholderSection";
import { Sidebar } from "../components/Sidebar";
import { TopNav } from "../components/TopNav";
import { DashboardHome } from "./DashboardHome";
import { CandidatesPage } from "./CandidatesPage";
import { JobsPage } from "./JobsPage";
import type { AppSection, Recruiter } from "../types";

type WorkspaceProps = {
  recruiter: Recruiter;
  token: string;
  onLogout: () => void;
};

export function Workspace({ recruiter, token, onLogout }: WorkspaceProps) {
  const [activeSection, setActiveSection] = useState<AppSection>("dashboard");

  return (
    <main className="app-dashboard">
      <Sidebar activeSection={activeSection} onSelect={setActiveSection} />
      <section className="dashboard-main">
        <TopNav recruiter={recruiter} onLogout={onLogout} />
        {activeSection === "dashboard" ? (
          <DashboardHome token={token} recruiter={recruiter} onNavigate={setActiveSection} />
        ) : null}
        {activeSection === "jobs" ? <JobsPage token={token} /> : null}
        {activeSection === "candidates" ? <CandidatesPage token={token} /> : null}
        {activeSection === "applications" ? (
          <PlaceholderSection
            icon={<FileText size={22} />}
            title="Applications"
            description="Applications can be reviewed here once candidate pipeline views are connected."
          />
        ) : null}
      </section>
    </main>
  );
}
