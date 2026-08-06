import { getCurrentUser, can } from "@/lib/permissions";
import { getPermissionsCatalog, getRolePermissionsMatrix } from "@/lib/roles/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { RolesPermissionsMatrix } from "@/components/roles/roles-permissions-matrix";

export default async function RolesPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "usuarios.manage")) {
    return <ModulePlaceholder title="Roles y Permisos" description="No tienes permiso para ver este módulo." denied />;
  }

  const [catalog, matrix] = await Promise.all([getPermissionsCatalog(), getRolePermissionsMatrix(user!.empresaId)]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Roles y Permisos</h1>
        <p className="text-sm text-muted-foreground">
          Decide qué puede hacer cada rol en tu empresa. El Propietario siempre tiene acceso completo y no se puede
          editar.
        </p>
      </div>

      <RolesPermissionsMatrix
        catalog={catalog}
        administrador={Array.from(matrix.administrador)}
        tecnico={Array.from(matrix.tecnico)}
      />
    </div>
  );
}
