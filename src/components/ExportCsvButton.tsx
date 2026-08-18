"use client";

import { useState } from "react";
import { SavedContact } from "@/lib/contacts";
import { ExportRow, exportSavedLeadsToCsv } from "@/lib/exportCsv";

interface ExportCsvButtonProps {
  contacts: SavedContact[];
}

export default function ExportCsvButton({ contacts }: ExportCsvButtonProps) {
  const [exporting, setExporting] = useState(false);
  const disabled = contacts.length === 0 || exporting;

  async function handleExportCsv() {
    setExporting(true);
    try {
      const enriched = await Promise.all(
        contacts.map(async (c): Promise<ExportRow | null> => {
          if (!c.place_id) return null;
          try {
            const res = await fetch(`/api/places/${encodeURIComponent(c.place_id)}`);
            if (!res.ok) {
              const data = await res.json();
              console.error(`[ExportCsvButton] Enrichment failed for place_id "${c.place_id}":`, data.error);
              return null;
            }
            const { details } = await res.json();
            return {
              place_id: c.place_id,
              name: details.name,
              address: details.address,
              category: details.category,
              phone: details.phone,
              mapsUrl: details.mapsUrl,
              reason: c.reason,
              savedAt: c.savedAt,
            };
          } catch (err) {
            console.error(`[ExportCsvButton] Fetch error for place_id "${c.place_id}":`, err);
            return null;
          }
        })
      );
      exportSavedLeadsToCsv(enriched.filter((r): r is ExportRow => r !== null));
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExportCsv}
      disabled={disabled}
      style={{
        fontSize: "12px",
        fontWeight: 500,
        padding: "6px 12px",
        borderRadius: "8px",
        backgroundColor: "#2a0a14",
        border: "1px solid #c92055",
        color: "#f2f2f2",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = "#3a0e1c";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = "#2a0a14";
      }}
    >
      {exporting ? "Esportazione…" : "Esporta CSV"}
    </button>
  );
}
