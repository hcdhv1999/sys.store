import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/i18n/config";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    Boolean(request.cookies.get(SESSION_COOKIE)?.value) ||
    // Supabase auth cookie (real deployments)
    request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except static assets and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
