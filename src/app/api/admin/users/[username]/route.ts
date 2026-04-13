import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { updateUser, deleteUser } from "@/lib/users";
import { renameContactsFile, deleteContactsFile } from "@/lib/contacts";
import { sessionOptions, SessionData, ADMIN_USERNAME } from "@/lib/session";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (session.username !== ADMIN_USERNAME) return null;
  return session;
}

// PATCH /api/admin/users/[username] — edit username and/or email
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
  }

  const { username } = await params;
  const { username: newUsername, email } = await request.json();

  if (newUsername !== undefined && newUsername !== username) {
    // Prevent renaming the admin account
    if (username === ADMIN_USERNAME) {
      return NextResponse.json(
        { error: "Non è possibile rinominare l'account admin." },
        { status: 400 }
      );
    }
    const normalised = newUsername.trim().toLowerCase();
    if (!/^[a-z0-9_]+$/.test(normalised)) {
      return NextResponse.json(
        { error: "Username: solo lettere minuscole, numeri e underscore." },
        { status: 400 }
      );
    }
    try {
      await renameContactsFile(username, normalised);
      await updateUser(username, { username: normalised, email: email ?? null });
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 409 });
    }
  } else {
    try {
      await updateUser(username, { email: email ?? null });
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/[username] — delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
  }

  const { username } = await params;

  if (username === ADMIN_USERNAME) {
    return NextResponse.json(
      { error: "Non è possibile eliminare l'account admin." },
      { status: 400 }
    );
  }

  try {
    await deleteUser(username);
    await deleteContactsFile(username);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
