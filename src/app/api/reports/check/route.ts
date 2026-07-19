import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { supabase } from "@/lib/supabase";

// POST /api/reports/check — any authenticated user
// Body: { place_ids: string[] }
// Returns: { reported_ids: string[] }
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.username) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { place_ids } = await request.json();

  if (!Array.isArray(place_ids) || place_ids.length === 0) {
    return NextResponse.json({ reported_ids: [] });
  }

  const { data, error } = await supabase
    .from("reports")
    .select("place_id")
    .in("place_id", place_ids);

  if (error) {
    console.error("[reports/check] Supabase error:", error.message);
    return NextResponse.json({ reported_ids: [] });
  }

  const reported_ids = (data ?? [])
    .map((r: { place_id: string | null }) => r.place_id)
    .filter((id): id is string => id !== null);

  return NextResponse.json({ reported_ids });
}
