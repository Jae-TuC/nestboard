// export const Roles = {
//   OWNER: 'OWNER',
//   ADMIN: 'ADMIN',
//   MEMBER: 'MEMBER',
// } as const;

// export type Role = keyof typeof Roles;

export const Permissions = {
  // Workspace
  CREATE_WORKSPACE: 'CREATE_WORKSPACE',
  UPDATE_WORKSPACE: 'UPDATE_WORKSPACE',
  DELETE_WORKSPACE: 'DELETE_WORKSPACE',

  // Members
  INVITE_MEMBER: 'INVITE_MEMBER',
  REMOVE_MEMBER: 'REMOVE_MEMBER',
  UPDATE_MEMBER_ROLE: 'UPDATE_MEMBER_ROLE',

  // Projects
  CREATE_PROJECT: 'CREATE_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',

  // Tasks
  CREATE_TASK: 'CREATE_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  ASSIGN_TASK: 'ASSIGN_TASK',
} as const;

export type PermissionType = keyof typeof Permissions;