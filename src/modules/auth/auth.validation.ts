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

// resend OTP
export const ResendOtpSchema = z.object({
  email: z.email(),
});

// email schema for forgot password
export const EmailSchema = z.object({
  email: z.email("Invalid email address"),
});

// reset password schema
export const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmNewPassword: z
      .string()
      .min(6, "Confirm new password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirm new password do not match",
  });

// change password
export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
});


// Type inference
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type EmailVerify = z.infer<typeof EmailVerifySchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
