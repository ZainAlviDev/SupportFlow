import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const phoneE164 = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +923001234567");

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phoneCountryCode: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{0,3}$/, "Select a country code"),
  phoneNationalNumber: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number")
    .regex(/^\d{6,14}$/, "Digits only, without country code"),
  workspaceName: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .min(2, "Workspace name must be at least 2 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[0-9]/, "Include at least one number")
    .regex(/[^A-Za-z0-9]/, "Include at least one special character"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function toE164(countryCode: string, nationalNumber: string): string {
  return `${countryCode.trim()}${nationalNumber.trim().replace(/\D/g, "")}`;
}

export const forgotPasswordSchema = z.object({
  channel: z.enum(["email", "whatsapp"]),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter the email you registered with"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const verifyOtpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/[0-9]/, "Include at least one number")
      .regex(/[^A-Za-z0-9]/, "Include at least one special character"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export { phoneE164 };
