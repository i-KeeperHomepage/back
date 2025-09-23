import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { createCategorySchema } from '@/app/lib/validation';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      postCount: category._count.posts
    }));

    return NextResponse.json(formattedCategories, { status: 200 });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const canCreate = await hasPermission(
      parseInt(userId),
      PERMISSIONS.CREATE_CATEGORY
    );

    if (!canCreate) {
      return NextResponse.json(
        { error: 'Permission denied: create_category required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    const existingCategory = await prisma.category.findUnique({
      where: { name: validatedData.name }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const newCategory = await prisma.category.create({
      data: validatedData,
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}