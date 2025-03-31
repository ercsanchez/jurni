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

export const UpsertUserProfileSchema = z.object({
  firstName: z.string().min(1, { message: 'First Name is required' }),
  // z.optional means can be undefined
  middleName: z.optional(
    // z.string().min(1, { message: 'Do not pass an empty field.' }), // cannot be empty string
    z.string(), // can be empty string
  ),
  lastName: z.string().min(1, { message: 'Last Name is required' }),
});
