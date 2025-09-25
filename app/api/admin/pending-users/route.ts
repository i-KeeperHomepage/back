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
      PERMISSIONS.VIEW_PENDING_USERS
    );

    if (!canView) {
      return NextResponse.json(
        { error: "Permission denied: view_pending_users required" },
        { status: 403 }
      );
    }
    const pendingUsers = await prisma.user.findMany({
      where: { status: "pending_approval", roleId: 3 },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pendingUsers, { status: 200 });
  } catch (error) {
    console.error("Get pending users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
