"use client";

import { useState, useEffect } from "react";

interface Business {
  name: string;
  category: string | null;
  address: string;
  phone: string | null;
  mapsUrl: string;
  reason: "no_website" | "unreachable_website";
  rating: number | null;
  user_ratings_total: number | null;
  opening_hours: { weekday_text: string[] | null; open_now: boolean | null } | null;
  business_status: string | null;
  photo_reference: string | null;
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

      <p className="mt-4 text-center text-xs" style={{ color: "#9e9e9e" }}>
        I risultati escludono clienti esistenti e attività già contattate.
      </p>

      {status.type === "error" && (
        <div className="mt-6 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#3a1a22", border: "1px solid #6b2236", color: "#f2a0b0" }}>
          {status.message}
        </div>
      )}

      {status.type === "done" && status.businesses.length === 0 && (
        <div className="mt-6 text-center text-sm" style={{ color: "#9e9e9e" }}>
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            className="w-full max-w-sm rounded-xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838" }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p id="report-modal-title" className="text-sm font-semibold" style={{ color: "#f2f2f2" }}>
                  Segnala attività
                </p>
                <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "#9e9e9e" }}>
                  {reportTarget.name}
                </p>
              </div>
              <button
                onClick={closeReport}
                aria-label="Chiudi"
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
                  <label htmlFor="report-subject" className="text-sm font-medium" style={{ color: "#f2f2f2" }}>
                    Oggetto *
                  </label>
                  <select
                    id="report-subject"
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                    required
                    className="rounded-lg px-3 py-2.5 text-sm w-full"
                    style={{
                      backgroundColor: "#1e1e1e",
                      border: "1px solid #3a3a3a",
                      color: reportSubject ? "#f2f2f2" : "#555",
                    }}
                  >
                    <option value="">Seleziona...</option>
                    {REPORT_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="report-note" className="text-sm font-medium" style={{ color: "#f2f2f2" }}>
                    Note
                  </label>
                  <textarea
                    id="report-note"
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
      <p className="text-xs px-3 py-2 rounded-lg mb-2" style={{ backgroundColor: "rgba(46,46,46,0.5)", border: "1px solid rgba(56,56,56,0.5)", color: "#9e9e9e" }}>
        Risultati filtrati per assenza di presenza web. Verifica i dettagli prima del contatto.
      </p>
      <p aria-live="polite" aria-atomic="true" className="text-xs mb-1" style={{ color: "#9e9e9e" }}>
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
            className="text-xs font-medium px-3 py-1.5 min-h-[44px] md:min-h-0 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
            onMouseEnter={(e) => { if (page > 0) e.currentTarget.style.backgroundColor = "#444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#383838"; }}
          >
            ← Precedente
          </button>
          <span className="text-xs" style={{ color: "#9e9e9e" }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="text-xs font-medium px-3 py-1.5 min-h-[44px] md:min-h-0 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
  const isNoWebsite = business.reason === "no_website";
  const headerGradient = isNoWebsite
    ? "linear-gradient(150deg, #122318 0%, #1a2e22 60%, #262e28 100%)"
    : "linear-gradient(150deg, #2a190a 0%, #2e2210 60%, #2d2b25 100%)";

  return (
    <div style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838", borderRadius: "12px", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{ position: "relative", height: "88px", background: business.photo_reference ? "#1a1a1a" : headerGradient }}>
        {business.photo_reference ? (
          /* Cover photo */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://places.googleapis.com/v1/${business.photo_reference}/media?maxWidthPx=400&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
            alt={`Foto di ${business.name}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
        ) : (
          /* Placeholder: diagonal stripe + centered initial */
          <>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 18px, rgba(255,255,255,0.018) 18px, rgba(255,255,255,0.018) 36px)",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span aria-hidden="true" style={{
                fontSize: "42px", fontWeight: 700, lineHeight: 1,
                color: "rgba(255,255,255,0.1)",
                userSelect: "none",
              }}>
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </>
        )}
        {/* bottom fade for text legibility */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "56px",
          background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
        }} />

        {/* Category pill + Name — bottom left */}
        <div style={{ position: "absolute", bottom: "11px", left: "14px", right: "14px" }}>
          {business.category && (
            <span style={{
              display: "inline-block",
              fontSize: "10px", fontWeight: 500, lineHeight: 1,
              padding: "3px 8px", borderRadius: "999px", marginBottom: "5px",
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "rgba(242,242,242,0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {business.category}
            </span>
          )}
          <p style={{
            margin: 0, fontSize: "14px", fontWeight: 600, color: "#f2f2f2",
            lineHeight: 1.25, textShadow: "0 1px 6px rgba(0,0,0,0.6)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {business.name}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "12px 14px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {business.address && (
          <div style={{ display: "flex", gap: "7px", alignItems: "flex-start" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: "1px", flexShrink: 0, opacity: 0.5 }}>
              <path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1Zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" fill="#f2f2f2" />
            </svg>
            <span style={{ fontSize: "12px", color: "#f2f2f2", opacity: 0.62, lineHeight: 1.45 }}>
              {business.address}
            </span>
          </div>
        )}
        {business.phone && (
          <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
              <path d="M2.5 1.5h2l.75 2-1.25.75A6.25 6.25 0 0 0 7.25 8l.75-1.25 2 .75v2C7.5 10 1.5 4 2.5 1.5Z" fill="#f2f2f2" />
            </svg>
            <span style={{ fontSize: "12px", color: "#f2f2f2", opacity: 0.62 }}>
              {business.phone}
            </span>
          </div>
        )}
        {business.rating != null && (
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="#c9a030" style={{ flexShrink: 0 }}>
              <path d="M6 1l1.25 2.6 2.75.4-2 2 .5 2.8L6 7.5 3.5 8.8l.5-2.8-2-2 2.75-.4L6 1Z" />
            </svg>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#f2f2f2" }}>
              {business.rating.toFixed(1)}
            </span>
            {business.user_ratings_total != null && (
              <span style={{ fontSize: "11px", color: "#9e9e9e" }}>
                ({business.user_ratings_total.toLocaleString("it-IT")} recensioni)
              </span>
            )}
          </div>
        )}
        {business.opening_hours?.open_now != null && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{
              width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
              backgroundColor: business.opening_hours.open_now ? "#4caf6e" : "#d95c5c",
            }} />
            <span style={{ fontSize: "12px", color: business.opening_hours.open_now ? "#6bcf8f" : "#e87878" }}>
              {business.opening_hours.open_now ? "Aperto" : "Chiuso"}
            </span>
          </div>
        )}
        {(() => {
          const wt = business.opening_hours?.weekday_text;
          if (!wt?.length) return null;
          const idx = (new Date().getDay() + 6) % 7;
          const hours = wt[idx]?.replace(/^[^:]+:\s*/, "") ?? null;
          if (!hours) return null;
          return (
            <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                <circle cx="6" cy="6" r="4.5" stroke="#f2f2f2" strokeWidth="1.2" />
                <path d="M6 3.5V6l1.75 1.75" stroke="#f2f2f2" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: "12px", color: "#f2f2f2", opacity: 0.62 }}>
                {hours}
              </span>
            </div>
          );
        })()}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: "9px 14px 13px",
        display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
        borderTop: "1px solid #343434",
      }}>
        <button
          onClick={onSave}
          disabled={isSaved || isSaving}
          role="button"
          aria-label={isSaved ? "Rimuovi dai salvati" : "Salva contatto"}
          aria-pressed={isSaved}
          title={isSaved ? "Rimuovi dai salvati" : "Salva contatto"}
          className="flex items-center justify-center rounded-lg disabled:cursor-default w-11 h-11 md:w-8 md:h-8"
          style={{
            fontSize: "14px",
            backgroundColor: isSaved ? "#2a2200" : "#2a2a2a",
            border: `1px solid ${isSaved ? "#7a6010" : "#3a3a3a"}`,
            color: isSaved ? "#c9a030" : "#f2f2f2",
            opacity: isSaving ? 0.4 : 1,
          }}
        >
          {isSaved ? "★" : "☆"}
        </button>
        <ReasonBadge reason={business.reason} />
        <a
          href={business.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Apri ${business.name} su Google Maps`}
          className="text-xs font-medium rounded-lg flex items-center min-h-[44px] md:min-h-0"
          style={{ padding: "6px 12px", backgroundColor: "#383838", color: "#f2f2f2", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#383838")}
        >
          Apri su Google Maps ↗
        </a>
        <button
          onClick={onReport}
          aria-label={`Segnala ${business.name}`}
          className="text-xs font-medium rounded-lg flex items-center min-h-[44px] md:min-h-0"
          style={{ padding: "6px 12px", backgroundColor: "#2a1a1a", border: "1px solid #4a2020", color: "#c97070" }}
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
