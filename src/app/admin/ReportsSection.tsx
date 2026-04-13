"use client";

import { useState, useEffect, useCallback } from "react";

interface Report {
  id: string;
  createdAt: string;
  username: string;
  type?: string;
  businessName?: string;
  subject?: string;
  note: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeBadge({ type }: { type: string }) {
  const isFeedback = type === "Feedback prodotto";
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full w-fit"
      style={
        isFeedback
          ? { backgroundColor: "#1a2a3a", border: "1px solid #204060", color: "#70a8c9" }
          : { backgroundColor: "#2a1a1a", border: "1px solid #4a2020", color: "#c97070" }
      }
    >
      {type}
    </span>
  );
}

export default function ReportsSection() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setError("");
    const res = await fetch("/api/reports");
    if (!res.ok) {
      setError("Impossibile caricare le segnalazioni.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setReports(data.reports);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Errore durante l'eliminazione.");
      return;
    }
    setConfirmDelete(null);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #383838" }}
    >
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ backgroundColor: "#2a2a2a", borderBottom: "1px solid #383838" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "#f2f2f2", opacity: 0.4 }}
        >
          Segnalazioni e feedback{!loading && ` — ${reports.length}`}
        </p>
        <button
          onClick={loadReports}
          className="text-xs px-2 py-1 rounded-md"
          style={{ color: "#f2f2f2", opacity: 0.35, backgroundColor: "#383838" }}
        >
          Aggiorna
        </button>
      </div>

      {loading ? (
        <div
          className="px-5 py-6 text-sm"
          style={{ backgroundColor: "#2e2e2e", color: "#f2f2f2", opacity: 0.3 }}
        >
          Caricamento…
        </div>
      ) : error ? (
        <div
          className="px-5 py-4 text-sm"
          style={{ backgroundColor: "#2e2e2e", color: "#f2a0b0" }}
        >
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div
          className="px-5 py-6 text-sm"
          style={{ backgroundColor: "#2e2e2e", color: "#f2f2f2", opacity: 0.3 }}
        >
          Nessuna voce.
        </div>
      ) : (
        <div
          className="flex flex-col divide-y"
          style={{ backgroundColor: "#2e2e2e", borderColor: "#383838" }}
        >
          {reports.map((r) => {
            const resolvedType = r.type ?? "Segnalazione risultato";
            const isFeedback = resolvedType === "Feedback prodotto";

            return (
              <div key={r.id} className="px-5 py-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-1.5">
                    {!isFeedback && r.businessName && (
                      <span className="text-sm font-medium" style={{ color: "#f2f2f2" }}>
                        {r.businessName}
                      </span>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <TypeBadge type={resolvedType} />
                      {!isFeedback && r.subject && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#f2f2f2", opacity: 0.6 }}
                        >
                          {r.subject}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex flex-col items-end gap-0.5" style={{ color: "#f2f2f2", opacity: 0.4 }}>
                      <span className="text-xs">{r.username}</span>
                      <span className="text-xs">{formatDate(r.createdAt)}</span>
                    </div>
                    {confirmDelete === r.id ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-xs font-medium px-2 py-1 rounded-lg"
                          style={{ backgroundColor: "#3a1a22", border: "1px solid #6b2236", color: "#f2a0b0" }}
                        >
                          Conferma
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs font-medium px-2 py-1 rounded-lg"
                          style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
                        >
                          Annulla
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(r.id)}
                        className="text-xs font-medium px-2 py-1 rounded-lg"
                        style={{ backgroundColor: "#2a1a1a", border: "1px solid #3a2020", color: "#c97070" }}
                      >
                        Elimina
                      </button>
                    )}
                  </div>
                </div>
                {r.note && (
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "#f2f2f2", opacity: 0.55 }}
                  >
                    {r.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
