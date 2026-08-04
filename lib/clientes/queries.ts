import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ClientRow } from "@/lib/clientes/types";

export const getClients = cache(async (): Promise<ClientRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, phone, plate")
    .is("deleted_at", null)
    .order("name");

  return data ?? [];
});
