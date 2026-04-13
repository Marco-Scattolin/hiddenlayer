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

  const { name, category, address, mapsUrl, phone, reason } = await request.json();

  if (!name?.trim() || !mapsUrl?.trim()) {
    return NextResponse.json({ error: "Dati mancanti." }, { status: 400 });
  }

  await addContact(session.username, {
    name: name.trim(),
    category: category ?? null,
    address: address ?? "",
    mapsUrl: mapsUrl.trim(),
    phone: phone ?? null,
    reason: reason ?? "",
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

  const { mapsUrl } = await request.json();

  if (!mapsUrl?.trim()) {
    return NextResponse.json({ error: "Dati mancanti." }, { status: 400 });
  }

  await removeContact(session.username, mapsUrl.trim());

  return NextResponse.json({ ok: true });
}
