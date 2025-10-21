import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/app/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/send-verification-code",
    "/api/auth/verify-code",
  ];

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For all other API routes, check authentication
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    try {
      const payload = verifyToken(token);

      // Add user info to headers for downstream processing
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", (await payload).userId.toString());
      requestHeaders.set("x-user-role", (await payload).roleId.toString());

      // Permission checks are now handled in individual route handlers
      // This allows for more granular permission control

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
