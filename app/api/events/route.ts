import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { createEventSchema } from '@/app/lib/validation';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// GET /api/events - Get list of events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (eventType) {
      where.eventType = eventType;
    }

    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          location: true,
          eventType: true,
          createdAt: true,
          _count: {
            select: { attendance: true }
          }
        },
        orderBy: { startDate: 'asc' },
        skip,
        take: limit
      }),
      prisma.calendarEvent.count({ where })
    ]);

    return NextResponse.json(
      {
        events,
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
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
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
      PERMISSIONS.MANAGE_EVENTS
    );

    if (!canManage) {
      return NextResponse.json(
        { error: 'Permission denied: manage_events required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createEventSchema.parse(body);

    // Check if start date is before end date
    if (new Date(validatedData.startDate) > new Date(validatedData.endDate)) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    const newEvent = await prisma.calendarEvent.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        location: validatedData.location,
        eventType: validatedData.eventType
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        eventType: true,
        createdAt: true
      }
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}