import { supabase } from "@/lib/supabase";

export interface SavedContact {
  name: string;
  category: string | null;
  address: string;
  phone: string | null;
  mapsUrl: string;
  reason: string;
  savedAt: string; // ISO date string
}

type ContactRow = {
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  maps_url: string;
  reason: string;
  saved_at: string;
};

function rowToContact(row: ContactRow): SavedContact {
  return {
    name: row.name,
    category: row.category ?? null,
    address: row.address ?? "",
    phone: row.phone ?? null,
    mapsUrl: row.maps_url,
    reason: row.reason,
    savedAt: row.saved_at,
  };
}

export async function readContacts(username: string): Promise<SavedContact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("name, category, address, phone, maps_url, reason, saved_at")
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
    name: c.name,
    category: c.category ?? null,
    address: c.address,
    phone: c.phone ?? null,
    maps_url: c.mapsUrl,
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
      name: contact.name,
      category: contact.category ?? null,
      address: contact.address,
      phone: contact.phone ?? null,
      maps_url: contact.mapsUrl,
      reason: contact.reason,
      saved_at: new Date().toISOString(),
    },
    { onConflict: "username,maps_url", ignoreDuplicates: true }
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

export async function removeContact(username: string, mapsUrl: string): Promise<void> {
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("username", username)
    .eq("maps_url", mapsUrl);
  if (error) throw new Error(error.message);
}

// deleteContactsFile: remove all contacts for a user
export async function deleteContactsFile(username: string): Promise<void> {
  const { error } = await supabase.from("contacts").delete().eq("username", username);
  if (error) throw new Error(error.message);
}
