-- Añade el país de la empresa: hasta ahora H07 solo soportaba negocios en
-- Colombia (moneda y huso horario fijos en el código). El listado de países
-- soportados vive en lib/locale/countries.ts — este check constraint debe
-- mantenerse en sync manualmente con esa lista cada vez que se agregue un
-- país nuevo. El default deja todas las empresas existentes en Colombia,
-- que es el país en el que operaban de todas formas.
alter table public.companies
  add column country_code text not null default 'CO'
  check (country_code in ('MX', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'DO', 'CO', 'VE', 'EC', 'PE', 'BO', 'PY', 'UY', 'AR', 'CL'));
