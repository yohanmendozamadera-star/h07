import { getCurrentUser, can } from "@/lib/permissions";
import { getUsuarios } from "@/lib/usuarios/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { UsuarioInviteDialog } from "@/components/usuarios/usuario-invite-dialog";
import { UsuariosTable } from "@/components/usuarios/usuarios-table";

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "usuarios.manage")) {
    return <ModulePlaceholder title="Usuarios" description="No tienes permiso para ver este módulo." denied />;
  }

  const usuarios = await getUsuarios();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
        <UsuarioInviteDialog />
      </div>

      <UsuariosTable usuarios={usuarios} currentUserId={user!.userId} />
    </div>
  );
}
