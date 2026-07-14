-- Store branch assignment on invitations so invited users keep branch restrictions
ALTER TABLE public.organization_invitations
ADD COLUMN IF NOT EXISTS branch_id UUID NULL;

-- Add foreign key for branch assignment integrity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organization_invitations_branch_id_fkey'
  ) THEN
    ALTER TABLE public.organization_invitations
    ADD CONSTRAINT organization_invitations_branch_id_fkey
    FOREIGN KEY (branch_id) REFERENCES public.branches(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Helpful index for invitation acceptance lookups
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email_status
ON public.organization_invitations(email, status);