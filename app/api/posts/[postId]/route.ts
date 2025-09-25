import { canModifyResource, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { updatePostSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
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
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
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

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user can edit the post (owner or has edit_any_post permission)
    const canEdit = await canModifyResource(
      parseInt(userId),
      post.authorId,
      PERMISSIONS.EDIT_ANY_POST
    );

    if (!canEdit) {
      return NextResponse.json(
        {
          error:
            "You can only edit your own posts or need edit_any_post permission",
        },
        { status: 403 }
      );
    }

    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    // Handle file attachments update
    const { fileIds, ...postData } = validatedData;

    const updateData: any = { ...postData };

    if (fileIds !== undefined) {
      // Delete existing file associations and create new ones
      await prisma.postFile.deleteMany({
        where: { postId: parseInt(postId) },
      });

      if (fileIds.length > 0) {
        await prisma.postFile.createMany({
          data: fileIds.map((fileId) => ({
            postId: parseInt(postId),
            fileId,
          })),
        });
      }
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(postId) },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
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

    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user can delete the post (owner or has delete_any_post permission)
    const canDelete = await canModifyResource(
      parseInt(userId),
      post.authorId,
      PERMISSIONS.DELETE_ANY_POST
    );

    if (!canDelete) {
      return NextResponse.json(
        {
          error:
            "You can only delete your own posts or need delete_any_post permission",
        },
        { status: 403 }
      );
    }

    await prisma.post.delete({
      where: { id: parseInt(postId) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
