import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const updateTaskStatusSchema = z.object({
    status: z.enum([
        'TODO',
        'IN_PROGRESS',
        'REVIEW',
        'DONE',
    ]),
});

export type UpdateTaskStatusSchema = z.infer<
    typeof updateTaskStatusSchema
>;

export class UpdateTaskStatusDto extends createZodDto(
    updateTaskStatusSchema,
) { }