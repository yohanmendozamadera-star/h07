-- IP de la impresora térmica de red usada para imprimir el tiquete al
-- registrar una entrada de parqueadero. Puerto fijo en 9100 (estándar
-- raw/JetDirect de impresoras térmicas), no se guarda como columna aparte
-- para que el cliente solo tenga que llenar un dato.
alter table public.company_settings
  add column parqueadero_printer_ip text;
