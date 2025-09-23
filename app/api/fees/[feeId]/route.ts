import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { updateFeeSchema } from '@/app/lib/validation';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

// GET /api/fees/[feeId] - Get fee details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feeId: string }> }
) {
  try {
    const { feeId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const fee = await prisma.fee.findUnique({
      where: { id: parseInt(feeId) },
      select: {
        id: true,
        amount: true,
        semester: true,
        year: true,
        status: true,
        paidAt: true,
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

    if (!fee) {
      return NextResponse.json(
        { error: 'Fee record not found' },
        { status: 404 }
      );
    }

    // Check if user can view this fee record
    const canViewAllFees = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_FEES
    );

    const canViewOwnFees = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_OWN_FEES
    );

    if (!canViewAllFees && (!canViewOwnFees || fee.user.id !== parseInt(userId))) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(fee, { status: 200 });
  } catch (error) {
    console.error('Get fee details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/fees/[feeId] - Update fee status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ feeId: string }> }
) {
  try {
    const { feeId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
        { error: 'Permission denied: manage_fees required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateFeeSchema.parse(body);

    // Check if fee exists
    const fee = await prisma.fee.findUnique({
      where: { id: parseInt(feeId) }
    });

    if (!fee) {
      return NextResponse.json(
        { error: 'Fee record not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.amount !== undefined) {
      updateData.amount = validatedData.amount;
    }

    if (validatedData.status) {
      updateData.status = validatedData.status;

      // If marking as paid, set paidAt date
      if (validatedData.status === 'paid' && !fee.paidAt) {
        updateData.paidAt = validatedData.paidAt ? new Date(validatedData.paidAt) : new Date();
      }
      // If marking as unpaid, clear paidAt date
      else if (validatedData.status === 'unpaid') {
        updateData.paidAt = null;
      }
    }

    const updatedFee = await prisma.fee.update({
      where: { id: parseInt(feeId) },
      data: updateData,
      select: {
        id: true,
        amount: true,
        semester: true,
        year: true,
        status: true,
        paidAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedFee, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update fee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}