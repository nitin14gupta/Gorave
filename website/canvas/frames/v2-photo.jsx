// v2 — Photo-led
// Partiful-style: photos everywhere, centered hero over a tilted collage,
// feature tiles with captions + "Learn more", double photo marquee. Paper
// background (lighter than cream) so the photography carries the colour.

const V2Tile = ({ k, w, h, rot, style }) => (
  <div style={{ position: 'absolute', width: w, height: h, borderRadius: 26, overflow: 'hidden', boxShadow: 'var(--shadow-pop)', '--rot': `${rot}deg`, transform: `rotate(${rot}deg)`, animation: 'gr-float 8s ease-in-out infinite', ...style }}>
    <img src={img(k, 500)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </div>
);

const V2Hero = () => (
  <section style={{ position: 'relative', height: 980, background: 'var(--paper)', overflow: 'hidden' }}>
    <FloatingNav />
    <V2Tile k="party1" w={230} h={290} rot={-9} style={{ top: 150, left: 70 }} />
    <V2Tile k="dine3" w={190} h={220} rot={6} style={{ top: 520, left: 150, animationDelay: '1s' }} />
    <V2Tile k="game2" w={170} h={200} rot={-4} style={{ top: 760, left: 30, animationDelay: '2s' }} />
    <V2Tile k="roof1" w={240} h={300} rot={8} style={{ top: 140, right: 80, animationDelay: '.5s' }} />
    <V2Tile k="gig2" w={200} h={240} rot={-7} style={{ top: 520, right: 170, animationDelay: '1.6s' }} />
    <V2Tile k="fr2" w={170} h={200} rot={5} style={{ top: 770, right: 40, animationDelay: '2.4s' }} />
    <div style={{ position: 'relative', textAlign: 'center', paddingTop: 190, maxWidth: 760, margin: '0 auto' }}>
      <Chip bg="#fff" style={{ boxShadow: 'var(--shadow-soft)', fontSize: 13, padding: '8px 14px' }}>🔥 New: Request-to-join for free events</Chip>
      <h1 style={{ margin: '24px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 104, letterSpacing: '-0.055em', lineHeight: .95, color: 'var(--ink)' }}>
        what's happening<br /><span className="gr-grad-text">this weekend?</span>
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 20, color: 'var(--ink-2)', margin: '22px auto 30px', maxWidth: 520, lineHeight: 1.55 }}>Find house parties, rooftops and game nights near you — or throw your own in 30 seconds.</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <Btn size="lg">Explore events</Btn>
        <Btn kind="ink" size="lg">Create an event</Btn>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 46 }}>
        <div style={{ width: 400, padding: 18, borderRadius: 32, background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(16px)', boxShadow: 'var(--shadow-pop)', textAlign: 'left' }}>
          <Bubble name="Tara" avatar={2} delay={0.2}>what's happening friday???</Bubble>
          <div style={{ height: 10 }} />
          <Bubble me delay={0.7}>sending you the gorave link 🔗</Bubble>
        </div>
      </div>
    </div>
  </section>
);

const V2Steps = () => {
  const steps = [
    ['Create your invite', 'Pick a template, set the vibe, add the crowd mix.', 'party3'],
    ['Guests request or book', 'Send one link. Approve who comes, or sell tickets with UPI.', 'fr1'],
    ['Everyone\'s on the same page', 'Updates, reminders, QR check-in — all in one place.', 'roof2'],
  ];
  return (
    <Section bg="var(--paper)">
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 76, letterSpacing: '-0.05em' }}>One link. Everyone's in.</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--ink-2)' }}>Everything your guests need, in one place.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
        {steps.map(([h, p, k], i) => (
          <div key={h} className="gr-hover-lift gr-zoom" style={{ borderRadius: 32, overflow: 'hidden', background: '#fff', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ height: 320, overflow: 'hidden', position: 'relative' }}>
              <img src={img(k, 700)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 16, left: 16, width: 44, height: 44, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>{i + 1}</div>
            </div>
            <div style={{ padding: 26 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em' }}>{h}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.55 }}>{p}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 40 }}><Btn>Create for free</Btn><div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-3)', marginTop: 10 }}>Takes 30 seconds</div></div>
    </Section>
  );
};

const V2PhotoBand = () => {
  const row1 = ['party1', 'roof1', 'game1', 'dine1', 'gig1', 'fr3', 'roof3', 'drinks'];
  const row2 = ['fr5', 'gig4', 'party4', 'dine5', 'fr7', 'neon', 'game3', 'fest'];
  const tile = (k, i) => <img key={k + i} src={img(k, 500)} style={{ width: 300, height: 220, objectFit: 'cover', borderRadius: 24, flexShrink: 0 }} />;
  return (
    <section style={{ background: 'var(--paper)', padding: '20px 0 120px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Marquee speed={60}>{row1.map(tile)}</Marquee>
      <Marquee speed={60} reverse>{row2.map(tile)}</Marquee>
    </section>
  );
};

// "More than an invite" — matches the reference tile layout the user shared
const V2Features = () => {
  const tiles = [
    ['Sell tickets.', true, <div style={{ position: 'relative' }}><img src="assets/img/hostXgorave.png" style={{ width: 260 }} /></div>],
    ['Set the crowd mix.', true, <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
      {['Open', '50:50', '60:40', 'Women only'].map((c, i) => <div key={c} style={{ padding: '14px 18px', borderRadius: 18, background: i === 1 ? 'var(--ink)' : '#fff', color: i === 1 ? 'var(--cream)' : 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, boxShadow: 'var(--shadow-soft)' }}>{c}</div>)}
    </div>],
    ['Approve every guest.', false, <div style={{ width: 280, padding: 14, borderRadius: 22, background: '#fff', boxShadow: 'var(--shadow-pop)' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
          <img src={AVATARS[i + 2]} style={{ width: 38, height: 38, borderRadius: 99, objectFit: 'cover' }} />
          <div style={{ flex: 1 }}><div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14 }}>{['Riya', 'Arjun', 'Dia'][i]}</div><div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--green)' }}>{['3 mutual', 'Came to your events', '5 events attended'][i]}</div></div>
          <span style={{ width: 30, height: 30, borderRadius: 99, background: 'var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✓</span>
        </div>
      ))}
    </div>],
    ['Automated reminders.', false, <Phone w={190}><div style={{ padding: '60px 12px' }}>
      <div style={{ padding: 12, borderRadius: 16, background: 'rgba(255,255,255,.12)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.4 }}>⏰ <b>Sunset Rooftop Sessions</b> is in 2 hours — exact address unlocked 📍</div>
    </div></Phone>],
  ];
  return (
    <Section bg="var(--paper)">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 46 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 76, letterSpacing: '-0.05em', lineHeight: .95 }}>More than an invite</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 20, color: 'var(--ink-2)', margin: '10px 0 0' }}>Everything you need to build community.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}><Btn kind="ghost">For hosts</Btn><Btn kind="ink">Get the app</Btn></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {tiles.map(([cap, more, art]) => (
          <div key={cap}>
            <div className="gr-hover-lift" style={{ height: 400, borderRadius: 24, background: '#EDEAE3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{art}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 20, color: 'var(--ink-2)', marginTop: 16 }}>{cap} {more && <span className="gr-underline" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Learn more</span>}</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

const V2Cities = () => (
  <Section bg="var(--paper)">
    <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 76, letterSpacing: '-0.05em', textAlign: 'center' }}>The best events in your city</h2>
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--ink-2)', textAlign: 'center', margin: '0 0 50px' }}>See what's happening nearby & where your friends are going.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
      {CITIES.map(c => (
        <div key={c.name} className="gr-hover-lift gr-zoom" style={{ height: 300, borderRadius: 28, overflow: 'hidden', position: 'relative' }}>
          <img src={img(c.img, 600)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 35%, rgba(0,0,0,.75))' }} />
          <div style={{ position: 'absolute', left: 20, bottom: 18, color: '#fff' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em' }}>{c.name}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: .85 }}>{c.count} events this week</div>
          </div>
        </div>
      ))}
    </div>
  </Section>
);

const V2Bento = () => (
  <Section bg="var(--paper)">
    <h2 style={{ margin: '0 0 40px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 76, letterSpacing: '-0.05em' }}>A million reasons to hang</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: '300px 300px', gap: 18 }}>
      {EVENT_TYPES.map((t, i) => (
        <div key={t.key} className="gr-zoom" style={{ gridColumn: i === 0 ? 'span 2' : i === 3 ? 'span 2' : 'span 1', gridRow: 'span 1', borderRadius: 28, overflow: 'hidden', position: 'relative' }}>
          <img src={img(t.img, 800)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: 16, bottom: 16 }}><Chip bg={t.tint} color={t.ink} style={{ fontSize: 15, padding: '10px 16px' }}>{t.emoji} {t.label}</Chip></div>
        </div>
      ))}
    </div>
  </Section>
);

const V2Proof = () => (
  <Section bg="var(--paper)" pad="40px 80px 120px">
    <div style={{ borderRadius: 40, background: 'var(--ink)', color: 'var(--cream)', padding: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 76, letterSpacing: '-0.05em', lineHeight: .95 }}>Social life runs on <span className="gr-grad-text">gorave</span></h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--noir-ink-2)' }}>Loved by people who actually go out.</p>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 30 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56 }}>4.9</div>
          <div><div style={{ color: 'var(--gold)', fontSize: 22 }}>★★★★★</div><div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--noir-ink-2)' }}>12k+ ratings</div></div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {['The best events come to me via this app.', 'Hosted my first rooftop — 40 strangers, zero chaos.', 'Women-only nights are a game changer.'].map((q, i) => (
          <div key={q} style={{ padding: 22, borderRadius: 22, background: 'var(--noir-2)', fontFamily: 'var(--font-body)', fontSize: 17, transform: `translateX(${i % 2 ? 30 : 0}px)` }}>"{q}" <span style={{ color: 'var(--noir-ink-2)' }}>— {['Aditi', 'Kabir', 'Neha'][i]}</span></div>
        ))}
      </div>
    </div>
  </Section>
);

const V2Cta = () => (
  <Section bg="var(--paper)" pad="40px 80px 120px" style={{ textAlign: 'center' }}>
    <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 110, letterSpacing: '-0.06em' }}>Get the party started</h2>
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 20, color: 'var(--ink-2)' }}>Your social life will thank you.</p>
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}><Btn size="lg">Get the app</Btn></div>
  </Section>
);

const LandingV2 = () => (
  <div style={{ width: '100%', background: 'var(--paper)', position: 'relative' }}>
    <V2Hero />
    <V2Steps />
    <V2PhotoBand />
    <V2Features />
    <V2Cities />
    <V2Bento />
    <V2Proof />
    <V2Cta />
    <SiteFooter dark={false} />
  </div>
);

Object.assign(window, { LandingV2, V2Hero });
