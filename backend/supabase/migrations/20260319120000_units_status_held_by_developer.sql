-- Allow "Held by Developer" listing state (matches frontend Unit status union).
alter table public.units drop constraint if exists units_status_check;
alter table public.units add constraint units_status_check
  check (status in ('Available', 'Reserved', 'Sold', 'Held by Developer'));
