-- Correo de bienvenida: se envía una sola vez, al crear una empresa nueva
-- por registro público (nunca cuando es una invitación a una empresa ya
-- existente). Mismo patrón que los avisos de pago: pg_net directo hacia
-- Resend, llave leída de Supabase Vault, no bloquea el alta si falla.
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
    -- Un fallo enviando el correo de bienvenida nunca debe tumbar el alta
    -- de la empresa/usuario.
    null;
  end;

  return new;
end;
$$;

-- Aviso de que la prueba gratis de 15 días está por vencer: se envía una
-- sola vez por empresa, 3 días antes del corte (día 12 desde su creación),
-- y solo si todavía no tiene un plan pago real activo.
create or replace function public.fn_send_trial_expiry_reminders()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_api_key text;
  v_rec record;
begin
  select decrypted_secret into v_api_key
  from vault.decrypted_secrets
  where name = 'resend_api_key';

  if v_api_key is null then
    return;
  end if;

  for v_rec in
    select c.id as empresa_id, c.name as company_name, p.email as owner_email
    from public.companies c
    join public.profiles p on p.id = c.owner_user_id
    where c.created_at::date = (current_date - 12)
      and not exists (
        select 1
        from public.company_subscriptions cs
        join public.plans pl on pl.id = cs.plan_id
        where cs.empresa_id = c.id
          and cs.status = 'active'
          and pl.code <> 'free'
      )
  loop
    perform net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_api_key
      ),
      body := jsonb_build_object(
        'from', 'H07 <noreply@h07.io>',
        'to', jsonb_build_array(v_rec.owner_email),
        'subject', 'Tu prueba gratis de H07 termina en 3 días',
        'html', format(
          '<p>Hola,</p><p>Tu prueba gratis de 15 días con <strong>%s</strong> termina en 3 días. Después de eso, el historial completo de pedidos y otros beneficios quedan disponibles solo con un plan pago (H07 o Premium).</p><p>Si ya te está sirviendo H07, puedes cambiar de plan en cualquier momento desde Planes, dentro de la app.</p>',
          v_rec.company_name
        )
      )
    );
  end loop;
end;
$$;

select cron.schedule(
  'h07-avisos-prueba-gratis',
  '0 9 * * *',
  $$select public.fn_send_trial_expiry_reminders();$$
);
