import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { findUser } from "@/lib/users";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Credenziali mancanti." }, { status: 400 });
  }

  const user = await findUser(username.trim().toLowerCase());
  if (!user) {
    return NextResponse.json({ error: "Credenziali non valide." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Credenziali non valide." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.username = user.username;
  await session.save();

  return NextResponse.json({ ok: true });
}
