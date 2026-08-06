-- Hasta ahora role_permissions era una tabla global: los permisos de
-- "Administrador"/"Técnico" eran los mismos para TODAS las empresas de H07.
-- El propietario quiere poder decidir qué puede hacer cada rol EN SU
-- empresa, sin afectar a las demás — role_permissions pasa a ser propia de
-- cada empresa (empresa_id). Las filas con empresa_id null quedan como la
-- plantilla base que se copia a cada empresa nueva en el signup.

alter table public.role_permissions add column if not exists empresa_id uuid references public.companies(id) on delete cascade;

-- La PK original era (role_id, permission_id) sola — hay que quitarla ANTES
-- de insertar las copias por empresa, porque de lo contrario cualquier
-- segunda fila con el mismo (role_id, permission_id) (aunque sea de otra
-- empresa) choca contra esa restricción vieja.
alter table public.role_permissions drop constraint if exists role_permissions_pkey;

-- Copia la plantilla global (empresa_id null) a cada empresa que ya existe,
-- para que nadie pierda sus permisos actuales al activar este cambio.
insert into public.role_permissions (role_id, permission_id, empresa_id)
select rp.role_id, rp.permission_id, c.id
from public.role_permissions rp
cross join public.companies c
where rp.empresa_id is null;

create unique index if not exists uq_role_permissions_empresa_role_permission
  on public.role_permissions (empresa_id, role_id, permission_id);
create unique index if not exists uq_role_permissions_template_role_permission
  on public.role_permissions (role_id, permission_id) where empresa_id is null;

create index if not exists idx_role_permissions_empresa_id on public.role_permissions (empresa_id);

-- has_permission ahora exige que el permiso esté asignado dentro de la
-- MISMA empresa del usuario, no en cualquier fila global.
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
    join public.role_permissions rp on rp.role_id = p.role_id and rp.empresa_id = p.empresa_id
    join public.permissions perm on perm.id = rp.permission_id
    where p.id = auth.uid()
      and perm.code = p_code
      and p.is_active = true
  );
$$;

-- Al crear una empresa nueva, copia la plantilla global a role_permissions
-- de esa empresa (antes no hacía falta, porque todo era una sola tabla
-- compartida).
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

  insert into public.role_permissions (role_id, permission_id, empresa_id)
  select rp.role_id, rp.permission_id, v_company_id
  from public.role_permissions rp
  where rp.empresa_id is null;

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

-- Solo lectura de la propia empresa (antes cualquier usuario logueado veía
-- la tabla completa, sin distinguir empresas).
drop policy if exists "role_permissions_select" on public.role_permissions;
create policy "role_permissions_select_tenant" on public.role_permissions for select
  using (empresa_id = public.current_empresa_id());

-- Solo quien tenga usuarios.manage puede editar, y nunca sobre el rol
-- Propietario (ese permiso siempre es todo, no se toca desde esta pantalla).
create policy "role_permissions_write_tenant" on public.role_permissions for all
  using (
    empresa_id = public.current_empresa_id()
    and public.has_permission('usuarios.manage')
    and role_id <> (select id from public.roles where code = 'propietario')
  )
  with check (
    empresa_id = public.current_empresa_id()
    and public.has_permission('usuarios.manage')
    and role_id <> (select id from public.roles where code = 'propietario')
  );
