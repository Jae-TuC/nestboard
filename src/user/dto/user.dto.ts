import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const userSchema = z.object({
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

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  password: z.string().min(8).max(32).optional(),
  avatar: z.string().optional(),
  isVerified: z.boolean().optional()
});

export type UpdateUserType = z.infer<
  typeof updateUserSchema
>;

export type UserDtoType = z.infer<typeof userSchema>;

export class UserDto extends createZodDto(userSchema) { }
export class UpdateUserDto extends createZodDto(updateUserSchema) { }
