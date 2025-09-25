import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { transferRoleSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const canTransfer = await hasPermission(
      parseInt(userId),
      PERMISSIONS.TRANSFER_ROLE
    );

    if (!canTransfer) {
      return NextResponse.json(
        { error: "Permission denied: transfer_role required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const validatedData = transferRoleSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const [fromUser, toUser, role, toUserIsMember] = await Promise.all([
        tx.user.findUnique({
          where: { id: validatedData.fromUserId },
          select: { roleId: true },
        }),
        tx.user.findUnique({
          where: { id: validatedData.toUserId },
          select: { id: true },
        }),
        tx.role.findUnique({
          where: { id: validatedData.roleId },
        }),
        tx.user.findUnique({
          where: { id: validatedData.toUserId, roleId: 2 },
          select: { id: true },
        }),
      ]);

      if (!fromUser) {
        throw new Error("Source user not found");
      }

      if (!toUser) {
        throw new Error("Target user not found");
      }

      if (!role) {
        throw new Error("Role not found");
      }

      if (!toUserIsMember) {
        throw new Error("toUser is not member role");
      }

      if (fromUser.roleId !== validatedData.roleId) {
        throw new Error("Source user does not have the specified role");
      }

      const defaultRole = await tx.role.findFirst({
        where: { name: "member" },
      });

      if (!defaultRole) {
        throw new Error("Default member role not found");
      }

      const [updatedFromUser, updatedToUser] = await Promise.all([
        tx.user.update({
          where: { id: validatedData.fromUserId },
          data: { roleId: defaultRole.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: { select: { name: true } },
          },
        }),
        tx.user.update({
          where: { id: validatedData.toUserId },
          data: { roleId: validatedData.roleId },
          select: {
            id: true,
            email: true,
            name: true,
            role: { select: { name: true } },
          },
        }),
      ]);

      return { updatedFromUser, updatedToUser };
    });

    return NextResponse.json(
      {
        message: "Role transferred successfully",
        fromUser: result.updatedFromUser,
        toUser: result.updatedToUser,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message.includes("does not have")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Transfer role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
