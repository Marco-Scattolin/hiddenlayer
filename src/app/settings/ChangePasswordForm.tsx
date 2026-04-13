"use client";

import { useState } from "react";

type FormStatus =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "success" };

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (next !== confirm) {
      setStatus({ type: "error", message: "Le nuove password non coincidono." });
      return;
    }

    setStatus({ type: "loading" });

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", message: data.error ?? "Errore sconosciuto." });
        return;
      }

      setStatus({ type: "success" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setStatus({ type: "error", message: "Impossibile contattare il server." });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-6 flex flex-col gap-5"
      style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838" }}
    >
      <p className="text-sm font-semibold" style={{ color: "#f2f2f2" }}>
        Cambia password
      </p>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="current-password"
          className="text-sm font-medium"
          style={{ color: "#f2f2f2" }}
        >
          Password attuale
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="hl-input w-full rounded-lg px-3.5 py-2.5 text-sm"
          disabled={status.type === "loading"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="new-password"
          className="text-sm font-medium"
          style={{ color: "#f2f2f2" }}
        >
          Nuova password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="hl-input w-full rounded-lg px-3.5 py-2.5 text-sm"
          disabled={status.type === "loading"}
        />
        <p className="text-xs" style={{ color: "#f2f2f2", opacity: 0.35 }}>
          Minimo 8 caratteri.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirm-password"
          className="text-sm font-medium"
          style={{ color: "#f2f2f2" }}
        >
          Conferma nuova password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="hl-input w-full rounded-lg px-3.5 py-2.5 text-sm"
          disabled={status.type === "loading"}
        />
      </div>

      {status.type === "error" && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: "#3a1a22",
            border: "1px solid #6b2236",
            color: "#f2a0b0",
          }}
        >
          {status.message}
        </div>
      )}

      {status.type === "success" && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: "#1e3a2a",
            border: "1px solid #2d5a3d",
            color: "#6bcf8f",
          }}
        >
          Password aggiornata con successo.
        </div>
      )}

      <button
        type="submit"
        disabled={
          status.type === "loading" || !current || !next || !confirm
        }
        className="hl-button mt-1 w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status.type === "loading" ? "Salvataggio…" : "Salva password"}
      </button>
    </form>
  );
}
