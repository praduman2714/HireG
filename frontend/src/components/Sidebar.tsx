import { BriefcaseBusiness, FileText, LayoutDashboard, UsersRound } from "lucide-react";
import type { AppSection } from "../types";

type SidebarProps = {
  activeSection: AppSection;
  onSelect: (section: AppSection) => void;
};

export function Sidebar({ activeSection, onSelect }: SidebarProps) {
  const navItems: Array<{ id: AppSection; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "jobs", label: "Jobs", icon: <BriefcaseBusiness size={18} /> },
    { id: "candidates", label: "Candidates", icon: <UsersRound size={18} /> },
    { id: "applications", label: "Applications", icon: <FileText size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span>H</span>
        <div>
          <strong>HireG</strong>
          <small>Recruiting OS</small>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Workspace navigation">
        {navItems.map((item) => (
          <button
            className={activeSection === item.id ? "active" : ""}
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
