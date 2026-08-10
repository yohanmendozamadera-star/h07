import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AuditLogRow } from "@/lib/audit/types";

// No hay FK directa audit_logs.user_id -> profiles (apunta a auth.users), así
// que se resuelve con una segunda consulta y se cruza en memoria — mismo
// patrón ya usado en panel-plataforma para companies/profiles. Filtrado por
// rango de fechas (por defecto, solo hoy — ver DateRangeFilter).
export const getAuditLogs = cache(async (dateFrom: string, dateTo: string): Promise<AuditLogRow[]> => {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, user_id, action, module, record_id, old_data, new_data, created_at")
    .gte("created_at", `${dateFrom}T00:00:00`)
    .lte("created_at", `${dateTo}T23:59:59`)
    .order("created_at", { ascending: false })
    .limit(2000)
    .returns<Omit<AuditLogRow, "userName">[]>();

  if (!logs || logs.length === 0) return [];

  const userIds = Array.from(new Set(logs.map((log) => log.user_id).filter((id): id is string => Boolean(id))));

  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds).returns<{ id: string; full_name: string }[]>()
      : { data: [] as { id: string; full_name: string }[] };

  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  return logs.map((log) => ({
    ...log,
    userName: log.user_id ? (nameById.get(log.user_id) ?? null) : null,
  }));
});
