import { NextRequest, NextResponse } from "next/server";
import { sendVerificationCodeSchema } from "@/app/lib/validation";
import { prisma } from "@/app/lib/prisma";
import {
  generateVerificationCode,
  sendVerificationEmail,
  createVerificationRecord,
} from "@/app/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendVerificationCodeSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate 6-digit verification code
    const code = generateVerificationCode();

    // Create verification record in database
    await createVerificationRecord(validatedData.email, code);

    // Send verification email
    const emailResult = await sendVerificationEmail(validatedData.email, code);

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error: "Failed to send verification email",
          details: emailResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Verification code sent to your email",
        email: validatedData.email,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Send verification code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
