-- Acting on reports about people and events (Nov 16 2026). Safe to run more than once.
--
-- Reports are open until an admin acts on the person or event they're about.
-- One decision closes every open report on it, and says what was done.

BEGIN;

ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS resolved_by uuid;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS resolution text;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS resolution_note text;

ALTER TABLE public.event_reports ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;
ALTER TABLE public.event_reports ADD COLUMN IF NOT EXISTS resolved_by uuid;
ALTER TABLE public.event_reports ADD COLUMN IF NOT EXISTS resolution text;
ALTER TABLE public.event_reports ADD COLUMN IF NOT EXISTS resolution_note text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_reports_resolved_by_fkey') THEN
    ALTER TABLE public.user_reports ADD CONSTRAINT user_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.admin_users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_reports_resolution_check') THEN
    ALTER TABLE public.user_reports ADD CONSTRAINT user_reports_resolution_check CHECK (resolution IS NULL OR resolution IN ('dismissed', 'warned', 'locked'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_reports_resolved_by_fkey') THEN
    ALTER TABLE public.event_reports ADD CONSTRAINT event_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.admin_users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_reports_resolution_check') THEN
    ALTER TABLE public.event_reports ADD CONSTRAINT event_reports_resolution_check CHECK (resolution IS NULL OR resolution IN ('dismissed', 'warned', 'cancelled', 'host_locked'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_reports_open ON public.user_reports (reported_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_event_reports_open ON public.event_reports (event_id) WHERE resolved_at IS NULL;

COMMIT;
