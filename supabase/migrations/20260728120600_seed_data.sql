-- =========================================================
-- Datos iniciales
-- =========================================================

-- ---------- Roles de tenant ----------
insert into public.roles (code, name) values
  ('propietario', 'Propietario'),
  ('administrador', 'Administrador'),
  ('tecnico', 'Técnico')
on conflict (code) do nothing;

-- ---------- Permisos por módulo ----------
insert into public.permissions (code, module, description)
select m.module || '.' || a.action, m.module, initcap(a.action) || ' - ' || m.module
from unnest(array['pedidos']) as m(module)
cross join unnest(array['view', 'create', 'edit', 'delete', 'export']) as a(action)
on conflict (code) do nothing;

insert into public.permissions (code, module, description)
select m.module || '.' || a.action, m.module, initcap(a.action) || ' - ' || m.module
from unnest(array['parqueadero']) as m(module)
cross join unnest(array['view', 'create', 'edit']) as a(action)
on conflict (code) do nothing;

insert into public.permissions (code, module, description)
select m.module || '.' || a.action, m.module, initcap(a.action) || ' - ' || m.module
from unnest(array['servicios', 'clientes']) as m(module)
cross join unnest(array['view', 'edit']) as a(action)
on conflict (code) do nothing;

insert into public.permissions (code, module, description)
select m.module || '.' || a.action, m.module, initcap(a.action) || ' - ' || m.module
from unnest(array['inventario']) as m(module)
cross join unnest(array['view', 'create', 'edit']) as a(action)
on conflict (code) do nothing;

insert into public.permissions (code, module, description)
select m.module || '.' || a.action, m.module, initcap(a.action) || ' - ' || m.module
from unnest(array['gastos']) as m(module)
cross join unnest(array['view', 'create', 'edit', 'delete']) as a(action)
on conflict (code) do nothing;

insert into public.permissions (code, module, description) values
  ('usuarios.manage', 'usuarios', 'Administrar usuarios de la empresa'),
  ('reportes.view', 'reportes', 'Ver reportes y dashboard'),
  ('configuraciones.manage', 'configuraciones', 'Administrar configuración de la empresa'),
  ('planes.view', 'planes', 'Ver plan y cartera de la empresa'),
  ('pagos.create', 'planes', 'Reportar un pago'),
  ('auditoria.view', 'auditoria', 'Ver auditoría')
on conflict (code) do nothing;

-- ---------- Propietario: todos los permisos ----------
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'propietario'
on conflict do nothing;

-- ---------- Administrador: todo excepto usuarios/configuraciones/planes/auditoría ----------
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'administrador'
  and p.code not in (
    'usuarios.manage', 'configuraciones.manage', 'planes.view', 'pagos.create', 'auditoria.view'
  )
on conflict do nothing;

-- ---------- Técnico: solo lo esencial para operar ----------
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'tecnico'
  and p.code in (
    'pedidos.view', 'pedidos.create',
    'parqueadero.view', 'parqueadero.create',
    'servicios.view',
    'clientes.view'
  )
on conflict do nothing;

-- ---------- Planes ----------
insert into public.plans (code, name, price_cop) values
  ('free', 'Free', 0),
  ('h7', 'H7', 70000)
on conflict (code) do nothing;

insert into public.plan_addons (code, name, price_cop) values
  ('automatizaciones', 'Automatizaciones', 30000)
on conflict (code) do nothing;
