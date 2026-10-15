// kit.jsx — shared Gorave website primitives used by every landing variant.
// Mirrors the component library the real Next.js site will have
// (components/layout, components/motion, components/ui) so whichever variant
// wins maps 1:1 onto real components.
//
// Canvas conventions: no imports, inline styles, window.X exports.

// ── Media ──────────────────────────────────────────────────────
const U = (id, w = 900) => `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=70`;
const R2 = (n) => `https://pub-f5cb81cf85a5471d9abf932f74d1ae0e.r2.dev/housepartyshowcase/${n}.webp`;

const PH = {
  party1: 'photo-1527529482837-4698179dc6ce', party2: 'photo-1530103862676-de8c9debad1d',
  party3: 'photo-1511795409834-ef04bbd61622', party4: 'photo-1533174072545-7a4b6ad7a6c3',
  roof1: 'photo-1519671482749-fd09be7ccebf', roof2: 'photo-1492684223066-81342ee5ff30',
  roof3: 'photo-1566737236500-c8ac43014a67', lights: 'photo-1470229722913-7c0e2dbbafd3',
  game1: 'photo-1610890716171-6b1bb98ffd09', game2: 'photo-1606503153255-59d8b8b82176',
  game3: 'photo-1632501641765-e568d28b0015', game4: 'photo-1611371805429-8b5c1b2c34ba',
  dine1: 'photo-1414235077428-338989a2e8c0', dine2: 'photo-1517457373958-b7bdd4587205',
  dine3: 'photo-1528605248644-14dd04022da1', dine4: 'photo-1543007630-9710e4a00a20',
  dine5: 'photo-1555939594-58d7cb561ad1', dine6: 'photo-1559339352-11d035aa65de',
  gig1: 'photo-1493225457124-a3eb161ffa5f', gig2: 'photo-1514525253161-7a46d19cd819',
  gig3: 'photo-1524368535928-5b5e00ddc76b', gig4: 'photo-1506157786151-b8491531f063',
  gig5: 'photo-1516450360452-9312f5e86fc7', gig6: 'photo-1504196606672-aef5c9cefc92',
  fr1: 'photo-1529156069898-49953e39b3ac', fr2: 'photo-1529543544282-ea669407fca3',
  fr3: 'photo-1543269865-cbf427effbad', fr4: 'photo-1528495612343-9ca9f4a4de28',
  fr5: 'photo-1517263904808-5dc91e3e7044', fr6: 'photo-1523580494863-6f3031224c94',
  fr7: 'photo-1540575467063-178a50c2df87', fr8: 'photo-1532635241-17e820acc59f',
  fr9: 'photo-1508997449629-303059a039c0', fest: 'photo-1501281668745-f7f57925c3b4',
  neon: 'photo-1496024840928-4c417adf211d', drinks: 'photo-1470337458703-46ad1756a187',
  roof4: 'photo-1516997121675-4c2d1684aa3e',
};
const img = (k, w) => U(PH[k], w);

const AVATARS = [
  'photo-1494790108377-be9c29b29330', 'photo-1507003211169-0a1dd7228f2d',
  'photo-1438761681033-6461ffad8d80', 'photo-1500648767791-00dcc994a43e',
  'photo-1544005313-94ddf0286df2', 'photo-1506794778202-cad84cf45f1d',
].map(id => U(id, 120));

// ── Real-ish data (mirrors server seed + client constants) ─────
const EVENT_TYPES = [
  { key: 'house_party', label: 'House Parties', blurb: 'Living rooms that turn into dance floors', img: 'party1', tint: 'var(--blush)', ink: 'var(--blush-ink)', emoji: '🪩' },
  { key: 'rooftop', label: 'Rooftops', blurb: 'Sunsets, skylines, one more song', img: 'roof1', tint: 'var(--sky)', ink: 'var(--sky-ink)', emoji: '🌇' },
  { key: 'game_night', label: 'Game Nights', blurb: 'Catan, Mafia and friendly betrayal', img: 'game1', tint: 'var(--sage)', ink: 'var(--sage-ink)', emoji: '🎲' },
  { key: 'dinner', label: 'Supper Clubs', blurb: 'Long tables, strangers, second helpings', img: 'dine1', tint: 'var(--cream-deep)', ink: 'var(--ink)', emoji: '🍝' },
  { key: 'music', label: 'Gigs & Jams', blurb: 'Living-room gigs and open circles', img: 'gig1', tint: 'var(--blush)', ink: 'var(--blush-ink)', emoji: '🎸' },
  { key: 'other', label: 'Everything else', blurb: 'Potlucks, swaps, garba, karaoke', img: 'fr2', tint: 'var(--sage)', ink: 'var(--sage-ink)', emoji: '✨' },
];

