import {
  canModifyResource,
  hasPermission,
  PERMISSIONS,
} from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    const fileId = parseInt((await params).fileId);

    if (isNaN(fileId)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    // Get file from database
    const file = await prisma.file.findUnique({
      where: { id: fileId },
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
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user has permission to view this file
    const canViewAll = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_FILES
    );
    const canViewOwn = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_OWN_FILES
    );

    if (!canViewAll && (!canViewOwn || file.uploader.id !== parseInt(userId))) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    return NextResponse.json(file, { status: 200 });
  } catch (error) {
    console.error("Get file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    const fileId = parseInt(params.fileId);

    if (isNaN(fileId)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    // Get file from database
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user can delete this file
    const canDelete = await canModifyResource(
      parseInt(userId),
      file.uploaderId,
      PERMISSIONS.DELETE_ANY_FILE
    );

    if (!canDelete) {
      // Check if user has permission to delete own files
      const canDeleteOwn = await hasPermission(
        parseInt(userId),
        PERMISSIONS.DELETE_OWN_FILE
      );

      if (!canDeleteOwn || file.uploaderId !== parseInt(userId)) {
        return NextResponse.json(
          { error: "Permission denied: cannot delete this file" },
          { status: 403 }
        );
      }
    }

    // Delete file from disk
    const filePath = path.resolve(file.path);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Error deleting file from disk:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
