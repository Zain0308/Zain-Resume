create or replace function public.portfolio_admin_authorized(p_admin_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.portfolio_admin_config c
    where encode(extensions.digest(coalesce(p_admin_token, ''), 'sha256'), 'hex') = c.token_sha256
  );
$$;
revoke all on function public.portfolio_admin_authorized(text) from public, anon, authenticated;

