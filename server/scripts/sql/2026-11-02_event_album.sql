-- After-party photo album (Nov 2 2026). Safe to run more than once.
--
-- Guests scanned at the door and the host drop photos after the night, seen
-- only by each other. Files live in the private bucket; rows keep the file's
-- key, never a link.

BEGIN;

CREATE TABLE IF NOT EXISTS public.event_photos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  uploader_id uuid NOT NULL,
  storage_key text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  -- Taken down by the uploader or the host; the file is deleted too.
  removed_at timestamp with time zone,
  removed_by uuid,
  -- Hidden automatically after enough reports, until someone reviews it.
  hidden_at timestamp with time zone,
  CONSTRAINT event_photos_pkey PRIMARY KEY (id),
  CONSTRAINT event_photos_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT event_photos_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT event_photos_removed_by_fkey FOREIGN KEY (removed_by) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event ON public.event_photos (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_photos_uploader ON public.event_photos (uploader_id);

CREATE TABLE IF NOT EXISTS public.event_photo_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  photo_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT event_photo_reports_pkey PRIMARY KEY (id),
  CONSTRAINT event_photo_reports_unique UNIQUE (photo_id, reporter_id),
  CONSTRAINT event_photo_reports_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.event_photos(id) ON DELETE CASCADE,
  CONSTRAINT event_photo_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- "Best of the night": a double tap on a photo. Who tapped and how many stay
-- private; the votes only decide which photos rise to the top.
CREATE TABLE IF NOT EXISTS public.event_photo_votes (
  photo_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT event_photo_votes_pkey PRIMARY KEY (photo_id, user_id),
  CONSTRAINT event_photo_votes_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.event_photos(id) ON DELETE CASCADE,
  CONSTRAINT event_photo_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- The "add your pictures" prompt goes out once per person.
ALTER TABLE public.event_attendees ADD COLUMN IF NOT EXISTS album_prompt_sent_at timestamp with time zone;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS album_host_prompt_sent_at timestamp with time zone;
-- New-photo pushes are grouped: at most one every 2 hours per event.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS album_last_push_at timestamp with time zone;

COMMIT;
