import { z } from "zod"
import { createZodDto } from "nestjs-zod"

export const updateProjectScheme = z.object({
    name: z
        .string()
        .min(2, 'Project name must be at least 2 characters')
        .max(50).optional(),

    description: z
        .string()
        .max(500)
        .optional(),
})

export class UpdateProjectDto extends createZodDto(updateProjectScheme) { }