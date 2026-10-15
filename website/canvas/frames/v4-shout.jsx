// v4 — Shout
// The Partiful "MORE THAN AN INVITE" type pairing: a condensed heavy display
// face (Anton) for every heading, Satoshi for everything else. Sticker-tilted
// chips, flyer-tint colour blocks, the app's real invite templates fanned out.

const Shout = ({ children, size = 140, color = 'var(--ink)', style }) => (
  <h2 style={{ margin: 0, fontFamily: 'var(--font-shout)', fontWeight: 400, fontSize: size, lineHeight: .88, letterSpacing: '-0.01em', textTransform: 'uppercase', color, ...style }}>{children}</h2>
);

const Sticker = ({ children, bg, color = 'var(--ink)', rot = 0, style }) => (
  <div style={{ position: 'absolute', padding: '12px 20px', borderRadius: 999, background: bg, color, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18, transform: `rotate(${rot}deg)`, boxShadow: '0 12px 26px -14px rgba(23,19,16,.5)', whiteSpace: 'nowrap', '--rot': `${rot}deg`, animation: 'gr-float 6s ease-in-out infinite', ...style }}>{children}</div>
);

const TemplateFan = ({ size = 220 }) => {
  const t = ['retro', 'houseparty', 'nightout', 'beack', 'halloween'];
  return (
    <div style={{ position: 'relative', width: size * 3, height: size * 1.55 }}>
      {t.map((n, i) => {
        const rot = (i - 2) * 9;
        return (
          <img key={n} src={R2(n)} className="gr-hover-lift" style={{
            position: 'absolute', left: '50%', bottom: 0, width: size, height: size * 1.4, objectFit: 'cover', borderRadius: 22,
            transform: `translateX(-50%) translateX(${(i - 2) * size * 0.42}px) rotate(${rot}deg)`, transformOrigin: '50% 120%',
            boxShadow: '0 24px 50px -24px rgba(23,19,16,.55)', zIndex: 5 - Math.abs(i - 2),
          }} />
        );
      })}
    </div>
  );
};

const V4Hero = () => (
  <section style={{ position: 'relative', background: 'var(--cream)', padding: '150px 80px 60px', overflow: 'hidden', textAlign: 'center' }}>
    <FloatingNav />
    <Shout size={250}>Parties<br />are back.</Shout>
    <Sticker bg="var(--blush)" rot={-10} style={{ top: 210, left: 150 }}>🪩 House party in Khar</Sticker>
    <Sticker bg="var(--sage)" rot={8} style={{ top: 250, right: 140, animationDelay: '1s' }}>🎲 Mafia night · free</Sticker>
    <Sticker bg="var(--sky)" rot={-5} style={{ top: 470, right: 210, animationDelay: '2s' }}>🌇 Rooftop · 50:50</Sticker>
    <Sticker bg="var(--ink)" color="var(--cream)" rot={6} style={{ top: 500, left: 200, animationDelay: '1.5s' }}>✋ Request sent</Sticker>
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 21, color: 'var(--ink-2)', margin: '30px auto', maxWidth: 520, lineHeight: 1.5 }}>Create an invite in 30 seconds, or find what's on near you tonight.</p>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}><Btn size="lg">Create event</Btn><Btn kind="ink" size="lg">Get the app</Btn></div>
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}><TemplateFan size={230} /></div>
  </section>
);

const V4Strip = () => (
  <div style={{ background: 'var(--ink)', padding: '22px 0', transform: 'rotate(-2deg)', margin: '0 -40px' }}>
    <Marquee speed={30} gap={40}>
      {['HOUSE PARTIES', 'ROOFTOPS', 'GAME NIGHTS', 'SUPPER CLUBS', 'GARBA', 'KARAOKE', 'GIGS'].map(w => (
        <span key={w} style={{ display: 'flex', alignItems: 'center', gap: 40, fontFamily: 'var(--font-shout)', fontSize: 58, color: 'var(--cream)', whiteSpace: 'nowrap' }}>{w}<span className="gr-grad-text">●</span></span>
      ))}
    </Marquee>
  </div>
);

