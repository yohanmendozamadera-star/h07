-- El número de soporte y el interruptor de notificaciones deben poder
-- leerse desde cualquier empresa (no solo el super admin) — es lo que usa
-- el link "Soporte" en Configuración. No es información sensible.
create policy "platform_config_select_authenticated" on public.platform_config for select
  using (auth.role() = 'authenticated');
