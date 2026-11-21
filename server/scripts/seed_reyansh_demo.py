"""Fill Reyansh's account (+91 9000000005) with a real-looking life for store
screenshots: friends, 1:1 chats (with a photo collage, an event card, a
profile card, reactions, unread), vibes, followers, events he's going to
(paid ticket, free, tomorrow), an event he's hosting with join requests and a
lively group chat, a past hosted night with reviews, a past night with an
album, and a few notifications.

    python scripts/seed_reyansh_demo.py          # seed (cleans first)
    python scripts/seed_reyansh_demo.py --clean  # remove everything it made

Local database only. Everything made is recorded in the demo_seed table, so
--clean removes exactly that. Album photos are uploaded to the private chat
bucket under album/<event_id>/ and deleted again by --clean.
"""
import io
import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

import httpx
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
DB = os.getenv("DATABASE_URL", "")
if "localhost" not in DB and "127.0.0.1" not in DB:
    sys.exit("Refusing: DATABASE_URL is not a local database.")

PHONE = "9000000005"
TAG = "_rx"
U = "https://images.unsplash.com/{}?w={}&auto=format&fit=crop&q=75"
NOW = datetime.now(timezone.utc)

FRIENDS = [  # key, name, gender, avatar, bio, interests
    ("ananya", "Ananya Iyer", "Female", "photo-1494790108377-be9c29b29330", "Rooftops, film cameras and long dinners.", ["Live music", "Photography", "Food"]),
    ("kabir", "Kabir Mehta", "Male", "photo-1507003211169-0a1dd7228f2d", "Guitar in one hand, Catan rules in the other.", ["Music", "Board games"]),
    ("meera", "Meera Kapoor", "Female", "photo-1438761681033-6461ffad8d80", "New in Bandra. Say hi.", ["Dance", "Travel"]),
    ("zoya", "Zoya Khan", "Female", "photo-1544005313-94ddf0286df2", "I host dumpling nights. You bring the stories.", ["Cooking", "Books"]),
    ("rohan", "Rohan Desai", "Male", "photo-1500648767791-00dcc994a43e", "Cajón, chai, repeat.", ["Music", "Coffee"]),
    ("tara", "Tara Fernandes", "Female", "photo-1534528741775-53994a69daeb", "Weekend hiker, weeknight karaoke.", ["Hiking", "Karaoke"]),
    ("naina", "Naina Rao", "Female", "photo-1517841905240-472988babdf9", "Always down for a board game.", ["Board games", "Art"]),
    ("isha", "Isha Malhotra", "Female", "photo-1524504388940-b1c1722653e1", "Ex-Delhi, now Mumbai. Food first.", ["Food", "Fashion"]),
    ("arjun", "Arjun Nair", "Male", "photo-1506794778202-cad84cf45f1d", "Ultimate frisbee and vinyl.", ["Sports", "Music"]),
    ("dev", "Dev Reddy", "Male", "photo-1531427186611-ecfd6d936c79", "Photographer for hire, friend for free.", ["Photography"]),
    ("aditi", "Aditi Bose", "Female", "photo-1488426862026-3ee34a7d66df", "Learning the ukulele, badly.", ["Music", "Yoga"]),
    ("vikram", "Vikram Sharma", "Male", "photo-1539571696357-5a69c17a67c6", "Quiz nights are my cardio.", ["Quizzes", "Food"]),
]
FIRST = ["Aarav", "Diya", "Kavya", "Yash", "Sana", "Nikhil", "Pooja", "Karan", "Riya", "Aman", "Sneha", "Rahul", "Priya", "Varun", "Neha", "Ishaan", "Anika", "Kunal"]
LAST = ["Shah", "Pillai", "Joshi", "Verma", "Gupta", "Menon", "Saxena", "Chopra", "Patil"]
FACES = ["photo-1529626455594-4ff0802cfb7e", "photo-1504593811423-6dd665756598", "photo-1527980965255-d3b416303d12",
         "photo-1580489944761-15a19d654956", "photo-1519085360753-af0119f7cbe7", "photo-1508214751196-bcfd4ca60f91"]
PARTY = ["photo-1519671482749-fd09be7ccebf", "photo-1492684223066-81342ee5ff30", "photo-1516997121675-4c2d1684aa3e",
         "photo-1530103862676-de8c9debad1d", "photo-1511795409834-ef04bbd61622", "photo-1527529482837-4698179dc6ce"]
GAMES = ["photo-1610890716171-6b1bb98ffd09", "photo-1632501641765-e568d28b0015", "photo-1606503153255-59d8b8b82176"]
MUSIC = ["photo-1514525253161-7a46d19cd819", "photo-1493225457124-a3eb161ffa5f", "photo-1524368535928-5b5e00ddc76b"]
DINNER = ["photo-1528605248644-14dd04022da1", "photo-1414235077428-338989a2e8c0", "photo-1517457373958-b7bdd4587205"]


