import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { approveUserSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check permission
    const currentUserId = request.headers.get("x-user-id");
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const canApprove = await hasPermission(
      parseInt(currentUserId),
      PERMISSIONS.APPROVE_USERS
    );

    if (!canApprove) {
      return NextResponse.json(
        { error: "Permission denied: approve_users required" },
        { status: 403 }
      );
    }
    const { userId } = await params;
    const body = await request.json();

    const validatedData = approveUserSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { status: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.status !== "pending_approval") {
      return NextResponse.json(
        { error: "User is not pending approval" },
        { status: 400 }
      );
    }

    if (validatedData.approve) {
      // Approve the user
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          status: "active",
          roleId: 2  // Set to member role
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          roleId: true,
        },
      });

      return NextResponse.json(
        {
          message: "User approved successfully",
          user: updatedUser,
        },
        { status: 200 }
      );
    } else {
      // Reject and delete the user
      await prisma.user.delete({
        where: { id: parseInt(userId) }
      });

      return NextResponse.json(
        {
          message: "User registration rejected and account deleted",
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Approve user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
