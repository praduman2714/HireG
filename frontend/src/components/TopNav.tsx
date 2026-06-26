import { Bell, CalendarDays, ChevronDown, Search } from "lucide-react";
import type { Recruiter } from "../types";

type TopNavProps = {
  recruiter: Recruiter;
  onLogout: () => void;
};

export function TopNav({ recruiter, onLogout }: TopNavProps) {
  return (
    <header className="dashboard-topbar">
      <label className="global-search">
        <Search size={18} />
        <input placeholder="Search jobs, candidates, applications" />
      </label>
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Calendar">
          <CalendarDays size={19} />
        </button>
        <button className="icon-button notification-button" type="button" aria-label="Notifications">
          <Bell size={19} />
          <span />
        </button>
        <div className="profile-menu">
          <div className="profile-avatar">{recruiter.name.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{recruiter.name}</strong>
            <span>{recruiter.email}</span>
          </div>
          <ChevronDown size={17} />
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
