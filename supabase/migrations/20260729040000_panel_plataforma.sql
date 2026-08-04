-- =========================================================
-- Panel de administración de plataforma.
-- =========================================================

-- El panel necesita ver quién es el dueño de cada empresa (nombre/correo).
-- La política de profiles existente solo deja ver el propio perfil o los de
-- la propia empresa (con usuarios.manage) — se agrega un camino SEPARADO Y
-- EXPLÍCITO para plataforma, igual que en companies/invoices/payments.
create policy "profiles_select_platform" on public.profiles
  for select using (public.is_platform_admin());

-- ---------- platform_set_plan: cambiar el plan de CUALQUIER empresa ----------
-- A diferencia de activate_paid_plan() (que actúa sobre la propia empresa
-- del que llama), esta función recibe la empresa como parámetro — por eso
-- valida is_platform_admin() explícitamente, no current_empresa_id().
create or replace function public.platform_set_plan(p_empresa_id uuid, p_plan_code text, p_addon_enabled boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'No autorizado';
  end if;

  select id into v_plan_id from public.plans where code = p_plan_code and is_active;
  if v_plan_id is null then
    raise exception 'Plan no encontrado: %', p_plan_code;
  end if;

  update public.company_subscriptions
  set status = 'cancelled', effective_to = now()
  where empresa_id = p_empresa_id and status = 'active';

  insert into public.company_subscriptions (empresa_id, plan_id, addon_enabled, status, effective_from)
  values (p_empresa_id, v_plan_id, p_addon_enabled, 'active', now());
end;
$$;
