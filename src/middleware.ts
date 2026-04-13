import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";

const SESSION_COOKIE = "hl-session";

const PUBLIC_PREFIXES = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sealed = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sealed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await unsealData<{ username: string }>(sealed, {
      password: process.env.SESSION_SECRET!,
    });
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.png|logo.png).*)"],
};
