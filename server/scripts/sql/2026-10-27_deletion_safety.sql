-- Account deletion, Google-style (Oct 27 2026). Safe to run more than once.
--
-- 1. deleted_backup: on deletion the profile's name, bio and voice move here,
--    so support can restore the account inside the 30-day window. The purge
--    clears it (server/utils/account_purge.py).
-- 2. Records we must keep (money, attendance, reviews, reports, support)
--    now REFUSE to let their user row be deleted instead of being deleted
--    with it. The purge never deletes user rows (it anonymises them), so this
--    only stops a manual `DELETE FROM users` from wiping those records.

BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_backup jsonb;

DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT * FROM (VALUES
      ('payment_orders',      'payment_orders_user_id_fkey',       'user_id'),
      ('wallet_transactions', 'wallet_transactions_user_id_fkey',  'user_id'),
      ('event_attendees',     'event_attendees_user_id_fkey',      'user_id'),
      ('events',              'events_host_id_fkey',               'host_id'),
      ('event_reviews',       'event_reviews_reviewer_id_fkey',    'reviewer_id'),
      ('user_reports',        'user_reports_reporter_id_fkey',     'reporter_id'),
      ('user_reports',        'user_reports_reported_id_fkey',     'reported_id'),
      ('event_reports',       'event_reports_reporter_id_fkey',    'reporter_id'),
      ('message_reports',     'message_reports_reporter_id_fkey',  'reporter_id'),
      ('messages',            'messages_sender_id_fkey',           'sender_id'),
      ('support_requests',    'support_requests_user_id_fkey',     'user_id'),
      ('app_feedback',        'app_feedback_user_id_fkey',         'user_id')
    ) AS t(tbl, con, col)
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', fk.tbl, fk.con);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.users(id) ON DELETE RESTRICT',
      fk.tbl, fk.con, fk.col
    );
  END LOOP;
END $$;

COMMIT;
