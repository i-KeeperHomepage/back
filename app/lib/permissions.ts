import { prisma } from './prisma';

/**
 * Check if a user has a specific permission
 * @param userId - The ID of the user to check
 * @param permission - The permission action to check (e.g., 'create_post')
 * @returns true if the user has the permission, false otherwise
 */
export async function hasPermission(
  userId: number,
  permission: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: {
                    action: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return false;
    }

    return user.role.permissions.some(
      (rp) => rp.permission.action === permission
    );
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Check if a user has any of the specified permissions
 * @param userId - The ID of the user to check
 * @param permissions - Array of permission actions to check
 * @returns true if the user has any of the permissions, false otherwise
 */
export async function hasAnyPermission(
  userId: number,
  permissions: string[]
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: {
                    action: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return false;
    }

    const userPermissions = user.role.permissions.map(
      (rp) => rp.permission.action
    );

    return permissions.some((permission) =>
      userPermissions.includes(permission)
    );
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Check if a user has all of the specified permissions
 * @param userId - The ID of the user to check
 * @param permissions - Array of permission actions to check
 * @returns true if the user has all the permissions, false otherwise
 */
export async function hasAllPermissions(
  userId: number,
  permissions: string[]
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: {
                    action: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return false;
    }

    const userPermissions = user.role.permissions.map(
      (rp) => rp.permission.action
    );

    return permissions.every((permission) =>
      userPermissions.includes(permission)
    );
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 * @param userId - The ID of the user
 * @returns Array of permission actions the user has
 */
export async function getUserPermissions(
  userId: number
): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: {
                    action: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return [];
    }

    return user.role.permissions.map(
      (rp) => rp.permission.action
    );
  } catch (error) {
    console.error('Get user permissions error:', error);
    return [];
  }
}

/**
 * Middleware helper to check permissions in API routes
 * @param permission - The required permission
 * @returns Function that checks the permission and returns appropriate response
 */
export function requirePermission(permission: string) {
  return async (userId: string | null) => {
    if (!userId) {
      return {
        error: 'Authentication required',
        status: 401,
      };
    }

    const hasAccess = await hasPermission(parseInt(userId), permission);

    if (!hasAccess) {
      return {
        error: `Permission denied. Required permission: ${permission}`,
        status: 403,
      };
    }

    return null; // No error, permission granted
  };
}

/**
 * Check if user can modify a resource (owns it or has admin permission)
 * @param userId - The ID of the user
 * @param resourceOwnerId - The ID of the resource owner
 * @param adminPermission - The admin permission that overrides ownership
 * @returns true if user can modify the resource, false otherwise
 */
export async function canModifyResource(
  userId: number,
  resourceOwnerId: number,
  adminPermission: string
): Promise<boolean> {
  // Owner can always modify their own resource
  if (userId === resourceOwnerId) {
    return true;
  }

  // Check if user has admin permission
  return await hasPermission(userId, adminPermission);
}

/**
 * Permission constants for easy reference
 */
export const PERMISSIONS = {
  // User Management
  VIEW_PENDING_USERS: 'view_pending_users',
  APPROVE_USERS: 'approve_users',
  VIEW_ALL_USERS: 'view_all_users',
  VIEW_USER_DETAILS: 'view_user_details',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',

  // Role Management
  VIEW_ROLES: 'view_roles',
  CREATE_ROLE: 'create_role',
  TRANSFER_ROLE: 'transfer_role',

  // Post Management
  CREATE_POST: 'create_post',
  EDIT_OWN_POST: 'edit_own_post',
  EDIT_ANY_POST: 'edit_any_post',
  DELETE_OWN_POST: 'delete_own_post',
  DELETE_ANY_POST: 'delete_any_post',
  VIEW_POSTS: 'view_posts',

  // Comment Management
  CREATE_COMMENT: 'create_comment',
  VIEW_COMMENTS: 'view_comments',

  // Category Management
  VIEW_CATEGORIES: 'view_categories',
  CREATE_CATEGORY: 'create_category',
  UPDATE_CATEGORY: 'update_category',
  DELETE_CATEGORY: 'delete_category',

  // Book Management
  VIEW_BOOKS: 'view_books',
  MANAGE_BOOKS: 'manage_books',
  BORROW_BOOK: 'borrow_book',
  RETURN_BOOK: 'return_book',

  // Fee Management
  VIEW_FEES: 'view_fees',
  MANAGE_FEES: 'manage_fees',
  VIEW_OWN_FEES: 'view_own_fees',
  PAY_FEE: 'pay_fee',

  // Event Management
  VIEW_EVENTS: 'view_events',
  MANAGE_EVENTS: 'manage_events',

  // Attendance Management
  VIEW_ATTENDANCE: 'view_attendance',
  MANAGE_ATTENDANCE: 'manage_attendance',
  CHECK_IN: 'check_in',
  VIEW_OWN_ATTENDANCE: 'view_own_attendance',

  // Evaluation Management
  VIEW_EVALUATIONS: 'view_evaluations',
  MANAGE_EVALUATIONS: 'manage_evaluations',
  VIEW_OWN_EVALUATIONS: 'view_own_evaluations',
} as const;