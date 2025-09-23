import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { createEvaluationSchema } from '@/app/lib/validation';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// GET /api/evaluations - Get list of evaluations
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
    const canViewEvaluations = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_EVALUATIONS
    );

    if (!canViewEvaluations) {
      return NextResponse.json(
        { error: 'Permission denied: view_evaluations required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const semester = searchParams.get('semester');
    const userIdFilter = searchParams.get('userId');
    const evaluatorId = searchParams.get('evaluatorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (year) {
      where.year = parseInt(year);
    }

    if (semester) {
      where.semester = semester;
    }

    if (userIdFilter) {
      where.userId = parseInt(userIdFilter);
    }

    if (evaluatorId) {
      where.evaluatorId = parseInt(evaluatorId);
    }

    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        select: {
          id: true,
          semester: true,
          year: true,
          score: true,
          comments: true,
          evaluatorId: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: [
          { year: 'desc' },
          { semester: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.evaluation.count({ where })
    ]);

    // Get evaluator information
    const evaluatorIds = [...new Set(evaluations.map(e => e.evaluatorId))];
    const evaluators = evaluatorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: evaluatorIds } },
          select: { id: true, name: true }
        })
      : [];

    const evaluationsWithEvaluator = evaluations.map(evaluation => ({
      ...evaluation,
      evaluator: evaluators.find(u => u.id === evaluation.evaluatorId)
    }));

    // Calculate statistics
    const stats = await prisma.evaluation.aggregate({
      where,
      _avg: { score: true },
      _min: { score: true },
      _max: { score: true },
      _count: true
    });

    return NextResponse.json(
      {
        evaluations: evaluationsWithEvaluator,
        statistics: {
          averageScore: stats._avg.score ? Number(stats._avg.score.toFixed(2)) : 0,
          minScore: stats._min.score ? Number(stats._min.score) : 0,
          maxScore: stats._max.score ? Number(stats._max.score) : 0,
          totalCount: stats._count
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
    console.error('Get evaluations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/evaluations - Create a new evaluation
export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id');

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permission
    const canManageEvaluations = await hasPermission(
      parseInt(currentUserId),
      PERMISSIONS.MANAGE_EVALUATIONS
    );

    if (!canManageEvaluations) {
      return NextResponse.json(
        { error: 'Permission denied: manage_evaluations required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createEvaluationSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if evaluation already exists for this user, year, and semester
    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        userId: validatedData.userId,
        year: validatedData.year,
        semester: validatedData.semester
      }
    });

    if (existingEvaluation) {
      return NextResponse.json(
        { error: 'Evaluation already exists for this user, year, and semester' },
        { status: 400 }
      );
    }

    const newEvaluation = await prisma.evaluation.create({
      data: {
        userId: validatedData.userId,
        semester: validatedData.semester,
        year: validatedData.year,
        score: validatedData.score,
        comments: validatedData.comments,
        evaluatorId: parseInt(currentUserId)
      },
      select: {
        id: true,
        semester: true,
        year: true,
        score: true,
        comments: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(newEvaluation, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}