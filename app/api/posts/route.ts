import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { createPostSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const authorId = searchParams.get("authorId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (authorId) {
      where.authorId = parseInt(authorId);
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { comments: true },
          },
          files: {
            select: {
              file: {
                select: {
                  id: true,
                  filename: true,
                  originalName: true,
                  mimetype: true,
                  size: true,
                  path: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json(
      {
        posts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": `${process.env.FRONT_URL}`,
        },
      }
    );
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    // Check permission
    const canCreate = await hasPermission(
      parseInt(userId),
      PERMISSIONS.CREATE_POST
    );

    if (!canCreate) {
      return NextResponse.json(
        { error: "Permission denied: create_post required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const validatedData = createPostSchema.parse(body);

    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const newPost = await prisma.post.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        authorId: parseInt(userId),
        categoryId: validatedData.categoryId,
        ...(validatedData.fileIds && validatedData.fileIds.length > 0
          ? {
              files: {
                create: validatedData.fileIds.map((fileId) => ({
                  fileId,
                })),
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        files: {
          select: {
            file: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                mimetype: true,
                size: true,
                path: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
