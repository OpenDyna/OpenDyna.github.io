grant usage on schema public to service_role;

grant select, insert, update
  on table public.fsae_data_tickets
  to service_role;
