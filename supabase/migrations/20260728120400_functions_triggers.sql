-- =========================================================
-- Funciones y triggers
-- =========================================================

-- ---------- Alta atómica de usuario/empresa al crearse en auth.users ----------
-- Dos flujos, distinguidos por raw_user_meta_data:
--  1) Registro público (nueva empresa): trae "company_name" -> crea companies +
--     company_settings + profiles (rol propietario) + suscripción Free, todo
--     en la misma transacción que el INSERT en auth.users (si algo falla, el
--     alta completa se revierte).
--  2) Invitación a empresa existente (Propietario da de alta un Técnico o
--     Administrador): trae "invited_company_id" + "role_code" -> solo crea
--     el profile, enlazado a esa empresa. Nunca crea una empresa nueva.
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invited_company_id uuid;
  v_role_code text;
  v_role_id uuid;
  v_company_id uuid;
  v_free_plan_id uuid;
begin
  v_invited_company_id := nullif(new.raw_user_meta_data ->> 'invited_company_id', '')::uuid;

  if v_invited_company_id is not null then
    v_role_code := coalesce(new.raw_user_meta_data ->> 'role_code', 'tecnico');
    select id into v_role_id from public.roles where code = v_role_code;

    insert into public.profiles (id, empresa_id, full_name, email, phone, role_id)
    values (
      new.id,
      v_invited_company_id,
      coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
      new.email,
      new.raw_user_meta_data ->> 'phone',
      v_role_id
    )
    on conflict (id) do nothing;

    return new;
  end if;

  insert into public.companies (name, phone, owner_user_id)
  values (
    coalesce(new.raw_user_meta_data ->> 'company_name', new.email),
    new.raw_user_meta_data ->> 'phone',
    new.id
  )
  returning id into v_company_id;

  insert into public.company_settings (empresa_id) values (v_company_id);

  select id into v_role_id from public.roles where code = 'propietario';

  insert into public.profiles (id, empresa_id, full_name, email, phone, role_id)
  values (
    new.id,
    v_company_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    v_role_id
  );

  select id into v_free_plan_id from public.plans where code = 'free';

  insert into public.company_subscriptions (empresa_id, plan_id, status, effective_from)
  values (v_company_id, v_free_plan_id, 'active', now());

  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.fn_handle_new_user();

-- ---------- Sello de auditoría (created_by/updated_by/timestamps) ----------
create or replace function public.fn_set_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_at := now();
    new.updated_by := auth.uid();
  elsif TG_OP = 'UPDATE' then
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

-- ---------- updated_at simple para catálogos/configuración ----------
create or replace function public.fn_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Bitácora de auditoría genérica ----------
-- Extrae empresa_id del propio registro (vía jsonb) para que sirva tanto en
-- tablas de tenant como, si empresa_id es null, en acciones de plataforma.
create or replace function public.fn_audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_module text := TG_ARGV[0];
  v_empresa_id uuid;
begin
  if TG_OP = 'DELETE' then
    v_empresa_id := (to_jsonb(old) ->> 'empresa_id')::uuid;
  else
    v_empresa_id := (to_jsonb(new) ->> 'empresa_id')::uuid;
  end if;

  if TG_OP = 'INSERT' then
    insert into public.audit_logs (empresa_id, user_id, action, module, record_id, old_data, new_data)
    values (v_empresa_id, auth.uid(), 'create', v_module, new.id, null, to_jsonb(new));
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_logs (empresa_id, user_id, action, module, record_id, old_data, new_data)
    values (v_empresa_id, auth.uid(), 'update', v_module, new.id, to_jsonb(old), to_jsonb(new));
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_logs (empresa_id, user_id, action, module, record_id, old_data, new_data)
    values (v_empresa_id, auth.uid(), 'delete', v_module, old.id, to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

-- ---------- Aplicar sello de auditoría (created_by/updated_by) ----------
-- Solo a las tablas que tienen ambas columnas.
do $$
declare
  t text;
begin
  foreach t in array array['clients', 'catalog_items', 'orders', 'expenses', 'parking_movements']
  loop
    execute format(
      'drop trigger if exists trg_%1$s_audit_fields on public.%1$I;
       create trigger trg_%1$s_audit_fields
       before insert or update on public.%1$I
       for each row execute function public.fn_set_audit_fields();',
      t
    );
  end loop;
end;
$$;

-- ---------- Aplicar updated_at automático ----------
do $$
declare
  t text;
begin
  foreach t in array array[
    'companies', 'company_settings', 'profiles', 'parking_rates',
    'order_workshop_details', 'company_subscriptions', 'invoices',
    'payment_links', 'platform_banner', 'expense_categories', 'suppliers'
  ]
  loop
    execute format(
      'drop trigger if exists trg_%1$s_touch_updated_at on public.%1$I;
       create trigger trg_%1$s_touch_updated_at
       before update on public.%1$I
       for each row execute function public.fn_touch_updated_at();',
      t
    );
  end loop;
end;
$$;

-- ---------- Aplicar bitácora de auditoría (audit_logs) ----------
-- A toda tabla de negocio con id + empresa_id, para trazabilidad amplia
-- (el legado solo auditaba un subconjunto de acciones sensibles).
do $$
declare
  t text;
begin
  foreach t in array array[
    'clients', 'catalog_items', 'parking_rates', 'orders', 'order_items',
    'parking_movements', 'purchases', 'shrinkages', 'expenses',
    'company_subscriptions', 'invoices', 'payments', 'payment_links'
  ]
  loop
    execute format(
      'drop trigger if exists trg_%1$s_audit_log on public.%1$I;
       create trigger trg_%1$s_audit_log
       after insert or update or delete on public.%1$I
       for each row execute function public.fn_audit_trigger(%1$L);',
      t
    );
  end loop;
end;
$$;
