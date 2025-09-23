import { generateToken, verifyPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { loginSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { loginId: validatedData.loginId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid login credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid login credentials" },
        { status: 401 }
      );
    }

    if (user.status === "pending_approval") {
      return NextResponse.json(
        { error: "Your account is pending approval" },
        { status: 403 }
      );
    }

    if (user.status === "inactive" || user.status === "withdrawn") {
      return NextResponse.json(
        { error: "Your account is not active" },
        { status: 403 }
      );
    }

    const token = await generateToken({
      userId: user.id,
      loginId: user.loginId,
      email: user.email,
      roleId: user.roleId,
    });

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          loginId: user.loginId,
          name: user.name,
          email: user.email,
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
