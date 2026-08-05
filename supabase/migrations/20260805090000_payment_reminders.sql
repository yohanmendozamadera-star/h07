-- Recordatorios de pago escalonados (día del vencimiento, +2 días, +5 días) y
-- reemplazo de la suspensión total de la empresa por un bloqueo puntual del
-- módulo de Toma Pedidos al día 6 de mora (el resto de la app sigue
-- funcionando normalmente — decisión explícita del negocio, no un descuido).
--
-- Los correos se envían directo desde Postgres vía pg_net hacia la API de
-- Resend, sin pasar por la app — evita depender de un endpoint HTTP propio
-- (y de tener que exponerlo sin autenticación de sesión). La llave de Resend
-- se guarda en Supabase Vault (nunca en una migración versionada en git,
-- este repo es público) — ver instrucciones aparte para insertarla una vez.

alter table public.invoices
  add column if not exists reminder_due_sent boolean not null default false,
  add column if not exists reminder_2d_sent boolean not null default false,
  add column if not exists reminder_5d_sent boolean not null default false,
  add column if not exists reminder_blocked_sent boolean not null default false;

create extension if not exists pg_net with schema extensions;

create or replace function public.fn_send_payment_reminders()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_api_key text;
  v_rec record;
  v_days_overdue int;
  v_period_start date;
  v_period_end date;
  v_subject text;
  v_html text;
begin
  -- Marca vencidas las facturas pendientes cuya fecha límite ya pasó (esto sí
  -- se mantiene igual que antes).
  update public.invoices
  set status = 'overdue'
  where status = 'pending' and due_date < current_date;

  select decrypted_secret into v_api_key
  from vault.decrypted_secrets
  where name = 'resend_api_key';

  if v_api_key is null then
    -- Sin llave configurada en Vault no se puede enviar nada — no rompe el
    -- resto del job (el marcado de vencidas de arriba ya corrió).
    return;
  end if;

  for v_rec in
    select
      i.id, i.due_date, i.total_amount,
      i.reminder_due_sent, i.reminder_2d_sent, i.reminder_5d_sent, i.reminder_blocked_sent,
      c.name as company_name, p.email as owner_email
    from public.invoices i
    join public.companies c on c.id = i.empresa_id
    join public.profiles p on p.id = c.owner_user_id
    where i.status in ('pending', 'overdue')
      and i.due_date <= current_date
  loop
    v_days_overdue := current_date - v_rec.due_date;
    v_period_start := v_rec.due_date;
    v_period_end := (v_rec.due_date + interval '1 month' - interval '1 day')::date;
    v_subject := null;
    v_html := null;

    if v_days_overdue = 0 and not v_rec.reminder_due_sent then
      v_subject := 'Tu factura de H07 vence hoy';
      v_html := format(
        '<p>Hola,</p><p>La factura de <strong>%s</strong> por <strong>$%s</strong> (periodo del %s al %s) vence hoy. Puedes pagarla desde el panel de Planes en H07.</p>',
        v_rec.company_name, to_char(v_rec.total_amount, 'FM999G999G999'),
        to_char(v_period_start, 'DD/MM/YYYY'), to_char(v_period_end, 'DD/MM/YYYY')
      );
      update public.invoices set reminder_due_sent = true where id = v_rec.id;

    elsif v_days_overdue = 2 and not v_rec.reminder_2d_sent then
      v_subject := 'Tu factura de H07 sigue pendiente (2 días de atraso)';
      v_html := format(
        '<p>Hola,</p><p>La factura de <strong>%s</strong> por <strong>$%s</strong> lleva 2 días vencida. Ponla al día desde Planes en H07 para evitar interrupciones.</p>',
        v_rec.company_name, to_char(v_rec.total_amount, 'FM999G999G999')
      );
      update public.invoices set reminder_2d_sent = true where id = v_rec.id;

    elsif v_days_overdue = 5 and not v_rec.reminder_5d_sent then
      v_subject := 'Última oportunidad antes de bloquear Toma Pedidos';
      v_html := format(
        '<p>Hola,</p><p>La factura de <strong>%s</strong> por <strong>$%s</strong> lleva 5 días vencida. Si no se paga mañana, el módulo de Toma Pedidos se bloqueará temporalmente hasta que se registre el pago.</p>',
        v_rec.company_name, to_char(v_rec.total_amount, 'FM999G999G999')
      );
      update public.invoices set reminder_5d_sent = true where id = v_rec.id;

    elsif v_days_overdue >= 6 and not v_rec.reminder_blocked_sent then
      v_subject := 'Toma Pedidos se bloqueó por falta de pago';
      v_html := format(
        '<p>Hola,</p><p>La factura de <strong>%s</strong> por <strong>$%s</strong> sigue sin pagarse. El módulo de Toma Pedidos quedó bloqueado hasta que se registre el pago — el resto de la aplicación sigue funcionando con normalidad.</p>',
        v_rec.company_name, to_char(v_rec.total_amount, 'FM999G999G999')
      );
      update public.invoices set reminder_blocked_sent = true where id = v_rec.id;
    end if;

    if v_subject is not null then
      perform net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_api_key
        ),
        body := jsonb_build_object(
          'from', 'H07 <noreply@h07.io>',
          'to', jsonb_build_array(v_rec.owner_email),
          'subject', v_subject,
          'html', v_html
        )
      );
    end if;
  end loop;
end;
$$;

-- Reemplaza el job anterior (suspendía toda la empresa) por este.
select cron.unschedule('h07-suspender-empresas-morosas');
drop function if exists public.fn_suspend_overdue_companies();

select cron.schedule(
  'h07-avisos-pago',
  '0 8 * * *',
  $$select public.fn_send_payment_reminders();$$
);
