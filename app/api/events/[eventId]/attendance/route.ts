import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { createAttendanceSchema } from '@/app/lib/validation';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// GET /api/events/[eventId]/attendance - Get attendance list for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user can view attendance
    const canViewAttendance = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_ATTENDANCE
    );

    if (!canViewAttendance) {
      return NextResponse.json(
        { error: 'Permission denied: view_attendance required' },
        { status: 403 }
      );
    }

    // Check if event exists
    const event = await prisma.calendarEvent.findUnique({
      where: { id: parseInt(eventId) }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const attendance = await prisma.attendance.findMany({
      where: { eventId: parseInt(eventId) },
      select: {
        id: true,
        status: true,
        checkInAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { checkInAt: 'desc' }
    });

    // Get statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };

    return NextResponse.json(
      {
        event: {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate
        },
        attendance,
        stats
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/events/[eventId]/attendance - Check in for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permission
    const canCheckIn = await hasPermission(
      parseInt(userId),
      PERMISSIONS.CHECK_IN
    );

    if (!canCheckIn) {
      return NextResponse.json(
        { error: 'Permission denied: check_in required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createAttendanceSchema.parse(body);

    // Check if event exists
    const event = await prisma.calendarEvent.findUnique({
      where: { id: parseInt(eventId) }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if already checked in
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_eventId: {
          userId: parseInt(userId),
          eventId: parseInt(eventId)
        }
      }
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Already checked in for this event' },
        { status: 400 }
      );
    }

    // Determine if late
    const now = new Date();
    const isLate = now > event.startDate;
    const status = isLate && validatedData.status === 'present' ? 'late' : validatedData.status;

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: parseInt(userId),
        eventId: parseInt(eventId),
        status,
        checkInAt: status === 'present' || status === 'late' ? now : null
      },
      select: {
        id: true,
        status: true,
        checkInAt: true,
        event: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}