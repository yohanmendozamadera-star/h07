import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CurrentSubscription, InvoiceRow, PaymentRow, PlanRow, PlanAddonRow, TenantPaymentLink } from "@/lib/planes/types";

export const getCurrentSubscription = cache(async (): Promise<CurrentSubscription | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_subscriptions")
    .select("status, addon_enabled, effective_from, plan:plans(code, name, price_cop)")
    .eq("status", "active")
    .maybeSingle<CurrentSubscription>();

  return data;
});

export const getInvoices = cache(async (): Promise<InvoiceRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, period_year, period_month, plan_amount, addon_amount, total_amount, due_date, status")
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })
    .limit(24);

  return data ?? [];
});

export const getPayments = cache(async (): Promise<PaymentRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, invoice_id, amount, reported_at, status")
    .order("reported_at", { ascending: false })
    .limit(24);

  return data ?? [];
});

export const hasActivePlan = cache(async (empresaId: string): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("has_active_plan", { p_empresa_id: empresaId });
  return Boolean(data);
});

export const getPlans = cache(async (): Promise<PlanRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("code, name, price_cop").eq("is_active", true).order("price_cop");
  return data ?? [];
});

export const getPlanAddons = cache(async (): Promise<PlanAddonRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("plan_addons").select("code, name, price_cop").eq("is_active", true);
  return data ?? [];
});

// Prefiere un link específico de la empresa sobre uno global si ambos existen.
export const getTenantPaymentLink = cache(async (empresaId: string): Promise<TenantPaymentLink> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_links")
    .select("label, url, empresa_id")
    .eq("is_active", true)
    .or(`empresa_id.eq.${empresaId},empresa_id.is.null`)
    .order("empresa_id", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return data ? { label: data.label, url: data.url } : null;
});
