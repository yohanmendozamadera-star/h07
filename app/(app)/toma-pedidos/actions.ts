"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/permissions";
import { createOrderShared, type CreateOrderResult } from "@/lib/pedidos/create-order";
import { entradaParqueaderoSchema, salidaParqueaderoSchema } from "@/lib/validations/parqueadero";
import { calculateParkingCharge } from "@/lib/parqueadero/tariff";

export type ActionResult = { success: true } | { success: false; message: string };
export type SalidaResult =
  | { success: true; orderNumber: string; amount: number }
  | { success: false; message: string };

export async function createPedido(input: unknown): Promise<CreateOrderResult> {
  const result = await createOrderShared(input);
  if (result.success) revalidatePath("/toma-pedidos");
  return result;
}

export async function registrarEntradaParqueadero(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "parqueadero.create")) {
    return { success: false, message: "No tienes permiso para registrar entradas." };
  }

  const parsed = entradaParqueaderoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("parking_movements").insert({
    empresa_id: user.empresaId,
    plate: parsed.data.plate.toUpperCase(),
    client_id: parsed.data.clientId || null,
    parking_rate_id: parsed.data.parkingRateId,
  });

  if (error) {
    const message =
      error.code === "23505" ? "Ya hay un vehículo con esa placa estacionado." : error.message;
    return { success: false, message };
  }

  revalidatePath("/toma-pedidos");
  return { success: true };
}

export async function registrarSalidaParqueadero(input: unknown): Promise<SalidaResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.permissions, "parqueadero.edit")) {
    return { success: false, message: "No tienes permiso para cerrar movimientos de parqueadero." };
  }

  const parsed = salidaParqueaderoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();

  const { data: movement, error: movementError } = await supabase
    .from("parking_movements")
    .select("id, plate, client_id, parking_rate_id, entry_at, status")
    .eq("id", parsed.data.movementId)
    .single();

  if (movementError || !movement) {
    return { success: false, message: "No se encontró el movimiento de parqueadero." };
  }
  if (movement.status !== "abierto") {
    return { success: false, message: "Este movimiento ya está cerrado." };
  }

  const { data: rate, error: rateError } = await supabase
    .from("parking_rates")
    .select("rate_type, amount")
    .eq("id", movement.parking_rate_id)
    .single();
  if (rateError || !rate) {
    return { success: false, message: "No se encontró la tarifa de parqueadero." };
  }

  const { data: settings } = await supabase
    .from("company_settings")
    .select("parking_grace_minutes")
    .eq("empresa_id", user.empresaId)
    .single();

  const graceMinutes = settings?.parking_grace_minutes ?? 0;
  const exitAt = new Date();
  const { amount } = calculateParkingCharge({
    entryAt: new Date(movement.entry_at),
    exitAt,
    graceMinutes,
    rateType: rate.rate_type,
    rateAmount: rate.amount,
  });

  const { data: orderNumber, error: seqError } = await supabase.rpc("generate_order_number", {
    p_channel: "parqueadero",
  });
  if (seqError || !orderNumber) {
    return { success: false, message: seqError?.message ?? "No fue posible generar el número de pedido." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      empresa_id: user.empresaId,
      channel: "parqueadero",
      order_number: orderNumber,
      client_id: movement.client_id,
      plate: movement.plate,
      payment_method: parsed.data.paymentMethod,
      total_amount: amount,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, message: orderError?.message ?? "No fue posible crear el pedido." };
  }

  const { error: closeError } = await supabase
    .from("parking_movements")
    .update({
      exit_at: exitAt.toISOString(),
      grace_minutes_applied: graceMinutes,
      charged_amount: amount,
      status: "cerrado",
      order_id: order.id,
    })
    .eq("id", movement.id);

  if (closeError) {
    return {
      success: false,
      message: `El pedido ${orderNumber} se creó pero hubo un error cerrando el movimiento: ${closeError.message}.`,
    };
  }

  revalidatePath("/toma-pedidos");
  return { success: true, orderNumber, amount };
}
