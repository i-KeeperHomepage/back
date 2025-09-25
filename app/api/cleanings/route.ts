import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { createCleaningSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/cleanings - Get list of cleaning schedules
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    // Date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    const [cleanings, total] = await Promise.all([
      prisma.cleaning.findMany({
        where,
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
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.cleaning.count({ where }),
    ]);

    return NextResponse.json(
      {
        cleanings,
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
    console.error("Get cleanings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/cleanings - Create a new cleaning schedule
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission
    const canCreate = await hasPermission(
      parseInt(userId),
      PERMISSIONS.CREATE_CLEANING
    );

    if (!canCreate) {
      return NextResponse.json(
        { error: "Permission denied: create_cleaning required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createCleaningSchema.parse(body);

    // Check if all user IDs exist
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

    // Create cleaning schedule with cleaners
    const cleaning = await prisma.cleaning.create({
      data: {
        date: new Date(validatedData.date),
        description: validatedData.description,
        cleaners: {
          create: validatedData.userIds.map((userId) => ({
            userId,
          })),
        },
      },
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

    return NextResponse.json(cleaning, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create cleaning error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}