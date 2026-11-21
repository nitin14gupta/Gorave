-- Weekend digest: once a week, Thursday evening. Remembers when each person last got one.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_weekend_digest_at TIMESTAMPTZ;
