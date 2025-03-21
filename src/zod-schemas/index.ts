import * as z from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email({ message: 'Email is required / Invalid email' }),
  password: z
    .string()
    .min(6, { message: 'Minimum 6 characters required for Password' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Password confirmation is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Email is required / Invalid email' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: 'Minimum 6 characters required for Password' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Password confirmation is required' }),
});
