import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { readReports, addReport } from "@/lib/reports";
import { sessionOptions, SessionData, ADMIN_USERNAME } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { REPORT_SUBJECTS } from "@/lib/reportSubjects";

const VALID_TYPES = ["Segnalazione risultato", "Feedback prodotto"] as const;

const VALID_SUBJECTS = REPORT_SUBJECTS.map((s) => s.value);

// Subjects that trigger an exclusion entry
const EXCLUSION_SUBJECTS = new Set(
  REPORT_SUBJECTS.filter((s) => s.excludes).map((s) => s.value),
);

// POST /api/reports — any authenticated user
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.username) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { type, businessName, subject, note, placeId } = await request.json();

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Tipo non valido." }, { status: 400 });
  }

  if (type === "Segnalazione risultato") {
    if (!businessName?.trim()) {
      return NextResponse.json({ error: "Nome attività mancante." }, { status: 400 });
    }
    if (!VALID_SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: "Oggetto non valido." }, { status: 400 });
    }
  }

  if (type === "Feedback prodotto" && !note?.trim()) {
    return NextResponse.json({ error: "Il feedback non può essere vuoto." }, { status: 400 });
  }

  const trimmedNote = (note ?? "").trim();
  const trimmedName = businessName?.trim() || undefined;

  const shouldExclude =
    type === "Segnalazione risultato" ? EXCLUSION_SUBJECTS.has(subject) : false;

  let triggeredExclusion = false;
  if (shouldExclude && trimmedName) {
    const { error: exclusionError } = await supabase
      .from("exclusions")
      .insert({ reason: subject, place_id: placeId || null });
    if (exclusionError) {
      console.error(
        `[reports] Failed to insert exclusion — subject: "${subject}", business: "${trimmedName}", placeId: "${placeId ?? "n/a"}":`,
        exclusionError.message,
      );
    } else {
      triggeredExclusion = true;
    }
  }

  try {
    await addReport({
      username: session.username,
      type,
      businessName: trimmedName,
      subject: subject || undefined,
      note: trimmedNote,
      placeId: placeId || undefined,
      triggeredExclusion,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Unique constraint on place_id
    if (msg.includes("reports_place_id_unique") || msg.includes("duplicate key")) {
      return NextResponse.json({ error: "Attività già segnalata." }, { status: 409 });
    }
    throw err;
  }

  console.log("[reports] N8N_WEBHOOK_URL:", process.env.N8N_WEBHOOK_URL);

  if (process.env.N8N_WEBHOOK_URL) {
    fetch(process.env.N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utente: session.username,
        etichetta: type,
        note: trimmedNote || null,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

// GET /api/reports — admin only, sorted by most recent
export async function GET() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (session.username !== ADMIN_USERNAME) {
    return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
  }

  const reports = await readReports();
  reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ reports });
}
