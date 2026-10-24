"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="card">
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
      {state.error && <p role="alert" style={{ color: "var(--red)" }}>{state.error}</p>}
      <p><button className="btn" disabled={pending}>{pending ? "…" : "Log in"}</button></p>
    </form>
  );
}
