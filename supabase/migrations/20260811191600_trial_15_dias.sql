-- Prueba gratis de 15 días: durante ese periodo, cualquier empresa nueva
-- (aunque siga en el plan Free) tiene acceso completo a los beneficios de
-- los planes pagos (hoy: Pedidos Históricos completo) — pasado ese tiempo,
-- si no tiene un plan pago activo, vuelve a las restricciones normales del
-- plan Free. Esta función es el único punto de verdad que usa toda la app
-- (Pedidos Históricos, su exportación, el aviso en Toma Pedidos y el menú
-- lateral), así que el cambio aquí basta para que todo se comporte bien.
create or replace function public.has_active_plan(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.company_subscriptions cs
      join public.plans pl on pl.id = cs.plan_id
      where cs.empresa_id = p_empresa_id
        and cs.status = 'active'
        and pl.code <> 'free'
    )
    or exists (
      select 1
      from public.companies c
      where c.id = p_empresa_id
        and c.created_at > now() - interval '15 days'
    );
$$;
