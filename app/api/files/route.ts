import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get("purpose");
    const uploaderId = searchParams.get("uploaderId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Check permissions
    const canViewAll = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_FILES
    );
    const canViewOwn = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_OWN_FILES
    );

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { error: "Permission denied: view_files or view_own_files required" },
        { status: 403 }
      );
    }

    // Build where clause based on permissions
    const where: any = {};

    // If user can only view own files, filter by uploaderId
    if (!canViewAll && canViewOwn) {
      where.uploaderId = parseInt(userId);
    } else if (uploaderId) {
      // If user can view all and uploaderId is provided as filter
      where.uploaderId = parseInt(uploaderId);
    }

    if (purpose) {
      where.purpose = purpose;
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimetype: true,
          size: true,
          purpose: true,
          uploadedAt: true,
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { uploadedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.file.count({ where }),
    ]);

    return NextResponse.json(
      {
        files,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get files error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}