import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const assignTaskSchema = z.object({
  assigneeId: z.string()
});

export type AssignTaskSchema = z.infer<
  typeof assignTaskSchema
>;

export class AssignTaskDto extends createZodDto(
  assignTaskSchema,
) {}