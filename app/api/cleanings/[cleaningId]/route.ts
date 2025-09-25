import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { updateCleaningSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/cleanings/[cleaningId] - Get specific cleaning schedule details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cleaningId: string }> }
) {
  try {
    const { cleaningId } = await params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission
    const canView = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_CLEANINGS
    );

    if (!canView) {
      return NextResponse.json(
        { error: "Permission denied: view_cleanings required" },
        { status: 403 }
      );
    }

    const cleaning = await prisma.cleaning.findUnique({
      where: { id: parseInt(cleaningId) },
      include: {
        cleaners: {
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
          },
        },
      },
    });

    if (!cleaning) {
      return NextResponse.json(
        { error: "Cleaning schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(cleaning, { status: 200 });
  } catch (error) {
    console.error("Get cleaning error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/cleanings/[cleaningId] - Update cleaning schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cleaningId: string }> }
) {
  try {
    const { cleaningId } = await params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission
    const canUpdate = await hasPermission(
      parseInt(userId),
      PERMISSIONS.UPDATE_CLEANING
    );

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Permission denied: update_cleaning required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateCleaningSchema.parse(body);

    // Check if cleaning exists
    const existingCleaning = await prisma.cleaning.findUnique({
      where: { id: parseInt(cleaningId) },
    });

    if (!existingCleaning) {
      return NextResponse.json(
        { error: "Cleaning schedule not found" },
        { status: 404 }
      );
    }

    // If userIds are provided, validate them
    if (validatedData.userIds) {
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: validatedData.userIds,
          },
        },
      });

      if (users.length !== validatedData.userIds.length) {
        return NextResponse.json(
          { error: "One or more users not found" },
          { status: 404 }
        );
      }
    }

    // Update cleaning schedule in a transaction
    const updatedCleaning = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const updateData: any = {};
      if (validatedData.date !== undefined) {
        updateData.date = new Date(validatedData.date);
      }
      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description;
      }

      // Update cleaners if provided
      if (validatedData.userIds) {
        // Delete existing cleaners
        await tx.cleaningUser.deleteMany({
          where: { cleaningId: parseInt(cleaningId) },
        });

        // Create new cleaners
        await tx.cleaningUser.createMany({
          data: validatedData.userIds.map((userId) => ({
            cleaningId: parseInt(cleaningId),
            userId,
          })),
        });
      }

      // Update and return the cleaning
      return await tx.cleaning.update({
        where: { id: parseInt(cleaningId) },
        data: updateData,
        include: {
          cleaners: {
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
            },
          },
        },
      });
    });

    return NextResponse.json(updatedCleaning, { status: 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update cleaning error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/cleanings/[cleaningId] - Delete cleaning schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cleaningId: string }> }
) {
  try {
    const { cleaningId } = await params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission
    const canDelete = await hasPermission(
      parseInt(userId),
      PERMISSIONS.DELETE_CLEANING
    );

    if (!canDelete) {
      return NextResponse.json(
        { error: "Permission denied: delete_cleaning required" },
        { status: 403 }
      );
    }

    // Check if cleaning exists
    const existingCleaning = await prisma.cleaning.findUnique({
      where: { id: parseInt(cleaningId) },
    });

    if (!existingCleaning) {
      return NextResponse.json(
        { error: "Cleaning schedule not found" },
        { status: 404 }
      );
    }

    // Delete cleaning (CleaningUser entries will be cascade deleted)
    await prisma.cleaning.delete({
      where: { id: parseInt(cleaningId) },
    });

    return NextResponse.json(
      { message: "Cleaning schedule deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete cleaning error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}