import { z } from "zod"
import { createZodDto } from "nestjs-zod"
import { NotificationType } from "../../generated/prisma/enums"

const createNotificationSchema = z.object({
    userId: z.string(),
    type: NotificationType,
    title: z.string().min(2, "title must be aleast 2 characters"),
    message: z.string().max(10, "max character of 10 character"),
    actorId: z.string(),
    workspaceId: z.string(),
    projectId: z.string(),
    taskId: z.string()
})

export type CreateNotificationType = z.infer<typeof createNotificationSchema>

export class CreateNotificationDto extends createZodDto(createNotificationSchema){}