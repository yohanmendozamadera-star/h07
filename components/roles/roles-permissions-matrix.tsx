"use client";

import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setRolePermissionAction } from "@/app/(app)/roles/actions";
import type { PermissionRow, EditableRoleCode } from "@/lib/roles/types";

const MODULE_LABELS: Record<string, string> = {
  pedidos: "Pedidos",
  parqueadero: "Parqueadero",
  servicios: "Servicios",
  clientes: "Clientes",
  inventario: "Inventario",
  gastos: "Gastos",
  usuarios: "Usuarios",
  reportes: "Reportes",
  configuraciones: "Configuraciones",
  planes: "Planes",
  pagos: "Pagos",
  auditoria: "Auditoría",
};

const ACTION_LABELS: Record<string, string> = {
  view: "Ver",
  create: "Crear",
  edit: "Editar",
  delete: "Eliminar",
  export: "Exportar",
  manage: "Administrar",
};

function actionLabel(code: string): string {
  const action = code.split(".")[1] ?? code;
  return ACTION_LABELS[action] ?? action;
}

function groupByModule(catalog: PermissionRow[]): Map<string, PermissionRow[]> {
  const groups = new Map<string, PermissionRow[]>();
  for (const permission of catalog) {
    const list = groups.get(permission.module) ?? [];
    list.push(permission);
    groups.set(permission.module, list);
  }
  return groups;
}

export function RolesPermissionsMatrix({
  catalog,
  administrador,
  tecnico,
}: {
  catalog: PermissionRow[];
  administrador: string[];
  tecnico: string[];
}) {
  const [adminSet, setAdminSet] = useState(new Set(administrador));
  const [tecnicoSet, setTecnicoSet] = useState(new Set(tecnico));
  const [pending, setPending] = useState<string | null>(null);

  const roleState: Record<EditableRoleCode, { set: Set<string>; setSet: (s: Set<string>) => void }> = {
    administrador: { set: adminSet, setSet: setAdminSet },
    tecnico: { set: tecnicoSet, setSet: setTecnicoSet },
  };

  const handleToggle = async (roleCode: EditableRoleCode, permissionCode: string, checked: boolean) => {
    const { set, setSet } = roleState[roleCode];
    const previous = new Set(set);
    const next = new Set(set);
    if (checked) next.add(permissionCode);
    else next.delete(permissionCode);
    setSet(next);
    setPending(`${roleCode}:${permissionCode}`);

    const result = await setRolePermissionAction(roleCode, permissionCode, checked);
    setPending(null);

    if (!result.success) {
      setSet(previous);
      toast.error("No se pudo guardar", { description: result.message });
    }
  };

  const groups = groupByModule(catalog);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Matriz de permisos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-left text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
              <tr>
                <th className="p-2 font-medium">Permiso</th>
                <th className="p-2 text-center font-medium">Propietario</th>
                <th className="p-2 text-center font-medium">Administrador</th>
                <th className="p-2 text-center font-medium">Técnico</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(groups.entries()).map(([module, permissionsInModule]) => (
                <Fragment key={module}>
                  <tr className="border-t bg-muted/30">
                    <td colSpan={4} className="p-2 text-xs font-semibold text-muted-foreground uppercase">
                      {MODULE_LABELS[module] ?? module}
                    </td>
                  </tr>
                  {permissionsInModule.map((permission) => (
                    <tr key={permission.code} className="border-t">
                      <td className="p-2">{actionLabel(permission.code)}</td>
                      <td className="p-2 text-center">
                        <Checkbox checked disabled />
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={adminSet.has(permission.code)}
                          disabled={pending === `administrador:${permission.code}`}
                          onCheckedChange={(checked) => handleToggle("administrador", permission.code, Boolean(checked))}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={tecnicoSet.has(permission.code)}
                          disabled={pending === `tecnico:${permission.code}`}
                          onCheckedChange={(checked) => handleToggle("tecnico", permission.code, Boolean(checked))}
                        />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
