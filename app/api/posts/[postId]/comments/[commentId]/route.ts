import { canModifyResource, hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { updateCommentSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/posts/[postId]/comments/[commentId] - Get specific comment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { postId, commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      select: {
        id: true,
        content: true,
        postId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Verify comment belongs to the specified post
    if (comment.postId !== parseInt(postId)) {
      return NextResponse.json(
        { error: "Comment does not belong to this post" },
        { status: 400 }
      );
    }

    return NextResponse.json(comment, { status: 200 });
  } catch (error) {
    console.error("Get comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[postId]/comments/[commentId] - Update comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { postId, commentId } = await params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      select: {
        id: true,
        postId: true,
        authorId: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Verify comment belongs to the specified post
    if (comment.postId !== parseInt(postId)) {
      return NextResponse.json(
        { error: "Comment does not belong to this post" },
        { status: 400 }
      );
    }

    // Check if user can edit the comment (owner or has edit_any_comment permission)
    const canEdit = await canModifyResource(
      parseInt(userId),
      comment.authorId,
      PERMISSIONS.EDIT_ANY_COMMENT
    );

    if (!canEdit) {
      return NextResponse.json(
        {
          error:
            "You can only edit your own comments or need edit_any_comment permission",
        },
        { status: 403 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(commentId) },
      data: {
        content: validatedData.content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedComment, { status: 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[postId]/comments/[commentId] - Delete comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { postId, commentId } = await params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 401 }
      );
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      select: {
        id: true,
        postId: true,
        authorId: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Verify comment belongs to the specified post
    if (comment.postId !== parseInt(postId)) {
      return NextResponse.json(
        { error: "Comment does not belong to this post" },
        { status: 400 }
      );
    }

    // Check if user can delete the comment (owner or has delete_any_comment permission)
    const canDelete = await canModifyResource(
      parseInt(userId),
      comment.authorId,
      PERMISSIONS.DELETE_ANY_COMMENT
    );

    if (!canDelete) {
      return NextResponse.json(
        {
          error:
            "You can only delete your own comments or need delete_any_comment permission",
        },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
