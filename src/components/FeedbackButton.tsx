"use client";

import { useState, useEffect } from "react";

export default function FeedbackButton() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => { if (r.ok) setVisible(true); })
      .catch(() => null);
  }, []);

  function openModal() {
    setOpen(true);
    setNote("");
    setStatus("idle");
    setError("");
  }

  function closeModal() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Feedback prodotto", note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Errore sconosciuto.");
        return;
      }
      setStatus("success");
      setTimeout(closeModal, 1500);
    } catch {
      setStatus("error");
      setError("Impossibile contattare il server.");
    }
  }

  if (!visible) return null;

  return (
    <>
      <button
        onClick={openModal}
        className="fixed bottom-5 right-5 z-40 text-xs font-medium px-3.5 py-2 rounded-lg transition-all"
        style={{
          backgroundColor: "#3077be",
          border: "1px solid #3077be",
          color: "#f2f2f2",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#2a69ab";
          e.currentTarget.style.borderColor = "#2a69ab";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#3077be";
          e.currentTarget.style.borderColor = "#3077be";
        }}
      >
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838" }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#f2f2f2" }}>
                  Feedback
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#f2f2f2", opacity: 0.4 }}>
                  Suggerimenti, problemi o idee sul prodotto.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="shrink-0 text-sm w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ color: "#f2f2f2", opacity: 0.4, backgroundColor: "#383838" }}
              >
                ✕
              </button>
            </div>

            {status === "success" ? (
              <div className="py-6 text-center text-sm" style={{ color: "#6bcf8f" }}>
                Feedback inviato. Grazie!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: "#f2f2f2" }}>
                    Note *
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Scrivi il tuo feedback…"
                    className="hl-input rounded-lg px-3 py-2.5 text-sm resize-none"
                    autoFocus
                  />
                </div>

                {status === "error" && (
                  <p className="text-xs" style={{ color: "#f2a0b0" }}>{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!note.trim() || status === "loading"}
                    className="hl-button flex-1 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "loading" ? "Invio…" : "Invia feedback"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium"
                    style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
                  >
                    Annulla
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
