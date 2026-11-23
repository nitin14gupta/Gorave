-- "Your month on Gorave": when a vibe was accepted (new connections per month),
-- and the last month someone's recap push went out (so it goes once a month).
ALTER TABLE public.vibe_requests ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_recap_month DATE;

-- Vibes accepted before this column existed: the conversation opens on accept,
-- so its start is the closest record; fall back to when the vibe was sent.
UPDATE public.vibe_requests v
SET accepted_at = COALESCE(
  (SELECT MIN(c.created_at) FROM public.conversations c WHERE c.vibe_request_id = v.id),
  v.created_at)
WHERE v.status = 'accepted' AND v.accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS vibe_requests_accepted_at_idx ON public.vibe_requests (accepted_at) WHERE status = 'accepted';
