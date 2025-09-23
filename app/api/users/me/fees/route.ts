import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// GET /api/users/me/fees - Get my fee records
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
      PERMISSIONS.VIEW_OWN_FEES
    );

    if (!canView) {
      return NextResponse.json(
        { error: 'Permission denied: view_own_fees required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const year = searchParams.get('year');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { userId: parseInt(userId) };

    if (status) {
      where.status = status;
    }

    if (year) {
      where.year = parseInt(year);
    }

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        select: {
          id: true,
          amount: true,
          semester: true,
          year: true,
          status: true,
          paidAt: true,
          createdAt: true
        },
        orderBy: [
          { year: 'desc' },
          { semester: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.fee.count({ where })
    ]);

    // Calculate statistics
    const allFees = await prisma.fee.findMany({
      where: { userId: parseInt(userId) },
      select: {
        amount: true,
        status: true
      }
    });

    const statistics = {
      totalAmount: allFees.reduce((sum, fee) => sum + Number(fee.amount), 0),
      paidAmount: allFees
        .filter(fee => fee.status === 'paid')
        .reduce((sum, fee) => sum + Number(fee.amount), 0),
      unpaidAmount: allFees
        .filter(fee => fee.status === 'unpaid')
        .reduce((sum, fee) => sum + Number(fee.amount), 0),
      overdueAmount: allFees
        .filter(fee => fee.status === 'overdue')
        .reduce((sum, fee) => sum + Number(fee.amount), 0),
      totalCount: allFees.length,
      paidCount: allFees.filter(fee => fee.status === 'paid').length,
      unpaidCount: allFees.filter(fee => fee.status === 'unpaid').length,
      overdueCount: allFees.filter(fee => fee.status === 'overdue').length
    };

    return NextResponse.json(
      {
        fees,
        statistics,
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
    console.error('Get my fees error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}