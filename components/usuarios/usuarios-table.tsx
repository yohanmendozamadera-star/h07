"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateUsuarioRoleAction, toggleUsuarioActivoAction } from "@/app/(app)/usuarios/actions";
import type { UsuarioRow } from "@/lib/usuarios/types";

export function UsuariosTable({ usuarios, currentUserId }: { usuarios: UsuarioRow[]; currentUserId: string }) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleRoleChange = async (usuario: UsuarioRow, roleCode: string) => {
    if (roleCode !== "administrador" && roleCode !== "tecnico") return;
    setPendingId(usuario.id);
    const result = await updateUsuarioRoleAction(usuario.id, roleCode);
    setPendingId(null);
    if (!result.success) {
      toast.error("No se pudo actualizar el rol", { description: result.message });
      return;
    }
    toast.success("Rol actualizado");
  };

  const handleToggleActive = async (usuario: UsuarioRow) => {
    setPendingId(usuario.id);
    const result = await toggleUsuarioActivoAction(usuario.id, !usuario.is_active);
    setPendingId(null);
    if (!result.success) {
      toast.error("No se pudo actualizar", { description: result.message });
      return;
    }
    toast.success(usuario.is_active ? "Usuario desactivado" : "Usuario activado");
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="p-2 font-medium">Nombre</th>
            <th className="p-2 font-medium">Correo</th>
            <th className="p-2 font-medium">Rol</th>
            <th className="p-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => {
            const isSelf = usuario.id === currentUserId;
            const isPropietario = usuario.role?.code === "propietario";
            return (
              <tr key={usuario.id} className="border-t">
                <td className="p-2">{usuario.full_name}</td>
                <td className="p-2">{usuario.email}</td>
                <td className="p-2">
                  {isPropietario ? (
                    <Badge variant="secondary">Propietario</Badge>
                  ) : (
                    <select
                      className="h-8 rounded-md border bg-transparent px-2 text-sm disabled:opacity-50"
                      value={usuario.role?.code ?? "tecnico"}
                      disabled={pendingId === usuario.id || isSelf}
                      onChange={(e) => handleRoleChange(usuario, e.target.value)}
                    >
                      <option value="tecnico">Técnico</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  )}
                </td>
                <td className="p-2">
                  {isPropietario || isSelf ? (
                    <Badge variant={usuario.is_active ? "secondary" : "outline"}>
                      {usuario.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pendingId === usuario.id}
                      onClick={() => handleToggleActive(usuario)}
                    >
                      <Badge variant={usuario.is_active ? "secondary" : "outline"}>
                        {usuario.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
