// src/schemas/authSchema.js
import { z } from "zod";

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name is too long"),

    email: z
      .string()
      .trim()
      .email("Enter a valid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

  export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

  export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password"),
  })
  .refine(
    (data) =>
      data.newPassword ===
      data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  )
  .refine(
    (data) =>
      data.currentPassword !==
      data.newPassword,
    {
      message:
        "New password must be different from current password",
      path: ["newPassword"],
    }
  );