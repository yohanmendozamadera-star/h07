-- H07 no emite facturas (documento tributario formal) — solo cobra por una
-- orden/suscripción pagada. Corrige el texto de los correos de recordatorio
-- para que no diga "factura" en ningún lado (misma lógica, solo redacción).
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
  update public.invoices
  set status = 'overdue'
  where status = 'pending' and due_date < current_date;

  select decrypted_secret into v_api_key
  from vault.decrypted_secrets
  where name = 'resend_api_key';

  if v_api_key is null then
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
      v_subject := 'Tu cobro de H07 vence hoy';
      v_html := format(
        '<p>Hola,</p><p>El cobro de <strong>%s</strong> por <strong>$%s</strong> (periodo del %s al %s) vence hoy. Puedes pagarlo desde el panel de Planes en H07.</p>',
        v_rec.company_name, to_char(v_rec.total_amount, 'FM999G999G999'),
        to_char(v_period_start, 'DD/MM/YYYY'), to_char(v_period_end, 'DD/MM/YYYY')
      );
      update public.invoices set reminder_due_sent = true where id = v_rec.id;

    elsif v_days_overdue = 2 and not v_rec.reminder_2d_sent then
      v_subject := 'Tu cobro de H07 sigue pendiente (2 días de atraso)';
      v_html := format(
        '<p>Hola,</p><p>El cobro de <strong>%s</strong> por <strong>$%s</strong> lleva 2 días vencido. Ponte al día desde Planes en H07 para evitar interrupciones.</p>',
        v_rec.company_name, to_char(v_rec.total_amount, 'FM999G999G999')
      );
      update public.invoices set reminder_2d_sent = true where id = v_rec.id;

    elsif v_days_overdue = 5 and not v_rec.reminder_5d_sent then
      v_subject := 'Última oportunidad antes de bloquear Toma Pedidos';
      v_html := format(
        '<p>Hola,</p><p>El cobro de <strong>%s</strong> por <strong>$%s</strong> lleva 5 días vencido. Si no se paga mañana, el módulo de Toma Pedidos se bloqueará temporalmente hasta que se registre el pago.</p>',
        v_rec.company_name, to_char(v_rec.total_amount, 'FM999G999G999')
      );
      update public.invoices set reminder_5d_sent = true where id = v_rec.id;

    elsif v_days_overdue >= 6 and not v_rec.reminder_blocked_sent then
      v_subject := 'Toma Pedidos se bloqueó por falta de pago';
      v_html := format(
        '<p>Hola,</p><p>El cobro de <strong>%s</strong> por <strong>$%s</strong> sigue sin pagarse. El módulo de Toma Pedidos quedó bloqueado hasta que se registre el pago — el resto de la aplicación sigue funcionando con normalidad.</p>',
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
