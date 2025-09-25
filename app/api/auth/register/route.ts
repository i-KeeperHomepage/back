import { hashPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { registerSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

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

    // Get default role
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

    // Handle signature image if provided
    let signatureImageId: number | undefined = undefined;
    if (body.signatureImage) {
      // Create file record for signature
      const fileRecord = await prisma.file.create({
        data: {
          filename: `signature_${uuidv4()}.png`,
          originalName: "signature.png",
          mimetype: "image/png",
          size: 0, // This would be calculated from actual file
          purpose: "signature",
          path: `/uploads/signatures/${uuidv4()}.png`,
          uploaderId: 1, // Temporary, will be updated after user creation
        },
      });
      signatureImageId = fileRecord.id;
    }

    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        major: validatedData.major,
        class: validatedData.class,
        signatureImageId: signatureImageId,
        status: "pending_approval",
        roleId: roleId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        major: true,
        class: true,
        status: true,
        createdAt: true,
      },
    });

    // Update the file record with the correct uploader ID if signature was uploaded
    if (signatureImageId) {
      await prisma.file.update({
        where: { id: signatureImageId },
        data: { uploaderId: newUser.id },
      });
    }

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
