import { z } from "zod"
import { createZodDto } from "nestjs-zod"

export const createProjectScheme = z.object({
    name: z
        .string()
        .min(2, 'Project name must be at least 2 characters')
        .max(50),

    description: z
        .string()
        .max(500)
        .optional(),
})

export class CreateProjectDto extends createZodDto(createProjectScheme) { }