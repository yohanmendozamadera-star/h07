import type { AuditAction } from "@/lib/audit/types";

export const ACTION_LABELS: Record<AuditAction, string> = {
  create: "Creó",
  update: "Actualizó",
  delete: "Eliminó",
  login: "Inició sesión",
  approve: "Aprobó",
  reject: "Rechazó",
};

export const MODULE_LABELS: Record<string, string> = {
  clients: "Clientes",
  catalog_items: "Servicios/Productos",
  parking_rates: "Tarifas de parqueadero",
  orders: "Pedidos",
  order_items: "Líneas de pedido",
  parking_movements: "Movimientos de parqueadero",
  purchases: "Compras",
  shrinkages: "Mermas",
  expenses: "Gastos",
  company_subscriptions: "Suscripción",
  invoices: "Facturas",
  payments: "Pagos",
  payment_links: "Links de pago",
};

// Campos técnicos/repetitivos que no aportan al dueño del negocio al revisar
// un cambio — se ocultan del detalle antes/después para que quede legible.
export const IGNORED_DIFF_FIELDS = new Set([
  "id",
  "empresa_id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
  "deleted_by",
]);

function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export type DiffRow = { field: string; before: string; after: string; changed: boolean };

// Une las llaves de old_data/new_data en filas campo->antes->después, para
// mostrar un detalle legible en vez de dos bloques de JSON crudo.
export function buildDiffRows(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
): DiffRow[] {
  const keys = new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]);
  const rows: DiffRow[] = [];

  for (const key of keys) {
    if (IGNORED_DIFF_FIELDS.has(key)) continue;
    const before = formatDiffValue(oldData?.[key]);
    const after = formatDiffValue(newData?.[key]);
    if (before === after) continue;
    rows.push({ field: key, before, after, changed: true });
  }

  return rows.sort((a, b) => a.field.localeCompare(b.field));
}
