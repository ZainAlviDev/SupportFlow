import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/forgot-password", "/verify-email", "/accept-invite"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session =
    request.cookies.get("sf_session")?.value ?? request.cookies.get("sf_access_token")?.value;

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isRoot = pathname === "/";
  const isStaticAsset =
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/_next") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname);
  const isDashboard = !isPublic && !isStaticAsset;

  if ((isDashboard || isRoot) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    isPublic &&
    session &&
    !pathname.startsWith("/forgot-password") &&
    !pathname.startsWith("/verify-email") &&
    !pathname.startsWith("/accept-invite")
  ) {
    // Allow post-register / post-verify landing on login without bouncing to inbox.
    const isPostAuthLanding =
      pathname.startsWith("/login") &&
      (request.nextUrl.searchParams.get("registered") === "1" ||
        request.nextUrl.searchParams.get("verified") === "1");
    if (!isPostAuthLanding) {
      return NextResponse.redirect(new URL("/inbox", request.url));
    }
  }

  if (isRoot && session) {
    return NextResponse.redirect(new URL("/inbox", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals, favicon, and public brand/static image assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
