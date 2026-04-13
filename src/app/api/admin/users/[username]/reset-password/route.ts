import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { updatePassword } from "@/lib/users";
import { sessionOptions, SessionData, ADMIN_USERNAME } from "@/lib/session";

// POST /api/admin/users/[username]/reset-password — reset to temp password, returned once
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (session.username !== ADMIN_USERNAME) {
    return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
  }

  const { username } = await params;

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  try {
    await updatePassword(username, passwordHash);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }

  return NextResponse.json({ ok: true, tempPassword });
}
