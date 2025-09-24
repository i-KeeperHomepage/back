import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Create default permissions
  const permissions = await Promise.all([
    // User Management Permissions
    prisma.permission.create({
      data: {
        action: "view_pending_users",
        description: "View users pending approval",
      },
    }),
    prisma.permission.create({
      data: {
        action: "approve_users",
        description: "Approve or reject user registrations",
      },
    }),
    prisma.permission.create({
      data: { action: "view_all_users", description: "View all users" },
    }),
    prisma.permission.create({
      data: {
        action: "view_user_details",
        description: "View detailed user information",
      },
    }),
    prisma.permission.create({
      data: { action: "update_user", description: "Update user information" },
    }),
    prisma.permission.create({
      data: { action: "delete_user", description: "Delete users" },
    }),

    // Role Management Permissions
    prisma.permission.create({
      data: { action: "view_roles", description: "View all roles" },
    }),
    prisma.permission.create({
      data: { action: "create_role", description: "Create new roles" },
    }),
    prisma.permission.create({
      data: {
        action: "transfer_role",
        description: "Transfer roles between users",
      },
    }),

    // Post Management Permissions
    prisma.permission.create({
      data: { action: "create_post", description: "Create new posts" },
    }),
    prisma.permission.create({
      data: { action: "edit_own_post", description: "Edit own posts" },
    }),
    prisma.permission.create({
      data: { action: "edit_any_post", description: "Edit any post" },
    }),
    prisma.permission.create({
      data: { action: "delete_own_post", description: "Delete own posts" },
    }),
    prisma.permission.create({
      data: { action: "delete_any_post", description: "Delete any post" },
    }),
    prisma.permission.create({
      data: { action: "view_posts", description: "View posts" },
    }),

    // Comment Management Permissions
    prisma.permission.create({
      data: { action: "create_comment", description: "Create comments" },
    }),
    prisma.permission.create({
      data: { action: "view_comments", description: "View comments" },
    }),

    // Category Management Permissions
    prisma.permission.create({
      data: { action: "view_categories", description: "View categories" },
    }),
    prisma.permission.create({
      data: { action: "create_category", description: "Create new categories" },
    }),
    prisma.permission.create({
      data: { action: "update_category", description: "Update categories" },
    }),
    prisma.permission.create({
      data: { action: "delete_category", description: "Delete categories" },
    }),

    // Book Management Permissions
    prisma.permission.create({
      data: { action: "view_books", description: "View book list" },
    }),
    prisma.permission.create({
      data: {
        action: "manage_books",
        description: "Add, edit, and delete books",
      },
    }),
    prisma.permission.create({
      data: { action: "borrow_book", description: "Borrow books" },
    }),
    prisma.permission.create({
      data: { action: "return_book", description: "Return borrowed books" },
    }),

    // Fee Management Permissions
    prisma.permission.create({
      data: { action: "view_fees", description: "View all fees" },
    }),
    prisma.permission.create({
      data: { action: "manage_fees", description: "Create and update fees" },
    }),
    prisma.permission.create({
      data: { action: "view_own_fees", description: "View own fee records" },
    }),
    prisma.permission.create({
      data: { action: "pay_fee", description: "Pay fees" },
    }),

    // Event Management Permissions
    prisma.permission.create({
      data: { action: "view_events", description: "View events" },
    }),
    prisma.permission.create({
      data: {
        action: "manage_events",
        description: "Create, edit, and delete events",
      },
    }),

    // Attendance Management Permissions
    prisma.permission.create({
      data: {
        action: "view_attendance",
        description: "View attendance records",
      },
    }),
    prisma.permission.create({
      data: {
        action: "manage_attendance",
        description: "Manage attendance records",
      },
    }),
    prisma.permission.create({
      data: { action: "check_in", description: "Check in for events" },
    }),
    prisma.permission.create({
      data: {
        action: "view_own_attendance",
        description: "View own attendance records",
      },
    }),

    // Evaluation Management Permissions
    prisma.permission.create({
      data: { action: "view_evaluations", description: "View all evaluations" },
    }),
    prisma.permission.create({
      data: {
        action: "manage_evaluations",
        description: "Create and edit evaluations",
      },
    }),
    prisma.permission.create({
      data: {
        action: "view_own_evaluations",
        description: "View own evaluation records",
      },
    }),

    // File Management Permissions
    prisma.permission.create({
      data: { action: "upload_file", description: "Upload files" },
    }),
    prisma.permission.create({
      data: { action: "view_files", description: "View all files" },
    }),
    prisma.permission.create({
      data: {
        action: "view_own_files",
        description: "View own uploaded files",
      },
    }),
    prisma.permission.create({
      data: {
        action: "delete_own_file",
        description: "Delete own uploaded files",
      },
    }),
    prisma.permission.create({
      data: { action: "delete_any_file", description: "Delete any file" },
    }),
    prisma.permission.create({
      data: { action: "download_file", description: "Download files" },
    }),
  ]);

  // Group permissions by role
  const adminPermissions = permissions; // Admin gets all permissions

  const memberPermissions = permissions.filter((p) =>
    [
      "create_post",
      "edit_own_post",
      "delete_own_post",
      "create_comment",
      "view_posts",
      "view_comments",
      "view_categories",
      "view_books",
      "borrow_book",
      "return_book",
      "view_own_fees",
      "pay_fee",
      "view_events",
      "check_in",
      "view_own_attendance",
      "view_own_evaluations",
      "upload_file",
      "view_own_files",
      "delete_own_file",
      "download_file",
    ].includes(p.action)
  );

  const nonMemberPermissions = permissions.filter((p) =>
    [
      "view_posts",
      "view_comments",
      "view_categories",
      "view_books",
      "view_events",
    ].includes(p.action)
  );

  // Create default roles
  const adminRole = await prisma.role.create({
    data: {
      name: "admin",
      description: "Administrator with full permissions",
      permissions: {
        create: adminPermissions.map((p) => ({
          permission: { connect: { id: p.id } },
        })),
      },
    },
  });

  const memberRole = await prisma.role.create({
    data: {
      name: "member",
      description: "Regular member",
      permissions: {
        create: memberPermissions.map((p) => ({
          permission: { connect: { id: p.id } },
        })),
      },
    },
  });

  const nonMemberRole = await prisma.role.create({
    data: {
      name: "non-member",
      description: "Non-member with limited view permissions",
      permissions: {
        create: nonMemberPermissions.map((p) => ({
          permission: { connect: { id: p.id } },
        })),
      },
    },
  });

  // Create default admin user
  const hashedPassword = await hash("admin123", 10);

  const adminUser = await prisma.user.create({
    data: {
      loginId: "admin",
      password: hashedPassword,
      name: "System Administrator",
      email: "admin@ikeeper.com",
      status: "active",
      roleId: adminRole.id,
    },
  });

  // Create default categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Announcements",
        description: "Official club announcements",
      },
    }),
    prisma.category.create({
      data: { name: "Events", description: "Upcoming events and activities" },
    }),
    prisma.category.create({
      data: { name: "Study", description: "Study materials and discussions" },
    }),
    prisma.category.create({
      data: { name: "General", description: "General discussions" },
    }),
  ]);

  console.log("Seeding completed!");
  console.log("Admin user created:");
  console.log("  Login ID: admin");
  console.log("  Password: admin123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
