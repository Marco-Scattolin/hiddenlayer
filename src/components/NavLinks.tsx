"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Ricerca" },
  { href: "/saved", label: "Salvati" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0.5 sm:gap-1 ml-2 sm:ml-6">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="text-xs font-medium px-2 sm:px-3 py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: active ? "#383838" : "transparent",
              color: "#f2f2f2",
              opacity: active ? 1 : 0.5,
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