const CITIES = [
  { name: 'Mumbai', count: 142, areas: ['Bandra', 'Khar', 'Andheri', 'Lower Parel', 'Powai'], img: 'roof2' },
  { name: 'Bangalore', count: 96, areas: ['Indiranagar', 'Koramangala', 'HSR'], img: 'gig2' },
  { name: 'Delhi', count: 88, areas: ['Hauz Khas', 'CP', 'GK'], img: 'neon' },
  { name: 'Pune', count: 54, areas: ['Koregaon Park', 'Baner', 'Viman Nagar'], img: 'party3' },
  { name: 'Hyderabad', count: 47, areas: ['Jubilee Hills', 'Banjara Hills'], img: 'fest' },
  { name: 'Chennai', count: 31, areas: ['Adyar', 'Besant Nagar'], img: 'dine3' },
  { name: 'Kolkata', count: 28, areas: ['Park Street', 'Salt Lake'], img: 'gig4' },
  { name: 'Goa', count: 36, areas: ['Anjuna', 'Assagao', 'Panjim'], img: 'roof4' },
];

const SAMPLE_EVENTS = [
  { title: 'Sunset Rooftop Sessions', area: 'Bandra West', city: 'Mumbai', when: 'Sat · 6 PM', price: '₹799', img: 'roof1', mix: '50:50', going: 18 },
  { title: 'Bollywood Retro Night', area: 'Khar West', city: 'Mumbai', when: 'Sun · 9 PM', price: 'Free', img: 'party2', mix: '50:50', going: 12, request: true },
  { title: 'Midnight Board Game Café', area: 'Andheri West', city: 'Mumbai', when: 'Fri · 8 PM', price: 'Free', img: 'game1', going: 9, request: true },
  { title: "Chef's Table: Coastal Konkan", area: 'Lower Parel', city: 'Mumbai', when: 'Tue · 8 PM', price: '₹1,499', img: 'dine2', going: 6 },
  { title: 'Indie Gig at the Loft', area: 'Versova', city: 'Mumbai', when: 'Thu · 8 PM', price: '₹499', img: 'gig3', going: 31 },
  { title: "Girls' Night: Wine & Paint", area: 'Juhu', city: 'Mumbai', when: 'Sat · 7 PM', price: 'Free', img: 'drinks', mix: 'Women only', going: 8, request: true },
];

const NAV_LINKS = ['Events', 'Cities', 'Host', 'Guides', 'Safety'];

// ── Atoms ──────────────────────────────────────────────────────
const Logo = ({ dark = false, size = 26 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <img src={dark ? 'assets/img/splash-icon.png' : 'assets/img/black-icon.png'} style={{ width: size, height: size, objectFit: 'contain' }} />
    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.82, letterSpacing: '-0.04em', color: dark ? 'var(--noir-ink)' : 'var(--ink)' }}>gorave</span>
  </div>
);

