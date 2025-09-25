import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        major: true,
        class: true,
        status: true,
        createdAt: true,
        signatureImage: {
          select: {
            id: true,
            filename: true,
            path: true,
          }
        },
        profileImage: {
          select: {
            id: true,
            filename: true,
            path: true,
          }
        },
        awards: {
          select: {
            id: true,
            title: true,
            description: true,
            evidenceFile: {
              select: {
                id: true,
                filename: true,
                path: true,
              }
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        educationHistory: {
          select: {
            id: true,
            title: true,
            description: true,
            evidenceFile: {
              select: {
                id: true,
                filename: true,
                path: true,
              }
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        role: {
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
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const formattedUser = {
      ...user,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        permissions: user.role.permissions.map(rp => rp.permission)
      }
    };

    return NextResponse.json(formattedUser, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, major, class: userClass, profileImageId } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (major) updateData.major = major;
    if (userClass) {
      // Validate class format (n/m)
      if (!/^\d+\/\d+$/.test(userClass)) {
        return NextResponse.json(
          { error: 'Class format must be n/m (e.g., 3/2)' },
          { status: 400 }
        );
      }
      updateData.class = userClass;
    }
    if (profileImageId !== undefined) {
      updateData.profileImageId = profileImageId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: parseInt(userId) }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        major: true,
        class: true,
        status: true,
        profileImage: {
          select: {
            id: true,
            filename: true,
            path: true
          }
        }
      }
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}