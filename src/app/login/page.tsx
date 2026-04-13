"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Errore sconosciuto.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Impossibile contattare il server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#252525" }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <Image
          src="/logo.png"
          alt="HiddenLayer"
          width={180}
          height={120}
          priority
        />

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-xl p-6 flex flex-col gap-5"
          style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838" }}
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-sm font-medium"
              style={{ color: "#f2f2f2" }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="hl-input w-full rounded-lg px-3.5 py-2.5 text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: "#f2f2f2" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="hl-input w-full rounded-lg px-3.5 py-2.5 text-sm"
              disabled={loading}
            />
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: "#3a1a22",
                border: "1px solid #6b2236",
                color: "#f2a0b0",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="hl-button mt-1 w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
