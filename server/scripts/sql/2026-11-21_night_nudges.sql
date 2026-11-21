-- Host reminder two hours before doors, and the morning-after "People from
-- last night" prompt. Each remembers it was sent so it goes once.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS host_reminded_at TIMESTAMPTZ;
ALTER TABLE public.event_attendees ADD COLUMN IF NOT EXISTS people_prompt_sent_at TIMESTAMPTZ;
