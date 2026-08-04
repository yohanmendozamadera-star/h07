-- =========================================================
-- Row Level Security
-- Patrón: <modulo>.view / .create / .edit (soft-delete vive dentro de
-- .edit, porque "borrar" es un UPDATE que pone deleted_at, no un DELETE
-- real; el permiso .delete existe en el catálogo para que la UI/Server
-- Action decida mostrar o no la acción, no como política RLS separada).
--
-- El super-admin de plataforma NUNCA recibe un "or is_platform_admin()"
-- genérico en las tablas operativas del tenant (pedidos, clientes, gastos,
-- parqueadero, inventario, servicios) — no hay bypass general de RLS desde
-- el cliente. Solo las tablas de facturación/plataforma tienen una
-- política ADICIONAL Y SEPARADA para is_platform_admin(), nunca mezclada
-- con la política de tenant en un mismo OR, para que quede auditable qué
-- camino de acceso se usó. Esto corrige el hueco de seguridad del legado
-- (rol de tenant "Propietario" con acceso a datos de todas las empresas).
-- =========================================================

-- ---------- Helpers ----------
create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.profiles where id = auth.uid();
$$;

create or replace function public.has_permission(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_id = p.role_id
    join public.permissions perm on perm.id = rp.permission_id
    where p.id = auth.uid()
      and perm.code = p_code
      and p.is_active = true
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

create or replace function public.has_active_plan(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_subscriptions cs
    join public.plans pl on pl.id = cs.plan_id
    where cs.empresa_id = p_empresa_id
      and cs.status = 'active'
      and pl.code <> 'free'
  );
$$;

-- ---------- platform_admins ----------
-- Sin política de insert/update/delete para ningún rol de cliente: solo se
-- administra vía consola/service_role, nunca por el flujo normal de la app.
alter table public.platform_admins enable row level security;
create policy "platform_admins_select" on public.platform_admins
  for select using (public.is_platform_admin());

-- ---------- roles / permissions / role_permissions ----------
-- Catálogo global de RBAC: lectura libre (se necesita para selectores de
-- rol), sin escritura desde el cliente (se administra vía migraciones).
alter table public.roles enable row level security;
create policy "roles_select" on public.roles for select using (auth.uid() is not null);

alter table public.permissions enable row level security;
create policy "permissions_select" on public.permissions for select using (auth.uid() is not null);

alter table public.role_permissions enable row level security;
create policy "role_permissions_select" on public.role_permissions for select using (auth.uid() is not null);

-- ---------- plans / plan_addons ----------
alter table public.plans enable row level security;
create policy "plans_select" on public.plans for select using (auth.uid() is not null);

alter table public.plan_addons enable row level security;
create policy "plan_addons_select" on public.plan_addons for select using (auth.uid() is not null);

-- ---------- expense_categories / suppliers (catálogos globales compartidos) ----------
alter table public.expense_categories enable row level security;
create policy "expense_categories_select" on public.expense_categories for select using (auth.uid() is not null);
create policy "expense_categories_manage" on public.expense_categories for all
  using (public.has_permission('configuraciones.manage'))
  with check (public.has_permission('configuraciones.manage'));

alter table public.suppliers enable row level security;
create policy "suppliers_select" on public.suppliers for select using (auth.uid() is not null);
create policy "suppliers_manage" on public.suppliers for all
  using (public.has_permission('configuraciones.manage'))
  with check (public.has_permission('configuraciones.manage'));

-- ---------- companies ----------
alter table public.companies enable row level security;
create policy "companies_select_tenant" on public.companies
  for select using (id = public.current_empresa_id());
create policy "companies_select_platform" on public.companies
  for select using (public.is_platform_admin());
create policy "companies_update_platform" on public.companies
  for update using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------- company_settings ----------
alter table public.company_settings enable row level security;
create policy "company_settings_select" on public.company_settings
  for select using (empresa_id = public.current_empresa_id());
create policy "company_settings_update" on public.company_settings
  for update using (empresa_id = public.current_empresa_id() and public.has_permission('configuraciones.manage'))
  with check (empresa_id = public.current_empresa_id() and public.has_permission('configuraciones.manage'));

-- ---------- profiles ----------
alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or (empresa_id = public.current_empresa_id() and public.has_permission('usuarios.manage')));
create policy "profiles_update" on public.profiles
  for update using (id = auth.uid() or (empresa_id = public.current_empresa_id() and public.has_permission('usuarios.manage')))
  with check (id = auth.uid() or (empresa_id = public.current_empresa_id() and public.has_permission('usuarios.manage')));

-- ---------- Tablas operativas de tenant (patrón estándar) ----------
alter table public.clients enable row level security;
create policy "clients_select" on public.clients for select using (empresa_id = public.current_empresa_id() and public.has_permission('clientes.view'));
create policy "clients_insert" on public.clients for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('clientes.edit'));
create policy "clients_update" on public.clients for update using (empresa_id = public.current_empresa_id() and public.has_permission('clientes.edit')) with check (empresa_id = public.current_empresa_id() and public.has_permission('clientes.edit'));

alter table public.catalog_items enable row level security;
create policy "catalog_items_select" on public.catalog_items for select using (empresa_id = public.current_empresa_id() and public.has_permission('servicios.view'));
create policy "catalog_items_insert" on public.catalog_items for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('servicios.edit'));
create policy "catalog_items_update" on public.catalog_items for update using (empresa_id = public.current_empresa_id() and public.has_permission('servicios.edit')) with check (empresa_id = public.current_empresa_id() and public.has_permission('servicios.edit'));

