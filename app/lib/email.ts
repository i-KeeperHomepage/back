import { Resend } from "resend";
import { prisma } from "./prisma";

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification code email
 */
export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: [email],
      subject: "이메일 인증 코드",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">이메일 인증</h2>
          <p>안녕하세요,</p>
          <p>i-Keeper 회원가입을 위한 인증 코드입니다:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>이 코드는 <strong>10분</strong> 동안 유효합니다.</p>
          <p>본인이 요청하지 않은 경우, 이 이메일을 무시하셔도 됩니다.</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send verification email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to send verification email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create or update email verification record
 */
export async function createVerificationRecord(
  email: string,
  code: string
): Promise<void> {
  const expiresAt = new Date(
    Date.now() + parseInt(process.env.VERIFICATION_CODE_EXPIRES_IN || "600000")
  );

  // Delete any existing unverified records for this email
  await prisma.emailVerification.deleteMany({
    where: {
      email,
      verified: false,
    },
  });

  // Create new verification record
  await prisma.emailVerification.create({
    data: {
      email,
      code,
      expiresAt,
      verified: false,
    },
  });
}

/**
 * Verify email code
 */
export async function verifyEmailCode(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      email,
      code,
      verified: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verification) {
    return { valid: false, error: "Invalid verification code" };
  }

  if (verification.expiresAt < new Date()) {
    return { valid: false, error: "Verification code has expired" };
  }

  // Mark as verified
  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { verified: true },
  });

  return { valid: true };
}

/**
 * Check if email is verified
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      email,
      verified: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verification) {
    return false;
  }

  // Check if verification is still valid (within expiry time)
  return verification.expiresAt >= new Date();
}

/**
 * Delete verification record after successful registration
 */
export async function cleanupVerificationRecord(email: string): Promise<void> {
  await prisma.emailVerification.deleteMany({
    where: { email },
  });
}
