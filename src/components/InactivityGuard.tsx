"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const TIMEOUT_MS = 30 * 60 * 1000;

const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;

export default function InactivityGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname === "/login") return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
      }, TIMEOUT_MS);
    };

    reset();
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [pathname, router]);

  return null;
}
