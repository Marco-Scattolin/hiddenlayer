"use client";

import { SavedContact } from "@/lib/contacts";
import { exportSavedLeadsToCsv } from "@/lib/exportCsv";

interface ExportCsvButtonProps {
  contacts: SavedContact[];
}

export default function ExportCsvButton({ contacts }: ExportCsvButtonProps) {
  const disabled = contacts.length === 0;

  function handleExportCsv() {
    exportSavedLeadsToCsv(contacts);
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
      Esporta CSV
    </button>
  );
}
