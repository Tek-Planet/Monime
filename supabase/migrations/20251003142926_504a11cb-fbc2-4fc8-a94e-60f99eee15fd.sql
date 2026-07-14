-- Create helper function to read current user's email safely
create or replace function public.authenticated_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select email from auth.users where id = auth.uid();
$$;

-- Ensure RLS is enabled (no-op if already enabled)
alter table public.organization_invitations enable row level security;

-- Drop problematic policy that queried auth.users directly
drop policy if exists "Invited users can view their invitation" on public.organization_invitations;

-- Recreate owner policy as PERMISSIVE (so it doesn't require other policies)
drop policy if exists "Business owners can manage invitations" on public.organization_invitations;
create policy "Business owners can manage invitations"
  on public.organization_invitations
  as permissive
  for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = organization_invitations.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = organization_invitations.business_id
        and b.owner_id = auth.uid()
    )
  );

-- Re-add invited-user select policy using the helper function, PERMISSIVE
create policy "Invited users can view their invitation (by email)"
  on public.organization_invitations
  as permissive
  for select
  to authenticated
  using (email = public.authenticated_user_email());