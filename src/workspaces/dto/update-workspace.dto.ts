import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Workspace name must be at least 3 characters')
    .max(50, 'Workspace name cannot exceed 50 characters'),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Slug must be at least 3 characters')
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens',
    ),

  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

export class UpdateWorkspaceDto extends createZodDto(
  UpdateWorkspaceSchema,
) {}

export type UpdateWorkspaceDtoType = z.infer<
  typeof UpdateWorkspaceSchema
>;