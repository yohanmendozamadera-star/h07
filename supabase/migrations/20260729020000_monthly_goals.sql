-- Meta mensual: costo fijo + margen (%) + meta de ventas ($), un registro
-- "vivo" por empresa (se actualiza, no se guarda historial mes a mes),
-- igual de simple que el legado.
create table public.monthly_goals (
  empresa_id uuid primary key references public.companies(id) on delete cascade,
  fixed_cost numeric(14, 2) not null default 0,
  margin_percent numeric(5, 2) not null default 0,
  goal_amount numeric(14, 2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.monthly_goals enable row level security;

-- No hay un permiso reportes.edit separado en el catálogo: quien puede ver
-- reportes (Propietario/Administrador) también puede fijar la meta.
create policy "monthly_goals_select" on public.monthly_goals
  for select using (empresa_id = public.current_empresa_id() and public.has_permission('reportes.view'));

create policy "monthly_goals_insert" on public.monthly_goals
  for insert with check (empresa_id = public.current_empresa_id() and public.has_permission('reportes.view'));

create policy "monthly_goals_update" on public.monthly_goals
  for update using (empresa_id = public.current_empresa_id() and public.has_permission('reportes.view'))
  with check (empresa_id = public.current_empresa_id() and public.has_permission('reportes.view'));

create trigger trg_monthly_goals_touch_updated_at
before update on public.monthly_goals
for each row execute function public.fn_touch_updated_at();
