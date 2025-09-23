import { hashPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { registerSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = registerSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { loginId: validatedData.loginId },
          { email: validatedData.email },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this login ID or email already exists" },
        { status: 400 }
      );
    }

    const defaultRole = await prisma.role.findFirst({
      where: { name: "non-member" },
    });

    if (!defaultRole) {
      await prisma.role.create({
        data: {
          name: "non-member",
          description: "Default role",
        },
      });
    }

    const roleId =
      defaultRole?.id ||
      (await prisma.role.findFirst({ where: { name: "non-member" } }))?.id ||
      3;

    const hashedPassword = await hashPassword(validatedData.password);

    const newUser = await prisma.user.create({
      data: {
        loginId: validatedData.loginId,
        password: hashedPassword,
        name: validatedData.name,
        email: validatedData.email,
        status: "pending_approval",
        roleId: roleId,
      },
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful. Please wait for admin approval.",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
