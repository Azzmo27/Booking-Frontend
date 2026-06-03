import React, { useState } from "react";
import { request } from "../api/client";
import { cleanError } from "../utils/format";

const demoLogins = [
  { label: "Planlægger", email: "planner@example.com", password: "planner123" },
  { label: "Afløser Anna", email: "anna@example.com", password: "anna123" },
  { label: "Afløser Omar", email: "omar@example.com", password: "omar123" },
];

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("planner@example.com");
  const [password, setPassword] = useState("planner123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function useDemoLogin(demo) {
    setEmail(demo.email);
    setPassword(demo.password);
    setError("");
  }

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
      <div className="login-backdrop" aria-hidden="true">
        <span className="login-orb orb-one" />
        <span className="login-orb orb-two" />
        <span className="login-grid-glow" />
      </div>

      <section className="login-hero" aria-label="BookingPlan login">
        <div className="login-story">
          <p className="eyebrow">BookingPlan</p>
          <h1>Rolige vagter starter med et klart overblik.</h1>
          <p>
            Log ind og styr ansøgninger, ugeplaner og afløsere fra et samlet
            planlæggerbord.
          </p>

          <div className="login-signal-card">
            <div>
              <span>Næste vagt</span>
              <strong>Daghold 07-15</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>2 afventer</strong>
            </div>
          </div>
        </div>

        <div className="login-visual" aria-hidden="true">
          <div className="shift-orbit">
            <span className="orbit-line" />
            <span className="orbit-node node-a">07</span>
            <span className="orbit-node node-b">15</span>
            <span className="orbit-node node-c">23</span>
            <div className="orbit-core">
              <small>Uge 23</small>
              <strong>37t</strong>
            </div>
          </div>
        </div>

        <section className="login-panel">
          <div className="login-panel-heading">
            <p className="eyebrow">Adgang</p>
            <h2>Log ind</h2>
            <p>Brug din testbruger for at komme ind i bookingplanen.</p>
          </div>

          <form className="form-grid" onSubmit={login}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
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
            <button className="primary-button login-submit" type="submit" disabled={loading}>
              {loading ? "Logger ind..." : "Log ind"}
            </button>
          </form>

          <div className="login-help">
            <strong>Test-login</strong>
            <div className="demo-login-list">
              {demoLogins.map((demo) => (
                <button
                  key={demo.email}
                  className="demo-login-chip"
                  type="button"
                  onClick={() => useDemoLogin(demo)}
                >
                  <span>{demo.label}</span>
                  <small>{demo.email}</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
