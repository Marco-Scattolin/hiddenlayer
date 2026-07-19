import Image from "next/image";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import { REPORT_SUBJECTS } from "@/lib/reportSubjects";

export default function GuidaPage() {
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
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2" style={{ color: "#f2f2f2" }}>
              Guida alle segnalazioni
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#f2f2f2", opacity: 0.55 }}>
              Usa il pulsante <strong style={{ opacity: 1, color: "#f2f2f2" }}>Segnala</strong> su una scheda per indicare
              perché un risultato non è utile. Il motivo scelto determina se l&apos;attività viene
              esclusa automaticamente dalle ricerche future.
            </p>
          </div>

          {/* Subject table */}
          <div className="rounded-xl overflow-hidden mb-8" style={{ border: "1px solid #383838" }}>
            {/* Header row */}
            <div
              className="grid grid-cols-[1fr_2fr] px-4 py-2.5"
              style={{ backgroundColor: "#2a2a2a", borderBottom: "1px solid #383838" }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#f2f2f2", opacity: 0.4 }}>
                Motivo
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#f2f2f2", opacity: 0.4 }}>
                Quando usarlo
              </span>
            </div>

            {/* Data rows */}
            <div className="flex flex-col divide-y" style={{ backgroundColor: "#2e2e2e", borderColor: "#383838" }}>
              {REPORT_SUBJECTS.map((s) => (
                <div key={s.value} className="grid grid-cols-[1fr_2fr] gap-4 px-4 py-3.5 items-start">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium" style={{ color: "#f2f2f2" }}>
                      {s.value}
                    </span>
                    {s.excludes ? (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full w-fit"
                        style={{ backgroundColor: "transparent", border: "1px solid #c92055", color: "#c92055" }}
                      >
                        Esclude
                      </span>
                    ) : (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full w-fit"
                        style={{ backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#f2f2f2", opacity: 0.5 }}
                      >
                        Da verificare
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#f2f2f2", opacity: 0.62 }}>
                    {s.when}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3 text-sm leading-relaxed" style={{ color: "#f2f2f2", opacity: 0.55 }}>
            <p>
              <span
                className="inline-block text-xs px-2 py-0.5 rounded-full mr-2 align-middle"
                style={{ backgroundColor: "transparent", border: "1px solid #c92055", color: "#c92055", opacity: 1 }}
              >
                Esclude
              </span>
              L&apos;attività viene aggiunta all&apos;elenco delle esclusioni e non apparirà più nelle ricerche future.
            </p>
            <p>
              <span
                className="inline-block text-xs px-2 py-0.5 rounded-full mr-2 align-middle"
                style={{ backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#f2f2f2", opacity: 1 }}
              >
                Da verificare
              </span>
              La segnalazione viene registrata per revisione manuale nel pannello admin. L&apos;attività non viene esclusa automaticamente.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
