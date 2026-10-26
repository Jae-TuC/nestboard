import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateTaskPositionSchema = z.object({
  position: z.number().int().min(0),
});

export class UpdateTaskPositionDto extends createZodDto(
  updateTaskPositionSchema,
) {}