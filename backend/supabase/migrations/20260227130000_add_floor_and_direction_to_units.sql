alter table public.units
  add column if not exists floor text,
  add column if not exists direction text;