const Btn = ({ children, kind = 'primary', size = 'md', dark = false, style }) => {
  const pad = size === 'lg' ? '18px 30px' : size === 'sm' ? '9px 16px' : '13px 22px';
  const fs = size === 'lg' ? 17 : size === 'sm' ? 13 : 15;
  const base = { display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: pad, fontSize: fs, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', transition: 'transform .3s cubic-bezier(.2,.8,.2,1)' };
  if (kind === 'primary') return <button className="gr-shine-btn" style={{ ...base, color: '#fff', boxShadow: '0 14px 30px -12px rgba(255,56,100,.6)', ...style }}>{children}</button>;
  if (kind === 'ink') return <button style={{ ...base, background: dark ? 'var(--noir-ink)' : 'var(--ink)', color: dark ? 'var(--ink)' : 'var(--cream)', ...style }}>{children}</button>;
  return <button style={{ ...base, background: 'transparent', color: dark ? 'var(--noir-ink)' : 'var(--ink)', boxShadow: `inset 0 0 0 1.5px ${dark ? 'rgba(245,240,235,.3)' : 'rgba(23,19,16,.18)'}`, ...style }}>{children}</button>;
};

const Eyebrow = ({ children, dark, color }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: color || (dark ? 'var(--noir-ink-2)' : 'var(--ink-3)') }}>
    <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--brand-grad)' }} />{children}
  </div>
);

const AvatarStack = ({ n = 4, size = 28, ring = 'var(--cream)' }) => (
  <div style={{ display: 'flex' }}>
    {AVATARS.slice(0, n).map((a, i) => (
      <img key={i} src={a} style={{ width: size, height: size, borderRadius: 99, objectFit: 'cover', border: `2.5px solid ${ring}`, marginLeft: i ? -size * 0.32 : 0 }} />
    ))}
  </div>
);

const Chip = ({ children, bg = 'rgba(23,19,16,.06)', color = 'var(--ink)', style }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: bg, color, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, ...style }}>{children}</span>
);

const StoreBadges = ({ dark }) => (
  <div style={{ display: 'flex', gap: 10 }}>
    {[['', 'Download on the', 'App Store'], ['▶', 'Get it on', 'Google Play']].map(([g, a, b]) => (
      <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderRadius: 14, background: dark ? 'var(--noir-ink)' : 'var(--ink)', color: dark ? 'var(--ink)' : 'var(--cream)' }}>
        <span style={{ fontSize: 20 }}>{g}</span>
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-body)', opacity: .75 }}>{a}</div>
          <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{b}</div>
        </div>
      </div>
    ))}
  </div>
);

// ── Chat (the hero device — Partiful-style "group chat" story) ──
const TypingDots = ({ color = 'var(--ink-3)' }) => (
  <div style={{ display: 'inline-flex', gap: 4, padding: '12px 14px', borderRadius: 20, background: '#fff' }}>
    {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: 9, background: color, animation: `gr-typing 1.2s ${i * 0.15}s infinite` }} />)}
  </div>
);

const Bubble = ({ children, me, delay = 0, name, avatar }) => (
  <div style={{ display: 'flex', flexDirection: me ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, animation: `gr-pop .6s ${delay}s both cubic-bezier(.2,.8,.2,1)` }}>
    {!me && avatar != null && <img src={AVATARS[avatar]} style={{ width: 28, height: 28, borderRadius: 99, objectFit: 'cover' }} />}
    <div>
      {name && <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-body)', fontWeight: 700, margin: '0 0 3px 12px' }}>{name}</div>}
      <div style={{
        maxWidth: 260, padding: '11px 15px', borderRadius: 22,
        borderBottomRightRadius: me ? 6 : 22, borderBottomLeftRadius: me ? 22 : 6,
        background: me ? 'var(--brand-grad)' : '#fff', color: me ? '#fff' : 'var(--ink)',
        fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, lineHeight: 1.35,
        boxShadow: '0 8px 20px -14px rgba(23,19,16,.35)',
      }}>{children}</div>
    </div>
  </div>
);

// The invite card that drops into the chat — the Gorave link preview.
const InviteCard = ({ ev = SAMPLE_EVENTS[0], delay = 0, tilt = 0, width = 270 }) => (
  <div style={{ width, borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: 'var(--shadow-pop)', transform: `rotate(${tilt}deg)`, animation: `gr-pop .7s ${delay}s both cubic-bezier(.2,.8,.2,1)` }}>
    <div style={{ position: 'relative', height: width * 0.62 }}>
      <img src={img(ev.img, 600)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', left: 12, top: 12, display: 'flex', gap: 6 }}>
        <Chip bg="rgba(255,255,255,.92)">{ev.when}</Chip>
        {ev.mix && <Chip bg="rgba(255,255,255,.92)">{ev.mix}</Chip>}
      </div>
    </div>
    <div style={{ padding: '12px 14px 14px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--ink)' }}>{ev.title}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>📍 {ev.area}, {ev.city} · {ev.price}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AvatarStack n={3} size={22} ring="#fff" />
          <span style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--ink-2)' }}>{ev.going} going</span>
        </div>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, padding: '7px 12px', borderRadius: 99, background: 'var(--ink)', color: 'var(--cream)' }}>{ev.request ? 'Request' : 'RSVP'}</span>
      </div>
    </div>
  </div>
);

