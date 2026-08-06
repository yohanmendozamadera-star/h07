export type PermissionRow = { code: string; module: string; description: string };

export type EditableRoleCode = "administrador" | "tecnico";

export type RolePermissionsMatrix = {
  administrador: Set<string>;
  tecnico: Set<string>;
};
