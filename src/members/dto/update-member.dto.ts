import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const updateRoleMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export type UpdateRoleSchema = z.infer<
  typeof updateRoleMemberSchema
>;

export class UpdateRoleDto extends createZodDto(
  updateRoleMemberSchema,
) {}