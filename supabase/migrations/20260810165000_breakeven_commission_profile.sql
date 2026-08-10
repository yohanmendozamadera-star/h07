-- Punto de equilibrio presupuestado/real: el dueño registra su propio costo
-- fijo (ya sea el que presupuestó o el que sabe que paga hoy) en vez de que
-- la app le calcule un promedio automático — ver company_settings.
alter table public.company_settings
  add column budgeted_fixed_cost numeric(14, 2),
  add column budgeted_fixed_cost_updated_at timestamptz,
  add column real_fixed_cost numeric(14, 2),
  add column real_fixed_cost_updated_at timestamptz;

-- Comisión por técnico: muchos lavaderos pagan un % de cada servicio al
-- técnico que lo realizó. commission_technician_percent es SIEMPRE el % que
-- se lleva el técnico (no el del negocio) — se aclara en la UI con ejemplo.
alter table public.company_settings
  add column commission_enabled boolean not null default false,
  add column commission_technician_percent numeric(5, 2)
    check (commission_technician_percent is null or (commission_technician_percent >= 0 and commission_technician_percent <= 100));

-- Número de WhatsApp de soporte, configurado por el super admin desde el
-- panel de plataforma — usado por el link "Soporte" en Configuración.
alter table public.platform_config
  add column support_whatsapp_number text;

-- Foto de perfil del usuario.
alter table public.profiles
  add column avatar_url text;

-- Bucket público para fotos de perfil. Cada usuario solo puede escribir en
-- su propia carpeta (prefijo = su user id), pero cualquiera con el link
-- público puede ver la imagen (necesario para mostrarla en el header).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_own_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
