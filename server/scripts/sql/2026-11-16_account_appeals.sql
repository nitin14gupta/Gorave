-- Appealing a locked account (Nov 16 2026). Safe to run more than once.
--
-- A locked person confirms their number with a code, takes a live selfie and
-- says what happened. An admin compares the selfie with their profile photos
-- and unlocks or keeps it locked. One appeal per lock, and once an appeal is
-- turned down the decision is final: no more appeals, ever.

BEGIN;

CREATE TABLE IF NOT EXISTS public.account_appeals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  -- The lock being appealed, as it was when they appealed.
  lock_reason text,
  locked_at timestamp with time zone,
  reason text NOT NULL,
  message text NOT NULL,
  -- Private bucket only; shown to admins through a short-lived link.
  selfie_key text NOT NULL,
  status text DEFAULT 'review' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_note text,
  CONSTRAINT account_appeals_pkey PRIMARY KEY (id),
  CONSTRAINT account_appeals_status_check CHECK (status IN ('review', 'unlocked', 'denied')),
  CONSTRAINT account_appeals_reason_check CHECK (reason IN ('not_me', 'someone_else', 'sorry')),
  CONSTRAINT account_appeals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT account_appeals_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id) ON DELETE SET NULL
);

-- One appeal per lock.
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_appeals_lock ON public.account_appeals (user_id, locked_at);
CREATE INDEX IF NOT EXISTS idx_account_appeals_status ON public.account_appeals (status, created_at);

COMMIT;
