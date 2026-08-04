-- =========================================================
-- Catálogos globales de plataforma (no llevan empresa_id, o lo
-- llevan nullable cuando aplica a una sola empresa opcionalmente).
-- =========================================================

-- Super-admin de plataforma: mecanismo GENUINAMENTE SEPARADO de los roles
-- de tenant (propietario/administrador/tecnico). Nunca se llena vía el
-- flujo normal de registro o gestión de usuarios de empresa — solo a mano
-- (SQL/consola) o desde el propio panel de plataforma por otro super-admin
-- ya existente. Esto corrige el hueco de seguridad del sistema legado,
-- donde el rol de tenant "Propietario" también daba acceso de plataforma.
create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id)
);

-- ---------- Roles de tenant ----------
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------- Permisos (código "modulo.accion", siempre en minúsculas) ----------
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  module text not null,
  description text
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- ---------- Planes de suscripción y complementos ----------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price_cop numeric(14, 2) not null default 0,
  is_active boolean not null default true
);

create table public.plan_addons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price_cop numeric(14, 2) not null default 0,
  is_active boolean not null default true
);

-- ---------- Catálogos compartidos entre empresas (globales, sin empresa_id) ----------
create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_expense_categories_name on public.expense_categories (lower(name));

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_suppliers_name on public.suppliers (lower(name));
