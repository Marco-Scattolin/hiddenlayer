import { supabase } from "@/lib/supabase";

export interface SavedContact {
  reason: string;
  place_id?: string | null;
  savedAt: string; // ISO date string
}

type ContactRow = {
  reason: string;
  saved_at: string;
  place_id?: string | null;
};

function rowToContact(row: ContactRow): SavedContact {
  return {
    reason: row.reason,
    place_id: row.place_id ?? null,
    savedAt: row.saved_at,
  };
}

export async function readContacts(username: string): Promise<SavedContact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("reason, saved_at, place_id")
    .eq("username", username)
    .order("saved_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ContactRow[]).map(rowToContact);
}

// writeContacts: replaces all contacts for a user in one shot (used for bulk sync)
export async function writeContacts(username: string, contacts: SavedContact[]): Promise<void> {
  const { error: delError } = await supabase
    .from("contacts")
    .delete()
    .eq("username", username);
  if (delError) throw new Error(delError.message);

  if (contacts.length === 0) return;

  const rows = contacts.map((c) => ({
    username,
    reason: c.reason,
    saved_at: c.savedAt,
  }));

  const { error: insError } = await supabase.from("contacts").insert(rows);
  if (insError) throw new Error(insError.message);
}

export async function addContact(username: string, contact: Omit<SavedContact, "savedAt">): Promise<void> {
  const { error } = await supabase.from("contacts").upsert(
    {
      username,
      reason: contact.reason,
      place_id: contact.place_id ?? null,
      saved_at: new Date().toISOString(),
    },
    { onConflict: "username,place_id", ignoreDuplicates: true }
  );
  if (error) throw new Error(error.message);
}

// renameContactsFile: update all contacts rows to the new username
export async function renameContactsFile(oldUsername: string, newUsername: string): Promise<void> {
  const { error } = await supabase
    .from("contacts")
    .update({ username: newUsername })
    .eq("username", oldUsername);
  if (error) throw new Error(error.message);
}

export async function removeContact(username: string, placeId: string): Promise<void> {
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("username", username)
    .eq("place_id", placeId);
  if (error) throw new Error(error.message);
}

// deleteContactsFile: remove all contacts for a user
export async function deleteContactsFile(username: string): Promise<void> {
  const { error } = await supabase.from("contacts").delete().eq("username", username);
  if (error) throw new Error(error.message);
}
