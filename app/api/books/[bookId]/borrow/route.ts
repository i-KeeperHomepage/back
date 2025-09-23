import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { borrowBookSchema } from '@/app/lib/validation';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// POST /api/books/[bookId]/borrow - Borrow a book
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
    const canBorrow = await hasPermission(
      parseInt(userId),
      PERMISSIONS.BORROW_BOOK
    );

    if (!canBorrow) {
      return NextResponse.json(
        { error: 'Permission denied: borrow_book required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = borrowBookSchema.parse(body);

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

    // Check if book is available
    if (book.status !== 'available') {
      return NextResponse.json(
        { error: 'Book is not available for borrowing' },
        { status: 400 }
      );
    }

    // Check if return date is in the future
    const returnDate = new Date(validatedData.returnDate);
    if (returnDate <= new Date()) {
      return NextResponse.json(
        { error: 'Return date must be in the future' },
        { status: 400 }
      );
    }

    // Check if user has any overdue books
    const overdueBooks = await prisma.book.findMany({
      where: {
        borrowerId: parseInt(userId),
        status: 'borrowed',
        returnDate: { lt: new Date() }
      }
    });

    if (overdueBooks.length > 0) {
      return NextResponse.json(
        {
          error: 'You have overdue books. Please return them before borrowing new ones.',
          overdueBooks: overdueBooks.map(b => ({ id: b.id, title: b.title }))
        },
        { status: 400 }
      );
    }

    // Update book status
    const updatedBook = await prisma.book.update({
      where: { id: parseInt(bookId) },
      data: {
        status: 'borrowed',
        borrowerId: parseInt(userId),
        borrowedAt: new Date(),
        returnDate
      },
      select: {
        id: true,
        title: true,
        author: true,
        borrowedAt: true,
        returnDate: true
      }
    });

    return NextResponse.json(
      {
        message: 'Book borrowed successfully',
        book: updatedBook
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Borrow book error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}