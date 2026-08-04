-- Configuración global de plataforma (fila única). Primer uso: interruptor
-- maestro para las notificaciones automáticas por WhatsApp del plan Premium,
-- apagado por defecto hasta que se conecte un proveedor real (Meta Cloud API,
-- Twilio, etc.) — permite dejar el código de envío listo sin que se dispare
-- nada hasta que el super administrador lo active a propósito.
create table public.platform_config (
  id smallint primary key default 1 check (id = 1),
  whatsapp_notifications_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.platform_config (id) values (1);

alter table public.platform_config enable row level security;

create policy "platform_config_select_platform" on public.platform_config for select
  using (public.is_platform_admin());

create policy "platform_config_update_platform" on public.platform_config for update
  using (public.is_platform_admin()) with check (public.is_platform_admin());
