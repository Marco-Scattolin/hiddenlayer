"use client";

import { useState } from "react";
import { SavedContact } from "@/lib/contacts";
import { PlaceBasicDetails } from "@/lib/googlePlaces";

interface FreshDetails {
  name: string;
  address: string;
  category: string | null;
  phone: string | null;
  mapsUrl: string;
}

function ReasonBadge({ reason }: { reason: string }) {
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

export default function SavedContacts({
  initialContacts,
  initialBasicMap,
}: {
  initialContacts: SavedContact[];
  initialBasicMap: Record<string, PlaceBasicDetails>;
}) {
  const [contacts, setContacts] = useState<SavedContact[]>(initialContacts);
  const [removing, setRemoving] = useState<string | null>(null);
  const [hintsMap, setHintsMap] = useState<Record<string, string[]>>({});
  const [loadingHintsMap, setLoadingHintsMap] = useState<Record<string, boolean>>({});
  const [errorsMap, setErrorsMap] = useState<Record<string, string>>({});
  const [freshMap, setFreshMap] = useState<Record<string, FreshDetails>>({});
  const [loadingFreshMap, setLoadingFreshMap] = useState<Record<string, boolean>>({});
  const [freshErrorMap, setFreshErrorMap] = useState<Record<string, string>>({});

  async function handleLoadDetails(placeId: string) {
    setLoadingFreshMap((prev) => ({ ...prev, [placeId]: true }));
    setFreshErrorMap((prev) => { const n = { ...prev }; delete n[placeId]; return n; });
    try {
      const res = await fetch(`/api/places/${encodeURIComponent(placeId)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        const msg = data.error ?? "Errore nel caricamento dettagli.";
        console.error(`[SavedContacts] handleLoadDetails failed for place_id "${placeId}":`, msg);
        setFreshErrorMap((prev) => ({ ...prev, [placeId]: msg }));
      } else {
        setFreshMap((prev) => ({ ...prev, [placeId]: data.details }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore di rete.";
      console.error(`[SavedContacts] handleLoadDetails fetch error for place_id "${placeId}":`, msg);
      setFreshErrorMap((prev) => ({ ...prev, [placeId]: msg }));
    } finally {
      setLoadingFreshMap((prev) => ({ ...prev, [placeId]: false }));
    }
  }

  async function handleGenerateHints(placeId: string) {
    setLoadingHintsMap((prev) => ({ ...prev, [placeId]: true }));
    setErrorsMap((prev) => { const n = { ...prev }; delete n[placeId]; return n; });
    try {
      const basic = initialBasicMap[placeId];
      const currentFresh = freshMap[placeId];
      const contact = contacts.find((c) => c.place_id === placeId)!;
      const res = await fetch("/api/generate-hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentFresh?.name ?? basic?.name ?? "",
          category: currentFresh?.category ?? basic?.category ?? null,
          address: currentFresh?.address ?? basic?.address ?? "",
          phone: currentFresh?.phone ?? null,
          reason: contact.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorsMap((prev) => ({ ...prev, [placeId]: data.error ?? "Generazione non riuscita, riprova." }));
      } else {
        setHintsMap((prev) => ({ ...prev, [placeId]: data.hints }));
      }
    } catch {
      setErrorsMap((prev) => ({ ...prev, [placeId]: "Generazione non riuscita, riprova." }));
    } finally {
      setLoadingHintsMap((prev) => ({ ...prev, [placeId]: false }));
    }
  }

  async function handleRemove(placeId: string) {
    setRemoving(placeId);
    try {
      const res = await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_id: placeId }),
      });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.place_id !== placeId));
      }
    } finally {
      setRemoving(null);
    }
  }

  if (contacts.length === 0) {
    return (
      <p className="text-sm" style={{ color: "#9e9e9e" }}>
        Nessun contatto salvato.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {contacts.map((contact) => {
        const placeId = contact.place_id ?? null;
        const isNoWebsite = contact.reason === "no_website";
        const headerGradient = isNoWebsite
          ? "linear-gradient(150deg, #122318 0%, #1a2e22 60%, #262e28 100%)"
          : "linear-gradient(150deg, #2a190a 0%, #2e2210 60%, #2d2b25 100%)";
        const basic = placeId ? initialBasicMap[placeId] : undefined;
        const isRemoving = placeId !== null && removing === placeId;
        const hints = placeId ? hintsMap[placeId] : undefined;
        const isLoadingHints = placeId ? !!loadingHintsMap[placeId] : false;
        const hintsError = placeId ? errorsMap[placeId] : undefined;
        const fresh = placeId ? freshMap[placeId] : undefined;
        const isLoadingFresh = placeId ? !!loadingFreshMap[placeId] : false;
        const freshError = placeId ? freshErrorMap[placeId] : undefined;
        const displayName = fresh?.name ?? basic?.name;
        const displayAddress = fresh?.address ?? basic?.address;
        const displayCategory = fresh?.category ?? basic?.category ?? null;
        const displayPhone = fresh?.phone ?? null;
        const displayMapsUrl = fresh?.mapsUrl ?? basic?.mapsUrl ??
          (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : "#");

        return (
          <div key={placeId ?? contact.savedAt}>
          <div
            style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838", borderRadius: "12px", overflow: "hidden" }}
          >
            {/* ── Header ── */}
            <div style={{ position: "relative", height: "88px", background: headerGradient }}>
              {/* Placeholder: diagonal stripe + centered initial */}
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
                  {displayName?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              </div>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "56px",
                background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
              }} />

              {/* Category pill + Name — bottom left */}
              <div style={{ position: "absolute", bottom: "11px", left: "14px", right: "14px" }}>
                {displayCategory && (
                  <span style={{
                    display: "inline-block",
                    fontSize: "10px", fontWeight: 500, lineHeight: 1,
                    padding: "3px 8px", borderRadius: "999px", marginBottom: "5px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "rgba(242,242,242,0.9)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    {displayCategory}
                  </span>
                )}
                <p style={{
                  margin: 0, fontSize: "14px", fontWeight: 600, color: "#f2f2f2",
                  lineHeight: 1.25, textShadow: "0 1px 6px rgba(0,0,0,0.6)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {displayName}
                </p>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "12px 14px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {displayAddress && (
                <div style={{ display: "flex", gap: "7px", alignItems: "flex-start" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: "1px", flexShrink: 0, opacity: 0.5 }}>
                    <path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1Zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" fill="#f2f2f2" />
                  </svg>
                  <span style={{ fontSize: "12px", color: "#f2f2f2", opacity: 0.62, lineHeight: 1.45 }}>
                    {displayAddress}
                  </span>
                </div>
              )}
              {displayPhone && (
                <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                    <path d="M2.5 1.5h2l.75 2-1.25.75A6.25 6.25 0 0 0 7.25 8l.75-1.25 2 .75v2C7.5 10 1.5 4 2.5 1.5Z" fill="#f2f2f2" />
                  </svg>
                  <span style={{ fontSize: "12px", color: "#f2f2f2", opacity: 0.62 }}>
                    {displayPhone}
                  </span>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div style={{
              padding: "9px 14px 13px",
              display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
              borderTop: "1px solid #343434",
            }}>
              <button
                onClick={() => { if (placeId) handleRemove(placeId); }}
                disabled={isRemoving || !placeId}
                title="Rimuovi dai salvati"
                aria-label="Rimuovi dai salvati"
                className="flex items-center justify-center rounded-lg w-11 h-11 md:w-8 md:h-8"
                style={{
                  fontSize: "14px",
                  backgroundColor: "#2a2200",
                  border: "1px solid #7a6010",
                  color: "#c9a030",
                  opacity: isRemoving ? 0.4 : 1,
                  cursor: isRemoving ? "default" : "pointer",
                }}
              >
                ★
              </button>
              <ReasonBadge reason={contact.reason} />
              {placeId && !fresh && (
                <button
                  onClick={() => handleLoadDetails(placeId)}
                  disabled={isLoadingFresh}
                  title="Carica dati aggiornati da Google Places"
                  className="text-xs font-medium rounded-lg flex items-center min-h-[44px] md:min-h-0"
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#2a2200",
                    border: "1px solid #7a6010",
                    color: "#c9a030",
                    cursor: isLoadingFresh ? "default" : "pointer",
                    opacity: isLoadingFresh ? 0.5 : 1,
                  }}
                >
                  {isLoadingFresh ? "Caricamento…" : "↺ Aggiorna"}
                </button>
              )}
              {freshError && (
                <span style={{ fontSize: "11px", color: "#e07070" }}>{freshError}</span>
              )}
              <a
                href={displayMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Apri ${displayName ?? "attività"} su Google Maps`}
                className="text-xs font-medium rounded-lg flex items-center min-h-[44px] md:min-h-0"
                style={{ padding: "6px 12px", backgroundColor: "#383838", color: "#f2f2f2", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#383838")}
              >
                Apri su Google Maps ↗
              </a>
              <button
                onClick={() => { if (placeId) handleGenerateHints(placeId); }}
                disabled={isLoadingHints || !placeId}
                title="Genera spunti di aggancio con AI"
                aria-label={`Genera agganci per ${displayName ?? "attività"}`}
                className="text-xs font-medium rounded-lg flex items-center min-h-[44px] md:min-h-0"
                style={{
                  padding: "6px 12px",
                  background: "linear-gradient(135deg, #c92055 0%, #8f1740 100%)",
                  color: "#f2f2f2",
                  border: "none",
                  cursor: isLoadingHints ? "default" : "pointer",
                  opacity: isLoadingHints ? 0.7 : 1,
                }}
              >
                {isLoadingHints ? "Generazione…" : "✦ Genera agganci"}
              </button>
              <span className="text-xs ml-auto" style={{ color: "#9e9e9e" }}>
                {new Date(contact.savedAt).toLocaleDateString("it-IT")}
              </span>
            </div>
          </div>

          {(hints && hints.length > 0 || hintsError) && (
            <div style={{
              marginTop: "6px",
              padding: "12px 14px",
              backgroundColor: "#1e1216",
              border: "1px solid #5a1030",
              borderRadius: "10px",
            }}>
              {hintsError ? (
                <p style={{ margin: 0, fontSize: "12px", color: "#e07070" }}>{hintsError}</p>
              ) : (
                <>
                  <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 600, color: "#c92055", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Agganci suggeriti
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {hints!.map((hint, i) => (
                      <li key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <span style={{ color: "#c92055", flexShrink: 0, marginTop: "1px" }}>•</span>
                        <span style={{ fontSize: "13px", color: "#e0e0e0", lineHeight: 1.5 }}>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          </div>
        );
      })}
    </div>
  );
}
