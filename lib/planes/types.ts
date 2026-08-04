export type CurrentSubscription = {
  status: "active" | "suspended" | "cancelled";
  addon_enabled: boolean;
  effective_from: string;
  plan: { code: string; name: string; price_cop: number };
};

export type InvoiceRow = {
  id: string;
  period_year: number;
  period_month: number;
  plan_amount: number;
  addon_amount: number;
  total_amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
};

export type PaymentRow = {
  id: string;
  invoice_id: string | null;
  amount: number;
  reported_at: string;
  status: "pending" | "approved" | "rejected";
};

export type PlanRow = { code: string; name: string; price_cop: number };
export type PlanAddonRow = { code: string; name: string; price_cop: number };
export type TenantPaymentLink = { label: string; url: string } | null;
