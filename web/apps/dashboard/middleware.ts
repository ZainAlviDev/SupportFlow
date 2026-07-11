import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("sf_access_token")?.value;

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isRoot = pathname === "/";
  const isDashboard = !isPublic && !pathname.startsWith("/_next");

  if ((isDashboard || isRoot) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL("/inbox", request.url));
  }

  if (isRoot && token) {
    return NextResponse.redirect(new URL("/inbox", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
