-- Host ID check by PAN, reviewed by an admin (Nov 14 2026). Safe to run more than once.
--
-- A host types their PAN; Surepass returns what the Income Tax records say
-- (name, date of birth, gender, masked Aadhaar). We compare it with their
-- profile and an admin approves or rejects. We keep the PAN masked plus a
-- one-way hash (to stop one PAN verifying two accounts), never in full.
-- Replaces the DigiLocker flow from 2026-11-07_host_verification.sql.

BEGIN;

ALTER TABLE public.host_verifications DROP CONSTRAINT IF EXISTS host_verifications_status_check;
ALTER TABLE public.host_verifications ADD CONSTRAINT host_verifications_status_check
  CHECK (status IN ('review', 'verified', 'rejected', 'failed', 'pending', 'expired', 'denied'));
ALTER TABLE public.host_verifications ALTER COLUMN status SET DEFAULT 'review';

ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS id_type text DEFAULT 'pan' NOT NULL;
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS id_masked text;
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS masked_aadhaar text;
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS aadhaar_linked boolean;
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS category text;
-- How the PAN compares with their profile: {"name": "match", "dob": "mismatch", "gender": "match"}.
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS matches jsonb;
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;
ALTER TABLE public.host_verifications ADD COLUMN IF NOT EXISTS review_note text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'host_verifications_reviewed_by_fkey') THEN
    ALTER TABLE public.host_verifications ADD CONSTRAINT host_verifications_reviewed_by_fkey
      FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id) ON DELETE SET NULL;
  END IF;
  -- The DigiLocker-only columns, while nothing has used them yet.
  IF NOT EXISTS (SELECT 1 FROM public.host_verifications) THEN
    ALTER TABLE public.host_verifications DROP COLUMN IF EXISTS mock_status;
    ALTER TABLE public.host_verifications DROP COLUMN IF EXISTS aadhaar_name;
    ALTER TABLE public.host_verifications DROP COLUMN IF EXISTS birth_year;
    ALTER TABLE public.host_verifications DROP COLUMN IF EXISTS aadhaar_last4;
  END IF;
END $$;

-- One PAN, one host: while it's being reviewed and once approved.
DROP INDEX IF EXISTS public.idx_host_verifications_identity;
CREATE UNIQUE INDEX IF NOT EXISTS idx_host_verifications_identity
  ON public.host_verifications (identity_hash) WHERE status IN ('review', 'verified');
-- The admin queue.
CREATE INDEX IF NOT EXISTS idx_host_verifications_status ON public.host_verifications (status, created_at DESC);

COMMIT;