alter table public.parking_rates enable row level security;
create policy "parking_rates_select" on public.parking_rates for select using (empresa_id = public.current_empresa_id() and public.has_permission('servicios.view'));
create policy "parking_rates_insert" on public.parking_rates for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('servicios.edit'));
create policy "parking_rates_update" on public.parking_rates for update using (empresa_id = public.current_empresa_id() and public.has_permission('servicios.edit')) with check (empresa_id = public.current_empresa_id() and public.has_permission('servicios.edit'));

alter table public.orders enable row level security;
create policy "orders_select" on public.orders for select using (empresa_id = public.current_empresa_id() and public.has_permission('pedidos.view'));
create policy "orders_insert" on public.orders for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('pedidos.create'));
create policy "orders_update" on public.orders for update using (empresa_id = public.current_empresa_id() and public.has_permission('pedidos.edit')) with check (empresa_id = public.current_empresa_id() and public.has_permission('pedidos.edit'));

alter table public.order_items enable row level security;
create policy "order_items_select" on public.order_items for select using (empresa_id = public.current_empresa_id() and public.has_permission('pedidos.view'));
create policy "order_items_insert" on public.order_items for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('pedidos.create'));

alter table public.order_workshop_details enable row level security;
create policy "order_workshop_details_select" on public.order_workshop_details for select using (empresa_id = public.current_empresa_id() and public.has_permission('pedidos.view'));
create policy "order_workshop_details_insert" on public.order_workshop_details for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('pedidos.create'));
create policy "order_workshop_details_update" on public.order_workshop_details for update using (empresa_id = public.current_empresa_id() and public.has_permission('pedidos.edit')) with check (empresa_id = public.current_empresa_id() and public.has_permission('pedidos.edit'));

alter table public.parking_movements enable row level security;
create policy "parking_movements_select" on public.parking_movements for select using (empresa_id = public.current_empresa_id() and public.has_permission('parqueadero.view'));
create policy "parking_movements_insert" on public.parking_movements for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('parqueadero.create'));
create policy "parking_movements_update" on public.parking_movements for update using (empresa_id = public.current_empresa_id() and public.has_permission('parqueadero.edit')) with check (empresa_id = public.current_empresa_id() and public.has_permission('parqueadero.edit'));

alter table public.purchases enable row level security;
create policy "purchases_select" on public.purchases for select using (empresa_id = public.current_empresa_id() and public.has_permission('inventario.view'));
create policy "purchases_insert" on public.purchases for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('inventario.create'));

alter table public.shrinkages enable row level security;
create policy "shrinkages_select" on public.shrinkages for select using (empresa_id = public.current_empresa_id() and public.has_permission('inventario.view'));
create policy "shrinkages_insert" on public.shrinkages for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('inventario.create'));

alter table public.expenses enable row level security;
create policy "expenses_select" on public.expenses for select using (empresa_id = public.current_empresa_id() and public.has_permission('gastos.view'));
create policy "expenses_insert" on public.expenses for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('gastos.create'));
create policy "expenses_update" on public.expenses for update using (empresa_id = public.current_empresa_id() and public.has_permission('gastos.edit')) with check (empresa_id = public.current_empresa_id() and public.has_permission('gastos.edit'));

-- ---------- Tablas de facturación/plataforma (camino de acceso separado) ----------
alter table public.company_subscriptions enable row level security;
create policy "company_subscriptions_select_tenant" on public.company_subscriptions for select using (empresa_id = public.current_empresa_id() and public.has_permission('planes.view'));
create policy "company_subscriptions_select_platform" on public.company_subscriptions for select using (public.is_platform_admin());
create policy "company_subscriptions_update_platform" on public.company_subscriptions for update using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.invoices enable row level security;
create policy "invoices_select_tenant" on public.invoices for select using (empresa_id = public.current_empresa_id() and public.has_permission('planes.view'));
create policy "invoices_select_platform" on public.invoices for select using (public.is_platform_admin());
create policy "invoices_update_platform" on public.invoices for update using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.payments enable row level security;
create policy "payments_select_tenant" on public.payments for select using (empresa_id = public.current_empresa_id() and public.has_permission('planes.view'));
create policy "payments_select_platform" on public.payments for select using (public.is_platform_admin());
create policy "payments_insert_tenant" on public.payments for insert with check (
  empresa_id = public.current_empresa_id() and public.has_permission('pagos.create') and status = 'pending'
);
create policy "payments_update_platform" on public.payments for update using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.payment_links enable row level security;
create policy "payment_links_select" on public.payment_links for select using (
  empresa_id is null or empresa_id = public.current_empresa_id()
);
create policy "payment_links_manage_platform" on public.payment_links for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Banner de bienvenida: visible incluso sin sesión (landing pública),
-- por eso "using (true)" en vez de exigir auth.uid().
alter table public.platform_banner enable row level security;
create policy "platform_banner_select" on public.platform_banner for select using (true);
create policy "platform_banner_manage_platform" on public.platform_banner for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------- audit_logs ----------
-- Sin política de insert: la escribe fn_audit_trigger, que corre con
-- privilegios de definer (dueño de la función) y por lo tanto no depende
-- de estas políticas.
alter table public.audit_logs enable row level security;
create policy "audit_logs_select_tenant" on public.audit_logs for select using (
  empresa_id = public.current_empresa_id() and public.has_permission('auditoria.view')
);
create policy "audit_logs_select_platform" on public.audit_logs for select using (public.is_platform_admin());