const ChatThread = ({ dark }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <Bubble name="Riya" avatar={0} delay={0.1}>anyone free saturday?? 🥺</Bubble>
    <Bubble name="Kabir" avatar={1} delay={0.5}>only if it's not another café</Bubble>
    <Bubble me delay={0.9}>found a rooftop thing in bandra 👀</Bubble>
    <div style={{ alignSelf: 'flex-end' }}><InviteCard delay={1.3} tilt={-2} /></div>
    <Bubble name="Riya" avatar={0} delay={1.8}>IN. requesting rn 🙋‍♀️</Bubble>
    <div style={{ animation: 'gr-pop .5s 2.2s both' }}><TypingDots /></div>
  </div>
);

// ── Phone mock ─────────────────────────────────────────────────
const Phone = ({ children, w = 300, tilt = 0, shadow = true, bg = 'var(--noir)' }) => (
  <div style={{ width: w, height: w * 2.05, borderRadius: w * 0.16, padding: w * 0.035, background: '#0c0c0c', boxShadow: shadow ? '0 40px 90px -30px rgba(23,19,16,.55)' : 'none', transform: `rotate(${tilt}deg)`, flexShrink: 0 }}>
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.13, overflow: 'hidden', background: bg }}>
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: w * 0.32, height: 24, borderRadius: 99, background: '#000', zIndex: 5 }} />
      {children}
    </div>
  </div>
);

// App-accurate dark event screen, for phone mocks
const AppEventScreen = ({ ev = SAMPLE_EVENTS[0] }) => (
  <div style={{ height: '100%', color: 'var(--noir-ink)', fontFamily: 'var(--font-body)' }}>
    <div style={{ height: '46%', position: 'relative' }}>
      <img src={img(ev.img, 500)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, #111)' }} />
    </div>
    <div style={{ padding: '0 16px', marginTop: -30, position: 'relative' }}>
      <div style={{ display: 'flex', gap: 6 }}><Chip bg="rgba(255,255,255,.12)" color="var(--noir-ink)">Rooftop</Chip><Chip bg="rgba(255,255,255,.12)" color="var(--noir-ink)">21+</Chip><Chip bg="rgba(255,255,255,.12)" color="var(--noir-ink)">50:50</Chip></div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginTop: 10, lineHeight: 1.1 }}>{ev.title}</div>
      <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: 'var(--noir-2)', fontSize: 12, lineHeight: 1.9, color: 'var(--noir-ink-2)' }}>
        <div>📅 {ev.when}, 18 Oct</div>
        <div>📍 {ev.area}, {ev.city} · 🔒 exact address after you're in</div>
        <div>👥 {ev.going} going · 4 for women · 3 for men</div>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(17,17,17,.95)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{ev.price}</div>
      <div style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--brand-grad)', fontWeight: 700, fontSize: 13 }}>Book Now</div>
    </div>
  </div>
);

