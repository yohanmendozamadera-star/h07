-- El webhook de Bold necesita una forma de saber si ya proceso una notificación
-- de pago (Bold reintenta hasta 5 veces si no responde 200 a tiempo), para no
-- duplicar el pago si la misma notificación llega más de una vez.
alter table public.payments add column bold_payment_id text unique;
