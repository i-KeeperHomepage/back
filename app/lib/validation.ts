import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(100),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[!@#$%^&*(),.?":{}|<>]/),
  name: z.string().min(2).max(50),
  major: z.string().min(1).max(100),
  class: z.string().regex(/^\d+\/\d+$/, "Class format must be n/m (e.g., 3/2)"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(1)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[!@#$%^&*(),.?":{}|<>]/),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(100)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[!@#$%^&*(),.?":{}|<>]/),
});

export const approveUserSchema = z.object({
  approve: z.boolean(),
});

export const updateUserSchema = z.object({
  status: z
    .enum(["pending_approval", "active", "inactive", "withdrawn"])
    .optional(),
  roleId: z.number().int().positive().optional(),
  profileImageId: z.number().int().positive().nullable().optional(),
});

export const transferRoleSchema = z.object({
  fromUserId: z.number().int().positive(),
  toUserId: z.number().int().positive(),
  roleId: z.number().int().positive(),
});

export const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  categoryId: z.number().int().positive(),
  fileIds: z.array(z.number().int().positive()).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  categoryId: z.number().int().positive().optional(),
  fileIds: z.array(z.number().int().positive()).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ApproveUserInput = z.infer<typeof approveUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type TransferRoleInput = z.infer<typeof transferRoleSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// CalendarEvent schemas
export const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().max(255).optional(),
  eventType: z.string().min(1).max(50),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().max(255).optional(),
  eventType: z.string().min(1).max(50).optional(),
});

// Book schemas
export const createBookSchema = z.object({
  title: z.string().min(1).max(255),
  author: z.string().min(1).max(100),
  publisher: z.string().min(1).max(100),
  isbn: z.string().max(20).optional(),
  location: z.string().max(50).optional(),
});

export const updateBookSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  author: z.string().min(1).max(100).optional(),
  publisher: z.string().min(1).max(100).optional(),
  isbn: z.string().max(20).optional(),
  location: z.string().max(50).optional(),
  status: z.enum(["available", "borrowed", "lost"]).optional(),
});

export const borrowBookSchema = z.object({
  returnDate: z.string().datetime(),
});

// Fee schemas
export const createFeeSchema = z.object({
  userId: z.number().int().positive(),
  amount: z.number().positive(),
  date: z.string().datetime(),
});

export const updateFeeSchema = z.object({
  amount: z.number().positive().optional(),
  date: z.string().datetime().optional(),
  status: z.enum(["unpaid", "paid", "overdue"]).optional(),
  paidAt: z.string().datetime().optional(),
});

// Attendance schemas
export const createAttendanceSchema = z.object({
  status: z.enum(["present", "absent", "late", "excused"]),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(["present", "absent", "late", "excused"]),
  checkInAt: z.string().datetime().optional(),
});

// Evaluation schemas
export const createEvaluationSchema = z.object({
  userId: z.number().int().positive(),
  semester: z.string().min(1).max(20),
  year: z.number().int().min(2000).max(2100),
  score: z.number().min(0).max(5),
  comments: z.string().optional(),
});

export const updateEvaluationSchema = z.object({
  score: z.number().min(0).max(5).optional(),
  comments: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BorrowBookInput = z.infer<typeof borrowBookSchema>;
export type CreateFeeInput = z.infer<typeof createFeeSchema>;
export type UpdateFeeInput = z.infer<typeof updateFeeSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;

// File schemas
export const uploadFileSchema = z.object({
  purpose: z.enum(["profile", "document", "attachment", "other"]),
  description: z.string().optional(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

// Award schemas
export const createAwardSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const updateAwardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

// Education History schemas
export const createEducationSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const updateEducationSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

// Cleaning schemas
export const createCleaningSchema = z.object({
  date: z.string().datetime(),
  description: z.string().optional(),
  userIds: z.array(z.number().int().positive()),
});

export const updateCleaningSchema = z.object({
  date: z.string().datetime().optional(),
  description: z.string().optional(),
  userIds: z.array(z.number().int().positive()).optional(),
});

export type CreateAwardInput = z.infer<typeof createAwardSchema>;
export type UpdateAwardInput = z.infer<typeof updateAwardSchema>;
export type CreateEducationInput = z.infer<typeof createEducationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
