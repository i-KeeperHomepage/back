import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
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

    // Check permission
    const canDownload = await hasPermission(
      parseInt(userId),
      PERMISSIONS.DOWNLOAD_FILE
    );

    if (!canDownload) {
      return NextResponse.json(
        { error: "Permission denied: download_file required" },
        { status: 403 }
      );
    }

    const fileId = parseInt((await params).fileId);

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

    // Check if file exists on disk
    const filePath = path.resolve(file.path);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: "File not found on server" },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Create response with file
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": file.mimetype,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          file.originalName
        )}"`,
        "Content-Length": file.size.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