const V4Steps = () => {
  const cards = [
    ['Make it yours', 'Pick a template, set the crowd mix, done.', 'var(--blush)', 'var(--blush-ink)', <InviteCard ev={SAMPLE_EVENTS[1]} width={230} tilt={-4} />],
    ['Send one link', 'Guests request or book — no app needed to look.', 'var(--sage)', 'var(--sage-ink)', <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 250 }}><Bubble name="Dev" avatar={1}>link pls 🙏</Bubble><Bubble me>gorave.in/e/retro-night</Bubble></div>],
    ['Same page, always', 'Updates, reminders and QR check-in.', 'var(--sky)', 'var(--sky-ink)', <Phone w={170}><div style={{ padding: '60px 10px', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 11 }}><div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,.14)' }}>⏰ Starts in 2 hours — address unlocked</div></div></Phone>],
  ];
  return (
    <Section bg="var(--cream)" pad="160px 80px 120px">
      <Shout size={130} style={{ textAlign: 'center' }}>One link.<br />Everyone's in.</Shout>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 70 }}>
        {cards.map(([h, p, bg, ink, art], i) => (
          <div key={h} className="gr-hover-lift" style={{ height: 560, borderRadius: 36, background: bg, color: ink, padding: 34, display: 'flex', flexDirection: 'column', transform: `rotate(${[-1.5, 1, -1][i]}deg)` }}>
            <Shout size={56} color={ink}>{h}</Shout>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, opacity: .8, lineHeight: 1.5 }}>{p}</p>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{art}</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

const V4Features = () => (
  <Section bg="var(--paper)">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <Shout size={110}>More than<br />an invite</Shout>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 22, color: 'var(--ink-2)', margin: '14px 0 0' }}>Everything you need to build community.</p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}><Btn kind="ghost">For organizers</Btn><Btn kind="ink">Get the app</Btn></div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 56 }}>
      {[['Sell tickets.', 'assets/img/hostXgorave.png', true], ['Crowd mix.', null, true], ['Request to join.', null, false], ['Calendar sync.', 'assets/img/calenderXgorave.png', false]].map(([cap, art, more], i) => (
        <div key={cap}>
          <div className="gr-hover-lift" style={{ height: 380, borderRadius: 24, background: '#EDEAE3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {art ? <img src={art} style={{ width: 240 }} /> : i === 1 ? (
              <div style={{ textAlign: 'center' }}><Shout size={120}>50<span className="gr-grad-text">:</span>50</Shout><div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--ink-2)' }}>4 women · 4 men · 1 open</div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Riya wants to join', 'Arjun wants to join'].map((n, j) => <div key={n} style={{ padding: '12px 16px', borderRadius: 16, background: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, boxShadow: 'var(--shadow-soft)', display: 'flex', gap: 10, alignItems: 'center' }}><img src={AVATARS[j + 3]} style={{ width: 28, height: 28, borderRadius: 99, objectFit: 'cover' }} />{n} <span style={{ marginLeft: 'auto', color: 'var(--green)' }}>✓</span></div>)}
              </div>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 21, color: 'var(--ink-2)', marginTop: 16 }}>{cap} {more && <span style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Learn more</span>}</div>
        </div>
      ))}
    </div>
  </Section>
);

const V4Cities = () => (
  <Section bg="var(--orange)" style={{ overflow: 'hidden' }}>
    <Shout size={150} color="#fff">The best nights<br />in your city</Shout>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 50, maxWidth: 1100 }}>
      {CITIES.map((c, i) => (
        <div key={c.name} className="gr-hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px 10px 10px', borderRadius: 999, background: i === 0 ? 'var(--ink)' : '#fff', color: i === 0 ? '#fff' : 'var(--ink)', transform: `rotate(${[-2, 1.5, -1, 2, -1.5, 1, -2, 1.5][i]}deg)` }}>
          <img src={img(c.img, 200)} style={{ width: 54, height: 54, borderRadius: 99, objectFit: 'cover' }} />
          <span style={{ fontFamily: 'var(--font-shout)', fontSize: 40, textTransform: 'uppercase' }}>{c.name}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, opacity: .6 }}>{c.count}</span>
        </div>
      ))}
    </div>
  </Section>
);

const V4Safety = () => (
  <Section bg="var(--ink)" style={{ color: 'var(--cream)' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
      <Shout size={140} color="var(--cream)">Real people.<br /><span className="gr-grad-text">Real safe.</span></Shout>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[['18+ & verified', 'var(--blush)', 'var(--blush-ink)'], ['Private address', 'var(--sage)', 'var(--sage-ink)'], ['One-tap SOS', 'var(--sky)', 'var(--sky-ink)'], ['Reviewed hosts', 'var(--cream-deep)', 'var(--ink)']].map(([h, bg, ink], i) => (
          <div key={h} style={{ height: 190, borderRadius: 28, background: bg, color: ink, padding: 24, display: 'flex', alignItems: 'flex-end', transform: `rotate(${[-2, 2, 1.5, -1.5][i]}deg)` }}>
            <Shout size={44} color={ink}>{h}</Shout>
          </div>
        ))}
      </div>
    </div>
  </Section>
);

const V4Cta = () => (
  <Section bg="var(--cream)" style={{ textAlign: 'center' }}>
    <Shout size={210}>Get the party<br /><span className="gr-grad-text">started</span></Shout>
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 22, color: 'var(--ink-2)' }}>Your social life will thank you.</p>
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}><StoreBadges /></div>
  </Section>
);

const LandingV4 = () => (
  <div style={{ width: '100%', background: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
    <V4Hero />
    <V4Strip />
    <V4Steps />
    <V4Features />
    <V4Cities />
    <V4Safety />
    <V4Cta />
    <SiteFooter />
  </div>
);

Object.assign(window, { LandingV4, V4Hero, TemplateFan });
