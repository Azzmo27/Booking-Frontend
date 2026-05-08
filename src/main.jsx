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

function formatType(type) {
  return type.replaceAll("_", " ");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function App() {
  const [openShifts, setOpenShifts] = useState([]);
  const [weekPlan, setWeekPlan] = useState([]);
  const [weekStart, setWeekStart] = useState(todayIso());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [applyUserId, setApplyUserId] = useState("");
  const [newShift, setNewShift] = useState({
    date: todayIso(),
    type: shiftTypes[0],
    teamId: "",
  });

  const openShiftCount = openShifts.length;
  const assignedCount = useMemo(
    () => weekPlan.filter((shift) => !shift.open || shift.assignedUser).length,
    [weekPlan],
  );

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [openData, weekData] = await Promise.all([
        request("/shifts/open"),
        request(`/shifts/week?start=${weekStart}`),
      ]);

      setOpenShifts(openData);
      setWeekPlan(weekData);
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
    setError("");
    setMessage("");

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

  async function applyForShift(shiftId) {
    if (!applyUserId) {
      setError("Skriv et bruger-id før du ansøger om en vagt.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await request(`/shifts/${shiftId}/apply`, {
        method: "POST",
        body: JSON.stringify({ userId: Number(applyUserId) }),
      });

      setMessage("Brugeren blev sat på vagten.");
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Bookingplan</p>
          <h1>Vagtoversigt</h1>
        </div>
        <button className="ghost-button" onClick={loadData} disabled={loading || saving}>
          Opdater
        </button>
      </section>

      <section className="metrics" aria-label="Status">
        <div>
          <span>Åbne vagter</span>
          <strong>{openShiftCount}</strong>
        </div>
        <div>
          <span>Besatte i ugen</span>
          <strong>{assignedCount}</strong>
        </div>
        <div>
          <span>Ugestart</span>
          <strong>{weekStart}</strong>
        </div>
      </section>

      {(message || error) && (
        <section className={error ? "notice error" : "notice"}>
          {error || message}
        </section>
      )}

      <section className="workspace">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Opret vagt</h2>
              <p>Vælg dato, vagttype og team-id fra backend databasen.</p>
            </div>
          </div>

          <form className="form-grid" onSubmit={createShift}>
            <label>
              Dato
              <input
                type="date"
                value={newShift.date}
                onChange={(event) =>
                  setNewShift((shift) => ({ ...shift, date: event.target.value }))
                }
                required
              />
            </label>

            <label>
              Vagttype
              <select
                value={newShift.type}
                onChange={(event) =>
                  setNewShift((shift) => ({ ...shift, type: event.target.value }))
                }
              >
                {shiftTypes.map((type) => (
                  <option value={type} key={type}>
                    {formatType(type)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Team-id
              <input
                type="number"
                min="1"
                value={newShift.teamId}
                onChange={(event) =>
                  setNewShift((shift) => ({ ...shift, teamId: event.target.value }))
                }
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={saving}>
              Opret
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Åbne vagter</h2>
              <p>Brug et eksisterende bruger-id for at tage en vagt.</p>
            </div>
            <label className="compact-label">
              Bruger-id
              <input
                type="number"
                min="1"
                value={applyUserId}
                onChange={(event) => setApplyUserId(event.target.value)}
                placeholder="fx 1"
              />
            </label>
          </div>

          <ShiftList
            emptyText="Der er ingen åbne vagter."
            loading={loading}
            shifts={openShifts}
            action={(shift) => (
              <button
                className="row-button"
                onClick={() => applyForShift(shift.id)}
                disabled={saving}
              >
                Tag vagt
              </button>
            )}
          />
        </div>
      </section>

      <section className="panel full-width">
        <div className="panel-header">
          <div>
            <h2>Ugeplan</h2>
            <p>Backend returnerer vagter fra valgt dato og 7 dage frem.</p>
          </div>
          <label className="compact-label">
            Startdato
            <input
              type="date"
              value={weekStart}
              onChange={(event) => setWeekStart(event.target.value)}
            />
          </label>
        </div>

        <ShiftList
          emptyText="Der er ingen vagter i den valgte uge."
          loading={loading}
          shifts={weekPlan}
        />
      </section>
    </main>
  );
}

function ShiftList({ shifts, loading, emptyText, action }) {
  if (loading) {
    return <div className="empty-state">Henter vagter...</div>;
  }

  if (!shifts.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className="shift-list">
      {shifts.map((shift) => (
        <article className="shift-row" key={shift.id}>
          <div className="date-box">
            <span>{new Date(shift.date).toLocaleDateString("da-DK", { weekday: "short" })}</span>
            <strong>{new Date(shift.date).toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })}</strong>
          </div>
          <div className="shift-main">
            <h3>{formatType(shift.type)}</h3>
            <p>
              {shift.teamName || "Ukendt team"} · {shift.userName || "Ingen bruger"}
            </p>
          </div>
          <span className={shift.open ? "status open" : "status filled"}>
            {shift.open ? "Åben" : "Besat"}
          </span>
          {action?.(shift)}
        </article>
      ))}
    </div>
  );
}

function cleanError(message) {
  if (!message) {
    return "Der skete en fejl.";
  }

  return message
    .replaceAll('"', "")
    .replace("java.lang.RuntimeException:", "")
    .trim();
}

createRoot(document.getElementById("root")).render(<App />);
