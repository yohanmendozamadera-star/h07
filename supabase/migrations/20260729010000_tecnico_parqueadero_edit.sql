-- Cerrar un movimiento de parqueadero (registrar salida + cobrar) es parte
-- de la operación diaria de un Técnico, no una edición administrativa —
-- necesita parqueadero.edit además de .view/.create para poder actualizar
-- la fila de parking_movements (abierto -> cerrado) bajo RLS.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'tecnico' and p.code = 'parqueadero.edit'
on conflict do nothing;
