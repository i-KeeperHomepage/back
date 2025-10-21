import { NextRequest, NextResponse } from "next/server";
import { verifyCodeSchema } from "@/app/lib/validation";
import { verifyEmailCode } from "@/app/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyCodeSchema.parse(body);

    // Verify the code
    const result = await verifyEmailCode(
      validatedData.email,
      validatedData.code
    );

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid verification code" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Email verified successfully",
        verified: true,
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

    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
