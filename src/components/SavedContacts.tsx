"use client";

import { useState } from "react";
import { SavedContact } from "@/lib/contacts";

function ReasonBadge({ reason }: { reason: string }) {
  const isNoWebsite = reason === "no_website";
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: isNoWebsite ? "rgba(34,197,94,0.15)" : "rgba(251,146,60,0.15)",
        color: isNoWebsite ? "#4ade80" : "#fb923c",
      }}
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
      {contacts.map((contact) => (
        <div
          key={contact.mapsUrl}
          className="rounded-xl p-4"
          style={{ backgroundColor: "#2e2e2e", border: "1px solid #383838" }}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-sm font-semibold" style={{ color: "#f2f2f2" }}>
              {contact.name}
            </span>
            <ReasonBadge reason={contact.reason} />
          </div>

          {contact.category && (
            <p className="text-xs mb-1" style={{ color: "#f2f2f2", opacity: 0.45 }}>
              {contact.category}
            </p>
          )}

          {contact.address && (
            <p className="text-xs mb-1" style={{ color: "#f2f2f2", opacity: 0.6 }}>
              {contact.address}
            </p>
          )}

          {contact.phone && (
            <p className="text-xs mb-3" style={{ color: "#f2f2f2", opacity: 0.6 }}>
              {contact.phone}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap mt-3">
            <button
              onClick={() => handleRemove(contact.mapsUrl)}
              disabled={removing === contact.mapsUrl}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: "#383838", color: "#f2f2f2", opacity: removing === contact.mapsUrl ? 0.5 : 1 }}
              title="Rimuovi dai salvati"
            >
              ★
            </button>
            <a
              href={contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
            >
              Apri su Google Maps ↗
            </a>
            <span className="text-xs ml-auto" style={{ color: "#f2f2f2", opacity: 0.3 }}>
              {new Date(contact.savedAt).toLocaleDateString("it-IT")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
