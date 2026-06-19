-- Migration: Karten-Tabelle für Fußball-Sammelkarten-Katalog
-- Ausführen in Supabase SQL Editor

create table if not exists public.cards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  player_name text not null,
  team        text not null,
  year        integer not null check (year >= 1800 and year <= 2100),
  condition   text not null check (condition in ('mint','near_mint','excellent','good','poor')),
  rookie_card boolean not null default false,
  purchase_price numeric(10,2),
  current_value numeric(10,2),
  notes       text,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- Jede Zeile gehört dem authentifizierten User
alter table public.cards enable row level security;

create policy "Eigene Karten lesen"
  on public.cards for select
  using (auth.uid() = user_id);

create policy "Eigene Karten anlegen"
  on public.cards for insert
  with check (auth.uid() = user_id);

create policy "Eigene Karten bearbeiten"
  on public.cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Eigene Karten löschen"
  on public.cards for delete
  using (auth.uid() = user_id);
