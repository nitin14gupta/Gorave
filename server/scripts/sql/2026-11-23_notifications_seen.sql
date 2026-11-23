-- Opening the notifications list counts as seeing everything in it: the badge
-- only counts unread notifications that came in after this. Each row keeps its
-- own read state (read_at) until it's tapped.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notifications_seen_at TIMESTAMPTZ;
