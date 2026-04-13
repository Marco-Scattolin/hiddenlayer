import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { readUsers, createUser } from "@/lib/users";
import { writeContacts } from "@/lib/contacts";
import { sessionOptions, SessionData, ADMIN_USERNAME } from "@/lib/session";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (session.username !== ADMIN_USERNAME) return null;
  return session;
}

// GET /api/admin/users — list all users (no password hashes)
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
  }

  const users = await readUsers();
  return NextResponse.json({
    users: users.map(({ username, email }) => ({ username, email: email ?? "" })),
  });
}

// POST /api/admin/users — create user, return temp password
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
  }

  const { username, email } = await request.json();

  if (!username?.trim()) {
    return NextResponse.json({ error: "Username obbligatorio." }, { status: 400 });
  }

  const normalised = username.trim().toLowerCase();
  if (!/^[a-z0-9_]+$/.test(normalised)) {
    return NextResponse.json(
      { error: "Username: solo lettere minuscole, numeri e underscore." },
      { status: 400 }
    );
  }

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  try {
    await createUser(normalised, email?.trim() || undefined, passwordHash);
    await writeContacts(normalised, []);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, username: normalised, tempPassword });
}
