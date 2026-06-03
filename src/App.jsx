import React, { useMemo, useState } from "react";
import { Button } from "./components/ui/Button";
import { userStorageKey } from "./constants";
import { EmployeeDashboard } from "./dashboards/EmployeeDashboard";
import { PlannerDashboard } from "./dashboards/PlannerDashboard";
import { LoginScreen } from "./screens/LoginScreen";

const plannerNavItems = [
  { id: "dashboard", label: "Dashboard", plannerView: "overview" },
  { id: "personal", label: "Personlig plan", plannerView: "overview" },
  { id: "schedule", label: "Arbejdsplan", plannerView: "overview" },
  { id: "applications", label: "Ønskede vagter", plannerView: "applications" },
  { id: "employees", label: "Afløsere", plannerView: "employees" },
  { id: "administration", label: "Administration", plannerView: "employees" },
];

const pageTitles = {
  AFLOSER: {
    dashboard: "Mit dashboard",
    personal: "Personlig plan",
    schedule: "Arbejdsplan",
    applications: "Ønskede vagter",
    employees: "Afløsere",
    administration: "Administration",
  },
  PLANNER: {
    dashboard: "Dashboard",
    personal: "Personlig plan",
    schedule: "Arbejdsplan",
    applications: "Ønskede vagter",
    employees: "Afløsere",
    administration: "Administration",
  },
};

function getInitialSection(user) {
  return user?.role === "AFLOSER" ? "personal" : "dashboard";
}

function roleText(role) {
  return role === "AFLOSER" ? "Afløser" : "Planlægger";
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "BP";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(userStorageKey);
    return saved ? JSON.parse(saved) : null;
  });
  const [activeSection, setActiveSection] = useState(() => getInitialSection(currentUser));

  function handleLogin(user) {
    localStorage.setItem(userStorageKey, JSON.stringify(user));
    setCurrentUser(user);
    setActiveSection(getInitialSection(user));
  }

  function logout() {
    localStorage.removeItem(userStorageKey);
    setCurrentUser(null);
  }

  const activeNav = useMemo(
    () => plannerNavItems.find((item) => item.id === activeSection) ?? plannerNavItems[0],
    [activeSection],
  );

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isEmployee = currentUser.role === "AFLOSER";
  const plannerView = activeNav.plannerView;
  const titleGroup = isEmployee ? pageTitles.AFLOSER : pageTitles.PLANNER;
  const pageTitle = isEmployee ? "Personlig plan" : titleGroup[activeSection] ?? "BookingPlan";

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="BookingPlan navigation">
        <div className="brand-block">
          <div className="brand-mark">BP</div>
          <div>
            <p className="eyebrow">BookingPlan</p>
            <strong>Vagtstyring</strong>
          </div>
        </div>

        {isEmployee ? (
          <div className="employee-sidebar-focus">
            <span>Min vagtportal</span>
            <strong>Personlig plan</strong>
            <small>Åbne vagter, venteliste, bytteønsker og dine egne vagter.</small>
          </div>
        ) : (
          <nav className="side-nav" aria-label="Hovednavigation">
            {plannerNavItems.map((item) => (
              <button
                className={activeSection === item.id ? "active-nav" : ""}
                type="button"
                key={item.id}
                onClick={() => setActiveSection(item.id)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        )}

        <div className="sidebar-card">
          <span>Aktiv rolle</span>
          <strong>{roleText(currentUser.role)}</strong>
          <small>Overblik over vagter, ønsker og bemanding.</small>
        </div>
      </aside>

      <main className="app-shell">
        <header className="topbar">
          <div className="topbar-title">
            <p className="eyebrow">{roleText(currentUser.role)} · Plejehjem</p>
            <h1>{pageTitle}</h1>
            <p>Planlæg og følg vagter med et samlet, roligt overblik.</p>
          </div>

          <div className="topbar-user">
            <div className="avatar" aria-hidden="true">{initials(currentUser.name)}</div>
            <div className="user-meta">
              <strong>{currentUser.name}</strong>
              <span>{roleText(currentUser.role)}</span>
            </div>
            <Button variant="ghost" onClick={logout}>Log ud</Button>
          </div>
        </header>

        {isEmployee ? (
          <EmployeeDashboard user={currentUser} section={activeSection} />
        ) : (
          <PlannerDashboard view={plannerView} section={activeSection} />
        )}
      </main>
    </div>
  );
}