def at(days=0, hours=0, minutes=0):
    return NOW + timedelta(days=days, hours=hours, minutes=minutes)


def evening(days, hour_utc=13, minute=30):
    """An evening in India (13:30 UTC = 7 PM IST), `days` from today."""
    return (NOW + timedelta(days=days)).replace(hour=hour_utc, minute=minute, second=0, microsecond=0)


class Seed:
    def __init__(self, cur):
        self.cur = cur
        cur.execute("CREATE TABLE IF NOT EXISTS demo_seed (kind TEXT NOT NULL, id TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())")
        cur.execute("SELECT id::text, name FROM users WHERE phone = %s", (PHONE,))
        row = cur.fetchone()
        if not row:
            sys.exit("Reyansh (9000000005) not found in the local database.")
        self.me = row["id"]
        self.u = {}

    def note(self, kind, id_):
        self.cur.execute("INSERT INTO demo_seed (kind, id) VALUES (%s, %s)", (kind, str(id_)))

    # ── people ────────────────────────────────────────────────────────────
    def user(self, n, name, gender, avatar, bio=None, interests=None):
        first = name.split()[0]
        self.cur.execute(
            """INSERT INTO users (phone, name, dob, gender, city, lat, lng, username, profile_complete, is_host_onboarding_finished, badges, bio, interests, last_seen_at)
               VALUES (%s, %s, %s, %s, 'Mumbai', 19.06, 72.83, %s, TRUE, TRUE, '{}', %s, %s, %s) RETURNING id::text""",
            (f"70100{n:05d}", name, datetime(1996 + n % 6, 1 + n % 12, 1 + n % 27).date(), gender,
             f"{first.lower()}{n}{TAG}", bio, interests, at(minutes=-(n * 7))),
        )
        uid = self.cur.fetchone()["id"]
        self.note("user", uid)
        self.cur.execute("INSERT INTO user_photos (user_id, url, r2_path, position) VALUES (%s, %s, 'seed', 0)", (uid, U.format(avatar, 600)))
        return uid

    def people(self):
        for i, (key, name, g, av, bio, ints) in enumerate(FRIENDS):
            self.u[key] = self.user(i + 1, name, g, av, bio, ints)
        crowd = []
        for i in range(28):
            name = f"{FIRST[i % len(FIRST)]} {LAST[i % len(LAST)]}"
            crowd.append(self.user(100 + i, name, "Female" if i % 2 else "Male", FACES[i % len(FACES)]))
        self.crowd = crowd
        # Followers and following: friends both ways, the crowd follows him.
        for key in self.u:
            self.follow(self.u[key], self.me, days=-30 + len(key))
            if key in ("ananya", "kabir", "zoya", "rohan", "meera", "dev", "arjun"):
                self.follow(self.me, self.u[key], days=-28)
        for i, uid in enumerate(crowd):
            self.follow(uid, self.me, days=-20 + i % 18)
        for i, uid in enumerate(crowd[:9]):
            self.follow(self.me, uid, days=-15)

    def follow(self, a, b, days):
        self.cur.execute("INSERT INTO follows (follower_id, following_id, created_at) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING RETURNING id::text", (a, b, at(days=days)))
        r = self.cur.fetchone()
        if r:
            self.note("follow", r["id"])

    # ── events ────────────────────────────────────────────────────────────
    def event(self, host, title, etype, when, area, covers, price=0, cap=20, desc="", join="instant", women_pct=None, hours=4):
        self.cur.execute(
            """INSERT INTO events (host_id, title, description, rules, event_type, date_time, end_time, capacity, spots_left,
                   age_restriction, location_name, location_lat, location_lng, price_inr, cover_photos, city, area,
                   address_line1, join_mode, women_pct, platform_fee_inr, host_commission_inr)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,18,%s,%s,%s,%s,%s,'Mumbai',%s,%s,%s,%s,%s,%s) RETURNING id::text""",
            (host, title, desc, "Shoes off at the door. Be kind, be on time.", etype, when, when + timedelta(hours=hours), cap, cap,
             f"{area}, Mumbai", 19.06, 72.83, price, json.dumps([U.format(c, 1200) for c in covers]), area,
             "Flat 12, Sea Breeze Apartments", join, women_pct, 50 if price else 0, round(price * 0.1)),
        )
        eid = self.cur.fetchone()["id"]
        self.note("event", eid)
        return eid

    def attend(self, eid, uid, price=0, checked_in=None, status="going", joined_days=-3):
        self.cur.execute(
            """INSERT INTO event_attendees (event_id, user_id, status, joined_at, payment_id, price_paid_inr, fee_paid_inr, commission_inr, checked_in_at, requested_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING""",
            (eid, uid, status, at(days=joined_days), f"pay_DEMO{uuid.uuid4().hex[:10]}" if price else None,
             price or None, 50 if price else None, round(price * 0.1) if price else None, checked_in,
             at(days=joined_days) if status == "requested" else None),
        )

    def fill(self, eid, people, price=0, checked_in=None):
        for i, uid in enumerate(people):
            self.attend(eid, uid, price, checked_in=(checked_in + timedelta(minutes=i * 3)) if checked_in else None, joined_days=-(3 + i % 6))
        self.cur.execute("UPDATE events SET spots_left = capacity - (SELECT COUNT(*) FROM event_attendees WHERE event_id = %s AND status = 'going') WHERE id = %s", (eid, eid))

    # ── chats ─────────────────────────────────────────────────────────────
    def direct(self, other):
        lo, hi = sorted([self.me, other])
        self.cur.execute("INSERT INTO conversations (kind, user1_id, user2_id, status, created_at, last_message_at) VALUES ('direct', %s, %s, 'active', %s, %s) RETURNING id::text", (lo, hi, at(days=-21), at(days=-21)))
        cid = self.cur.fetchone()["id"]
        self.note("conversation", cid)
        return cid

    def group(self, eid, host, members):
        self.cur.execute("INSERT INTO conversations (kind, event_id, status, created_at, last_message_at) VALUES ('event', %s, 'active', %s, %s) RETURNING id::text", (eid, at(days=-6), at(days=-6)))
        cid = self.cur.fetchone()["id"]
        self.note("conversation", cid)
        self.cur.execute("INSERT INTO conversation_members (conversation_id, user_id, role, joined_at, last_read_at) VALUES (%s, %s, 'host', %s, NOW())", (cid, host, at(days=-6)))
        for i, uid in enumerate(members):
            if uid != host:
                self.cur.execute("INSERT INTO conversation_members (conversation_id, user_id, role, joined_at, last_read_at) VALUES (%s, %s, 'guest', %s, %s)",
                                 (cid, uid, at(days=-5 + i * 0.1), at(days=-1)))
        return cid

    def say(self, cid, who, when, text=None, ctype="text", meta=None, read=True, reactions=None):
        self.cur.execute(
            """INSERT INTO messages (conversation_id, sender_id, content, content_type, metadata, sent_at, delivered_at, read_at, reactions)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id::text""",
            (cid, who, text, ctype, json.dumps(meta) if meta else None, when, when,
             when + timedelta(minutes=1) if read else None, json.dumps(reactions) if reactions else None),
        )
        mid = self.cur.fetchone()["id"]
        self.cur.execute("UPDATE conversations SET last_message_at = GREATEST(COALESCE(last_message_at, %s), %s) WHERE id = %s", (when, when, cid))
        return mid

    def photos(self, cid, who, when, ids, read=True):
        for i, p in enumerate(ids):
            self.say(cid, who, when + timedelta(seconds=i * 4), ctype="image",
                     meta={"url": U.format(p, 900), "width": 900, "height": 1125}, read=read)

    def event_card(self, eid, title, when, cover):
        return {"event_id": eid, "title": title, "cover_url": U.format(cover, 900),
                "date": (when + timedelta(hours=5, minutes=30)).strftime("%a, %d %b · %I:%M %p").replace(" 0", " ")}

    def notify(self, type_, title, body, actor=None, entity_id=None, entity_type=None, minutes=0, read=False):
        self.cur.execute(
            "INSERT INTO notifications (user_id, type, actor_id, entity_id, entity_type, title, body, created_at, read_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id::text",
            (self.me, type_, actor, entity_id, entity_type, title, body, at(minutes=minutes), at(minutes=minutes + 1) if read else None),
        )
        self.note("notification", self.cur.fetchone()["id"])

    # ── album ─────────────────────────────────────────────────────────────
    def album(self, eid, uploaders, photo_ids):
        from PIL import Image
        from utils.r2_client import r2_client
        from utils import chat_realtime as rt
        if not rt.CHAT_BUCKET:
            print("  (no R2_CHAT_BUCKET, skipping album photos)")
            return
        for i, p in enumerate(photo_ids):
            try:
                raw = httpx.get(U.format(p, 1080), timeout=20, follow_redirects=True).content
                img = Image.open(io.BytesIO(raw)).convert("RGB")
                buf = io.BytesIO()
                img.save(buf, "WEBP", quality=82)
                buf.seek(0)
                key = r2_client.upload_file(buf, "album.webp", folder=f"album/{eid}", bucket=rt.CHAT_BUCKET)["path"]
                self.cur.execute("INSERT INTO event_photos (event_id, uploader_id, storage_key, width, height, created_at) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id::text",
                                 (eid, uploaders[i % len(uploaders)], key, img.width, img.height, at(days=-8, minutes=i * 13)))
                self.note("photo", self.cur.fetchone()["id"])
                self.note("r2", key)
            except Exception as e:
                print(f"  album photo {p} skipped: {e}")

    # ── the story ─────────────────────────────────────────────────────────
    def run(self):
        me, u, c = self.me, self.u, self.cur
        self.people()

        # Events he's going to.
        rooftop_at = evening(5)
        rooftop = self.event(u["ananya"], "Sunset Rooftop Sessions", "rooftop", rooftop_at, "Bandra West", PARTY[:3], price=799, cap=40,
                             desc="Golden hour on a Bandra terrace with a speaker, fairy lights and the sea. Come early for the sunset, stay for the songs. Snacks on us, BYOB.", women_pct=50)
        self.fill(rooftop, [u["kabir"], u["zoya"], u["meera"], u["rohan"], u["tara"], u["dev"], u["aditi"]] + self.crowd[:22], price=799)
        self.attend(rooftop, me, price=799, joined_days=-1)
        c.execute("UPDATE events SET spots_left = capacity - 30 WHERE id = %s", (rooftop,))

        acoustic_at = evening(2, 14)
        acoustic = self.event(u["kabir"], "Living-room Acoustic Set", "music", acoustic_at, "Khar West", MUSIC, cap=24, join="request",
                              desc="Music up close in a living room. Cushions on the floor, phones down during sets, open jam at the end. Bring an instrument if you play.")
        self.fill(acoustic, [u["rohan"], u["arjun"], u["aditi"], u["naina"]] + self.crowd[5:14])
        self.attend(acoustic, me, joined_days=-4)

        dumpling_at = evening(1, 13)
        dumpling = self.event(u["zoya"], "Dumpling Making Dinner", "dinner", dumpling_at, "Pali Hill", DINNER, price=499, cap=12,
                              desc="We fold, steam and eat together at one long table. Veg and non-veg fillings. Tell us about allergies in the group chat.")
        self.fill(dumpling, [u["isha"], u["vikram"], u["meera"]] + self.crowd[14:20], price=499)
        self.attend(dumpling, me, price=499, joined_days=-6)

        # The night he's hosting, with requests waiting.
        catan_at = evening(3, 14)
        catan = self.event(me, "Catan & Chai Night", "game_night", catan_at, "Bandra West", GAMES, cap=16, join="request",
                           desc="Board games, masala chai and friendly betrayal. Catan, Codenames and Exploding Kittens. Rules explained, beginners welcome.")
        self.fill(catan, [u["kabir"], u["naina"], u["arjun"], u["vikram"]] + self.crowd[20:25])
        for uid in (u["ananya"], self.crowd[25], self.crowd[26]):
            self.attend(catan, uid, status="requested", joined_days=-1)

        # A past night he hosted, with reviews.
        brunch_at = evening(-12, 6)
        brunch = self.event(me, "Monsoon Board Game Brunch", "game_night", brunch_at, "Bandra West", GAMES[1:] + GAMES[:1], cap=14, join="request", hours=3,
                            desc="Rainy Sunday, board games and a big brunch spread.")
        guests = [u["kabir"], u["naina"], u["zoya"], u["tara"], u["dev"]] + self.crowd[:7]
        self.fill(brunch, guests, checked_in=brunch_at + timedelta(minutes=10))
        for uid, rating, body in [(u["naina"], 5, "Reyansh is the best host. Explained Catan to five beginners without losing it."),
                                  (u["kabir"], 5, "Great crowd and the chai was unreal."), (u["zoya"], 4, "Loved it, would go again."),
                                  (u["tara"], 5, "Felt welcome from the first minute."), (self.crowd[1], 5, None)]:
            c.execute("INSERT INTO event_reviews (event_id, reviewer_id, rating, body, created_at) VALUES (%s,%s,%s,%s,%s)", (brunch, uid, rating, body, brunch_at + timedelta(days=1)))

        # A past night he went to, with an album and a review waiting from him.
        retro_at = evening(-9, 15)
        retro = self.event(u["kabir"], "Retro Bollywood Night", "house_party", retro_at, "Andheri West", PARTY[3:], cap=30,
                           desc="Dress in your best 90s Bollywood. Dance floor, karaoke corner and a lot of Kishore Kumar.")
        self.fill(retro, [u["ananya"], u["meera"], u["dev"], u["rohan"], u["isha"]] + self.crowd[8:20], checked_in=retro_at + timedelta(minutes=20))
        self.attend(retro, me, checked_in=retro_at + timedelta(minutes=25), joined_days=-14)

        # ── 1:1 chats ──
        a = self.direct(u["ananya"])
        self.say(a, u["ananya"], at(days=-2, hours=-5), "Reyansh!! Sending you the pics from Saturday")
        self.photos(a, u["ananya"], at(days=-2, hours=-5, minutes=1), PARTY[3:] + PARTY[:1])
        self.say(a, me, at(days=-2, hours=-4, minutes=-40), "These are so good", reactions={u["ananya"]: "❤️"})
        self.say(a, me, at(days=-2, hours=-4, minutes=-39), "The one on the dance floor is going straight on my profile")
        self.say(a, u["ananya"], at(days=-2, hours=-4, minutes=-30), "Told you Kabir's parties are worth it")
        self.say(a, u["ananya"], at(days=-1, hours=-3), ctype="event", meta=self.event_card(rooftop, "Sunset Rooftop Sessions", rooftop_at, PARTY[0]))
        self.say(a, u["ananya"], at(days=-1, hours=-3, minutes=1), "Same crew is going to this one. You in?")
        self.say(a, me, at(days=-1, hours=-2), "Just booked!", reactions={u["ananya"]: "🔥"})
        self.say(a, u["ananya"], at(days=-1, hours=-2, minutes=2), "Yay. I'll save you a spot near the speaker")
        self.say(a, me, at(minutes=-48), "Also I'm hosting a Catan night on Friday, come")
        self.say(a, u["ananya"], at(minutes=-45), "Wait since when do you host")
        self.say(a, me, at(minutes=-44), "Since this week. Verified and everything")
        self.say(a, me, at(minutes=-44), ctype="event", meta=self.event_card(catan, "Catan & Chai Night", catan_at, GAMES[0]))
        self.say(a, u["ananya"], at(minutes=-6), "Look at you. Requested!", read=False)

        k = self.direct(u["kabir"])
        self.say(k, u["kabir"], at(days=-1, hours=-6), "Bro you're coming Thursday right? Acoustic set")
        self.say(k, me, at(days=-1, hours=-6, minutes=4), "Obviously. Should I bring anything?")
        self.say(k, u["kabir"], at(days=-1, hours=-6, minutes=6), "Just your voice for the jam at the end")
        self.say(k, u["kabir"], at(days=-1, hours=-6, minutes=7), ctype="profile",
                 meta={"user_id": u["rohan"], "name": "Rohan Desai", "avatar_url": U.format("photo-1500648767791-00dcc994a43e", 300), "city": "Mumbai", "interests": ["Music", "Coffee"]})
        self.say(k, u["kabir"], at(days=-1, hours=-6, minutes=7), "This guy plays the cajón, he's coming too")
        self.say(k, me, at(hours=-3), "Haha perfect, it's a band now", reactions={u["kabir"]: "😂"})

        m = self.direct(u["meera"])
        self.say(m, u["meera"], at(minutes=-22), "Hey! Saw you're going to Sunset Rooftop Sessions too", read=False)
        self.say(m, u["meera"], at(minutes=-21), "First time going to one of these, is it chill?", read=False)

        zr = self.direct(u["zoya"])
        self.say(zr, me, at(days=-3), "Is the dumpling dinner okay for a vegetarian?")
        self.say(zr, u["zoya"], at(days=-3, minutes=12), "Totally, half the fillings are veg. Mushroom and paneer ones are the best anyway")
        self.say(zr, me, at(days=-3, minutes=14), "Sold. See you tomorrow")

        r = self.direct(u["rohan"])
        self.say(r, u["rohan"], at(days=-5), "Kabir said you sing?")
        self.say(r, me, at(days=-5, minutes=30), "In the shower, mostly")
        self.say(r, u["rohan"], at(days=-5, minutes=31), "Good enough for Thursday")

        # ── Group chats ──
        g = self.group(rooftop, u["ananya"], [u["kabir"], u["zoya"], u["meera"], u["rohan"], u["tara"], u["dev"], u["aditi"], me])
        pin = self.say(g, u["ananya"], at(days=-4), "Welcome everyone! Sunset is around 6:40, so get here by 6:15. Wear something you can sit on the floor in, cushions are sorted", ctype="update")
        c.execute("UPDATE conversations SET pinned_message_id = %s WHERE id = %s", (pin, g))
        self.say(g, u["tara"], at(days=-3), "Is there parking nearby?")
        self.say(g, u["ananya"], at(days=-3, minutes=5), "Street parking on Chapel Road, or an auto from Bandra station is 5 mins")
        self.say(g, u["dev"], at(days=-2), "Bringing my film camera, will drop the pics in the album after")
        # Today: the bit you see first when you open the chat.
        self.say(g, u["tara"], at(minutes=-150), "Anyone coming from Andheri? Can share an auto")
        self.say(g, u["dev"], at(minutes=-148), "Me! Leaving around 5:45", reactions={u["tara"]: "🙌"})
        self.say(g, u["meera"], at(minutes=-120), "First time at one of these, a little nervous ngl")
        self.say(g, u["zoya"], at(minutes=-118), "Don't be! Ananya's rooftops are the friendliest", reactions={u["meera"]: "❤️", u["ananya"]: "❤️"})
        self.say(g, me, at(minutes=-115), "I knew one person at my first one. Now look at this group", reactions={u["kabir"]: "😂", u["meera"]: "😂"})
        self.say(g, u["kabir"], at(minutes=-90), "Bringing my guitar, requests open")
        self.say(g, u["rohan"], at(minutes=-88), "Cajón is packed too")
        self.say(g, u["aditi"], at(minutes=-86), "Okay this is turning into a concert", reactions={u["kabir"]: "🔥", u["rohan"]: "🔥", me: "🔥"})
        self.say(g, u["ananya"], at(minutes=-61), "Lights are up!")
        self.photos(g, u["ananya"], at(minutes=-60), PARTY[:3])
        self.say(g, u["meera"], at(minutes=-55), "Stop it's so pretty", reactions={u["ananya"]: "❤️"})
        self.say(g, u["zoya"], at(minutes=-35), "Can't wait!!", read=False)
        self.say(g, u["kabir"], at(minutes=-20), "See you all at 6:15 sharp", read=False)
        c.execute("UPDATE conversation_members SET last_read_at = %s WHERE conversation_id = %s AND user_id = %s", (at(minutes=-50), g, me))
        # Everyone else has read up to now, so the seen faces show under the newest message.
        c.execute("UPDATE conversation_members SET last_read_at = %s WHERE conversation_id = %s AND user_id <> %s", (at(minutes=-5), g, me))

        h = self.group(catan, me, [u["kabir"], u["naina"], u["arjun"], u["vikram"]] + self.crowd[20:25])
        self.say(h, me, at(days=-2), "Hey all! Doors at 7:30, first game starts 8. Chai and snacks are on me", ctype="update")
        self.say(h, u["naina"], at(days=-2, minutes=20), "Can I bring Codenames Duet?")
        self.say(h, me, at(days=-2, minutes=25), "Please do")
        self.say(h, u["arjun"], at(days=-1), "Never played Catan, is that okay?")
        self.say(h, me, at(days=-1, minutes=3), "Totally, I'll explain it. Takes 10 minutes")
        self.say(h, u["kabir"], at(minutes=-90), "He says 10 minutes. It's 40.", reactions={me: "😂", u["naina"]: "😂"})
        self.say(h, u["vikram"], at(minutes=-12), "Already practising my trades", read=False)
        c.execute("UPDATE conversation_members SET last_read_at = %s WHERE conversation_id = %s AND user_id = %s", (at(minutes=-60), h, me))

        d = self.group(dumpling, u["zoya"], [u["isha"], u["vikram"], u["meera"], me])
        self.say(d, u["zoya"], at(days=-2), "Menu: mushroom, paneer-spinach, chicken and prawn. Tell me allergies here!", ctype="update")
        self.say(d, u["isha"], at(days=-2, minutes=30), "No allergies, just very hungry")
        self.say(d, me, at(days=-1), "Vegetarian here, the mushroom ones sound great")

        # ── Album for the past night ──
        print("uploading album photos...")
        self.album(retro, [u["dev"], u["ananya"], u["meera"], me], PARTY[3:] + PARTY[:3] + MUSIC[:2])

        # ── Deals ──
        # Host side: a paid night he runs, with early bird and a code already in use.
        vinyl_at = evening(9, 14)
        vinyl = self.event(me, "Vinyl & Wine Listening Night", "music", vinyl_at, "Bandra West", MUSIC[1:] + MUSIC[:1], price=599, cap=20,
                           desc="Side A to side B, no skipping. Bring a record you love, we'll pour the wine. Seats on the floor, good speakers.")
        c.execute("UPDATE events SET early_bird_price_inr = 399, early_bird_count = 10 WHERE id = %s", (vinyl,))
        c.execute("INSERT INTO promo_codes (event_id, host_id, code, percent_off, uses) VALUES (%s, %s, 'REYANSH20', 20, 2) RETURNING id::text", (vinyl, me))
        code_id = c.fetchone()["id"]
        for i, uid in enumerate(self.crowd[:10]):
            kind, price = ("early_bird", 399) if i < 6 else ("promo", 479) if i < 8 else (None, 599)
            c.execute(
                """INSERT INTO event_attendees (event_id, user_id, status, joined_at, payment_id, price_paid_inr, fee_paid_inr, commission_inr, pricing, promo_code_id)
                   VALUES (%s, %s, 'going', %s, %s, %s, 50, %s, %s, %s)""",
                (vinyl, uid, at(days=-5 + i * 0.3), f"pay_DEMO{uuid.uuid4().hex[:10]}", price, round(price * 0.1), kind, code_id if kind == "promo" else None),
            )
        c.execute("UPDATE events SET spots_left = capacity - 10 WHERE id = %s", (vinyl,))
        # Insights: a week of people opening it (some came back), and saves.
        for i, uid in enumerate(self.crowd + list(u.values())):
            for back in range(1 + (i % 3 == 0)):
                c.execute("INSERT INTO event_views (event_id, user_id, day) VALUES (%s, %s, CURRENT_DATE - %s) ON CONFLICT DO NOTHING", (vinyl, uid, (i + back * 2) % 7))
        for uid in self.crowd[12:19] + [u["aditi"], u["naina"]]:
            c.execute("INSERT INTO event_hotlist (user_id, event_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (uid, vinyl))

        # Guest side: deals on someone else's night he can book.
        c.execute("""SELECT e.id::text, e.price_inr, e.host_id::text FROM events e
                     WHERE e.title = 'Unplugged Ghazal Evening' AND e.city = 'Mumbai' AND e.date_time > NOW() AND NOT e.is_cancelled
                       AND e.host_id <> %s AND NOT EXISTS (SELECT 1 FROM event_attendees a WHERE a.event_id = e.id AND a.user_id = %s)
                     ORDER BY e.date_time LIMIT 1""", (me, me))
        gz = c.fetchone()
        if gz:
            if gz["price_inr"] < 199:
                c.execute("UPDATE events SET price_inr = 499, platform_fee_inr = 50 WHERE id = %s", (gz["id"],))
                self.note("price_reset", f"{gz['id']}:{gz['price_inr']}")
            # Early bird: 3 spots at 70% of full price. The code beats it, so it visibly applies.
            c.execute("UPDATE events SET early_bird_price_inr = (price_inr * 7 / 10) - 1, early_bird_count = 3 WHERE id = %s", (gz["id"],))
            self.note("eb_reset", gz["id"])
            c.execute("INSERT INTO promo_codes (event_id, host_id, code, percent_off) VALUES (%s, %s, 'GHAZAL40', 40) RETURNING id::text", (gz["id"], gz["host_id"]))
            self.note("promo", c.fetchone()["id"])
            print("Unplugged Ghazal Evening: early bird 3 spots at 70%, code GHAZAL40 (40% off)")

        # ── Vibes ──
        crowd_f = [self.crowd[i] for i in range(1, len(self.crowd), 2)]  # the women in the crowd
        for sender, msg, mins in [(u["tara"], "Your Catan night looks fun, are you doing another one soon?", -95),
                                  (u["isha"], "Saw you at Retro Bollywood Night, your dance moves were something", -300),
                                  (u["naina"], "Okay I need a Catan rematch. Same team?", -12),
                                  (crowd_f[0], "You were the one singing Kishore songs at the karaoke corner right?", -40),
                                  (crowd_f[1], "Also going to Sunset Rooftop Sessions! See you there?", -75),
                                  (crowd_f[2], "Your voice intro made me laugh. Coffee sometime?", -150),
                                  (crowd_f[3], "Fellow yoga person. Know any good morning classes in Bandra?", -220),
                                  (crowd_f[4], "Saw you're hosting board games, I'm terrible but I'm fun", -420),
                                  (crowd_f[5], "Your playlist taste is elite, swap recommendations?", -700),
                                  (crowd_f[6], "Hi! We were both at the dumpling dinner list, are you veg too?", -1100)]:
            c.execute("INSERT INTO vibe_requests (sender_id, receiver_id, message, status, created_at, expires_at) VALUES (%s,%s,%s,'pending',%s,%s) RETURNING id::text",
                      (sender, me, msg, at(minutes=mins), at(days=7, minutes=mins)))
            self.note("vibe", c.fetchone()["id"])
        c.execute("INSERT INTO vibe_requests (sender_id, receiver_id, message, status, created_at, expires_at) VALUES (%s,%s,%s,'pending',%s,%s) RETURNING id::text",
                  (me, u["aditi"], "Heard you're learning ukulele, Thursday's jam needs you", at(hours=-20), at(days=6)))
        self.note("vibe", c.fetchone()["id"])

        # ── Notifications ──
        self.notify("join_request", "New request", "Ananya wants to join Catan & Chai Night", actor=u["ananya"], entity_id=catan, entity_type="event", minutes=-6)
        self.notify("people_from_night", "Who you met at Retro Bollywood Night", "17 people were there. Send a vibe to someone you clicked with.", entity_id=retro, entity_type="night_people", minutes=-30)
        self.notify("vibe_request", "New vibe", "Tara sent you a vibe", actor=u["tara"], minutes=-95)
        self.notify("new_follower", "New follower", "Isha started following you", actor=u["isha"], minutes=-180)
        self.notify("event_rsvp", "Someone's going", "Vikram is going to Catan & Chai Night", actor=u["vikram"], entity_id=catan, entity_type="event", minutes=-240, read=True)
        self.notify("album_prompt", "Photos from Retro Bollywood Night", "Dev and 2 others added photos. Add yours", actor=u["dev"], entity_id=retro, entity_type="event", minutes=-600, read=True)
        self.notify("event_review", "New review", "Naina rated Monsoon Board Game Brunch 5 stars", actor=u["naina"], entity_id=brunch, entity_type="event", minutes=-2000, read=True)
        print("done: friends, 5 chats, 3 group chats, 6 events, album, vibes, notifications")


def clean(cur):
    cur.execute("CREATE TABLE IF NOT EXISTS demo_seed (kind TEXT NOT NULL, id TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())")
    cur.execute("SELECT kind, id FROM demo_seed")
    made = {}
    for r in cur.fetchall():
        made.setdefault(r["kind"], []).append(r["id"])
    if not made:
        return 0
    keys = made.get("r2", [])
    if keys:
        try:
            from utils.r2_client import r2_client
            from utils import chat_realtime as rt
            for k in keys:
                r2_client.delete_file(k, bucket=rt.CHAT_BUCKET)
        except Exception as e:
            print(f"  couldn't delete some album files from R2: {e}")
    ev, users, convs = made.get("event", []), made.get("user", []), made.get("conversation", [])
    for pid in made.get("promo", []):
        cur.execute("UPDATE event_attendees SET promo_code_id = NULL, pricing = NULL WHERE promo_code_id = %s::uuid", (pid,))
        cur.execute("DELETE FROM promo_codes WHERE id = %s::uuid", (pid,))
    for eid in made.get("eb_reset", []):
        cur.execute("UPDATE events SET early_bird_price_inr = NULL, early_bird_count = NULL WHERE id = %s::uuid", (eid,))
    for pr in made.get("price_reset", []):
        eid, old = pr.split(":")
        cur.execute("UPDATE events SET price_inr = %s, platform_fee_inr = CASE WHEN %s > 0 THEN 50 ELSE 0 END WHERE id = %s::uuid", (int(old), int(old), eid))
    for kind, sql in [
        ("notification", "DELETE FROM notifications WHERE id = ANY(%s::uuid[])"),
        ("vibe", "DELETE FROM vibe_requests WHERE id = ANY(%s::uuid[])"),
        ("follow", "DELETE FROM follows WHERE id = ANY(%s::uuid[])"),
        ("photo", "DELETE FROM event_photos WHERE id = ANY(%s::uuid[])"),
    ]:
        if made.get(kind):
            cur.execute(sql, (made[kind],))
    if convs:
        cur.execute("UPDATE conversations SET pinned_message_id = NULL WHERE id = ANY(%s::uuid[])", (convs,))
        cur.execute("DELETE FROM messages WHERE conversation_id = ANY(%s::uuid[])", (convs,))
        cur.execute("DELETE FROM conversation_members WHERE conversation_id = ANY(%s::uuid[])", (convs,))
        cur.execute("DELETE FROM conversations WHERE id = ANY(%s::uuid[])", (convs,))
    if ev:
        cur.execute("DELETE FROM promo_codes WHERE event_id = ANY(%s::uuid[])", (ev,))
        cur.execute("DELETE FROM notifications WHERE entity_id = ANY(%s::uuid[])", (ev,))
        cur.execute("DELETE FROM event_photos WHERE event_id = ANY(%s::uuid[])", (ev,))
        cur.execute("DELETE FROM event_reviews WHERE event_id = ANY(%s::uuid[])", (ev,))
        cur.execute("DELETE FROM event_attendees WHERE event_id = ANY(%s::uuid[])", (ev,))
        cur.execute("UPDATE conversations SET pinned_message_id = NULL WHERE event_id = ANY(%s::uuid[])", (ev,))
        cur.execute("DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE event_id = ANY(%s::uuid[]))", (ev,))
        cur.execute("DELETE FROM conversation_members WHERE conversation_id IN (SELECT id FROM conversations WHERE event_id = ANY(%s::uuid[]))", (ev,))
        cur.execute("DELETE FROM conversations WHERE event_id = ANY(%s::uuid[])", (ev,))
        cur.execute("DELETE FROM events WHERE id = ANY(%s::uuid[])", (ev,))
    if users:
        cur.execute("DELETE FROM notifications WHERE actor_id = ANY(%s::uuid[]) OR user_id = ANY(%s::uuid[])", (users, users))
        cur.execute("DELETE FROM follows WHERE follower_id = ANY(%s::uuid[]) OR following_id = ANY(%s::uuid[])", (users, users))
        cur.execute("DELETE FROM vibe_requests WHERE sender_id = ANY(%s::uuid[]) OR receiver_id = ANY(%s::uuid[])", (users, users))
        cur.execute("DELETE FROM user_photos WHERE user_id = ANY(%s::uuid[])", (users,))
        cur.execute("DELETE FROM users WHERE id = ANY(%s::uuid[])", (users,))
    cur.execute("DELETE FROM demo_seed")
    return sum(len(v) for v in made.values())


if __name__ == "__main__":
    conn = psycopg2.connect(DB, cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        with conn, conn.cursor() as cur:
            n = clean(cur)
            if n:
                print(f"removed {n} things from the last demo seed")
            if "--clean" not in sys.argv:
                Seed(cur).run()
    finally:
        conn.close()
