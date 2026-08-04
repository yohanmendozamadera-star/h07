-- audit_logs.empresa_id referenciaba companies(id) sin "on delete", lo que
-- bloquea para siempre cualquier borrado de una empresa (violación de FK)
-- en cuanto existe al menos una fila de auditoría suya. El historial de
-- auditoría debe sobrevivir aunque la empresa se borre (empresa_id queda en
-- null), no impedir el borrado.
alter table public.audit_logs drop constraint audit_logs_empresa_id_fkey;
alter table public.audit_logs
  add constraint audit_logs_empresa_id_fkey
  foreign key (empresa_id) references public.companies(id) on delete set null;
