import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE = "http://localhost:8080/api";

const shiftTypes = [
  "DAG_7_15",
  "DAG_7_14",
  "DAG_8_14",
  "AFTEN_15_22",
  "AFTEN_15_23",
  "NAT_23_07",
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatType(type) {
  return type?.replaceAll("_", " ") ?? "";
}

function cleanError(message) {
  return (message || "Der skete en fejl.")
    .replaceAll('"', "")
    .replace("java.lang.RuntimeException:", "")
    .trim();
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("bookingplan-user");
    return saved ? JSON.parse(saved) : null;
  });

  function handleLogin(user) {
    localStorage.setItem("bookingplan-user", JSON.stringify(user));
    setCurrentUser(user);
  }

  function logout() {
    localStorage.removeItem("bookingplan-user");
    setCurrentUser(null);
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Bookingplan</p>
          <h1>{currentUser.role === "AFLOSER" ? "Mine vagtmuligheder" : "Vagtplanlaegger"}</h1>
        </div>
        <div className="user-chip">
          <span>{currentUser.name}</span>
          <button className="ghost-button" onClick={logout}>Log ud</button>
        </div>
      </header>

      {currentUser.role === "AFLOSER" ? (
        <EmployeeDashboard user={currentUser} />
      ) : (
        <PlannerDashboard />
      )}
    </main>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("planner@example.com");
  const [password, setPassword] = useState("planner123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin(user);
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Bookingplan</p>
        <h1>Log ind</h1>
        <form className="form-grid" onSubmit={login}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <div className="notice error">{error}</div>}
          <button className="primary-button" type="submit" disabled={loading}>
            Log ind
          </button>
        </form>
        <div className="login-help">
          <strong>Test-login</strong>
          <span>planner@example.com / planner123</span>
          <span>anna@example.com / anna123</span>
        </div>
      </section>
    </main>
  );
}

function PlannerDashboard() {
  const [weekStart, setWeekStart] = useState(todayIso());
  const [weekPlan, setWeekPlan] = useState([]);
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newShift, setNewShift] = useState({
    date: todayIso(),
    type: shiftTypes[0],
    teamId: "",
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [weekData, pendingData, userData, teamData] = await Promise.all([
        request(`/shifts/week?start=${weekStart}`),
        request("/shifts/pending"),
        request("/users"),
        request("/teams"),
      ]);
      setWeekPlan(weekData);
      setPending(pendingData);
      setUsers(userData);
      setTeams(teamData);
      if (!newShift.teamId && teamData.length) {
        setNewShift((shift) => ({ ...shift, teamId: String(teamData[0].id) }));
      }
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [weekStart]);

  async function createShift(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await request("/shifts", {
        method: "POST",
        body: JSON.stringify({
          date: newShift.date,
          type: newShift.type,
          teamId: Number(newShift.teamId),
        }),
      });
      setMessage("Vagten blev oprettet.");
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function decide(shiftId, decision) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await request(`/shifts/${shiftId}/${decision}`, { method: "POST" });
      setMessage(decision === "approve" ? "Vagten blev godkendt." : "Vagten blev afvist.");
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  const aflosere = users.filter((user) => user.role === "AFLOSER");
  const warningCount = pending.filter((shift) => shift.exceeds37Hours).length;

  return (
    <>
      <section className="metrics">
        <Metric label="Pending ansogninger" value={pending.length} />
        <Metric label="37 timers warnings" value={warningCount} />
        <Metric label="Aflosere" value={aflosere.length} />
      </section>

      <Notice message={message} error={error} />

      <section className="workspace">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Opret vagt</h2>
              <p>Vagten bliver synlig for aflosere som en aaben vagt.</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={createShift}>
            <label>
              Dato
              <input
                type="date"
                value={newShift.date}
                onChange={(event) => setNewShift({ ...newShift, date: event.target.value })}
                required
              />
            </label>
            <label>
              Vagttype
              <select
                value={newShift.type}
                onChange={(event) => setNewShift({ ...newShift, type: event.target.value })}
              >
                {shiftTypes.map((type) => (
                  <option key={type} value={type}>{formatType(type)}</option>
                ))}
              </select>
            </label>
            <label>
              Team
              <select
                value={newShift.teamId}
                onChange={(event) => setNewShift({ ...newShift, teamId: event.target.value })}
                required
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>
            <button className="primary-button" disabled={saving}>Opret vagt</button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Ansogninger</h2>
              <p>Godkend eller afvis aflosernes oenskede vagter.</p>
            </div>
            <button className="ghost-button" onClick={loadData} disabled={loading || saving}>
              Opdater
            </button>
          </div>
          <ShiftList
            loading={loading}
            shifts={pending}
            emptyText="Der er ingen pending ansogninger."
            action={(shift) => (
              <div className="row-actions">
                <button className="primary-button small" onClick={() => decide(shift.id, "approve")} disabled={saving}>
                  Godkend
                </button>
                <button className="ghost-button small" onClick={() => decide(shift.id, "reject")} disabled={saving}>
                  Afvis
                </button>
              </div>
            )}
          />
        </div>
      </section>

      <section className="panel full-width">
        <div className="panel-header">
          <div>
            <h2>Ugeplan</h2>
            <p>Alle vagter i den valgte uge.</p>
          </div>
          <label className="compact-label">
            Startdato
            <input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} />
          </label>
        </div>
        <ShiftList loading={loading} shifts={weekPlan} emptyText="Ingen vagter i denne uge." />
      </section>
    </>
  );
}

