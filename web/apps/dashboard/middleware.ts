import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Long-lived marker only — real auth is Bearer token in localStorage / API client.
  const session = request.cookies.get("sf_session")?.value
    ?? request.cookies.get("sf_access_token")?.value;

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isRoot = pathname === "/";
  const isDashboard = !isPublic && !pathname.startsWith("/_next");

  if ((isDashboard || isRoot) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic && session) {
    return NextResponse.redirect(new URL("/inbox", request.url));
  }

  if (isRoot && session) {
    return NextResponse.redirect(new URL("/inbox", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
