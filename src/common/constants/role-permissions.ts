import { Role } from '../../generated/prisma/enums';
import {
  Permissions,
  PermissionType,
} from '../enums/role.enum';

export const RolePermissions: Record<
  Role,
  PermissionType[]
> = {
  OWNER: Object.values(Permissions),

  ADMIN: [
    Permissions.INVITE_MEMBER,
    Permissions.UPDATE_MEMBER_ROLE,

    Permissions.CREATE_PROJECT,
    Permissions.UPDATE_PROJECT,
    Permissions.DELETE_PROJECT,

    Permissions.CREATE_TASK,
    Permissions.UPDATE_TASK,
    Permissions.DELETE_TASK,

    Permissions.ASSIGN_TASK,
  ],

  MEMBER: [
    Permissions.CREATE_TASK,
    Permissions.UPDATE_TASK,
  ],
};