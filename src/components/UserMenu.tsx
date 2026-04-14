"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_USERNAME = "marco";

export default function UserMenu({ username }: { username: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
      <span className="text-xs hidden sm:block" style={{ color: "#f2f2f2", opacity: 0.4 }}>
        {username}
      </span>
      {username === ADMIN_USERNAME && (
        <Link
          href="/admin"
          className="text-xs font-medium px-2 sm:px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: "#3a1060", color: "#c084fc" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4a1878")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3a1060")}
        >
          Admin
        </Link>
      )}
      <Link
        href="/settings"
        className="text-xs font-medium px-2 sm:px-3 py-1.5 rounded-lg transition-colors"
        style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#383838")}
      >
        <span className="hidden sm:inline">Impostazioni</span>
        <span className="sm:hidden">⚙</span>
      </Link>
      <button
        onClick={handleLogout}
        className="text-xs font-medium px-2 sm:px-3 py-1.5 rounded-lg transition-colors"
        style={{ backgroundColor: "#383838", color: "#f2f2f2" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#383838")}
      >
        Esci
      </button>
    </div>
  );
}
