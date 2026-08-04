-- =========================================================
-- Generación segura de número de pedido. Atómico vía INSERT ...
-- ON CONFLICT, por lo que dos pedidos registrados al mismo tiempo en la
-- misma empresa nunca reciben el mismo número (corrige el "Date.now()" del
-- legado, que no garantizaba unicidad estricta bajo concurrencia).
-- Debe llamarse siempre desde el backend, nunca calcularse en el navegador.
-- =========================================================

create table public.order_number_sequences (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  seq_date date not null,
  channel text not null,
  last_sequence integer not null default 0,
  unique (empresa_id, seq_date, channel)
);

-- Sin políticas de cliente: solo se toca a través de generate_order_number(),
-- que corre con privilegios de definer.
alter table public.order_number_sequences enable row level security;

create or replace function public.generate_order_number(p_channel text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid := public.current_empresa_id();
  v_seq integer;
  v_prefix text;
begin
  if v_empresa_id is null then
    raise exception 'No autenticado';
  end if;

  insert into public.order_number_sequences (empresa_id, seq_date, channel, last_sequence)
  values (v_empresa_id, current_date, p_channel, 1)
  on conflict (empresa_id, seq_date, channel)
  do update set last_sequence = public.order_number_sequences.last_sequence + 1
  returning last_sequence into v_seq;

  v_prefix := case p_channel
    when 'lavanderia' then 'LAV'
    when 'productos' then 'PRO'
    when 'taller' then 'TAL'
    when 'parqueadero' then 'PARK'
    else 'ORD'
  end;

  return v_prefix || '-' || to_char(current_date, 'YYYYMMDD') || '-' || lpad(v_seq::text, 4, '0');
end;
$$;