function EmployeeDashboard({ user }) {
  const [openShifts, setOpenShifts] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [openData, myData] = await Promise.all([
        request("/shifts/open"),
        request(`/shifts/user/${user.id}`),
      ]);
      setOpenShifts(openData);
      setMyShifts(myData);
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user.id]);

  async function apply(shiftId) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await request(`/shifts/${shiftId}/apply`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id }),
      });
      setMessage("Dit oenske er sendt til vagtplanlaeggeren.");
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  const approvedHours = useMemo(
    () => myShifts.reduce((sum, shift) => sum + (shift.hours || 0), 0),
    [myShifts],
  );

  return (
    <>
      <section className="metrics">
        <Metric label="Aabne vagter" value={openShifts.length} />
        <Metric label="Mine godkendte vagter" value={myShifts.length} />
        <Metric label="Mine timer" value={approvedHours} />
      </section>

      <Notice message={message} error={error} />

      <section className="workspace two-even">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Aabne vagter</h2>
              <p>Vaelg de vagter du oensker. De skal godkendes bagefter.</p>
            </div>
            <button className="ghost-button" onClick={loadData} disabled={loading || saving}>Opdater</button>
          </div>
          <ShiftList
            loading={loading}
            shifts={openShifts}
            emptyText="Der er ingen aabne vagter."
            action={(shift) => (
              <button className="primary-button small" onClick={() => apply(shift.id)} disabled={saving}>
                Oensk vagt
              </button>
            )}
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Mine godkendte vagter</h2>
              <p>Vagter som vagtplanlaeggeren har godkendt.</p>
            </div>
          </div>
          <ShiftList loading={loading} shifts={myShifts} emptyText="Du har ingen godkendte vagter." />
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Notice({ message, error }) {
  if (!message && !error) return null;
  return <section className={error ? "notice error" : "notice"}>{error || message}</section>;
}

function ShiftList({ shifts, loading, emptyText, action }) {
  if (loading) return <div className="empty-state">Henter data...</div>;
  if (!shifts.length) return <div className="empty-state">{emptyText}</div>;

  return (
    <div className="shift-list">
      {shifts.map((shift) => (
        <article className="shift-row" key={shift.id}>
          <div className="date-box">
            <span>{new Date(shift.date).toLocaleDateString("da-DK", { weekday: "short" })}</span>
            <strong>{new Date(shift.date).toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })}</strong>
          </div>
          <div className="shift-main">
            <h3>{formatType(shift.type)} <span>{shift.hours}t</span></h3>
            <p>
              {shift.teamName || "Ukendt team"} - {shift.userName || shift.requestedUserName || "Ingen bruger"}
            </p>
            {shift.exceeds37Hours && (
              <p className="warning-text">
                Warning: {shift.requestedUserWeekHoursIfApproved} timer hvis godkendt.
              </p>
            )}
          </div>
          <span className={`status ${statusClass(shift.status)}`}>{statusText(shift.status)}</span>
          {action?.(shift)}
        </article>
      ))}
    </div>
  );
}

function statusClass(status) {
  if (status === "APPROVED") return "filled";
  if (status === "REQUESTED") return "pending";
  return "open";
}

function statusText(status) {
  if (status === "APPROVED") return "Godkendt";
  if (status === "REQUESTED") return "Pending";
  return "Aaben";
}

createRoot(document.getElementById("root")).render(<App />);
