import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// GET /api/users/me/attendance - Get my attendance records
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permission
    const canView = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_OWN_ATTENDANCE
    );

    if (!canView) {
      return NextResponse.json(
        { error: 'Permission denied: view_own_attendance required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const semester = searchParams.get('semester');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { userId: parseInt(userId) };

    // Filter by year if provided
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year) + 1, 0, 1);
      where.event = {
        startDate: {
          gte: startOfYear,
          lt: endOfYear
        }
      };
    }

    // Get attendance records
    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        select: {
          id: true,
          status: true,
          checkInAt: true,
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              eventType: true,
              location: true
            }
          }
        },
        orderBy: { event: { startDate: 'desc' } },
        skip,
        take: limit
      }),
      prisma.attendance.count({ where })
    ]);

    // Calculate statistics
    const stats = await prisma.attendance.groupBy({
      by: ['status'],
      where: { userId: parseInt(userId) },
      _count: true
    });

    const statistics = {
      total: total,
      present: stats.find(s => s.status === 'present')?._count || 0,
      absent: stats.find(s => s.status === 'absent')?._count || 0,
      late: stats.find(s => s.status === 'late')?._count || 0,
      excused: stats.find(s => s.status === 'excused')?._count || 0
    };

    // Calculate attendance rate
    const attendanceRate = statistics.total > 0
      ? Math.round(((statistics.present + statistics.late) / statistics.total) * 100)
      : 0;

    return NextResponse.json(
      {
        attendance,
        statistics: {
          ...statistics,
          attendanceRate
        },
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
    console.error('Get my attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}