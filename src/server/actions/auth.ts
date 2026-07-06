"use server";

import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  registerSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/lib/validation/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { otpProvider } from "@/lib/otp/msg91";
import { sendPasswordResetEmail } from "@/lib/email";

export type RegisterResult =
  | { success: true }
  | { success: false; error: string };

export async function registerUser(
  input: unknown,
): Promise<RegisterResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success: withinLimit } = checkRateLimit(`register:${ip}`, 5, 60_000);
  if (!withinLimit) {
    return { success: false, error: "Too many attempts. Please try again in a minute." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Please check your details and try again." };
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    return {
      success: false,
      error:
        existing.email === email
          ? "An account with this email already exists."
          : "An account with this mobile number already exists.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, phone, passwordHash },
  });

  return { success: true };
}

export type OtpResult = { success: true } | { success: false; error: string };

export async function sendPhoneOtp(phone: string): Promise<OtpResult> {
  const { success: withinLimit } = checkRateLimit(`otp-send:${phone}`, 3, 5 * 60_000);
  if (!withinLimit) {
    return { success: false, error: "Too many codes requested. Please wait a few minutes." };
  }

  const result = await otpProvider.sendOtp(phone);
  if (!result.success) {
    return { success: false, error: result.error ?? "Could not send the verification code." };
  }
  return { success: true };
}

export async function verifyPhoneOtp(input: unknown): Promise<OtpResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated." };
  }

  const parsed = otpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter the 6-digit code." };
  }

  const { success: withinLimit } = checkRateLimit(`otp-verify:${session.user.id}`, 5, 5 * 60_000);
  if (!withinLimit) {
    return { success: false, error: "Too many attempts. Please wait a few minutes." };
  }

  const result = await otpProvider.verifyOtp(parsed.data.phone, parsed.data.code);
  if (!result.success) {
    return { success: false, error: result.error ?? "Invalid or expired code." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phoneVerified: new Date() },
  });
  revalidatePath("/account");

  return { success: true };
}

export type ForgotPasswordResult = { success: true };

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function requestPasswordReset(input: unknown): Promise<ForgotPasswordResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  checkRateLimit(`forgot-password:${ip}`, 5, 60_000);

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: true };
  }

  const { success: withinLimit } = checkRateLimit(`forgot-password:${parsed.data.email}`, 3, 15 * 60_000);
  if (!withinLimit) {
    return { success: true };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user?.passwordHash) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  // Always return the same generic result — don't reveal whether the email exists.
  return { success: true };
}

export type ResetPasswordResult = { success: true } | { success: false; error: string };

export async function resetPassword(input: unknown): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Please check your details and try again." };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success: withinLimit } = checkRateLimit(`reset-password:${ip}`, 10, 60_000);
  if (!withinLimit) {
    return { success: false, error: "Too many attempts. Please try again in a minute." };
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return { success: false, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } });

  return { success: true };
}

export type ChangePasswordResult = { success: true } | { success: false; error: string };

export async function changePassword(input: unknown): Promise<ChangePasswordResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated." };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Please check your details and try again." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return {
      success: false,
      error: "This account signs in with Google and has no password to change.",
    };
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { success: true };
}

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80),
});

export async function updateProfile(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Not authenticated." };
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Please enter a valid name." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/account/profile");
  return { success: true as const };
}
