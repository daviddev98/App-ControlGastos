-- =============================================================================
-- Control de Gastos — script de recreación de Supabase
-- Ejecutar en: Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Tablas
-- -----------------------------------------------------------------------------

create table if not exists public.cuentas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  subtitle text not null default '',
  -- La app mapea: bank → 'savings' | credit_card | cash
  type text not null check (type in ('savings', 'credit_card', 'cash')),
  balance numeric(14, 2) not null default 0,
  color text not null default '#3B82F6',
  brand text null check (brand is null or brand in ('mastercard', 'visa', 'amex')),
  created_at timestamptz not null default now()
);

create index if not exists cuentas_user_id_idx on public.cuentas (user_id);

create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  merchant text not null,
  category text not null,
  bank_account text not null,
  amount numeric(14, 2) not null,
  due_date integer not null default 1,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists movimientos_user_id_idx on public.movimientos (user_id);
create index if not exists movimientos_user_date_idx on public.movimientos (user_id, date);
create index if not exists movimientos_user_bank_account_idx on public.movimientos (user_id, bank_account);

create table if not exists public.ahorros_metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  descripcion text not null default '',
  categoria text not null,
  monto_objetivo numeric(14, 2) not null check (monto_objetivo >= 0),
  monto_actual numeric(14, 2) not null default 0 check (monto_actual >= 0),
  fecha_inicio date not null,
  fecha_limite date not null,
  prioridad text not null check (prioridad in ('alta', 'media', 'baja')),
  estado text not null check (estado in ('activa', 'completada', 'pausada')),
  notas text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ahorros_metas_user_id_idx on public.ahorros_metas (user_id);

-- API de Supabase: el cliente usa el rol authenticated tras el login
grant select, insert, update, delete on table public.cuentas to authenticated;
grant select, insert, update, delete on table public.movimientos to authenticated;
grant select, insert, update, delete on table public.ahorros_metas to authenticated;

-- -----------------------------------------------------------------------------
-- 2) Row Level Security (cada usuario solo ve/edita lo suyo)
-- -----------------------------------------------------------------------------

alter table public.cuentas enable row level security;
alter table public.movimientos enable row level security;
alter table public.ahorros_metas enable row level security;

-- cuentas
drop policy if exists "cuentas_select_own" on public.cuentas;
drop policy if exists "cuentas_insert_own" on public.cuentas;
drop policy if exists "cuentas_update_own" on public.cuentas;
drop policy if exists "cuentas_delete_own" on public.cuentas;

create policy "cuentas_select_own"
  on public.cuentas for select
  using (auth.uid() = user_id);

create policy "cuentas_insert_own"
  on public.cuentas for insert
  with check (auth.uid() = user_id);

create policy "cuentas_update_own"
  on public.cuentas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cuentas_delete_own"
  on public.cuentas for delete
  using (auth.uid() = user_id);

-- movimientos
drop policy if exists "movimientos_select_own" on public.movimientos;
drop policy if exists "movimientos_insert_own" on public.movimientos;
drop policy if exists "movimientos_update_own" on public.movimientos;
drop policy if exists "movimientos_delete_own" on public.movimientos;

create policy "movimientos_select_own"
  on public.movimientos for select
  using (auth.uid() = user_id);

create policy "movimientos_insert_own"
  on public.movimientos for insert
  with check (auth.uid() = user_id);

create policy "movimientos_update_own"
  on public.movimientos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "movimientos_delete_own"
  on public.movimientos for delete
  using (auth.uid() = user_id);

-- ahorros_metas
drop policy if exists "ahorros_metas_select_own" on public.ahorros_metas;
drop policy if exists "ahorros_metas_insert_own" on public.ahorros_metas;
drop policy if exists "ahorros_metas_update_own" on public.ahorros_metas;
drop policy if exists "ahorros_metas_delete_own" on public.ahorros_metas;

create policy "ahorros_metas_select_own"
  on public.ahorros_metas for select
  using (auth.uid() = user_id);

create policy "ahorros_metas_insert_own"
  on public.ahorros_metas for insert
  with check (auth.uid() = user_id);

create policy "ahorros_metas_update_own"
  on public.ahorros_metas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ahorros_metas_delete_own"
  on public.ahorros_metas for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3) Storage: bucket público avatars (foto de perfil)
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_insert_own_folder" on storage.objects;
drop policy if exists "avatars_update_own_folder" on storage.objects;
drop policy if exists "avatars_delete_own_folder" on storage.objects;

-- Lectura pública (la app usa getPublicUrl)
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Cada usuario solo sube/actualiza/borra dentro de su carpeta: {user_id}/...
create policy "avatars_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_delete_own_folder"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
