import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { addContact, removeContact } from "@/lib/contacts";
import { sessionOptions, SessionData } from "@/lib/session";

// POST /api/contacts — save a contact to the logged-in user's contacts file
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.username) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { reason, place_id } = await request.json();

  if (!place_id?.trim()) {
    return NextResponse.json({ error: "Dati mancanti." }, { status: 400 });
  }

  await addContact(session.username, {
    reason: reason ?? "",
    place_id: place_id ?? null,
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/contacts — remove a contact from the logged-in user's contacts file
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.username) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { place_id } = await request.json();

  if (!place_id?.trim()) {
    return NextResponse.json({ error: "Dati mancanti." }, { status: 400 });
  }

  await removeContact(session.username, place_id.trim());

  return NextResponse.json({ ok: true });
}
