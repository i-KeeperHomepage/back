import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { uploadFileSchema } from "@/app/lib/validation";
import formidable from "formidable";
import { promises as fs } from "fs";
import mime from "mime-types";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB default
const UPLOAD_PATH = process.env.FILE_UPLOAD_PATH || "./uploads";
const ALLOWED_TYPES = process.env.ALLOWED_FILE_TYPES?.split(",") || [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: NextRequest): Promise<{
  fields: formidable.Fields;
  files: formidable.Files;
}> {
  const uploadDir = path.resolve(UPLOAD_PATH);

  // Ensure upload directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: MAX_FILE_SIZE,
    filename: (name, ext, part) => {
      const uniqueId = uuidv4();
      const extension = mime.extension(
        part.mimetype || "application/octet-stream"
      );
      return `${uniqueId}.${extension}`;
    },
    filter: (part) => {
      return ALLOWED_TYPES.includes(part.mimetype || "");
    },
  });

  // Convert NextRequest to Node.js readable stream
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();

  if (!reader) {
    throw new Error("No request body");
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);
  const stream = Readable.from(buffer);

  // Add headers to the stream
  (stream as any).headers = Object.fromEntries(req.headers.entries());

  return new Promise((resolve, reject) => {
    form.parse(stream as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    // Check permission
    const canUpload = await hasPermission(
      parseInt(userId),
      PERMISSIONS.UPLOAD_FILE
    );

    if (!canUpload) {
      return NextResponse.json(
        { error: "Permission denied: upload_file required" },
        { status: 403 }
      );
    }

    const { fields, files } = await parseForm(request);

    // Extract the first uploaded file
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate metadata
    const purpose = Array.isArray(fields.purpose)
      ? fields.purpose[0]
      : fields.purpose;
    const description = Array.isArray(fields.description)
      ? fields.description[0]
      : fields.description;

    const validatedData = uploadFileSchema.parse({
      purpose: purpose || "other",
      description: description || undefined,
    });

    // Save file info to database
    const file = await prisma.file.create({
      data: {
        filename:
          uploadedFile.newFilename ||
          uploadedFile.originalFilename ||
          "unknown",
        originalName: uploadedFile.originalFilename || "unknown",
        mimetype: uploadedFile.mimetype || "application/octet-stream",
        size: uploadedFile.size,
        purpose: validatedData.purpose,
        path: uploadedFile.filepath,
        uploaderId: parseInt(userId),
      },
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
          },
        },
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error: any) {
    console.error("File upload error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error.message?.includes("File too large")) {
      return NextResponse.json(
        { error: "File size exceeds the maximum allowed size" },
        { status: 413 }
      );
    }

    if (error.message?.includes("filter")) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 415 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
