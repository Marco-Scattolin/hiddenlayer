import { supabase } from "@/lib/supabase";

export interface Report {
  id: string;
  createdAt: string;
  username: string;
  type: string;
  businessName?: string;
  subject?: string;
  note: string;
  placeId?: string;
  triggeredExclusion?: boolean;
}

type ReportRow = {
  id: string;
  created_at: string;
  username: string;
  type: string;
  business_name: string | null;
  object: string | null;
  note: string;
  place_id: string | null;
  triggered_exclusion: boolean | null;
};

function rowToReport(row: ReportRow): Report {
  const report: Report = {
    id: row.id,
    createdAt: row.created_at,
    username: row.username,
    type: row.type,
    note: row.note,
  };
  if (row.business_name) report.businessName = row.business_name;
  if (row.object) report.subject = row.object;
  if (row.place_id) report.placeId = row.place_id;
  if (row.triggered_exclusion != null) report.triggeredExclusion = row.triggered_exclusion;
  return report;
}

export async function readReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, created_at, username, type, business_name, object, note, place_id, triggered_exclusion")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ReportRow[]).map(rowToReport);
}

export async function addReport(data: Omit<Report, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase.from("reports").insert({
    username: data.username,
    type: data.type,
    business_name: data.businessName ?? null,
    object: data.subject ?? null,
    note: data.note,
    place_id: data.placeId ?? null,
    triggered_exclusion: data.triggeredExclusion ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
