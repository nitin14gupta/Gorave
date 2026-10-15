// v1 — Editorial Cream
// Magazine energy: huge Cabinet Extrabold headlines with photos set inline in
// the type, lots of cream paper, ink rules, polaroids. Noir appears once
// (safety) as the "portal into the app".

const V1Headline = () => {
  const pill = (k, w = 150, rot = 0) => (
    <span style={{ display: 'inline-block', width: w, height: 92, borderRadius: 999, overflow: 'hidden', verticalAlign: 'middle', margin: '0 10px', transform: `rotate(${rot}deg) translateY(-8px)`, boxShadow: 'var(--shadow-soft)' }}>
      <img src={img(k, 400)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </span>
  );
  return (
    <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 118, lineHeight: .98, letterSpacing: '-0.055em', color: 'var(--ink)' }}>
      Parties{pill('party1', 170, -4)}are better<br />with{pill('fr1', 150, 3)}<span className="gr-grad-text">your people.</span>
    </h1>
  );
};

const V1Polaroid = ({ k, label, rot, style }) => (
  <div style={{ position: 'absolute', padding: 10, paddingBottom: 34, background: '#fff', borderRadius: 6, boxShadow: 'var(--shadow-pop)', '--rot': `${rot}deg`, transform: `rotate(${rot}deg)`, animation: 'gr-float 7s ease-in-out infinite', ...style }}>
    <img src={img(k, 400)} style={{ width: 170, height: 190, objectFit: 'cover', display: 'block' }} />
    <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink-2)' }}>{label}</div>
  </div>
);

const V1Hero = () => (
  <section style={{ position: 'relative', background: 'var(--cream)', padding: '150px 80px 90px', overflow: 'hidden' }}>
    <FloatingNav />
    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 40, alignItems: 'center' }}>
      <div>
        <Eyebrow>412 parties in Mumbai this week</Eyebrow>
        <div style={{ height: 22 }} />
        <V1Headline />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 20, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 560, margin: '30px 0 34px' }}>
          House parties, rooftops, game nights and supper clubs — hosted by real people near you. Verified 18+ guests, one link, zero awkward group-chat chaos.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Btn size="lg">Find a party →</Btn>
          <Btn kind="ghost" size="lg">Host one free</Btn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 30 }}>
          <AvatarStack n={5} size={34} />
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-2)' }}><b>4.9 ★</b> · loved by 40k+ people who actually go out</div>
        </div>
      </div>
      <div style={{ position: 'relative', height: 720 }}>
        <V1Polaroid k="roof1" label="bandra, sat" rot={-8} style={{ top: 10, left: -20 }} />
        <V1Polaroid k="game1" label="mafia night" rot={7} style={{ bottom: 20, right: -30, animationDelay: '1.5s' }} />
        <div style={{ position: 'absolute', top: 70, left: 70, width: 380, padding: 22, borderRadius: 36, background: 'rgba(251,247,239,.85)', backdropFilter: 'blur(14px)', boxShadow: 'var(--shadow-pop)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid var(--line)', marginBottom: 14 }}>
            <AvatarStack n={3} size={26} ring="var(--paper)" />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>the sat plan 🫶</div>
          </div>
          <ChatThread />
        </div>
      </div>
    </div>
  </section>
);