// ── Cards ──────────────────────────────────────────────────────
const EventCard = ({ ev, w = 300, h = 380, dark }) => (
  <div className="gr-hover-lift gr-zoom" style={{ width: w, flexShrink: 0, borderRadius: 'var(--r-card)', overflow: 'hidden', background: dark ? 'var(--noir-2)' : '#fff', boxShadow: 'var(--shadow-soft)' }}>
    <div style={{ height: h * 0.62, overflow: 'hidden', position: 'relative' }}>
      <img src={img(ev.img, 700)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
        <Chip bg="rgba(255,255,255,.92)">{ev.when}</Chip>
        {ev.request && <Chip bg="rgba(255,255,255,.92)">✋ Request</Chip>}
      </div>
    </div>
    <div style={{ padding: 16 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em', color: dark ? 'var(--noir-ink)' : 'var(--ink)', lineHeight: 1.15 }}>{ev.title}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: dark ? 'var(--noir-ink-2)' : 'var(--ink-3)', marginTop: 4 }}>{ev.area} · {ev.price}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <AvatarStack n={3} size={22} ring={dark ? 'var(--noir-2)' : '#fff'} />
        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', color: dark ? 'var(--noir-ink-2)' : 'var(--ink-2)' }}>{ev.going} going</span>
      </div>
    </div>
  </div>
);

// ── Marquee ────────────────────────────────────────────────────
// Real site: speed couples to scroll velocity, pauses on hover.
const Marquee = ({ children, speed = 40, reverse = false, gap = 16, style }) => (
  <div style={{ overflow: 'hidden', width: '100%', ...style }}>
    <div style={{ display: 'flex', gap, width: 'max-content', animation: `${reverse ? 'gr-marquee-r' : 'gr-marquee'} ${speed}s linear infinite` }}>
      {children}{children}
    </div>
  </div>
);

const WordMarquee = ({ words, dark, size = 64, sep = '✺' }) => (
  <Marquee speed={36} gap={36}>
    {words.map((w, i) => (
      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 36, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size, letterSpacing: '-0.04em', color: dark ? 'var(--noir-ink)' : 'var(--ink)', whiteSpace: 'nowrap' }}>
        {w}<span className="gr-grad-text" style={{ fontSize: size * 0.6 }}>{sep}</span>
      </span>
    ))}
  </Marquee>
);

// ── Navigation ─────────────────────────────────────────────────
// Floating pill. Real site: hides on scroll-down, returns on scroll-up or
// when the cursor nears the top; hovering a link morphs open the mega menu.
const FloatingNav = ({ dark = false, active = null, glass = true, top = 18 }) => (
  <div style={{ position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 50 }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 28, padding: '10px 10px 10px 22px', borderRadius: 999,
      background: dark ? 'rgba(26,26,26,.72)' : glass ? 'rgba(251,247,239,.78)' : 'var(--paper)',
      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      boxShadow: dark ? '0 0 0 1px rgba(255,255,255,.08), 0 18px 40px -20px rgba(0,0,0,.6)' : '0 0 0 1px rgba(23,19,16,.06), 0 18px 40px -22px rgba(23,19,16,.35)',
    }}>
      <Logo dark={dark} size={24} />
      <div style={{ display: 'flex', gap: 22 }}>
        {NAV_LINKS.map(l => (
          <span key={l} className="gr-underline" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: active === l ? (dark ? '#fff' : 'var(--ink)') : (dark ? 'var(--noir-ink-2)' : 'var(--ink-2)'), display: 'flex', alignItems: 'center', gap: 4 }}>
            {l}{(l === 'Events' || l === 'Cities') && <span style={{ fontSize: 9, opacity: .6 }}>▼</span>}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn kind="ghost" size="sm" dark={dark}>Host an event</Btn>
        <Btn kind="primary" size="sm">Get the app</Btn>
      </div>
    </div>
  </div>
);

// Apple-style mega menu: panel height morphs between menus, content
// cross-fades; columns of links + a featured image card.
const MegaMenu = ({ menu = 'Events', dark = false, top = 84 }) => {
  const cols = menu === 'Events'
    ? [
        ['By vibe', EVENT_TYPES.map(t => `${t.emoji}  ${t.label}`)],
        ['When', ['Tonight', 'This weekend', 'Friday night', 'New Year\'s Eve', 'Holi', 'Diwali']],
        ['Who it\'s for', ['Free events', 'Under ₹500', 'Women only', '21+ nights', 'Singles mixers', 'Couples']],
      ]
    : [
        ['Metros', CITIES.slice(0, 4).map(c => c.name)],
        ['More cities', CITIES.slice(4).map(c => c.name)],
        ['Mumbai hot spots', CITIES[0].areas],
      ];
  const feature = menu === 'Events' ? SAMPLE_EVENTS[0] : { title: 'Mumbai this weekend', img: 'roof2', when: 'Bandra · Khar · Andheri' };
  return (
    <div style={{ position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 49 }}>
      <div style={{
        width: 980, padding: 28, borderRadius: 32, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 280px', gap: 28,
        background: dark ? 'rgba(26,26,26,.92)' : 'rgba(251,247,239,.94)', backdropFilter: 'blur(24px)',
        boxShadow: '0 0 0 1px rgba(23,19,16,.06), 0 40px 90px -40px rgba(23,19,16,.5)',
        animation: 'gr-pop .45s both cubic-bezier(.2,.8,.2,1)',
      }}>
        {cols.map(([h, items]) => (
          <div key={h}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 12 }}>{h}</div>
            {items.map(i => <div key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: dark ? 'var(--noir-ink)' : 'var(--ink)', padding: '6px 0' }}>{i}</div>)}
          </div>
        ))}
        <div className="gr-zoom" style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', minHeight: 220 }}>
          <img src={img(feature.img, 600)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,.7))' }} />
          <div style={{ position: 'absolute', left: 16, bottom: 14, color: '#fff' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: .85 }}>{feature.when}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{feature.title}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bottom dock — appears after the hero, hides above the footer.
