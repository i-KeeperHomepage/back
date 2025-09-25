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
    const type = searchParams.get('type'); // filter by transaction type
    const year = searchParams.get('year');
    const semester = searchParams.get('semester');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { userId: parseInt(userId) };

    if (type) {
      where.type = type; // 'deposit' or 'withdrawal'
    }

    // Support legacy search by year/semester for backward compatibility
    if (year && semester) {
      // Convert year/semester to date range
      const startMonth = semester === "1" ? 3 : 9; // 1학기: 3월, 2학기: 9월
      const endMonth = semester === "1" ? 8 : 2; // 1학기: 8월, 2학기: 2월
      const startYear = parseInt(year);
      const endYear = semester === "2" ? startYear + 1 : startYear;

      where.date = {
        gte: new Date(`${startYear}-${String(startMonth).padStart(2, '0')}-01`),
        lt: new Date(`${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`),
      };
    } else if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          date: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.fee.count({ where })
    ]);

    // Calculate ledger statistics for user
    const allFees = await prisma.fee.findMany({
      where: { userId: parseInt(userId) },
      select: {
        amount: true,
        type: true
      }
    });

    const statistics = {
      totalDeposits: allFees
        .filter(fee => fee.type === 'deposit')
        .reduce((sum, fee) => sum + Number(fee.amount), 0),
      depositCount: allFees.filter(fee => fee.type === 'deposit').length,
      totalWithdrawals: allFees
        .filter(fee => fee.type === 'withdrawal')
        .reduce((sum, fee) => sum + Number(fee.amount), 0),
      withdrawalCount: allFees.filter(fee => fee.type === 'withdrawal').length,
      netBalance: allFees.reduce((sum, fee) => {
        const amount = Number(fee.amount);
        return fee.type === 'deposit' ? sum + amount : sum - amount;
      }, 0),
      totalTransactions: allFees.length
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