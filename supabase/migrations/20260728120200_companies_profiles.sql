-- =========================================================
-- companies: raíz de cada tenant. company_settings: configuración
-- 1:1 (módulos activos, tolerancia de parqueadero). profiles: extiende
-- auth.users con nombre, rol y empresa.
-- =========================================================

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  owner_user_id uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active', 'suspended')),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_companies_owner on public.companies (owner_user_id);

-- Tolerancia de parqueadero: única regla de negocio (con gracia), vive aquí
-- como configuración de la empresa, no duplicada en ninguna otra tabla.
create table public.company_settings (
  empresa_id uuid primary key references public.companies(id) on delete cascade,
  lavanderia_enabled boolean not null default true,
  inventario_enabled boolean not null default false,
  taller_enabled boolean not null default false,
  parqueadero_enabled boolean not null default false,
  require_technician_on_invoice boolean not null default false,
  show_numeric_keypad boolean not null default false,
  parking_grace_minutes integer not null default 10
    check (parking_grace_minutes >= 0 and parking_grace_minutes <= 1440),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role_id uuid not null references public.roles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_empresa_id on public.profiles (empresa_id);
create index idx_profiles_role_id on public.profiles (role_id);
