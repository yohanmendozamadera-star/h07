-- Un log de auditoría no debe imponer integridad referencial hacia adelante:
-- "on delete set null" solo corrige filas YA existentes cuando se borra una
-- empresa, pero un trigger de auditoría que corre DURANTE el borrado en
-- cascada (ej. al eliminar company_subscriptions de una empresa que ya se
-- borró) sigue intentando insertar una fila nueva apuntando a un empresa_id
-- que ya no existe, y eso vuelve a violar la FK. La solución estándar para
-- tablas de bitácora es no forzar FK en absoluto: el dato histórico debe
-- sobrevivir siempre, incluso si la empresa referenciada ya no existe.
alter table public.audit_logs drop constraint audit_logs_empresa_id_fkey;
