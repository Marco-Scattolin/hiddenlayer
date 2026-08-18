import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { getPlaceDetails } from "@/lib/googlePlaces";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.username) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { placeId } = await params;

  try {
    const details = await getPlaceDetails(placeId);
    return NextResponse.json({ details });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[places] getPlaceDetails failed for "${placeId}":`, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
