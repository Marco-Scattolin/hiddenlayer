/**
 * find-place-ids.mjs
 *
 * Standalone script: trova i place_id mancanti in contacts ed exclusions.
 * NON scrive su Supabase. Solo stampa i risultati a schermo.
 *
 * Uso:
 *   node scripts/find-place-ids.mjs
 *
 * Richiede .env.local con GOOGLE_MAPS_API_KEY e .env con credenziali Supabase.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Carica le variabili d'ambiente da .env e .env.local
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // file non trovato: ignora
  }
}

loadEnvFile(resolve(root, ".env"));
loadEnvFile(resolve(root, ".env.local"));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Errore: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY non trovate.");
  process.exit(1);
}
if (!GOOGLE_API_KEY) {
  console.error("Errore: GOOGLE_MAPS_API_KEY non trovata in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// Google Places Text Search (Places API v1)
// ---------------------------------------------------------------------------
async function textSearch(query) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "it", maxResultCount: 1 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Places API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return null;

  return {
    place_id: place.id,
    name: place.displayName?.text ?? "(nessun nome)",
    address: place.formattedAddress ?? "(nessun indirizzo)",
  };
}

// ---------------------------------------------------------------------------
// Formattazione tabellare
// ---------------------------------------------------------------------------
function pad(str, len) {
  const s = String(str ?? "");
  return s.length >= len ? s.slice(0, len - 1) + "…" : s.padEnd(len);
}

function printRow(origName, origAddr, matchName, matchAddr, placeId) {
  console.log(
    pad(origName, 30) + " | " +
    pad(origAddr, 35) + " | " +
    pad(matchName, 30) + " | " +
    pad(matchAddr, 35) + " | " +
    (placeId ?? "(nessun match)")
  );
}

function printHeader() {
  console.log(
    pad("NOME ORIG.", 30) + " | " +
    pad("INDIRIZZO ORIG.", 35) + " | " +
    pad("NOME MATCH", 30) + " | " +
    pad("INDIRIZZO MATCH", 35) + " | " +
    "PLACE_ID"
  );
  console.log("-".repeat(175));
}

// ---------------------------------------------------------------------------
// Processa una lista di righe
// ---------------------------------------------------------------------------
async function processRows(rows, labelFn) {
  for (const row of rows) {
    const { name, address } = labelFn(row);
    const query = [name, address].filter(Boolean).join(", ");

    process.stdout.write(`  Cerco: "${query}" ... `);

    let match = null;
    try {
      match = await textSearch(query);
    } catch (err) {
      process.stdout.write(`ERRORE: ${err.message}\n`);
      printRow(name, address, "ERRORE", err.message, null);
      continue;
    }

    process.stdout.write("ok\n");
    printRow(
      name,
      address,
      match?.name ?? null,
      match?.address ?? null,
      match?.place_id ?? null
    );

    // Piccola pausa per rispettare i rate limit
    await new Promise((r) => setTimeout(r, 300));
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // --- CONTACTS ---
  console.log("\n========== CONTACTS (place_id IS NULL) ==========\n");

  const { data: contacts, error: cErr } = await supabase
    .from("contacts")
    .select("name, address, maps_url, username")
    .is("place_id", null)
    .order("name");

  if (cErr) {
    console.error("Errore lettura contacts:", cErr.message);
  } else if (!contacts.length) {
    console.log("Nessuna riga trovata.");
  } else {
    console.log(`Trovate ${contacts.length} righe.\n`);
    printHeader();
    await processRows(contacts, (r) => ({ name: r.name, address: r.address ?? "" }));
  }

  // --- EXCLUSIONS ---
  console.log("\n\n========== EXCLUSIONS (place_id IS NULL) ==========\n");

  const { data: excl, error: eErr } = await supabase
    .from("exclusions")
    .select("id, name, domain, reason")
    .is("place_id", null)
    .order("name");

  if (eErr) {
    console.error("Errore lettura exclusions:", eErr.message);
  } else if (!excl.length) {
    console.log("Nessuna riga trovata.");
  } else {
    console.log(`Trovate ${excl.length} righe.\n`);
    printHeader();
    await processRows(excl, (r) => ({ name: r.name ?? "", address: "" }));
  }

  console.log("\nFine. Nessuna modifica scritta su Supabase.\n");
}

main().catch((err) => {
  console.error("Errore fatale:", err);
  process.exit(1);
});
