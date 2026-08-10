export type CompanyRow = {
  id: string;
  name: string;
  status: "active" | "suspended";
  owner: { full_name: string; email: string } | null;
  subscription: { status: string; plan: { code: string; name: string } | null } | null;
};

export type PlatformInvoiceRow = {
  id: string;
  empresa_id: string;
  company: { name: string } | null;
  period_year: number;
  period_month: number;
  total_amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
};

export type PlatformPaymentRow = {
  id: string;
  empresa_id: string;
  company: { name: string } | null;
  invoice_id: string | null;
  amount: number;
  reported_at: string;
  status: "pending" | "approved" | "rejected";
};

export type PlatformBanner = {
  id: string;
  message: string;
  image_url: string | null;
  is_active: boolean;
};

export type PlatformConfig = {
  whatsapp_notifications_enabled: boolean;
  support_whatsapp_number: string | null;
};

export type PaymentLinkRow = {
  id: string;
  empresa_id: string | null;
  company: { name: string } | null;
  label: string;
  url: string;
  amount: number | null;
  is_active: boolean;
};