const V1Marquee = () => (
  <div style={{ background: 'var(--cream)', borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)', padding: '26px 0' }}>
    <WordMarquee size={72} words={['House parties', 'Rooftops', 'Game nights', 'Supper clubs', 'Living-room gigs', 'Garba nights', 'Karaoke']} />
  </div>
);

const V1How = () => {
  const steps = [
    ['01', 'Find your night', 'Browse what\'s on in your city — by vibe, by date, by price. Closest first.', <InviteCard ev={SAMPLE_EVENTS[1]} width={240} tilt={-3} />],
    ['02', 'Request or book', 'Free events are host-approved, so the crowd stays right. Paid ones book in a tap with UPI.',
      <div style={{ width: 260, padding: 16, borderRadius: 22, background: 'var(--noir)', color: 'var(--noir-ink)', boxShadow: 'var(--shadow-pop)', transform: 'rotate(2deg)' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--noir-ink-2)' }}>gorave · now</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginTop: 4 }}>You're in! 🎉</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--noir-ink-2)', marginTop: 4 }}>Your request for Bollywood Retro Night was accepted — ticket ready.</div>
      </div>],
    ['03', 'Show up, scan in', 'Exact address unlocks once you\'re in. Your QR ticket gets you through the door.',
      <div style={{ width: 210, padding: 18, borderRadius: 26, background: '#fff', boxShadow: 'var(--shadow-pop)', transform: 'rotate(-2deg)', textAlign: 'center' }}>
        <div style={{ width: 150, height: 150, margin: '0 auto', borderRadius: 12, background: 'repeating-conic-gradient(var(--ink) 0 25%, #fff 0 50%) 0 0/18px 18px' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginTop: 12 }}>Ticket · Riya S.</div>
      </div>],
  ];
  return (
    <Section bg="var(--cream)">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 70 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 84, letterSpacing: '-0.05em', lineHeight: .95 }}>One link.<br />Everyone's in.</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--ink-2)', maxWidth: 380, lineHeight: 1.6 }}>No more "who's coming?" spreadsheets. Gorave handles the guest list, the money and the door.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1.5px solid var(--ink)' }}>
        {steps.map(([n, h, p, art], i) => (
          <div key={n} style={{ padding: '34px 30px 0', borderLeft: i ? '1.5px solid var(--ink)' : 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 40, color: 'var(--orange)' }}>{n}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', marginTop: 8 }}>{h}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.6, minHeight: 80 }}>{p}</p>
            <div style={{ height: 330, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{art}</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

const V1Types = () => (
  <section style={{ background: 'var(--paper)', padding: '120px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 80px', marginBottom: 46 }}>
      <div>
        <Eyebrow>A million reasons to hang</Eyebrow>
        <h2 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 84, letterSpacing: '-0.05em', lineHeight: .95 }}>Pick your kind<br />of night.</h2>
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--ink-3)' }}>scroll — the section pins while cards slide →</div>
    </div>
    <div className="gr-noscroll" style={{ display: 'flex', gap: 22, padding: '0 80px', overflow: 'hidden' }}>
      {EVENT_TYPES.map((t, i) => (
        <div key={t.key} className="gr-hover-lift gr-zoom" style={{ width: 340, height: 480, flexShrink: 0, borderRadius: 32, overflow: 'hidden', position: 'relative', transform: `translateY(${i % 2 ? 40 : 0}px)` }}>
          <img src={img(t.img, 700)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, padding: 18, borderRadius: 22, background: t.tint, color: t.ink }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em' }}>{t.emoji} {t.label}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 4, opacity: .8 }}>{t.blurb}</div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const V1Cities = () => (
  <Section bg="var(--cream)">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 60 }}>
      <div>
        <Eyebrow>The best events in your city</Eyebrow>
        <h2 style={{ margin: '14px 0 20px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 72, letterSpacing: '-0.05em', lineHeight: .95 }}>Where's the party tonight?</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.6 }}>Live in 8 cities and counting. Hover a city to peek inside.</p>
      </div>
      <div style={{ position: 'relative' }}>
        {CITIES.slice(0, 6).map((c, i) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderTop: '1.5px solid var(--ink)', color: i === 0 ? 'var(--orange)' : 'var(--ink)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, letterSpacing: '-0.04em' }}>{c.name}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16 }}>{c.count} this week →</span>
          </div>
        ))}
        {/* Cursor-follow preview (hover state shown on Mumbai) */}
        <div style={{ position: 'absolute', top: -40, left: 290, width: 230, height: 290, borderRadius: 22, overflow: 'hidden', transform: 'rotate(5deg)', boxShadow: 'var(--shadow-pop)', pointerEvents: 'none' }}>
          <img src={img('roof2', 500)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: 12, bottom: 12 }}><Chip bg="rgba(255,255,255,.92)">Bandra · Khar · Andheri</Chip></div>
        </div>
      </div>
    </div>
  </Section>
);

const V1Safety = () => {
  const cards = [
    ['🪪', 'Every guest is verified', 'Phone-verified, 18+ only. Hosts see who\'s coming before they accept.'],
    ['🔒', 'Addresses stay private', 'Only confirmed guests get the exact location. Everyone else sees the area.'],
    ['🆘', 'SOS in one tap', 'Live location to your emergency contacts, even in the background.'],
    ['⭐', 'Reviewed hosts', 'Every event gets rated. Hosts earn badges — Rising to Legend.'],
  ];
  return (
    <Section bg="var(--noir)" style={{ color: 'var(--noir-ink)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 70, alignItems: 'start' }}>
        <div style={{ position: 'sticky', top: 0 }}>
          <Eyebrow dark>Safety, built in</Eyebrow>
          <h2 style={{ margin: '14px 0 20px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 80, letterSpacing: '-0.05em', lineHeight: .95 }}>Go out.<br /><span className="gr-grad-text">Feel safe.</span></h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--noir-ink-2)', lineHeight: 1.6, maxWidth: 440 }}>Strangers become friends faster when everyone's real. That's the whole point of Gorave.</p>
          <div style={{ marginTop: 30 }}><Btn kind="ghost" dark>Read our safety promise</Btn></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cards.map(([e, h, p], i) => (
            <div key={h} style={{ padding: 28, borderRadius: 28, background: 'var(--noir-2)', boxShadow: '0 0 0 1px rgba(255,255,255,.06)', transform: `translateX(${i * 18}px)` }}>
              <div style={{ fontSize: 30 }}>{e}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, marginTop: 10 }}>{h}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--noir-ink-2)', marginTop: 6, lineHeight: 1.55 }}>{p}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

const V1Hosts = () => (
  <Section bg="var(--blush)">
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 60, alignItems: 'center' }}>
      <div>
        <Eyebrow color="var(--blush-ink)">For hosts</Eyebrow>
        <h2 style={{ margin: '14px 0 20px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 84, letterSpacing: '-0.05em', lineHeight: .95, color: 'var(--blush-ink)' }}>Throw it.<br />Fill it.<br />Get paid.</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--blush-ink)', opacity: .8, lineHeight: 1.6, maxWidth: 480 }}>Your first 2 events a month are free. Sell tickets with UPI, set the crowd mix, approve every guest — 90% lands in your account after the event.</p>
        <div style={{ display: 'flex', gap: 40, margin: '34px 0' }}>
          {[['90%', 'of every ticket'], ['2×', 'more bookings for Elite hosts'], ['₹0', 'to start']].map(([n, l]) => (
            <div key={l}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--blush-ink)' }}>{n}</div><div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--blush-ink)', opacity: .7 }}>{l}</div></div>
          ))}
        </div>
        <Btn kind="ink">Become a host →</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {[['rising', 'Rising', '2+ events'], ['established', 'Established', '10+'], ['elite', 'Elite', '25+'], ['legend', 'Legend', '75+']].map(([b, n, r], i) => (
          <div key={b} className="gr-hover-lift" style={{ padding: 24, borderRadius: 28, background: 'rgba(255,255,255,.55)', textAlign: 'center', transform: `rotate(${[-3, 2, 2, -2][i]}deg)` }}>
            <img src={`assets/img/${b}.png`} style={{ width: 110, height: 110, objectFit: 'contain' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--blush-ink)' }}>{n}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--blush-ink)', opacity: .7 }}>{r} hosted</div>
          </div>
        ))}
      </div>
    </div>
  </Section>
);

