
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const createAttachmentSchema = z.object({
    name: z
        .string()
        .min(1, 'File name is required')
        .max(255, 'File name is too long'),

    description: z
        .string()
        .max(500, 'Description is too long')
        .optional(),
});

export type CreateAttachmentDtoType =
    z.infer<typeof createAttachmentSchema>;

export class CreateAttachmentDto extends createZodDto(
    createAttachmentSchema,
) { }
