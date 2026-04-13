import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { findUser, updatePassword } from "@/lib/users";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.username) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Campi mancanti." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "La nuova password deve avere almeno 8 caratteri." },
      { status: 400 }
    );
  }

  const user = await findUser(session.username);
  if (!user) {
    return NextResponse.json({ error: "Utente non trovato." }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Password attuale non corretta." }, { status: 401 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await updatePassword(session.username, newHash);

  return NextResponse.json({ ok: true });
}
