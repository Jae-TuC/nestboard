import { z } from "zod"
import { createZodDto } from "nestjs-zod"

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export type inviteMemberDtoType = z.infer<typeof inviteMemberSchema>;
export class inviteMemberDto extends createZodDto(inviteMemberSchema) {}
