-- =========================================================
-- Planes y facturación recurrente.
-- =========================================================

-- El tenant SÍ puede administrar su propia suscripción (elegir plan,
-- activar/desactivar el complemento) — es un cambio de intención, no un
-- cobro. Lo que el tenant NUNCA puede hacer vía RLS es tocar invoices
-- (facturas) ni aprobar sus propios payments; eso sigue siendo exclusivo
-- del job programado y del panel de plataforma.
create policy "company_subscriptions_insert_tenant" on public.company_subscriptions
  for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('planes.view'));

create policy "company_subscriptions_update_tenant" on public.company_subscriptions
  for update using (empresa_id = public.current_empresa_id() and public.has_permission('planes.view'))
  with check (empresa_id = public.current_empresa_id() and public.has_permission('planes.view'));

-- ---------- has_active_plan: usado para acotar histórico si el plan no está activo ----------
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

-- ---------- activate_paid_plan: upgrade a H7 (+ complemento opcional) ----------
-- Cierra la suscripción activa actual y crea la nueva, más la factura del
-- periodo en curso (para poder empezar a cobrar de inmediato, sin esperar
-- al job mensual). empresa_id se deriva del propio usuario autenticado,
-- nunca de un parámetro que el cliente pudiera falsear.
create or replace function public.activate_paid_plan(p_plan_code text, p_addon_enabled boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid := public.current_empresa_id();
  v_plan_id uuid;
  v_plan_price numeric(14,2);
  v_addon_price numeric(14,2) := 0;
  v_period_year int := extract(year from current_date)::int;
  v_period_month int := extract(month from current_date)::int;
  v_due_date date := make_date(v_period_year, v_period_month, 25);
  v_invoice_id uuid;
begin
  if v_empresa_id is null or not public.has_permission('planes.view') then
    raise exception 'No autorizado';
  end if;

  select id, price_cop into v_plan_id, v_plan_price from public.plans where code = p_plan_code and is_active;
  if v_plan_id is null then
    raise exception 'Plan no encontrado: %', p_plan_code;
  end if;

  if p_addon_enabled then
    select price_cop into v_addon_price from public.plan_addons where code = 'automatizaciones';
  end if;

  update public.company_subscriptions
  set status = 'cancelled', effective_to = now()
  where empresa_id = v_empresa_id and status = 'active';

  insert into public.company_subscriptions (empresa_id, plan_id, addon_enabled, status, effective_from)
  values (v_empresa_id, v_plan_id, p_addon_enabled, 'active', now());

  if p_plan_code = 'free' then
    return null;
  end if;

  if v_due_date < current_date then
    v_due_date := v_due_date + interval '1 month';
  end if;

  insert into public.invoices (empresa_id, period_year, period_month, plan_amount, addon_amount, total_amount, due_date, status)
  values (v_empresa_id, v_period_year, v_period_month, v_plan_price, coalesce(v_addon_price, 0), v_plan_price + coalesce(v_addon_price, 0), v_due_date, 'pending')
  on conflict (empresa_id, period_year, period_month) do nothing
  returning id into v_invoice_id;

  return v_invoice_id;
end;
$$;

-- ---------- Job mensual: genera la factura del siguiente periodo ----------
create or replace function public.fn_generate_monthly_invoices()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub record;
  v_next_year int;
  v_next_month int;
  v_due_date date;
  v_addon_amount numeric(14,2);
begin
  v_next_year := extract(year from (date_trunc('month', current_date) + interval '1 month'))::int;
  v_next_month := extract(month from (date_trunc('month', current_date) + interval '1 month'))::int;
  v_due_date := make_date(v_next_year, v_next_month, 25);

  for v_sub in
    select cs.empresa_id, cs.addon_enabled, pl.price_cop as plan_price
    from public.company_subscriptions cs
    join public.plans pl on pl.id = cs.plan_id
    where cs.status = 'active' and pl.code <> 'free'
  loop
    v_addon_amount := 0;
    if v_sub.addon_enabled then
      select price_cop into v_addon_amount from public.plan_addons where code = 'automatizaciones';
    end if;

    insert into public.invoices (empresa_id, period_year, period_month, plan_amount, addon_amount, total_amount, due_date, status)
    values (v_sub.empresa_id, v_next_year, v_next_month, v_sub.plan_price, coalesce(v_addon_amount, 0), v_sub.plan_price + coalesce(v_addon_amount, 0), v_due_date, 'pending')
    on conflict (empresa_id, period_year, period_month) do nothing;
  end loop;
end;
$$;

-- ---------- Job diario: marca vencidas y suspende empresas morosas ----------
create or replace function public.fn_suspend_overdue_companies()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.invoices
  set status = 'overdue'
  where status = 'pending' and due_date < current_date;

  update public.company_subscriptions cs
  set status = 'suspended'
  where cs.status = 'active'
    and exists (
      select 1 from public.invoices i
      where i.empresa_id = cs.empresa_id
        and i.status = 'overdue'
        and i.due_date < current_date - interval '5 days'
    );

  update public.companies c
  set status = 'suspended'
  where c.status = 'active'
    and exists (
      select 1 from public.company_subscriptions cs
      where cs.empresa_id = c.id and cs.status = 'suspended'
    );
end;
$$;

-- ---------- Programación ----------
select cron.schedule(
  'h07-generar-facturas-mensuales',
  '0 6 25 * *',
  $$select public.fn_generate_monthly_invoices();$$
);

select cron.schedule(
  'h07-suspender-empresas-morosas',
  '0 7 * * *',
  $$select public.fn_suspend_overdue_companies();$$
);
