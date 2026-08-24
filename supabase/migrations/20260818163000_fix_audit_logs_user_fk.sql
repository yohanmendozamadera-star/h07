-- audit_logs.user_id referenciaba auth.users(id) sin "on delete", lo que
-- bloquea borrar una cuenta de acceso en cuanto esa persona haya hecho al
-- menos una acción auditada (crear, editar, borrar, iniciar sesión...).
-- El historial de auditoría debe sobrevivir aunque la cuenta se borre
-- (user_id queda en null), no impedir el borrado — mismo criterio ya
-- aplicado a audit_logs.empresa_id y a orders.technician_id.
alter table public.audit_logs drop constraint audit_logs_user_id_fkey;
alter table public.audit_logs
  add constraint audit_logs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
