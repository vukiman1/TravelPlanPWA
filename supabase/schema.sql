-- Trip Budget schema.
-- No auth: access is gated by an unguessable trip UUID, so RLS policies are
-- permissive for the anon role. Do not store sensitive data in these tables.

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Chuyến đi của tôi',
  total_budget numeric not null default 0,
  day_count integer not null default 1,
  start_date date,
  currency text not null default 'VND',
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_number integer not null default 1,
  time text not null default '08:00',
  activity text not null default '',
  category text not null default 'other',
  planned_amount numeric not null default 0,
  actual_amount numeric,
  status text not null default 'unpaid',
  note text not null default '',
  sort_order bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists items_trip_id_idx on public.items (trip_id);

alter table public.trips enable row level security;
alter table public.items enable row level security;

drop policy if exists "anon full access trips" on public.trips;
drop policy if exists "anon full access items" on public.items;

create policy "anon full access trips" on public.trips
  for all to anon using (true) with check (true);

create policy "anon full access items" on public.items
  for all to anon using (true) with check (true);

grant usage on schema public to anon;
grant select, insert, update, delete on public.trips to anon;
grant select, insert, update, delete on public.items to anon;
