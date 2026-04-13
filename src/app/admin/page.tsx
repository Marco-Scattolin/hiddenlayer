import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import { sessionOptions, SessionData, ADMIN_USERNAME } from "@/lib/session";
import AdminPanel from "./AdminPanel";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (session.username !== ADMIN_USERNAME) {
    redirect("/");
  }

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
        <Link
          href="/"
          className="ml-auto text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
        >
          ← Torna alla ricerca
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1" style={{ color: "#f2f2f2" }}>
              Pannello Admin
            </h1>
            <p className="text-sm" style={{ color: "#f2f2f2", opacity: 0.4 }}>
              Gestione utenti
            </p>
          </div>
          <AdminPanel />
        </div>
      </main>
    </div>
  );
}
