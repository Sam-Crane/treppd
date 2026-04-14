import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /[a-z]/,
      'Password must include at least one lowercase letter',
    )
    .regex(
      /[A-Z]/,
      'Password must include at least one uppercase letter',
    )
    .regex(/[0-9]/, 'Password must include at least one number'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