const V1Proof = () => {
  const quotes = [
    ['The best events come to me via this app. Met my whole friend group here.', 'Aditi, Mumbai'],
    ['Hosted my first rooftop — 40 strangers, zero chaos, ₹18k in my UPI.', 'Kabir, Bangalore'],
    ['Women-only nights are a game changer. Finally feels safe to go solo.', 'Neha, Pune'],
    ['Way better than another Saturday at the same café.', 'Vihaan, Delhi'],
  ];
  return (
    <section style={{ background: 'var(--cream)', padding: '120px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 50 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 96, letterSpacing: '-0.05em' }}>4.9 <span className="gr-grad-text">★★★★★</span></div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--ink-2)' }}>Social life runs on Gorave.</div>
      </div>
      <Marquee speed={50} gap={20}>
        {quotes.map(([q, a], i) => (
          <div key={i} style={{ width: 420, padding: 28, borderRadius: 28, background: '#fff', boxShadow: 'var(--shadow-soft)', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, lineHeight: 1.3, color: 'var(--ink)' }}>"{q}"</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
              <img src={AVATARS[i]} style={{ width: 34, height: 34, borderRadius: 99, objectFit: 'cover' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--ink-2)' }}>{a}</span>
            </div>
          </div>
        ))}
      </Marquee>
    </section>
  );
};

const V1Cta = () => (
  <Section bg="var(--cream)" pad="40px 80px 120px">
    <div style={{ position: 'relative', borderRadius: 44, overflow: 'hidden', padding: '110px 80px', background: 'var(--brand-grad)', color: '#fff', textAlign: 'center' }}>
      <img src={img('neon', 1400)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: .35 }} />
      <div style={{ position: 'relative' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 120, letterSpacing: '-0.06em', lineHeight: .9 }}>Get the party<br />started.</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 20, opacity: .9, margin: '24px 0 34px' }}>Your social life will thank you.</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}><StoreBadges /></div>
      </div>
    </div>
  </Section>
);

const LandingV1 = () => (
  <div style={{ width: '100%', background: 'var(--cream)', position: 'relative' }}>
    <V1Hero />
    <V1Marquee />
    <V1How />
    <V1Types />
    <V1Cities />
    <V1Safety />
    <V1Hosts />
    <V1Proof />
    <V1Cta />
    <SiteFooter />
  </div>
);

Object.assign(window, { LandingV1, V1Hero });