const FloatingDock = ({ dark, bottom = 22 }) => (
  <div style={{ position: 'absolute', bottom, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 50 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 8px 8px 18px', borderRadius: 999, background: 'var(--ink)', color: 'var(--cream)', boxShadow: '0 24px 50px -20px rgba(23,19,16,.6)' }}>
      <AvatarStack n={3} size={26} ring="var(--ink)" />
      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14 }}>Your next Saturday is on Gorave</span>
      <Btn kind="primary" size="sm">Get the app</Btn>
    </div>
  </div>
);

// ── Footer ─────────────────────────────────────────────────────
const SiteFooter = ({ dark = true }) => {
  const c = dark ? 'var(--noir-ink-2)' : 'var(--ink-3)';
  const cols = [
    ['Explore', ['Events near you', 'This weekend', 'Free events', 'All cities']],
    ['Host', ['Host on Gorave', 'How payouts work', 'Hosting guides', 'Badges']],
    ['Company', ['About', 'Safety', 'Blog', 'Careers']],
    ['Help', ['Help centre', 'Contact', 'Terms', 'Privacy']],
  ];
  return (
    <div style={{ background: dark ? 'var(--noir)' : 'var(--cream-deep)', padding: '80px 80px 0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 60 }}>
        <div style={{ maxWidth: 340 }}>
          <Logo dark={dark} size={30} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: c, lineHeight: 1.6, marginTop: 16 }}>House parties, rooftops, game nights and supper clubs — hosted by real people in your city. Built for Gen-Z India.</p>
          <div style={{ marginTop: 20 }}><StoreBadges dark={dark} /></div>
        </div>
        <div style={{ display: 'flex', gap: 70 }}>
          {cols.map(([h, items]) => (
            <div key={h}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: dark ? 'var(--noir-ink)' : 'var(--ink)', marginBottom: 14 }}>{h}</div>
              {items.map(i => <div key={i} className="gr-underline" style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: c, padding: '5px 0', width: 'fit-content' }}>{i}</div>)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 300, letterSpacing: '-0.07em', lineHeight: .78, marginTop: 70, textAlign: 'center' }} className="gr-grad-text">gorave</div>
    </div>
  );
};

// Section wrapper with standard gutters
const Section = ({ children, bg = 'transparent', pad = '120px 80px', style }) => (
  <section style={{ background: bg, padding: pad, position: 'relative', ...style }}>{children}</section>
);

Object.assign(window, {
  U, R2, PH, img, AVATARS, EVENT_TYPES, CITIES, SAMPLE_EVENTS, NAV_LINKS,
  Logo, Btn, Eyebrow, AvatarStack, Chip, StoreBadges,
  TypingDots, Bubble, InviteCard, ChatThread, Phone, AppEventScreen,
  EventCard, Marquee, WordMarquee, FloatingNav, MegaMenu, FloatingDock, SiteFooter, Section,
});
