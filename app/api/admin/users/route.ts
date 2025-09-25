import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check permission
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const canView = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_ALL_USERS
    );

    if (!canView) {
      return NextResponse.json(
        { error: "Permission denied: view_all_users required" },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const roleId = searchParams.get("roleId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (roleId) {
      where.roleId = parseInt(roleId);
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { roleId: { not: 3 } },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: { roleId: { not: 3 } } }),
    ]);

    return NextResponse.json(
      {
        users,
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
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
