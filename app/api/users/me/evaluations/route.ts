import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// GET /api/users/me/evaluations - Get my evaluation records
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
      PERMISSIONS.VIEW_OWN_EVALUATIONS
    );

    if (!canView) {
      return NextResponse.json(
        { error: 'Permission denied: view_own_evaluations required' },
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

    if (year) {
      where.year = parseInt(year);
    }

    if (semester) {
      where.semester = semester;
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
    const allEvaluations = await prisma.evaluation.findMany({
      where: { userId: parseInt(userId) },
      select: { score: true }
    });

    const scores = allEvaluations.map(e => Number(e.score));
    const statistics = {
      averageScore: scores.length > 0
        ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2))
        : 0,
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      totalCount: allEvaluations.length,
      recentCount: total
    };

    // Get trend (compare with previous semester)
    let trend = null;
    if (evaluations.length > 0) {
      const currentEvaluation = evaluations[0];
      const previousEvaluation = await prisma.evaluation.findFirst({
        where: {
          userId: parseInt(userId),
          OR: [
            {
              year: currentEvaluation.year,
              semester: { lt: currentEvaluation.semester }
            },
            {
              year: { lt: currentEvaluation.year }
            }
          ]
        },
        orderBy: [
          { year: 'desc' },
          { semester: 'desc' }
        ],
        select: { score: true }
      });

      if (previousEvaluation) {
        const scoreDiff = Number(currentEvaluation.score) - Number(previousEvaluation.score);
        trend = {
          direction: scoreDiff > 0 ? 'up' : scoreDiff < 0 ? 'down' : 'stable',
          difference: Number(scoreDiff.toFixed(2))
        };
      }
    }

    return NextResponse.json(
      {
        evaluations: evaluationsWithEvaluator,
        statistics,
        trend,
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
    console.error('Get my evaluations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}