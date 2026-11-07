-- Admin takedown (Nov 7 2026). Safe to run more than once.
--
-- Reported messages and album photos get a status: open until an admin
-- either removes the content or keeps it. One decision closes every report
-- on that message or photo.

BEGIN;

ALTER TABLE public.message_reports ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;
ALTER TABLE public.message_reports ADD COLUMN IF NOT EXISTS resolved_by uuid;
ALTER TABLE public.message_reports ADD COLUMN IF NOT EXISTS resolution text;

ALTER TABLE public.event_photo_reports ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;
ALTER TABLE public.event_photo_reports ADD COLUMN IF NOT EXISTS resolved_by uuid;
ALTER TABLE public.event_photo_reports ADD COLUMN IF NOT EXISTS resolution text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_reports_resolved_by_fkey') THEN
    ALTER TABLE public.message_reports ADD CONSTRAINT message_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.admin_users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_reports_resolution_check') THEN
    ALTER TABLE public.message_reports ADD CONSTRAINT message_reports_resolution_check CHECK (resolution IS NULL OR resolution IN ('removed', 'kept'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_photo_reports_resolved_by_fkey') THEN
    ALTER TABLE public.event_photo_reports ADD CONSTRAINT event_photo_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.admin_users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_photo_reports_resolution_check') THEN
    ALTER TABLE public.event_photo_reports ADD CONSTRAINT event_photo_reports_resolution_check CHECK (resolution IS NULL OR resolution IN ('removed', 'kept'));
  END IF;
END $$;

-- The open queue is what admins look at most.
CREATE INDEX IF NOT EXISTS idx_message_reports_open ON public.message_reports (created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_event_photo_reports_open ON public.event_photo_reports (created_at DESC) WHERE resolved_at IS NULL;

COMMIT;
