"use client";

import { ClientFormDialog } from "@/components/clientes/client-form-dialog";
import type { ClientRow } from "@/lib/clientes/types";

export function ClientesTable({ clients, canEdit }: { clients: ClientRow[]; canEdit: boolean }) {
  if (clients.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay clientes registrados.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-blue-50 text-left text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
          <tr>
            <th className="p-2 font-medium">Nombre</th>
            <th className="p-2 font-medium">Celular</th>
            <th className="p-2 font-medium">Placa</th>
            {canEdit && <th className="p-2 font-medium" />}
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-t">
              <td className="p-2">{client.name}</td>
              <td className="p-2">{client.phone ?? "—"}</td>
              <td className="p-2">{client.plate ?? "—"}</td>
              {canEdit && (
                <td className="p-2 text-right">
                  <ClientFormDialog client={client} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
