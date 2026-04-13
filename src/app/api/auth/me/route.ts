import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.username) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  return NextResponse.json({ username: session.username });
}
