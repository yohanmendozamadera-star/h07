-- =========================================================
-- Tablas de negocio por tenant. Todas llevan empresa_id directo
-- (no solo vía join) para que las políticas RLS sean simples y eficientes.
-- =========================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  phone text,
  plate text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
create index idx_clients_empresa_id on public.clients (empresa_id);
create unique index uq_clients_empresa_phone on public.clients (empresa_id, phone)
  where deleted_at is null and phone is not null;

-- Unifica "servicio" y "producto" en una sola tabla (decisión confirmada):
-- simplifica el cruce de inventario por FK real en vez de texto de nombre.
-- Parqueadero NO usa esta tabla (tiene su propio catálogo: parking_rates).
create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  channel text not null check (channel in ('lavanderia', 'productos', 'taller')),
  name text not null,
  price_type text not null default 'fijo' check (price_type in ('fijo', 'variable')),
  price numeric(14, 2) not null default 0,
  tracks_inventory boolean not null default false,
  unit text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  -- Solo Taller admite precio "Variable" (se pide el valor al facturar).
  constraint chk_catalog_items_variable_only_taller
    check (price_type = 'fijo' or channel = 'taller')
);
create index idx_catalog_items_empresa_channel on public.catalog_items (empresa_id, channel);

create table public.parking_rates (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  rate_type text not null check (rate_type in ('hora', 'dia', 'mes')),
  amount numeric(14, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_parking_rates_empresa_id on public.parking_rates (empresa_id);

-- ---------- Pedidos (cabecera) ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  channel text not null check (channel in ('lavanderia', 'productos', 'taller', 'parqueadero', 'mixto')),
  order_number text not null,
  client_id uuid references public.clients(id),
  client_name text,
  client_phone text,
  plate text,
  technician_id uuid references public.profiles(id),
  payment_method text,
  status text not null default 'completado' check (status in ('completado', 'anulado')),
  total_amount numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
create unique index uq_orders_empresa_number on public.orders (empresa_id, order_number);
create index idx_orders_empresa_id on public.orders (empresa_id);
create index idx_orders_created_at on public.orders (created_at);
create index idx_orders_client_id on public.orders (client_id);

-- ---------- Pedidos (líneas) ----------
-- FK real a catalog_items (corrige el cruce por texto del legado).
-- price_type se persiste SIEMPRE (el legado lo perdía silenciosamente).
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  catalog_item_id uuid references public.catalog_items(id),
  description text not null,
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null default 0,
  price_type text not null default 'fijo' check (price_type in ('fijo', 'variable')),
  subtotal numeric(14, 2) not null default 0,
  channel text not null check (channel in ('lavanderia', 'productos', 'taller')),
  created_at timestamptz not null default now()
);
create index idx_order_items_order_id on public.order_items (order_id);
create index idx_order_items_catalog_item_id on public.order_items (catalog_item_id);
create index idx_order_items_empresa_id on public.order_items (empresa_id);

-- ---------- Extensión de Taller (orden de trabajo) ----------
create table public.order_workshop_details (
  order_id uuid primary key references public.orders(id) on delete cascade,
  empresa_id uuid not null references public.companies(id) on delete cascade,
  brand text,
  model text,
  diagnosis text,
  mileage text,
  work_performed text,
  recommendation text,
  next_visit_date date,
  entry_at timestamptz,
  exit_at timestamptz,
  work_order_status text not null default 'abierta'
    check (work_order_status in ('abierta', 'en_proceso', 'finalizada')),
  updated_at timestamptz not null default now()
);
create index idx_order_workshop_details_empresa_id on public.order_workshop_details (empresa_id);

-- ---------- Parqueadero ----------
-- charged_amount solo se llena al cerrar, calculado siempre server-side por
-- lib/parqueadero/tariff.ts (única función de dominio, con tolerancia).
-- El índice único de abajo reemplaza el chequeo manual del legado para
-- impedir doble entrada abierta de la misma placa.
create table public.parking_movements (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  plate text not null,
  client_id uuid references public.clients(id),
  parking_rate_id uuid not null references public.parking_rates(id),
  entry_at timestamptz not null default now(),
  exit_at timestamptz,
  grace_minutes_applied integer not null default 0,
  charged_amount numeric(14, 2),
  order_id uuid references public.orders(id),
  status text not null default 'abierto' check (status in ('abierto', 'cerrado')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create index idx_parking_movements_empresa_id on public.parking_movements (empresa_id);
create unique index uq_parking_movements_open_plate
  on public.parking_movements (empresa_id, plate) where status = 'abierto';

-- ---------- Inventario ----------
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  catalog_item_id uuid not null references public.catalog_items(id),
  supplier_id uuid references public.suppliers(id),
  quantity numeric(14, 2) not null check (quantity > 0),
  unit_cost numeric(14, 2) not null default 0,
  total_cost numeric(14, 2) not null default 0,
  purchase_date date not null default current_date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index idx_purchases_empresa_id on public.purchases (empresa_id);
create index idx_purchases_catalog_item_id on public.purchases (catalog_item_id);

create table public.shrinkages (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  catalog_item_id uuid not null references public.catalog_items(id),
  quantity numeric(14, 2) not null check (quantity > 0),
  reason text,
  shrinkage_date date not null default current_date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index idx_shrinkages_empresa_id on public.shrinkages (empresa_id);
create index idx_shrinkages_catalog_item_id on public.shrinkages (catalog_item_id);

-- Vista de stock: cruce por catalog_item_id (FK real), no por texto de
-- nombre como hacía el legado. security_invoker para que respete el RLS
-- de quien consulta, no del dueño de la vista.
create view public.stock_by_item
with (security_invoker = true) as
select
  ci.empresa_id,
  ci.id as catalog_item_id,
  ci.name,
  coalesce(p.purchased_qty, 0) as purchased_qty,
  coalesce(s.sold_qty, 0) as sold_qty,
  coalesce(m.shrinkage_qty, 0) as shrinkage_qty,
  coalesce(p.purchased_qty, 0) - coalesce(s.sold_qty, 0) - coalesce(m.shrinkage_qty, 0) as available_qty
from public.catalog_items ci
left join (
  select catalog_item_id, sum(quantity) as purchased_qty
  from public.purchases
  group by catalog_item_id
) p on p.catalog_item_id = ci.id
left join (
  select oi.catalog_item_id, sum(oi.quantity) as sold_qty
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status = 'completado'
  group by oi.catalog_item_id
) s on s.catalog_item_id = ci.id
left join (
  select catalog_item_id, sum(quantity) as shrinkage_qty
  from public.shrinkages
  group by catalog_item_id
) m on m.catalog_item_id = ci.id
where ci.tracks_inventory = true;

-- ---------- Gastos ----------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in ('fijo', 'variable')),
  category_id uuid references public.expense_categories(id),
  supplier_id uuid references public.suppliers(id),
  amount numeric(14, 2) not null default 0,
  expense_date date not null default current_date,
  description text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);
create index idx_expenses_empresa_id on public.expenses (empresa_id);
create index idx_expenses_date on public.expenses (expense_date);

-- ---------- Planes y facturación recurrente ----------
create table public.company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  addon_enabled boolean not null default false,
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_company_subscriptions_empresa_id on public.company_subscriptions (empresa_id);
create unique index uq_company_subscriptions_active
  on public.company_subscriptions (empresa_id) where status = 'active';

-- Cartera mensual: generada solo por el job programado (fn_generate_monthly_invoices),
-- nunca por el cliente.
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  period_year integer not null,
  period_month integer not null check (period_month between 1 and 12),
  plan_amount numeric(14, 2) not null default 0,
  addon_amount numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_invoices_empresa_period on public.invoices (empresa_id, period_year, period_month);
create index idx_invoices_empresa_id on public.invoices (empresa_id);
create index idx_invoices_status on public.invoices (status);

-- Reportado por el tenant, aprobado/rechazado solo por un admin de plataforma.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid references public.invoices(id),
  amount numeric(14, 2) not null default 0,
  reported_at timestamptz not null default now(),
  reported_by uuid references auth.users(id),
  payment_proof_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz
);
create index idx_payments_empresa_id on public.payments (empresa_id);
create index idx_payments_invoice_id on public.payments (invoice_id);

-- empresa_id nullable = link global (visible para todas las empresas).
create table public.payment_links (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.companies(id) on delete cascade,
  label text not null,
  url text not null,
  amount numeric(14, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payment_links_empresa_id on public.payment_links (empresa_id);

-- Banner de bienvenida global de la plataforma (una sola fila activa a la vez).
create table public.platform_banner (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  image_url text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------- Auditoría ----------
-- empresa_id nullable: null para acciones puramente de plataforma
-- (aprobar pago, gestionar plan de cualquier empresa, etc).
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.companies(id),
  user_id uuid references auth.users(id),
  action text not null check (action in ('create', 'update', 'delete', 'login', 'approve', 'reject')),
  module text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_empresa_id on public.audit_logs (empresa_id);
create index idx_audit_logs_module_record on public.audit_logs (module, record_id);
