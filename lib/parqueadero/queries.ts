import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ParkingRate, OpenMovement } from "@/lib/parqueadero/types";

// Devuelve TODAS las tarifas (activas e inactivas), igual que
// getCatalogItems() — quien necesite solo las activas (ej. el formulario de
// entrada de parqueadero) filtra is_active en el propio caller.
export const getParkingRates = cache(async (): Promise<ParkingRate[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parking_rates")
    .select("id, name, rate_type, amount, is_active")
    .order("name");

  return data ?? [];
});

export const getOpenMovements = cache(async (): Promise<OpenMovement[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parking_movements")
    .select("id, plate, client_id, entry_at, parking_rate:parking_rates(id, name, rate_type, amount)")
    .eq("status", "abierto")
    .order("entry_at")
    .returns<OpenMovement[]>();

  return data ?? [];
});
