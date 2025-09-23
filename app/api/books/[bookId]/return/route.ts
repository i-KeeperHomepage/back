import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// POST /api/books/[bookId]/return - Return a borrowed book
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permission
    const canReturn = await hasPermission(
      parseInt(userId),
      PERMISSIONS.RETURN_BOOK
    );

    if (!canReturn) {
      return NextResponse.json(
        { error: 'Permission denied: return_book required' },
        { status: 403 }
      );
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: parseInt(bookId) }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if book is borrowed
    if (book.status !== 'borrowed') {
      return NextResponse.json(
        { error: 'Book is not currently borrowed' },
        { status: 400 }
      );
    }

    // Check if the user is the borrower (or has admin permission)
    const canManageBooks = await hasPermission(
      parseInt(userId),
      PERMISSIONS.MANAGE_BOOKS
    );

    if (book.borrowerId !== parseInt(userId) && !canManageBooks) {
      return NextResponse.json(
        { error: 'You can only return books you have borrowed' },
        { status: 403 }
      );
    }

    // Calculate if the book is overdue
    const isOverdue = book.returnDate && new Date() > book.returnDate;

    // Update book status
    const updatedBook = await prisma.book.update({
      where: { id: parseInt(bookId) },
      data: {
        status: 'available',
        borrowerId: null,
        borrowedAt: null,
        returnDate: null
      },
      select: {
        id: true,
        title: true,
        author: true
      }
    });

    return NextResponse.json(
      {
        message: isOverdue
          ? 'Book returned successfully (was overdue)'
          : 'Book returned successfully',
        book: updatedBook,
        wasOverdue: isOverdue
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Return book error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}