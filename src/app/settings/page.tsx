import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import Image from "next/image";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  return (
    <div
      className="min-h-screen flex flex-col font-[family-name:var(--font-inter)]"
      style={{ backgroundColor: "#252525", color: "#f2f2f2" }}
    >
      <header
        className="px-3 sm:px-8 py-2 flex items-center"
        style={{ borderBottom: "1px solid #333" }}
      >
        <Link href="/" className="shrink-0">
          <div className="w-28 sm:w-[200px]">
            <Image src="/logo.png" alt="HiddenLayer" width={200} height={133} priority className="w-full h-auto" />
          </div>
        </Link>
        <NavLinks />
        <Link
          href="/"
          className="ml-auto text-xs font-medium px-2 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0"
          style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
        >
          <span className="hidden sm:inline">← Torna alla ricerca</span>
          <span className="sm:hidden">←</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1
              className="text-2xl font-semibold mb-2"
              style={{ color: "#f2f2f2" }}
            >
              Impostazioni
            </h1>
            <p
              className="text-sm"
              style={{ color: "#f2f2f2", opacity: 0.5 }}
            >
              Utente: <span style={{ opacity: 1 }}>{session.username}</span>
            </p>
          </div>

          <ChangePasswordForm />
        </div>
      </main>
    </div>
  );
}
