import { ZodType, z } from "zod";
import { ILoginFormData, IStudentLoginFormData } from "../types/auth";
import { IResetPasswordRequest } from "../types/auth";
import { IUpdatePasswordFormData } from "../types/auth";

export const LoginSchema: ZodType<ILoginFormData> = z.object({
  email: z
    .string({
      required_error: "Email address is required",
      invalid_type_error: "Email format is invalid",
    })
    .email(),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(4, "Password should be atleast 6 characters"),
});

export const StudentLoginSchema: ZodType<IStudentLoginFormData> = z.object({
  nid: z
    .string({ required_error: "National ID is required" })
    .min(16, "National ID must be 16 characters")
    .max(16, "National ID must be 16 characters"),
  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .min(10, "Enter a valid phone number"),
});

export const ForgotPasswordSchema: ZodType<IResetPasswordRequest> = z.object({
  email: z
    .string({
      required_error: "Email address is required",
      invalid_type_error: "Email format is invalid",
    })
    .email(),
});

export const ResetPasswordSchema = z.object({
  otp: z.string().min(1, "OTP is required"),
  newPassword: z.string().min(6, "Password should be at least 6 characters"),
  //   confirmPassword: z.string().min(6, "Confirm password is required"),
  // })
  // .refine((data) => data.newPassword === data.confirmPassword, {
  //   message: "Passwords do not match",
  //   path: ["confirmPassword"],
});

export const UpdatePasswordSchema: ZodType<IUpdatePasswordFormData> = z.object({
  currentPassword: z
    .string({
      required_error: "Current password is required",
    })
    .min(6, "Password should be at least 6 characters"),
  newPassword: z
    .string({
      required_error: "New password is required",
    })
    .min(6, "Password should be at least 6 characters"),
  // confirmPassword: z
  //   .string({
  //     required_error: "Confirm password is required",
  //   })
  //   .min(6, "Password should be at least 6 characters"),
});
