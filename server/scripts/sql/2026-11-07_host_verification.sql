-- Government ID check for hosts (Nov 7 2026). Safe to run more than once.
--
-- Every new host verifies with DigiLocker (Aadhaar) before hosting. We keep
-- the verified name, birth year, gender and last 4 digits only. The identity
-- hash stops one Aadhaar verifying a second account, without storing it.

BEGIN;

CREATE TABLE IF NOT EXISTS public.host_verifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  verification_id text NOT NULL,
  reference_id bigint,
  status text DEFAULT 'pending' NOT NULL,
  -- Only used by the local test page (KYC_MOCK).
  mock_status text,
  failure_reason text,
  aadhaar_name text,
  birth_year integer,
  gender text,
  aadhaar_last4 text,
  identity_hash text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  verified_at timestamp with time zone,
  CONSTRAINT host_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT host_verifications_verification_id_key UNIQUE (verification_id),
  CONSTRAINT host_verifications_status_check CHECK (status IN ('pending', 'verified', 'failed', 'expired', 'denied')),
  CONSTRAINT host_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_host_verifications_user ON public.host_verifications (user_id, created_at DESC);
-- One Aadhaar, one verified account.
CREATE UNIQUE INDEX IF NOT EXISTS idx_host_verifications_identity ON public.host_verifications (identity_hash) WHERE status = 'verified';

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_verified_at timestamp with time zone;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_verified_name text;

COMMIT;
