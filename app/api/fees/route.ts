import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { createFeeSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/fees - Get list of fees
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission
    const canViewFees = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_FEES
    );

    if (!canViewFees) {
      return NextResponse.json(
        { error: "Permission denied: view_fees required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");
    const userIdFilter = searchParams.get("userId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
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

    if (userIdFilter) {
      where.userId = parseInt(userIdFilter);
    }

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        select: {
          id: true,
          amount: true,
          date: true,
          status: true,
          paidAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: [
          { date: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.fee.count({ where }),
    ]);

    // Calculate statistics
    const stats = await prisma.fee.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    const paidStats = await prisma.fee.aggregate({
      where: { ...where, status: "paid" },
      _sum: { amount: true },
      _count: true,
    });

    const statistics = {
      totalAmount: stats._sum.amount || 0,
      totalCount: stats._count,
      paidAmount: paidStats._sum.amount || 0,
      paidCount: paidStats._count,
      unpaidAmount:
        (stats._sum.amount?.toNumber() || 0) -
        (paidStats._sum.amount?.toNumber() || 0),
      unpaidCount: stats._count - paidStats._count,
    };

    return NextResponse.json(
      {
        fees,
        statistics,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get fees error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/fees - Create fee records
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission
    const canManageFees = await hasPermission(
      parseInt(userId),
      PERMISSIONS.MANAGE_FEES
    );

    if (!canManageFees) {
      return NextResponse.json(
        { error: "Permission denied: manage_fees required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createFeeSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if fee already exists for this user and date
    const existingFee = await prisma.fee.findFirst({
      where: {
        userId: validatedData.userId,
        date: new Date(validatedData.date),
      },
    });

    if (existingFee) {
      return NextResponse.json(
        {
          error: "Fee record already exists for this user and date",
        },
        { status: 400 }
      );
    }

    const newFee = await prisma.fee.create({
      data: {
        userId: validatedData.userId,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        status: "unpaid",
      },
      select: {
        id: true,
        amount: true,
        date: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(newFee, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create fee error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
