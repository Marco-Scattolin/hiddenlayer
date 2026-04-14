"use client";

import { useState, useEffect } from "react";

interface Business {
  name: string;
  category: string | null;
  address: string;
  phone: string | null;
  mapsUrl: string;
  reason: "no_website" | "unreachable_website";
}

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "done"; businesses: Business[] };

type ReportStatus = "idle" | "loading" | "success" | "error";

const PAGE_SIZE = 5;

const REPORT_SUBJECTS = [
  "Sito non rilevato",
  "Info obsolete",
  "Attività non rilevante",
  "Presenza digitale sottovalutata",
  "Altro",
];

export default function SearchForm() {
  const [sector, setSector] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [page, setPage] = useState(0);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [savingUrls, setSavingUrls] = useState<Set<string>>(new Set());

  // Report modal state
  const [reportTarget, setReportTarget] = useState<Business | null>(null);
  const [reportSubject, setReportSubject] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reportStatus, setReportStatus] = useState<ReportStatus>("idle");
  const [reportError, setReportError] = useState("");

  function openReport(business: Business) {
    setReportTarget(business);
    setReportSubject("");
    setReportNote("");
    setReportStatus("idle");
    setReportError("");
  }

  function closeReport() {
    setReportTarget(null);
  }

  useEffect(() => {
    if (!reportTarget) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeReport();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reportTarget]);

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportTarget || !reportSubject) return;

    setReportStatus("loading");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Segnalazione risultato",
          businessName: reportTarget.name,
          subject: reportSubject,
          note: reportNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReportStatus("error");
        setReportError(data.error ?? "Errore sconosciuto.");
        return;
      }
      setReportStatus("success");
      setTimeout(closeReport, 1500);
    } catch {
      setReportStatus("error");
      setReportError("Impossibile contattare il server.");
    }
  }

  async function handleSave(business: Business) {
    const key = business.mapsUrl;
    if (savedUrls.has(key) || savingUrls.has(key)) return;

    setSavingUrls((prev) => new Set(prev).add(key));
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: business.name,
          category: business.category,
          address: business.address,
          mapsUrl: business.mapsUrl,
          phone: business.phone,
          reason: business.reason,
        }),
      });
      if (res.ok) {
        setSavedUrls((prev) => new Set(prev).add(key));
      }
    } finally {
      setSavingUrls((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sector.trim() && !area.trim()) return;

    setStatus({ type: "loading" });
    setPage(0);
    setSavedUrls(new Set());
    setSavingUrls(new Set());
    try {
      const params = new URLSearchParams();
      if (sector.trim()) params.set("sector", sector.trim());
      if (area.trim()) params.set("area", area.trim());
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", message: data.error ?? "Errore sconosciuto." });
        return;
      }
      setStatus({ type: "done", businesses: data.businesses });
    } catch {
      setStatus({ type: "error", message: "Impossibile contattare il server." });
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="rounded-xl p-6 flex flex-col gap-5" style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838" }}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sector" className="text-sm font-medium" style={{ color: "#f2f2f2" }}>
            Settore
          </label>
          <input
            id="sector"
            type="text"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="es. idraulici, parrucchieri, dentisti…"
            className="hl-input w-full rounded-lg px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="area" className="text-sm font-medium" style={{ color: "#f2f2f2" }}>
            Area geografica
          </label>
          <input
            id="area"
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="es. Treviso, Milano, Roma…"
            className="hl-input w-full rounded-lg px-3.5 py-2.5 text-sm"
          />
          {sector.trim() && !area.trim() && (
            <p className="text-xs leading-relaxed" style={{ color: "#c9a030" }}>
              Senza un&apos;area geografica i risultati potrebbero non essere rilevanti. Specifica almeno una città, regione o &quot;Italia&quot;.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={status.type === "loading"}
          className="hl-button mt-1 w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status.type === "loading" ? "Ricerca in corso…" : "Cerca"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs" style={{ color: "#f2f2f2", opacity: 0.3 }}>
        I risultati escludono clienti esistenti e attività già contattate.
      </p>

      {status.type === "error" && (
        <div className="mt-6 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#3a1a22", border: "1px solid #6b2236", color: "#f2a0b0" }}>
          {status.message}
        </div>
      )}

      {status.type === "done" && status.businesses.length === 0 && (
        <div className="mt-6 text-center text-sm" style={{ color: "#f2f2f2", opacity: 0.4 }}>
          Nessuna attività trovata senza presenza web.
        </div>
      )}

      {status.type === "done" && status.businesses.length > 0 && (
        <ResultsList
          businesses={status.businesses}
          page={page}
          setPage={setPage}
          onReport={openReport}
          onSave={handleSave}
          savedUrls={savedUrls}
          savingUrls={savingUrls}
        />
      )}

      {/* ── Report modal ── */}
      {reportTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeReport(); }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838" }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#f2f2f2" }}>
                  Segnala attività
                </p>
                <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "#f2f2f2", opacity: 0.45 }}>
                  {reportTarget.name}
                </p>
              </div>
              <button
                onClick={closeReport}
                className="shrink-0 text-sm w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ color: "#f2f2f2", opacity: 0.4, backgroundColor: "#383838" }}
              >
                ✕
              </button>
            </div>

            {reportStatus === "success" ? (
              <div className="py-6 text-center text-sm" style={{ color: "#6bcf8f" }}>
                Segnalazione inviata.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: "#f2f2f2" }}>
                    Oggetto *
                  </label>
                  <select
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                    required
                    className="rounded-lg px-3 py-2.5 text-sm w-full"
                    style={{
                      backgroundColor: "#1e1e1e",
                      border: "1px solid #3a3a3a",
                      color: reportSubject ? "#f2f2f2" : "#555",
                      outline: "none",
                    }}
                  >
                    <option value="">Seleziona...</option>
                    {REPORT_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: "#f2f2f2" }}>
                    Note
                  </label>
                  <textarea
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    rows={3}
                    placeholder="Note aggiuntive (opzionale)"
                    className="hl-input rounded-lg px-3 py-2.5 text-sm resize-none"
                  />
                </div>

                {reportStatus === "error" && (
                  <p className="text-xs" style={{ color: "#f2a0b0" }}>
                    {reportError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!reportSubject || reportStatus === "loading"}
                    className="hl-button flex-1 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reportStatus === "loading" ? "Invio…" : "Invia segnalazione"}
                  </button>
                  <button
                    type="button"
                    onClick={closeReport}
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

function ResultsList({
  businesses,
  page,
  setPage,
  onReport,
  onSave,
  savedUrls,
  savingUrls,
}: {
  businesses: Business[];
  page: number;
  setPage: (p: number) => void;
  onReport: (b: Business) => void;
  onSave: (b: Business) => void;
  savedUrls: Set<string>;
  savingUrls: Set<string>;
}) {
  const totalPages = Math.ceil(businesses.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const slice = businesses.slice(start, start + PAGE_SIZE);

  return (
    <div className="mt-8 flex flex-col gap-3">
      <p className="text-xs px-3 py-2 rounded-lg mb-2" style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838", color: "#f2f2f2", opacity: 0.5 }}>
        Risultati filtrati per assenza di presenza web. Verifica i dettagli prima del contatto.
      </p>
      <p className="text-xs mb-1" style={{ color: "#f2f2f2", opacity: 0.4 }}>
        {businesses.length} {businesses.length === 1 ? "attività trovata" : "attività trovate"}
      </p>

      {slice.map((biz, i) => (
        <BusinessCard
          key={start + i}
          business={biz}
          onReport={() => onReport(biz)}
          onSave={() => onSave(biz)}
          isSaved={savedUrls.has(biz.mapsUrl)}
          isSaving={savingUrls.has(biz.mapsUrl)}
        />
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
            onMouseEnter={(e) => { if (page > 0) e.currentTarget.style.backgroundColor = "#444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#383838"; }}
          >
            ← Precedente
          </button>
          <span className="text-xs" style={{ color: "#f2f2f2", opacity: 0.4 }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
            onMouseEnter={(e) => { if (page < totalPages - 1) e.currentTarget.style.backgroundColor = "#444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#383838"; }}
          >
            Successivo →
          </button>
        </div>
      )}
    </div>
  );
}

function BusinessCard({
  business,
  onReport,
  onSave,
  isSaved,
  isSaving,
}: {
  business: Business;
  onReport: () => void;
  onSave: () => void;
  isSaved: boolean;
  isSaving: boolean;
}) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold leading-snug" style={{ color: "#f2f2f2" }}>
            {business.name}
          </span>
          {business.category && (
            <span className="text-xs" style={{ color: "#f2f2f2", opacity: 0.45 }}>
              {business.category}
            </span>
          )}
        </div>
        <ReasonBadge reason={business.reason} />
      </div>

      <div className="flex flex-col gap-1.5 text-xs" style={{ color: "#f2f2f2", opacity: 0.6 }}>
        {business.address && <span>{business.address}</span>}
        {business.phone && <span>{business.phone}</span>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onSave}
          disabled={isSaved || isSaving}
          title={isSaved ? "Già salvato" : "Salva contatto"}
          className="text-base w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:cursor-default"
          style={{
            backgroundColor: isSaved ? "#2a2200" : "#2a2a2a",
            border: `1px solid ${isSaved ? "#7a6010" : "#3a3a3a"}`,
            color: isSaved ? "#c9a030" : "#f2f2f2",
            opacity: isSaving ? 0.4 : 1,
          }}
        >
          {isSaved ? "★" : "☆"}
        </button>
        <a
          href={business.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#383838")}
        >
          Apri su Google Maps ↗
        </a>
        <button
          onClick={onReport}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: "#2a1a1a", border: "1px solid #4a2020", color: "#c97070" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3a2020")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2a1a1a")}
        >
          Segnala
        </button>
      </div>
    </div>
  );
}

function ReasonBadge({ reason }: { reason: Business["reason"] }) {
  const isNoWebsite = reason === "no_website";
  return (
    <span
      className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
      style={
        isNoWebsite
          ? { backgroundColor: "#1e3a2a", color: "#6bcf8f", border: "1px solid #2d5a3d" }
          : { backgroundColor: "#3a2a1e", color: "#cf9a6b", border: "1px solid #5a3d2d" }
      }
    >
      {isNoWebsite ? "Senza sito" : "Sito irraggiungibile"}
    </span>
  );
}
