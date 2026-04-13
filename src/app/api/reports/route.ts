import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { readReports, addReport } from "@/lib/reports";
import { sessionOptions, SessionData, ADMIN_USERNAME } from "@/lib/session";

const VALID_TYPES = ["Segnalazione risultato", "Feedback prodotto"] as const;

const VALID_SUBJECTS = [
  "Sito non rilevato",
  "Info obsolete",
  "Attività non rilevante",
  "Presenza digitale sottovalutata",
  "Altro",
];

// POST /api/reports — any authenticated user
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.username) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { type, businessName, subject, note } = await request.json();

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

  await addReport({
    username: session.username,
    type,
    businessName: businessName?.trim() || undefined,
    subject: subject || undefined,
    note: (note ?? "").trim(),
  });

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
