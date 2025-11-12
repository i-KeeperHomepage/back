import { generateToken, verifyPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { loginSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

function setCORSHeaders(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return res;
}

export async function OPTIONS() {
  return setCORSHeaders(new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { role: true },
    });

    if (!user) {
      const res = NextResponse.json(
        { error: "Invalid login credentials" },
        { status: 401 }
      );
      return setCORSHeaders(res);
    }

    const isPasswordValid = await verifyPassword(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      const res = NextResponse.json(
        { error: "Invalid login credentials" },
        { status: 401 }
      );
      return setCORSHeaders(res);
    }

    if (user.status === "pending_approval") {
      const res = NextResponse.json(
        { error: "Your account is pending approval" },
        { status: 403 }
      );
      return setCORSHeaders(res);
    }

    if (user.status === "inactive" || user.status === "withdrawn") {
      const res = NextResponse.json(
        { error: "Your account is not active" },
        { status: 403 }
      );
      return setCORSHeaders(res);
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          major: user.major,
          class: user.class,
          role: user.role.name,
        },
        accessToken: token,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: false,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return setCORSHeaders(response);
  } catch (error: any) {
    console.error("Login error:", error);
    const res =
      error.name === "ZodError"
        ? NextResponse.json(
            { error: "Validation failed", details: error.errors },
            { status: 400 }
          )
        : NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
          );
    return setCORSHeaders(res);
  }
}
