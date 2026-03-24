import { z } from 'zod'

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .max(100, 'Họ tên không được quá 100 ký tự'),
    email: z.email('Email không hợp lệ').trim().toLowerCase(),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .max(72, 'Mật khẩu không được quá 72 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    error: 'Mật khẩu xác nhận không khớp',
  })

export const loginSchema = z.object({
  email: z.email('Email không hợp lệ').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(72, 'Mật khẩu không được quá 72 ký tự'),
})

export const forgotPasswordCodeSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordWithCodeSchema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    code: z
      .string()
      .regex(/^\d{6}$/, "Mã xác nhận phải gồm đúng 6 chữ số"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string().min(8, "Mật khẩu xác nhận phải có ít nhất 8 ký tự"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Bạn cần nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
    confirmNewPassword: z.string().min(8, "Mật khẩu xác nhận phải có ít nhất 8 ký tự"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmNewPassword"],
  });