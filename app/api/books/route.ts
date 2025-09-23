import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { createBookSchema } from '@/app/lib/validation';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// GET /api/books - Get list of books
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { publisher: { contains: search } },
        { isbn: { contains: search } }
      ];
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
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
          returnDate: true
        },
        orderBy: { title: 'asc' },
        skip,
        take: limit
      }),
      prisma.book.count({ where })
    ]);

    // Get borrower information for borrowed books
    const bookIds = books.filter(b => b.borrowerId).map(b => b.borrowerId);
    const borrowers = bookIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: bookIds as number[] } },
          select: { id: true, name: true, email: true }
        })
      : [];

    const booksWithBorrower = books.map(book => ({
      ...book,
      borrower: book.borrowerId
        ? borrowers.find(u => u.id === book.borrowerId)
        : null
    }));

    return NextResponse.json(
      {
        books: booksWithBorrower,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get books error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/books - Add a new book
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
        { error: 'Permission denied: manage_books required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createBookSchema.parse(body);

    // Check if ISBN already exists
    if (validatedData.isbn) {
      const existingBook = await prisma.book.findUnique({
        where: { isbn: validatedData.isbn }
      });

      if (existingBook) {
        return NextResponse.json(
          { error: 'Book with this ISBN already exists' },
          { status: 400 }
        );
      }
    }

    const newBook = await prisma.book.create({
      data: {
        title: validatedData.title,
        author: validatedData.author,
        publisher: validatedData.publisher,
        isbn: validatedData.isbn,
        location: validatedData.location,
        status: 'available'
      },
      select: {
        id: true,
        title: true,
        author: true,
        publisher: true,
        isbn: true,
        location: true,
        status: true
      }
    });

    return NextResponse.json(newBook, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create book error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}