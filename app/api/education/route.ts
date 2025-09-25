import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { createEducationSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/education - Get all education records (admin) or own education
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view all education records
    const canViewAll = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_ALL_EDUCATION
    );

    let educationRecords;
    if (canViewAll) {
      // Admin can see all education records
      educationRecords = await prisma.educationHistory.findMany({
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
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Regular users can only see their own education
      educationRecords = await prisma.educationHistory.findMany({
        where: { userId: parseInt(userId) },
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
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(educationRecords);
  } catch (error) {
    console.error("Error fetching education records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/education - Create a new education record
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createEducationSchema.parse(body);

    // Check if user has permission to create education records
    const canCreateOwn = await hasPermission(
      parseInt(userId),
      PERMISSIONS.CREATE_OWN_EDUCATION
    );

    if (!canCreateOwn) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle evidence file if provided
    let evidenceFileId: number | null = null;
    if (body.evidenceFileId) {
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

    const educationRecord = await prisma.educationHistory.create({
      data: {
        userId: parseInt(userId),
        title: validatedData.title,
        description: validatedData.description,
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

    return NextResponse.json(educationRecord, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating education record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
