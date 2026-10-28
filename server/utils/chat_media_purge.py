"""Deletes chat files from storage once nothing can show them any more:

View once / view twice, the way WhatsApp does:
- a few minutes after the last allowed view (the 5-minute open link has
  expired by then, so nobody is mid-download),
- 14 days after sending if it was never fully opened.

Any photo, video, GIF or voice note the sender unsent.

A forwarded copy points at the same file as its original, so a file is only
deleted once no live message uses it any more; until then the row is just
marked handled. The message row always stays (so a chat can read "Opened" /
"Expired"); only the file and its link/key are removed, and media_purged_at
is stamped.
"""
import os

from db.config import get_db
from utils.r2_client import r2_client
from utils import chat_realtime as rt

AFTER_LAST_VIEW_MINUTES = 10
UNOPENED_DAYS = 14
BATCH = 500
MEDIA_TYPES = ('image', 'video', 'gif', 'voice')


def _storage_location(md: dict):
    """(bucket, key) for a message's file, or None if it isn't ours."""
    key = md.get("key")
    if isinstance(key, str) and key.startswith("chat/") and rt.CHAT_BUCKET:
        return rt.CHAT_BUCKET, key
    url = md.get("url")
    base = (os.getenv("R2_BASEURL") or "").rstrip("/")
    if isinstance(url, str) and base and url.startswith(base + "/chat/"):
        return None, url[len(base) + 1:]  # None = the public bucket
    return None


def _still_used(msg_id: str, md: dict) -> bool:
    """Another message that can still be shown (a forwarded copy) uses this file."""
    key, url = md.get("key"), md.get("url")
    if not key and not url:
        return False
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT 1 FROM messages
            WHERE id != %s::uuid AND unsent_at IS NULL AND media_purged_at IS NULL
              AND (
                    (%s::text IS NOT NULL AND metadata ? 'key' AND metadata->>'key' = %s)
                 OR (%s::text IS NOT NULL AND content_type IN %s AND metadata ? 'url' AND metadata->>'url' = %s)
              )
            LIMIT 1
            """,
            (msg_id, key, key, url, MEDIA_TYPES, url),
        )
        return cur.fetchone() is not None


def purge_viewed_media() -> int:
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT id::text, metadata
            FROM messages
            WHERE media_purged_at IS NULL
              AND (
                    (view_limit IS NOT NULL AND (
                         unsent_at IS NOT NULL
                      OR (views_used >= view_limit AND last_viewed_at < NOW() - make_interval(mins => %s))
                      OR sent_at < NOW() - make_interval(days => %s)
                    ))
                 OR (unsent_at IS NOT NULL AND content_type IN %s)
              )
            ORDER BY sent_at
            LIMIT %s
            """,
            (AFTER_LAST_VIEW_MINUTES, UNOPENED_DAYS, MEDIA_TYPES, BATCH),
        )
        rows = cur.fetchall()

    done = []
    for row in rows:
        md = row["metadata"] or {}
        loc = _storage_location(md)
        if loc is not None and not _still_used(row["id"], md):
            bucket, key = loc
            # delete_file logs and returns False on failure; retry next run.
            if not r2_client.delete_file(key, bucket=bucket):
                continue
        done.append(row["id"])

    if done:
        with get_db() as (cur, conn):
            cur.execute(
                """
                UPDATE messages
                SET media_purged_at = NOW(),
                    metadata = NULLIF(metadata - 'url' - 'key' - 'thumbnail_url', '{}'::jsonb)
                WHERE id = ANY(%s::uuid[])
                """,
                (done,),
            )
            conn.commit()
    return len(done)
