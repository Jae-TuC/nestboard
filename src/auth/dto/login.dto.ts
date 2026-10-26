import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginDtoType = z.infer<typeof loginSchema>;
export class LoginDto extends createZodDto(loginSchema) {}
