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
        className="px-8 py-2 flex items-center"
        style={{ borderBottom: "1px solid #333" }}
      >
        <Link href="/">
          <Image
            src="/logo.png"
            alt="HiddenLayer"
            width={200}
            height={133}
            priority
          />
        </Link>
        <NavLinks />
        <Link
          href="/"
          className="ml-auto text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
          onMouseEnter={undefined}
        >
          ← Torna alla ricerca
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-16">
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
