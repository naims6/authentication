import { z } from "zod";

// registration schema
export const UserCreateSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),

  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
});

// update schema
export const UserUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.email().optional(),
  password: z.string().min(8).optional(),
  isVerified: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
});

// login schema
export const UserLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// Verify Email
export const EmailVerifySchema = z.object({
  email: z.email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

// Password Reset
export const ResetPasswordSchema = z.object({
  email: z.email(),
  newPassword: z.string().min(8),
});

// Type inference
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type EmailVerify = z.infer<typeof EmailVerifySchema>;
