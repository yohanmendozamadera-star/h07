-- orders.technician_id referenciaba profiles(id) sin "on delete", lo que
-- bloquea el borrado de un perfil (y en cascada, de toda su empresa) en
-- cuanto ese técnico tiene al menos un pedido a su nombre. El historial de
-- ventas debe sobrevivir aunque el técnico se borre (technician_id queda en
-- null), no impedir el borrado — mismo criterio ya aplicado a
-- audit_logs.empresa_id.
alter table public.orders drop constraint orders_technician_id_fkey;
alter table public.orders
  add constraint orders_technician_id_fkey
  foreign key (technician_id) references public.profiles(id) on delete set null;
