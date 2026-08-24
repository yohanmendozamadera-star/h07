-- Baja el precio del plan H07 de $70.000 a $49.000/mes para tomar fuerza y
-- ganar clientes en el arranque. price_cop es la única fuente de verdad del
-- precio (lo lee tanto la pantalla de Planes como la generación de
-- facturas), así que este solo UPDATE se refleja en toda la app de
-- inmediato, sin tocar ningún "link" de pago.
update public.plans set price_cop = 49000 where code = 'h7';
