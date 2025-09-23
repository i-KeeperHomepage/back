import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { updateEvaluationSchema } from '@/app/lib/validation';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// GET /api/evaluations/[evaluationId] - Get evaluation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: parseInt(evaluationId) },
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
      }
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    // Check if user can view this evaluation
    const canViewAllEvaluations = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_EVALUATIONS
    );

    const canViewOwnEvaluations = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_OWN_EVALUATIONS
    );

    if (!canViewAllEvaluations && (!canViewOwnEvaluations || evaluation.user.id !== parseInt(userId))) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Get evaluator information
    const evaluator = await prisma.user.findUnique({
      where: { id: evaluation.evaluatorId },
      select: { id: true, name: true }
    });

    return NextResponse.json(
      { ...evaluation, evaluator },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get evaluation details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/evaluations/[evaluationId] - Update evaluation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;
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
    const validatedData = updateEvaluationSchema.parse(body);

    // Check if evaluation exists
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: parseInt(evaluationId) }
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    // Only allow the original evaluator or admin to update
    if (evaluation.evaluatorId !== parseInt(currentUserId)) {
      const isAdmin = await prisma.user.findFirst({
        where: {
          id: parseInt(currentUserId),
          role: { name: 'admin' }
        }
      });

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'You can only update evaluations you created' },
          { status: 403 }
        );
      }
    }

    const updatedEvaluation = await prisma.evaluation.update({
      where: { id: parseInt(evaluationId) },
      data: validatedData,
      select: {
        id: true,
        semester: true,
        year: true,
        score: true,
        comments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedEvaluation, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}