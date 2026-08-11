import { SavedContact } from "@/lib/contacts";

function escapeField(value: string): string {
  if (value.includes('"') || value.includes(";") || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const REASON_LABEL: Record<string, string> = {
  no_website: "Senza sito",
  unreachable_website: "Sito irraggiungibile",
};

export function exportSavedLeadsToCsv(contacts: SavedContact[]): void {
  const header = ["Categoria", "Nome", "Indirizzo", "Telefono", "Stato", "Google Maps", "Data salvataggio"];

  const rows = contacts.map((c) => [
    escapeField(c.category ?? ""),
    escapeField(c.name),
    escapeField(c.address),
    escapeField(c.phone ?? ""),
    escapeField(REASON_LABEL[c.reason] ?? c.reason),
    escapeField(c.mapsUrl),
    escapeField(new Date(c.savedAt).toLocaleDateString("it-IT")),
  ]);

  const csv = [header.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hiddenlayer-salvati-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
