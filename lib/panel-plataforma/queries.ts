import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CompanyRow, PlatformInvoiceRow, PlatformPaymentRow, PlatformBanner, PlatformConfig, PaymentLinkRow } from "@/lib/panel-plataforma/types";

type CompanyBase = { id: string; name: string; status: string; owner_user_id: string };
type SubscriptionBase = { empresa_id: string; status: string; plan: { code: string; name: string } | null };
type OwnerProfile = { id: string; full_name: string; email: string };

// companies.owner_user_id apunta a auth.users, no a profiles — no existe una
// FK directa companies -> profiles para que PostgREST pueda embeberla. Se
// resuelve con una segunda consulta y se cruza en memoria (profiles.id es el
// mismo id de auth.users del dueño).
export const getAllCompanies = cache(async (): Promise<CompanyRow[]> => {
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, status, owner_user_id")
    .order("name")
    .returns<CompanyBase[]>();

  const ownerIds = (companies ?? []).map((c) => c.owner_user_id);

  const [subsRes, ownersRes] = await Promise.all([
    supabase
      .from("company_subscriptions")
      .select("empresa_id, status, plan:plans(code, name)")
      .eq("status", "active")
      .returns<SubscriptionBase[]>(),
    ownerIds.length > 0
      ? supabase.from("profiles").select("id, full_name, email").in("id", ownerIds).returns<OwnerProfile[]>()
      : Promise.resolve({ data: [] as OwnerProfile[] }),
  ]);

  const subByEmpresa = new Map((subsRes.data ?? []).map((s) => [s.empresa_id, s]));
  const ownerById = new Map((ownersRes.data ?? []).map((o) => [o.id, o]));

  return (companies ?? []).map((company) => ({
    id: company.id,
    name: company.name,
    status: company.status as "active" | "suspended",
    owner: ownerById.get(company.owner_user_id) ?? null,
    subscription: subByEmpresa.get(company.id) ?? null,
  }));
});

export const getAllInvoices = cache(async (): Promise<PlatformInvoiceRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, empresa_id, company:companies(name), period_year, period_month, total_amount, due_date, status")
    .order("due_date", { ascending: false })
    .limit(100)
    .returns<PlatformInvoiceRow[]>();

  return data ?? [];
});

export const getAllPayments = cache(async (): Promise<PlatformPaymentRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, empresa_id, company:companies(name), invoice_id, amount, reported_at, status")
    .order("reported_at", { ascending: false })
    .limit(100)
    .returns<PlatformPaymentRow[]>();

  return data ?? [];
});

export const getPlatformBanner = cache(async (): Promise<PlatformBanner | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_banner")
    .select("id, message, image_url, is_active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
});

export const getPlatformConfig = cache(async (): Promise<PlatformConfig> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_config")
    .select("whatsapp_notifications_enabled")
    .eq("id", 1)
    .maybeSingle();

  return data ?? { whatsapp_notifications_enabled: false };
});

export const getPaymentLinks = cache(async (): Promise<PaymentLinkRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_links")
    .select("id, empresa_id, company:companies(name), label, url, amount, is_active")
    .order("label")
    .returns<PaymentLinkRow[]>();

  return data ?? [];
});
