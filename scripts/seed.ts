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
        action: "update_role",
        description: "Update role details and permissions",
      },
    }),
    prisma.permission.create({
      data: { action: "delete_role", description: "Delete roles" },
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
    prisma.permission.create({
      data: { action: "edit_own_comment", description: "Edit own comments" },
    }),
    prisma.permission.create({
      data: { action: "edit_any_comment", description: "Edit any comment" },
    }),
    prisma.permission.create({
      data: {
        action: "delete_own_comment",
        description: "Delete own comments",
      },
    }),
    prisma.permission.create({
      data: { action: "delete_any_comment", description: "Delete any comment" },
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

    // Award Management Permissions
    prisma.permission.create({
      data: {
        action: "view_all_awards",
        description: "View all awards across users",
      },
    }),
    prisma.permission.create({
      data: { action: "view_awards", description: "View awards" },
    }),
    prisma.permission.create({
      data: {
        action: "view_own_awards",
        description: "View own award records",
      },
    }),
    prisma.permission.create({
      data: {
        action: "create_own_award",
        description: "Create own award record",
      },
    }),
    prisma.permission.create({
      data: {
        action: "update_own_award",
        description: "Update own award record",
      },
    }),
    prisma.permission.create({
      data: {
        action: "delete_own_award",
        description: "Delete own award record",
      },
    }),
    prisma.permission.create({
      data: {
        action: "create_any_award",
        description: "Create award for any user",
      },
    }),
    prisma.permission.create({
      data: {
        action: "update_any_award",
        description: "Update any user's award",
      },
    }),
    prisma.permission.create({
      data: {
        action: "delete_any_award",
        description: "Delete any user's award",
      },
    }),

    // Education History Management Permissions
    prisma.permission.create({
      data: {
        action: "view_all_education",
        description: "View all education records",
      },
    }),
    prisma.permission.create({
      data: { action: "view_education", description: "View education records" },
    }),
    prisma.permission.create({
      data: {
        action: "view_own_education",
        description: "View own education history",
      },
    }),
    prisma.permission.create({
      data: {
        action: "create_own_education",
        description: "Create own education record",
      },
    }),
    prisma.permission.create({
      data: {
        action: "update_own_education",
        description: "Update own education record",
      },
    }),
    prisma.permission.create({
      data: {
        action: "delete_own_education",
        description: "Delete own education record",
      },
    }),
    prisma.permission.create({
      data: {
        action: "create_any_education",
        description: "Create education for any user",
      },
    }),
    prisma.permission.create({
      data: {
        action: "update_any_education",
        description: "Update any user's education",
      },
    }),
    prisma.permission.create({
      data: {
        action: "delete_any_education",
        description: "Delete any user's education",
      },
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
      "view_own_awards",
      "create_own_award",
      "update_own_award",
      "delete_own_award",
      "view_own_education",
      "create_own_education",
      "update_own_education",
      "delete_own_education",
    ].includes(p.action)
  );

  const nonMemberPermissions = permissions.filter((p) =>
    [
      "view_posts",
      "view_comments",
      "view_categories",
      "view_books",
      "view_events",
      "view_awards",
      "view_education",
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
  const hashedPassword = await hash("iKeeperD2509!@", 10);

  const adminUser = await prisma.user.create({
    data: {
      password: hashedPassword,
      name: "System Administrator",
      email: "admin@ikeeper.com",
      studentId: "ADMIN001",
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
  console.log("  Login Email: admin@ikeeper.com");
  console.log("  Password: iKeeperD2509!@");
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
