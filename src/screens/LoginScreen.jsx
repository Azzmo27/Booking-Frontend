import React, { useState } from "react";
import { request } from "../api/client";
import { cleanError } from "../utils/format";

export function LoginScreen({ onLogin }) {
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
