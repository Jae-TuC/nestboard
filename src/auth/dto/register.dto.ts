import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters'),

  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters'),

  email: z.email('Invalid email address'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(32, 'Password cannot exceed 32 characters'),

  avatar: z.url().optional(),
});

export type RegisterDtoType = z.infer<typeof registerSchema>;

export class RegisterDto extends createZodDto(registerSchema) {}