-- Host insights: who opened an event, once per person per day (the host isn't counted).
CREATE TABLE IF NOT EXISTS public.event_views (
  event_id  UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day       DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (event_id, user_id, day)
);
CREATE INDEX IF NOT EXISTS idx_event_views_event_day ON public.event_views (event_id, day);
