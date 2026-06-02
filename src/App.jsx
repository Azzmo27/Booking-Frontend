import React, { useState } from "react";
import { Button } from "./components/ui/Button";
import { userStorageKey } from "./constants";
import { EmployeeDashboard } from "./dashboards/EmployeeDashboard";
import { PlannerDashboard } from "./dashboards/PlannerDashboard";
import { LoginScreen } from "./screens/LoginScreen";

export function App() {
  const [plannerView, setPlannerView] = useState("overview");
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(userStorageKey);
    return saved ? JSON.parse(saved) : null;
  });

  function handleLogin(user) {
    localStorage.setItem(userStorageKey, JSON.stringify(user));
    setCurrentUser(user);
  }

  function logout() {
    localStorage.removeItem(userStorageKey);
    setCurrentUser(null);
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const title = currentUser.role === "AFLOSER"
    ? "Mine vagtmuligheder"
    : plannerView === "employees"
      ? "Afløsere"
      : plannerView === "applications"
        ? "Ønskede vagter"
        : "Vagtplanlægger";

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Bookingplan</p>
          <strong>Vagtstyring</strong>
        </div>
        <nav className="side-nav" aria-label="Hovednavigation">
          {currentUser.role === "AFLOSER" ? (
            <>
              <button className="active-nav" type="button">Overblik</button>
              <button type="button">Mine vagter</button>
            </>
          ) : (
            <>
              <button
                className={plannerView === "overview" ? "active-nav" : ""}
                type="button"
                onClick={() => setPlannerView("overview")}
              >
                Overblik
              </button>
              <button
                className={plannerView === "applications" ? "active-nav" : ""}
                type="button"
                onClick={() => setPlannerView("applications")}
              >
                Ønskede vagter
              </button>
              <button
                className={plannerView === "employees" ? "active-nav" : ""}
                type="button"
                onClick={() => setPlannerView("employees")}
              >
                Afløsere
              </button>
            </>
          )}
        </nav>
      </aside>

      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{currentUser.role === "AFLOSER" ? "Afløser" : "Planlægger"}</p>
            <h1>{title}</h1>
          </div>
          <div className="user-chip">
            <span>{currentUser.name}</span>
            <Button variant="ghost" onClick={logout}>Log ud</Button>
          </div>
        </header>

        {currentUser.role === "AFLOSER" ? (
          <EmployeeDashboard user={currentUser} />
        ) : (
          <PlannerDashboard view={plannerView} />
        )}
      </main>
    </div>
  );
}
