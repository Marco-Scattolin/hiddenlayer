import Image from "next/image";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import UserMenu from "@/components/UserMenu";
import SavedContacts from "@/components/SavedContacts";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { readContacts } from "@/lib/contacts";

export default async function SavedPage() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  const contacts = session.username ? await readContacts(session.username) : [];

  return (
    <div
      className="min-h-screen flex flex-col font-[family-name:var(--font-inter)]"
      style={{ backgroundColor: "#252525", color: "#f2f2f2" }}
    >
      <header
        className="px-8 py-2 flex items-center"
        style={{ borderBottom: "1px solid #333" }}
      >
        <Link href="/">
          <Image src="/logo.png" alt="HiddenLayer" width={200} height={133} priority />
        </Link>
        <NavLinks />
        <UserMenu username={session.username} />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1" style={{ color: "#f2f2f2" }}>
              Salvati
            </h1>
            <p className="text-sm" style={{ color: "#f2f2f2", opacity: 0.4 }}>
              {contacts.length} {contacts.length === 1 ? "contatto salvato" : "contatti salvati"}
            </p>
          </div>
          <SavedContacts initialContacts={contacts} />
        </div>
      </main>
    </div>
  );
}
