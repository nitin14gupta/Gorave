-- An event the team found was rigged after it happened: guests were refunded,
-- so the host isn't paid for it. Refunded tickets already leave the payout
-- ledger (event_attendees.refunded_at); this records why, for the admin pages.
ALTER TABLE events ADD COLUMN IF NOT EXISTS payout_held_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS payout_held_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_event_reports_open ON event_reports (event_id) WHERE resolved_at IS NULL;
-- A new way to close event reports: guests refunded after the event.
ALTER TABLE public.event_reports DROP CONSTRAINT IF EXISTS event_reports_resolution_check;
ALTER TABLE public.event_reports ADD CONSTRAINT event_reports_resolution_check
  CHECK (resolution IS NULL OR resolution IN ('dismissed', 'warned', 'cancelled', 'host_locked', 'refunded'));
