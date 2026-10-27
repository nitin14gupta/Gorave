from db.config import get_db
from utils.r2_client import r2_client

PURGE_AFTER_DAYS = 30
# Purged accounts get a phone like 'del-3f9a…' (15 chars max): it frees the
# real number for a new sign-up and marks the row as already purged.
PURGED_PHONE_PREFIX = "del-"


def purge_expired_deleted_accounts() -> int:
    """Erases the personal data of accounts soft-deleted more than
    PURGE_AFTER_DAYS ago (the 30-day "email us to recover" window in the app
    has closed), the way Google and Instagram handle deletion.

    The user row is NOT deleted. It stays as an anonymous tombstone ("[deleted]",
    no phone, no birthday, no photos) so every record we must keep still points
    at a valid row and nothing cascades away:

    Kept (financial / legal, needed for refunds, disputes, tax and safety):
      payment_orders, wallet_transactions, host_payout_details,
      event_attendees, events they hosted, event_reviews,
      user_reports / event_reports / message_reports (made by or against them),
      support_requests, app_feedback, admin_audit_log,
      the signed host agreement (users.host_agreement_* columns).
    Kept for the other person: conversations and messages (their side of the
      chat), now shown as from a deleted account.
    Erased: name, username, phone, dob, gender, city, live location, bio,
      voice intro, interests, badges, notification prefs, photos (R2 files too),
      push tokens, sessions, follows, blocks, hotlist, vibe requests,
      saved UPI IDs, emergency contacts, their own notifications.
    """
    with get_db() as (cur, _):
        cur.execute(
            f"""
            SELECT id::text FROM users
            WHERE is_deleted = TRUE AND deleted_at < NOW() - INTERVAL '{PURGE_AFTER_DAYS} days'
              AND phone NOT LIKE %s
            """,
            (PURGED_PHONE_PREFIX + "%",),
        )
        expired = [row["id"] for row in cur.fetchall()]

    for uid in expired:
        with get_db() as (cur, _):
            cur.execute("SELECT r2_path FROM user_photos WHERE user_id = %s::uuid", (uid,))
            photo_paths = [row["r2_path"] for row in cur.fetchall()]
            cur.execute("SELECT voice_r2_path FROM users WHERE id = %s::uuid", (uid,))
            row = cur.fetchone()
            voice_path = row["voice_r2_path"] if row else None

        for path in photo_paths + ([voice_path] if voice_path else []):
            try:
                r2_client.delete_file(path)
            except Exception as e:
                print(f"[PURGE] R2 delete failed for user {uid}: {e}", flush=True)

        with get_db() as (cur, conn):
            # Personal-only rows: nothing else depends on these.
            for sql in (
                "DELETE FROM user_photos WHERE user_id = %(u)s::uuid",
                "DELETE FROM device_tokens WHERE user_id = %(u)s::uuid",
                "DELETE FROM refresh_tokens WHERE user_id = %(u)s::uuid",
                "DELETE FROM follows WHERE follower_id = %(u)s::uuid OR following_id = %(u)s::uuid",
                "DELETE FROM user_blocks WHERE blocker_id = %(u)s::uuid OR blocked_id = %(u)s::uuid",
                "DELETE FROM event_hotlist WHERE user_id = %(u)s::uuid",
                "DELETE FROM vibe_requests WHERE sender_id = %(u)s::uuid OR receiver_id = %(u)s::uuid",
                "DELETE FROM saved_upi_ids WHERE user_id = %(u)s::uuid",
                "DELETE FROM emergency_contacts WHERE user_id = %(u)s::uuid",
                "DELETE FROM notifications WHERE user_id = %(u)s::uuid",
            ):
                cur.execute(sql, {"u": uid})

            # The tombstone: same id, no personal data.
            cur.execute(
                """
                UPDATE users SET
                    phone = %(prefix)s || substr(md5(id::text), 1, 11),
                    name = '[deleted]', username = NULL, dob = NULL, gender = NULL,
                    city = NULL, lat = NULL, lng = NULL,
                    bio = NULL, voice_url = NULL, voice_r2_path = NULL,
                    interests = '{}', badges = '{}', notification_prefs = '{}'::jsonb,
                    last_seen_at = NULL, is_active = FALSE, profile_complete = FALSE,
                    updated_at = NOW()
                WHERE id = %(u)s::uuid
                """,
                {"u": uid, "prefix": PURGED_PHONE_PREFIX},
            )
            conn.commit()
        print(f"[PURGE] Erased personal data of user {uid}; kept records as an anonymous tombstone", flush=True)

    return len(expired)
