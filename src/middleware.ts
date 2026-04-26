import { authConfig } from "@/lib/auth.config";
import { rateLimitResponse } from "@/lib/rate-limit";
import NextAuth from "next-auth";
import { type NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Brute-force protection on admin login (Auth.js Credentials callback).
  if (pathname === "/api/auth/callback/credentials" && request.method === "POST") {
    const limited = rateLimitResponse(request, "auth:credentials", {
      max: 5,
      windowMs: 15 * 60_000,
    });
    if (limited) return limited;
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    // Delegate to Auth.js for /admin/* protection.
    return (await auth(
      request as unknown as Parameters<typeof auth>[0],
    )) as unknown as NextResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/auth/callback/credentials"],
};
