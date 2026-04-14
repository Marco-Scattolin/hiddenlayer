import Image from "next/image";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import SearchForm from "@/components/SearchForm";
import UserMenu from "@/components/UserMenu";
import NavLinks from "@/components/NavLinks";
import { sessionOptions, SessionData } from "@/lib/session";

export default async function Home() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-inter)]" style={{ backgroundColor: "#252525", color: "#f2f2f2" }}>
      <header className="px-3 sm:px-8 py-2 flex items-center" style={{ borderBottom: "1px solid #333" }}>
        <div className="w-28 sm:w-[200px] shrink-0">
          <Image
            src="/logo.png"
            alt="HiddenLayer"
            width={200}
            height={133}
            priority
            className="w-full h-auto"
          />
        </div>
        <NavLinks />
        <UserMenu username={session.username} />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-16">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2" style={{ color: "#f2f2f2" }}>
              Trova attività senza presenza web
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#f2f2f2", opacity: 0.6 }}>
              Inserisci un settore e un&apos;area per trovare attività locali senza sito o con un sito irraggiungibile.
            </p>
          </div>

          <SearchForm />
        </div>
      </main>
    </div>
  );
}
