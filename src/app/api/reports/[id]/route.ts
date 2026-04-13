import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { deleteReport } from "@/lib/reports";
import { sessionOptions, SessionData, ADMIN_USERNAME } from "@/lib/session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (session.username !== ADMIN_USERNAME) {
    return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteReport(id);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
