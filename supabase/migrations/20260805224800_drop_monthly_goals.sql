-- "Meta mensual" (una meta de ventas que el dueño tenía que inventar a
-- mano) se reemplaza por un Punto de Equilibrio calculado automáticamente
-- a partir de gastos, compras y ventas reales — ya no se necesita esta
-- tabla ni nada relacionado con ella.
drop table if exists public.monthly_goals;
