import { verifyToken } from "@/app/lib/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://yourdomain.com",
  "https://www.yourdomain.com",
];

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  // 허용된 origin인지 확인
  const isAllowed = origin && allowedOrigins.includes(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();

  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  const pathname = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = [
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/send-verification-code",
    "/api/auth/verify-code",
  ];

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return response;
  }

  // For all other API routes, check authentication
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: response.headers }
      );
    }

    try {
      const payload = verifyToken(token);

      // Add user info to headers for downstream processing
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", (await payload).userId.toString());
      requestHeaders.set("x-user-role", (await payload).roleId.toString());
      requestHeaders.set(
        "Access-Control-Allow-Origin",
        process.env.BASE_URL || ""
      );
      requestHeaders.set("Access-Control-Allow-Credentials", "true");

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
        { status: 401, headers: response.headers }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
