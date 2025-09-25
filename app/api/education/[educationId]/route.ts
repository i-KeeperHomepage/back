import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { updateEducationSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/education/[educationId] - Get specific education record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ educationId: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const educationId = parseInt((await params).educationId);
    const educationRecord = await prisma.educationHistory.findUnique({
      where: { id: educationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            major: true,
            class: true,
          },
        },
        evidenceFile: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimetype: true,
            path: true,
          },
        },
      },
    });

    if (!educationRecord) {
      return NextResponse.json(
        { error: "Education record not found" },
        { status: 404 }
      );
    }

    // Check if user can view this education record
    const canViewAll = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_ALL_EDUCATION
    );

    if (educationRecord.userId !== parseInt(userId) && !canViewAll) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    return NextResponse.json(educationRecord);
  } catch (error) {
    console.error("Error fetching education record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/education/[educationId] - Update education record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ educationId: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const educationId = parseInt((await params).educationId);
    const body = await request.json();
    const validatedData = updateEducationSchema.parse(body);

    // Check if education record exists
    const educationRecord = await prisma.educationHistory.findUnique({
      where: { id: educationId },
    });

    if (!educationRecord) {
      return NextResponse.json(
        { error: "Education record not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isOwner = educationRecord.userId === parseInt(userId);
    const canUpdateOwn = await hasPermission(
      parseInt(userId),
      PERMISSIONS.UPDATE_OWN_EDUCATION
    );
    const canUpdateAny = await hasPermission(
      parseInt(userId),
      PERMISSIONS.UPDATE_ANY_EDUCATION
    );

    if (!((isOwner && canUpdateOwn) || canUpdateAny)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle evidence file update if provided
    let evidenceFileId = educationRecord.evidenceFileId;
    if (body.evidenceFileId !== undefined) {
      if (body.evidenceFileId === null) {
        evidenceFileId = null;
      } else {
        // Verify the file exists and belongs to the user
        const file = await prisma.file.findFirst({
          where: {
            id: body.evidenceFileId,
            uploaderId: parseInt(userId),
          },
        });

        if (!file) {
          return NextResponse.json(
            { error: "Evidence file not found or access denied" },
            { status: 400 }
          );
        }
        evidenceFileId = file.id;
      }
    }

    const updatedEducation = await prisma.educationHistory.update({
      where: { id: educationId },
      data: {
        ...validatedData,
        evidenceFileId: evidenceFileId,
      },
      include: {
        evidenceFile: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimetype: true,
            path: true,
          },
        },
      },
    });

    return NextResponse.json(updatedEducation);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating education record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/education/[educationId] - Delete education record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ educationId: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const educationId = parseInt((await params).educationId);

    // Check if education record exists
    const educationRecord = await prisma.educationHistory.findUnique({
      where: { id: educationId },
    });

    if (!educationRecord) {
      return NextResponse.json(
        { error: "Education record not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isOwner = educationRecord.userId === parseInt(userId);
    const canDeleteOwn = await hasPermission(
      parseInt(userId),
      PERMISSIONS.DELETE_OWN_EDUCATION
    );
    const canDeleteAny = await hasPermission(
      parseInt(userId),
      PERMISSIONS.DELETE_ANY_EDUCATION
    );

    if (!((isOwner && canDeleteOwn) || canDeleteAny)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await prisma.educationHistory.delete({
      where: { id: educationId },
    });

    return NextResponse.json({
      message: "Education record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting education record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
