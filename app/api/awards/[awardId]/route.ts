import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { updateAwardSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/awards/[awardId] - Get specific award
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ awardId: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const awardId = parseInt((await params).awardId);
    const award = await prisma.award.findUnique({
      where: { id: awardId },
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

    if (!award) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 });
    }

    // Check if user can view this award
    const canViewAll = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_ALL_AWARDS
    );

    if (award.userId !== parseInt(userId) && !canViewAll) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    return NextResponse.json(award);
  } catch (error) {
    console.error("Error fetching award:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/awards/[awardId] - Update award
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ awardId: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const awardId = parseInt((await params).awardId);
    const body = await request.json();
    const validatedData = updateAwardSchema.parse(body);

    // Check if award exists
    const award = await prisma.award.findUnique({
      where: { id: awardId },
    });

    if (!award) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 });
    }

    // Check permissions
    const isOwner = award.userId === parseInt(userId);
    const canUpdateOwn = await hasPermission(
      parseInt(userId),
      PERMISSIONS.UPDATE_OWN_AWARD
    );
    const canUpdateAny = await hasPermission(
      parseInt(userId),
      PERMISSIONS.UPDATE_ANY_AWARD
    );

    if (!((isOwner && canUpdateOwn) || canUpdateAny)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle evidence file update if provided
    let evidenceFileId = award.evidenceFileId;
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

    const updatedAward = await prisma.award.update({
      where: { id: awardId },
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

    return NextResponse.json(updatedAward);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating award:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/awards/[awardId] - Delete award
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ awardId: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const awardId = parseInt((await params).awardId);

    // Check if award exists
    const award = await prisma.award.findUnique({
      where: { id: awardId },
    });

    if (!award) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 });
    }

    // Check permissions
    const isOwner = award.userId === parseInt(userId);
    const canDeleteOwn = await hasPermission(
      parseInt(userId),
      PERMISSIONS.DELETE_OWN_AWARD
    );
    const canDeleteAny = await hasPermission(
      parseInt(userId),
      PERMISSIONS.DELETE_ANY_AWARD
    );

    if (!((isOwner && canDeleteOwn) || canDeleteAny)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await prisma.award.delete({
      where: { id: awardId },
    });

    return NextResponse.json({ message: "Award deleted successfully" });
  } catch (error) {
    console.error("Error deleting award:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
