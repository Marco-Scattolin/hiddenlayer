"use client";

import { useState } from "react";
import { SavedContact } from "@/lib/contacts";

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

export default function SavedContacts({ initialContacts }: { initialContacts: SavedContact[] }) {
  const [contacts, setContacts] = useState<SavedContact[]>(initialContacts);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(mapsUrl: string) {
    setRemoving(mapsUrl);
    try {
      const res = await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapsUrl }),
      });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.mapsUrl !== mapsUrl));
      }
    } finally {
      setRemoving(null);
    }
  }

  if (contacts.length === 0) {
    return (
      <p className="text-sm" style={{ color: "#f2f2f2", opacity: 0.4 }}>
        Nessun contatto salvato.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {contacts.map((contact) => {
        const isNoWebsite = contact.reason === "no_website";
        const headerGradient = isNoWebsite
          ? "linear-gradient(150deg, #122318 0%, #1a2e22 60%, #262e28 100%)"
          : "linear-gradient(150deg, #2a190a 0%, #2e2210 60%, #2d2b25 100%)";
        const isRemoving = removing === contact.mapsUrl;

        return (
          <div
            key={contact.mapsUrl}
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
                <span style={{
                  fontSize: "42px", fontWeight: 700, lineHeight: 1,
                  color: "rgba(255,255,255,0.1)",
                  userSelect: "none",
                }}>
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "56px",
                background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
              }} />

              {/* Category pill + Name — bottom left */}
              <div style={{ position: "absolute", bottom: "11px", left: "14px", right: "14px" }}>
                {contact.category && (
                  <span style={{
                    display: "inline-block",
                    fontSize: "10px", fontWeight: 500, lineHeight: 1,
                    padding: "3px 8px", borderRadius: "999px", marginBottom: "5px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "rgba(242,242,242,0.75)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    {contact.category}
                  </span>
                )}
                <p style={{
                  margin: 0, fontSize: "14px", fontWeight: 600, color: "#f2f2f2",
                  lineHeight: 1.25, textShadow: "0 1px 6px rgba(0,0,0,0.6)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {contact.name}
                </p>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "12px 14px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {contact.address && (
                <div style={{ display: "flex", gap: "7px", alignItems: "flex-start" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: "1px", flexShrink: 0, opacity: 0.5 }}>
                    <path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1Zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" fill="#f2f2f2" />
                  </svg>
                  <span style={{ fontSize: "12px", color: "#f2f2f2", opacity: 0.62, lineHeight: 1.45 }}>
                    {contact.address}
                  </span>
                </div>
              )}
              {contact.phone && (
                <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                    <path d="M2.5 1.5h2l.75 2-1.25.75A6.25 6.25 0 0 0 7.25 8l.75-1.25 2 .75v2C7.5 10 1.5 4 2.5 1.5Z" fill="#f2f2f2" />
                  </svg>
                  <span style={{ fontSize: "12px", color: "#f2f2f2", opacity: 0.62 }}>
                    {contact.phone}
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
                onClick={() => handleRemove(contact.mapsUrl)}
                disabled={isRemoving}
                title="Rimuovi dai salvati"
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: "32px", height: "32px", fontSize: "14px",
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
              <a
                href={contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium rounded-lg"
                style={{ padding: "6px 12px", backgroundColor: "#383838", color: "#f2f2f2", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#383838")}
              >
                Apri su Google Maps ↗
              </a>
              <span className="text-xs ml-auto" style={{ color: "#f2f2f2", opacity: 0.3 }}>
                {new Date(contact.savedAt).toLocaleDateString("it-IT")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
