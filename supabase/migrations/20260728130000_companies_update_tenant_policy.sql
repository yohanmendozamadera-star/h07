-- Faltaba una política de UPDATE para que la propia empresa pueda marcar su
-- onboarding como completo (y, más adelante, editar su nombre/celular desde
-- Configuraciones). Antes de esto solo el panel de plataforma podía
-- actualizar companies.
create policy "companies_update_tenant" on public.companies
  for update using (id = public.current_empresa_id() and public.has_permission('configuraciones.manage'))
  with check (id = public.current_empresa_id() and public.has_permission('configuraciones.manage'));
