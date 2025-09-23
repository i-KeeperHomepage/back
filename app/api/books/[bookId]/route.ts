import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { updateBookSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/books/[bookId] - Get book details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;

    const book = await prisma.book.findUnique({
      where: { id: parseInt(bookId) },
      select: {
        id: true,
        title: true,
        author: true,
        publisher: true,
        isbn: true,
        location: true,
        status: true,
        borrowerId: true,
        borrowedAt: true,
        returnDate: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Get borrower information if book is borrowed
    let borrower = null;
    if (book.borrowerId) {
      borrower = await prisma.user.findUnique({
        where: { id: book.borrowerId },
        select: {
          id: true,
          name: true,
          email: true,
          role: {
            select: { name: true },
          },
        },
      });
    }

    return NextResponse.json({ ...book, borrower }, { status: 200 });
  } catch (error) {
    console.error("Get book details error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/books/[bookId] - Update book
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission
    const canManage = await hasPermission(
      parseInt(userId),
      PERMISSIONS.MANAGE_BOOKS
    );

    if (!canManage) {
      return NextResponse.json(
        { error: "Permission denied: manage_books required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateBookSchema.parse(body);

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: parseInt(bookId) },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Check if ISBN already exists (if updating ISBN)
    if (validatedData.isbn && validatedData.isbn !== book.isbn) {
      const existingBook = await prisma.book.findUnique({
        where: { isbn: validatedData.isbn },
      });

      if (existingBook) {
        return NextResponse.json(
          { error: "Book with this ISBN already exists" },
          { status: 400 }
        );
      }
    }

    const updatedBook = await prisma.book.update({
      where: { id: parseInt(bookId) },
      data: validatedData,
      select: {
        id: true,
        title: true,
        author: true,
        publisher: true,
        isbn: true,
        location: true,
        status: true,
      },
    });

    return NextResponse.json(updatedBook, { status: 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update book error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[bookId] - Delete book
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission
    const canManage = await hasPermission(
      parseInt(userId),
      PERMISSIONS.MANAGE_BOOKS
    );

    if (!canManage) {
      return NextResponse.json(
        { error: "Permission denied: manage_books required" },
        { status: 403 }
      );
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: parseInt(bookId) },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Don't delete if book is currently borrowed
    if (book.status === "borrowed") {
      return NextResponse.json(
        { error: "Cannot delete a book that is currently borrowed" },
        { status: 400 }
      );
    }

    await prisma.book.delete({
      where: { id: parseInt(bookId) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    console.error("Delete book error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
