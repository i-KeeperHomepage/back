import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hasPermission, PERMISSIONS } from '@/app/lib/permissions';

export async function GET(request: NextRequest) {
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
    const roles = await prisma.role.findMany({
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

    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: role._count.users,
      permissions: role.permissions.map(rp => rp.permission)
    }));

    return NextResponse.json(formattedRoles, { status: 200 });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const canCreate = await hasPermission(
      parseInt(userId),
      PERMISSIONS.CREATE_ROLE
    );

    if (!canCreate) {
      return NextResponse.json(
        { error: 'Permission denied: create_role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissions?.map((permissionId: number) => ({
            permission: {
              connect: { id: permissionId }
            }
          })) || []
        }
      },
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
      ...newRole,
      permissions: newRole.permissions.map(rp => rp.permission)
    };

    return NextResponse.json(formattedRole, { status: 201 });
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}