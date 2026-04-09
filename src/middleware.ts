/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Global Auth Middleware

   Lightweight cookie check for protected routes.
   Full session validation happens in layout/api routes.

   Protected: /dashboard/*
   Public: /, /demo/*, /contact, /display/*, /api/auth/*,
           /api/health, /api/scan, /api/qrcode, /api/sse,
           /api/display/*, /api/hospitality/*, /api/webhooks/*,
           /api/cron/*
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "mc-session";

// Routes that require authentication
const PROTECTED_PATHS = ["/dashboard"];

// Routes that are always public (no auth needed)
const PUBLIC_API_PATHS = [
  "/api/auth",
  "/api/health",
  "/api/scan",
  "/api/qrcode",
  "/api/sse",
  "/api/display",
  "/api/hospitality",
  "/api/webhooks",
  "/api/cron",
  "/api/themealdb",
  "/api/soundscapes",
  "/api/smart-grocery",
  "/api/enrichment",
];

// Static assets
const STATIC_EXTENSIONS = [".js", ".css", ".png", ".jpg", ".svg", ".ico", ".webp", ".woff", ".woff2", ".json"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and _next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo") ||
    STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  ) {
    return NextResponse.next();
  }

  // Skip manifest.json
  if (pathname === "/manifest.json") {
    return NextResponse.next();
  }

  // Check if this is a protected path
  const isProtectedRoute = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // Check if this is a protected API route (everything under /api/* except public ones)
  const isProtectedApi =
    pathname.startsWith("/api/") &&
    !PUBLIC_API_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));

  if (!isProtectedRoute && !isProtectedApi) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    // For API routes, return 401
    if (isProtectedApi) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    // For page routes, redirect to home
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "required");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, logo.svg
     * - public files
     */
    "/((?!_next/static|_next/image|favicon\\.ico|logo\\.svg|sw\\.js|manifest\\.json).*)",
  ],
};
