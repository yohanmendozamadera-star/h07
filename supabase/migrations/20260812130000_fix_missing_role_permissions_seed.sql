-- BUG: la migración 20260811193000 (correo de bienvenida) reescribió
-- fn_handle_new_user() completo y, sin querer, se le cayó el paso que
-- copia la plantilla global de role_permissions (empresa_id is null) a la
-- empresa nueva — el mismo paso que sí estaba en 20260805210000. Resultado:
-- toda empresa creada desde que se aplicó esa migración quedó con CERO
-- filas en role_permissions, así que su Propietario ve "No tienes permiso"
-- en absolutamente todo (permissions = [] siempre). Se restaura el paso y
-- se rellenan retroactivamente las empresas afectadas.
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_invited_company_id uuid;
  v_role_code text;
  v_role_id uuid;
  v_company_id uuid;
  v_company_name text;
  v_free_plan_id uuid;
  v_api_key text;
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

  v_company_name := coalesce(new.raw_user_meta_data ->> 'company_name', new.email);

  insert into public.companies (name, phone, owner_user_id)
  values (v_company_name, new.raw_user_meta_data ->> 'phone', new.id)
  returning id into v_company_id;

  insert into public.company_settings (empresa_id) values (v_company_id);

  -- Paso que se había perdido: copiar la plantilla global de permisos
  -- (empresa_id is null) a esta empresa nueva.
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

  begin
    select decrypted_secret into v_api_key
    from vault.decrypted_secrets
    where name = 'resend_api_key';

    if v_api_key is not null then
      perform net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_api_key
        ),
        body := jsonb_build_object(
          'from', 'H07 <noreply@h07.io>',
          'to', jsonb_build_array(new.email),
          'subject', '¡Bienvenido a H07!',
          'html', format(
            '<p>Hola,</p><p>¡Bienvenido a H07! Ya creamos <strong>%s</strong> — tienes <strong>15 días gratis</strong> con acceso completo, incluido el historial completo de pedidos, para que pruebes todo sin restricciones.</p><p>Ahora entra a la app y sigue el asistente de bienvenida para activar tus módulos de negocio y cargar tus primeros servicios.</p><p>Cualquier duda, desde Configuración encuentras el link directo a soporte.</p>',
            v_company_name
          )
        )
      );
    end if;
  exception when others then
    null;
  end;

  return new;
end;
$$;

-- Rellena retroactivamente cualquier empresa que haya quedado sin filas en
-- role_permissions (creada mientras la función estuvo rota).
insert into public.role_permissions (role_id, permission_id, empresa_id)
select rp.role_id, rp.permission_id, c.id
from public.companies c
cross join public.role_permissions rp
where rp.empresa_id is null
  and not exists (
    select 1 from public.role_permissions existing
    where existing.empresa_id = c.id
  );
