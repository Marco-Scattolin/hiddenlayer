"use client";

import { useState, useEffect, useCallback } from "react";
import ReportsSection from "./ReportsSection";

interface UserRow {
  username: string;
  email: string;
}

type RowMode =
  | { type: "idle" }
  | { type: "editing"; username: string; email: string }
  | { type: "confirm-delete" }
  | { type: "resetting" }
  | { type: "reset-done"; tempPassword: string };

const ADMIN_USERNAME = "marco";

export default function AdminPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");

  // Per-row UI state
  const [rowModes, setRowModes] = useState<Record<string, RowMode>>({});

  // Create form
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createStatus, setCreateStatus] = useState<
    | { type: "idle" }
    | { type: "loading" }
    | { type: "error"; message: string }
    | { type: "done"; tempPassword: string; username: string }
  >({ type: "idle" });

  const loadUsers = useCallback(async () => {
    setGlobalError("");
    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      setGlobalError("Impossibile caricare gli utenti.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function rowMode(username: string): RowMode {
    return rowModes[username] ?? { type: "idle" };
  }

  function setRowMode(username: string, mode: RowMode) {
    setRowModes((prev) => ({ ...prev, [username]: mode }));
  }

  // ── Create ────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createUsername.trim()) return;

    setCreateStatus({ type: "loading" });
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: createUsername.trim(),
        email: createEmail.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCreateStatus({ type: "error", message: data.error ?? "Errore." });
      return;
    }
    setCreateStatus({ type: "done", tempPassword: data.tempPassword, username: data.username });
    setCreateUsername("");
    setCreateEmail("");
    await loadUsers();
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  function startEdit(user: UserRow) {
    setRowMode(user.username, {
      type: "editing",
      username: user.username,
      email: user.email,
    });
  }

  async function saveEdit(originalUsername: string) {
    const mode = rowMode(originalUsername);
    if (mode.type !== "editing") return;

    const res = await fetch(
      `/api/admin/users/${encodeURIComponent(originalUsername)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: mode.username !== originalUsername ? mode.username : undefined,
          email: mode.email || null,
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setGlobalError(data.error ?? "Errore durante il salvataggio.");
      return;
    }
    setRowMode(originalUsername, { type: "idle" });
    await loadUsers();
  }

  // ── Reset password ────────────────────────────────────────────────────────
  async function resetPassword(username: string) {
    setRowMode(username, { type: "resetting" });
    const res = await fetch(
      `/api/admin/users/${encodeURIComponent(username)}/reset-password`,
      { method: "POST" }
    );
    const data = await res.json();
    if (!res.ok) {
      setGlobalError(data.error ?? "Errore durante il reset.");
      setRowMode(username, { type: "idle" });
      return;
    }
    setRowMode(username, { type: "reset-done", tempPassword: data.tempPassword });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function confirmDelete(username: string) {
    const res = await fetch(
      `/api/admin/users/${encodeURIComponent(username)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) {
      setGlobalError(data.error ?? "Errore durante l'eliminazione.");
      setRowMode(username, { type: "idle" });
      return;
    }
    setRowModes((prev) => {
      const next = { ...prev };
      delete next[username];
      return next;
    });
    await loadUsers();
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  const inputClass = "hl-input rounded-lg px-3 py-1.5 text-sm w-full";

  const btnGhost = {
    style: { backgroundColor: "#383838", color: "#f2f2f2" } as React.CSSProperties,
    className:
      "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0",
  };

  const btnDanger = {
    style: { backgroundColor: "#3a1a22", color: "#f2a0b0", border: "1px solid #6b2236" } as React.CSSProperties,
    className: "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Global error ── */}
      {globalError && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "#3a1a22", border: "1px solid #6b2236", color: "#f2a0b0" }}
        >
          {globalError}
          <button
            className="ml-3 underline text-xs"
            onClick={() => setGlobalError("")}
          >
            Chiudi
          </button>
        </div>
      )}

      {/* ── Create user ── */}
      <div
        className="rounded-xl p-5 flex flex-col gap-4"
        style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838" }}
      >
        <p className="text-sm font-semibold" style={{ color: "#f2f2f2" }}>
          Crea nuovo utente
        </p>

        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Username *"
              value={createUsername}
              onChange={(e) => setCreateUsername(e.target.value)}
              className={inputClass}
              disabled={createStatus.type === "loading"}
            />
            <input
              type="email"
              placeholder="Email (opzionale)"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              className={inputClass}
              disabled={createStatus.type === "loading"}
            />
          </div>

          {createStatus.type === "error" && (
            <p className="text-xs" style={{ color: "#f2a0b0" }}>
              {createStatus.message}
            </p>
          )}

          {createStatus.type === "done" && (
            <div
              className="rounded-lg px-4 py-3 text-sm flex flex-col gap-1"
              style={{ backgroundColor: "#1e3a2a", border: "1px solid #2d5a3d", color: "#6bcf8f" }}
            >
              <span>
                Utente <strong>{createStatus.username}</strong> creato.
              </span>
              <span className="text-xs" style={{ opacity: 0.8 }}>
                Password temporanea (mostrata una sola volta):
              </span>
              <code
                className="mt-1 px-3 py-1.5 rounded-md text-sm font-mono select-all"
                style={{ backgroundColor: "#0d2419", color: "#a0f0c0" }}
              >
                {createStatus.tempPassword}
              </code>
            </div>
          )}

          <button
            type="submit"
            disabled={createStatus.type === "loading" || !createUsername.trim()}
            className="hl-button rounded-lg px-4 py-2 text-sm font-medium self-start disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createStatus.type === "loading" ? "Creazione…" : "Crea utente"}
          </button>
        </form>
      </div>

      {/* ── Reports ── */}
      <ReportsSection />

      {/* ── Users list ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid #383838" }}
      >
        <div
          className="px-5 py-3 flex items-center"
          style={{ backgroundColor: "#2a2a2a", borderBottom: "1px solid #383838" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#f2f2f2", opacity: 0.4 }}>
            Utenti{!loading && ` — ${users.length}`}
          </p>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm" style={{ color: "#f2f2f2", opacity: 0.3 }}>
            Caricamento…
          </div>
        ) : (
          <div className="flex flex-col divide-y" style={{ backgroundColor: "#2e2e2e", borderColor: "#383838" }}>
            {users.map((user) => {
              const mode = rowMode(user.username);
              const isAdmin = user.username === ADMIN_USERNAME;

              return (
                <div key={user.username} className="px-5 py-4 flex flex-col gap-3">
                  {mode.type === "editing" ? (
                    /* ── Edit row ── */
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={mode.username}
                          onChange={(e) =>
                            setRowMode(user.username, { ...mode, username: e.target.value })
                          }
                          className={inputClass}
                          disabled={isAdmin}
                          title={isAdmin ? "Non è possibile rinominare l'account admin." : undefined}
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={mode.email}
                          onChange={(e) =>
                            setRowMode(user.username, { ...mode, email: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(user.username)}
                          className="hl-button rounded-lg px-3 py-1.5 text-xs font-medium"
                        >
                          Salva
                        </button>
                        <button
                          onClick={() => setRowMode(user.username, { type: "idle" })}
                          {...btnGhost}
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Idle row ── */
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-sm font-medium truncate" style={{ color: "#f2f2f2" }}>
                          {user.username}
                          {isAdmin && (
                            <span
                              className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: "#3a1060", color: "#c084fc" }}
                            >
                              admin
                            </span>
                          )}
                        </span>
                        <span className="text-xs truncate" style={{ color: "#f2f2f2", opacity: 0.4 }}>
                          {user.email || "—"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <button onClick={() => startEdit(user)} {...btnGhost}>
                          Modifica
                        </button>
                        <button
                          onClick={() => resetPassword(user.username)}
                          {...btnGhost}
                          disabled={mode.type === "resetting"}
                          style={{ ...btnGhost.style, opacity: mode.type === "resetting" ? 0.5 : 1 }}
                        >
                          {mode.type === "resetting" ? "Reset…" : "Reset pw"}
                        </button>
                        {!isAdmin && (
                          <button
                            onClick={() =>
                              mode.type === "confirm-delete"
                                ? confirmDelete(user.username)
                                : setRowMode(user.username, { type: "confirm-delete" })
                            }
                            {...btnDanger}
                          >
                            {mode.type === "confirm-delete" ? "Conferma" : "Elimina"}
                          </button>
                        )}
                        {mode.type === "confirm-delete" && (
                          <button
                            onClick={() => setRowMode(user.username, { type: "idle" })}
                            {...btnGhost}
                          >
                            Annulla
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Temp password after reset ── */}
                  {mode.type === "reset-done" && (
                    <div
                      className="rounded-lg px-4 py-3 text-sm flex flex-col gap-1"
                      style={{ backgroundColor: "#1e3a2a", border: "1px solid #2d5a3d", color: "#6bcf8f" }}
                    >
                      <span className="text-xs" style={{ opacity: 0.8 }}>
                        Nuova password temporanea per <strong>{user.username}</strong> (mostrata una sola volta):
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <code
                          className="flex-1 px-3 py-1.5 rounded-md text-sm font-mono select-all"
                          style={{ backgroundColor: "#0d2419", color: "#a0f0c0" }}
                        >
                          {mode.tempPassword}
                        </code>
                        <button
                          onClick={() => setRowMode(user.username, { type: "idle" })}
                          className="text-xs px-2 py-1 rounded"
                          style={{ color: "#6bcf8f", opacity: 0.6 }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
