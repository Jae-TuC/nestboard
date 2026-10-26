import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, 'Task title must be at least 2 characters')
    .max(200, 'Task title cannot exceed 200 characters'),

  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),



  status: z
    .enum([
      'TODO',
      'IN_PROGRESS',
      'REVIEW',
      'DONE',
    ])
    .optional(),

  priority: z
    .enum([
      'LOW',
      'MEDIUM',
      'HIGH',
      'URGENT',
    ])
    .optional(),

  position: z.number().default(0).optional(),

  dueDate: z
    .string()
    .datetime()
    .optional(),

  assigneeId: z
    .string()
    .uuid()
    .optional(),
});

export type CreateTaskSchema = z.infer<
  typeof createTaskSchema
>;

export class CreateTaskDto extends createZodDto(
  createTaskSchema,
) { }