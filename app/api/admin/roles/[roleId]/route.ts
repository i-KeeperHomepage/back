import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';
import { updateRoleSchema } from '@/app/lib/validation';

// GET /api/admin/roles/[roleId] - Get a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    // Check permission
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const canView = await hasPermission(
      parseInt(userId),
      PERMISSIONS.VIEW_ROLES
    );

    if (!canView) {
      return NextResponse.json(
        { error: 'Permission denied: view_roles required' },
        { status: 403 }
      );
    }

    const { roleId } = await params;
    const role = await prisma.role.findUnique({
      where: { id: parseInt(roleId) },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                action: true,
                description: true
              }
            }
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    const formattedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: role._count.users,
      permissions: role.permissions.map(rp => rp.permission)
    };

    return NextResponse.json(formattedRole, { status: 200 });
  } catch (error) {
    console.error('Get role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/roles/[roleId] - Update a role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    // Check permission
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const canUpdate = await hasPermission(
      parseInt(userId),
      PERMISSIONS.UPDATE_ROLE
    );

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Permission denied: update_role required' },
        { status: 403 }
      );
    }

    const { roleId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateRoleSchema.parse(body);

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: parseInt(roleId) },
      select: { name: true }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Prevent modification of critical system roles
    if (existingRole.name === 'admin' && validatedData.name && validatedData.name !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot rename the admin role' },
        { status: 400 }
      );
    }

    // Check if new name already exists (if name is being changed)
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name: validatedData.name }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update role
    const updateData: any = {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.description !== undefined && { description: validatedData.description })
    };

    // Handle permission updates if provided
    if (validatedData.permissionIds !== undefined) {
      // First, delete all existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: parseInt(roleId) }
      });

      // Then, create new permissions
      if (validatedData.permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: validatedData.permissionIds.map(permId => ({
            roleId: parseInt(roleId),
            permissionId: permId
          }))
        });
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id: parseInt(roleId) },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                action: true,
                description: true
              }
            }
          }
        }
      }
    });

    const formattedRole = {
      ...updatedRole,
      permissions: updatedRole.permissions.map(rp => rp.permission)
    };

    return NextResponse.json(formattedRole, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles/[roleId] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    // Check permission
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const canDelete = await hasPermission(
      parseInt(userId),
      PERMISSIONS.DELETE_ROLE
    );

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Permission denied: delete_role required' },
        { status: 403 }
      );
    }

    const { roleId } = await params;

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: parseInt(roleId) },
      select: {
        name: true,
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of critical system roles
    if (['admin', 'member', 'non-member'].includes(role.name)) {
      return NextResponse.json(
        { error: 'Cannot delete system default roles' },
        { status: 400 }
      );
    }

    // Check if role has users assigned
    if (role._count.users > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete role with assigned users',
          details: {
            userCount: role._count.users,
            message: 'Please reassign users to another role before deleting'
          }
        },
        { status: 400 }
      );
    }

    // Delete the role (cascade will handle RolePermission deletion due to schema)
    await prisma.role.delete({
      where: { id: parseInt(roleId) }
    });

    return NextResponse.json(
      { message: 'Role deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}