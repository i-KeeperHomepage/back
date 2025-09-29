import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { updateUserSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    const canView = await hasPermission(
      parseInt(currentUserId),
      PERMISSIONS.VIEW_USER_DETAILS
    );

    if (!canView) {
      return NextResponse.json(
        { error: "Permission denied: view_user_details required" },
        { status: 403 }
      );
    }
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
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
            description: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    id: true,
                    action: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
        posts: {
          select: { id: true, title: true, createdAt: true },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        comments: {
          select: { id: true, content: true, createdAt: true },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formattedUser = {
      ...user,
      role: {
        ...user.role,
        permissions: user.role.permissions.map((rp) => rp.permission),
      },
    };

    return NextResponse.json(formattedUser, { status: 200 });
  } catch (error) {
    console.error("Get user details error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const canUpdate = await hasPermission(
      parseInt(currentUserId),
      PERMISSIONS.UPDATE_USER
    );

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Permission denied: update_user required" },
        { status: 403 }
      );
    }
    const { userId } = await params;
    const body = await request.json();

    const validatedData = updateUserSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        roleId: true,
        profileImageId: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUserId = request.headers.get("x-user-id");
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const canDelete = await hasPermission(
      parseInt(currentUserId),
      PERMISSIONS.DELETE_USER
    );

    if (!canDelete) {
      return NextResponse.json(
        { error: "Permission denied: delete_user required" },
        { status: 403 }
      );
    }

    const { userId } = await params;

    if (userId === currentUserId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: parseInt(userId) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
