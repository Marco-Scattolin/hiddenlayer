import { supabase } from "@/lib/supabase";

export interface User {
  username: string;
  email?: string;
  passwordHash: string;
}

type UserRow = { username: string; email: string | null; password_hash: string };

function rowToUser(row: UserRow): User {
  const user: User = { username: row.username, passwordHash: row.password_hash };
  if (row.email) user.email = row.email;
  return user;
}

export async function readUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("username, email, password_hash");
  if (error) throw new Error(error.message);
  return (data as UserRow[]).map(rowToUser);
}

export async function findUser(username: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from("users")
    .select("username, email, password_hash")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return rowToUser(data as UserRow);
}

export async function updatePassword(username: string, newHash: string): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ password_hash: newHash })
    .eq("username", username);
  if (error) throw new Error(error.message);
}

export async function createUser(
  username: string,
  email: string | undefined,
  passwordHash: string
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .insert({ username, email: email ?? null, password_hash: passwordHash });
  if (error) {
    if (error.code === "23505") throw new Error("Username già in uso.");
    throw new Error(error.message);
  }
}

export async function updateUser(
  oldUsername: string,
  updates: { username?: string; email?: string | null }
): Promise<void> {
  const patch: Record<string, unknown> = {};

  if (updates.username !== undefined && updates.username !== oldUsername) {
    patch.username = updates.username;
  }
  if (updates.email !== undefined) {
    patch.email = updates.email ?? null;
  }

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase
    .from("users")
    .update(patch)
    .eq("username", oldUsername);

  if (error) {
    if (error.code === "23505") throw new Error("Username già in uso.");
    throw new Error(error.message);
  }
}

export async function deleteUser(username: string): Promise<void> {
  const { error } = await supabase.from("users").delete().eq("username", username);
  if (error) throw new Error(error.message);
}
