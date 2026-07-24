alter table public.fsae_data_tickets
  alter column competition drop not null,
  alter column year drop not null,
  alter column team drop not null,
  alter column event_name drop not null;

-- New submissions require email in both the browser and Edge Function. If an
-- earlier deployment accepted rows without email, preserve those historical
-- rows instead of inventing contact data; otherwise enforce the requirement
-- at the table level too.
do $$
begin
  if not exists (
    select 1
    from public.fsae_data_tickets
    where reporter_email is null
  ) then
    alter table public.fsae_data_tickets
      alter column reporter_email set not null;
  end if;
end
$$;

comment on column public.fsae_data_tickets.reporter_email is
  'Required by the dashboard and submit-fsae-ticket Edge Function. May remain nullable only when preserving legacy rows submitted before July 23, 2026.';

