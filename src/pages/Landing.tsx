import { Link } from 'react-router-dom';
import AthleteCard from '../components/AthleteCard';
import { getCountryFlag, initials } from '../lib/utils';
import type { Profile, AthleteProfile } from '../lib/types';

// ── Lime palette (public page — hardcoded, no useTheme) ──
const C = {
  bg: '#050A06',
  surface: '#08100A',
  cardBg: '#0D1A0F',
  border: '#1a2e1c',
  accent: '#E8FF47',
  accentMuted: 'rgba(232,255,71,0.1)',
  text: '#F5FFF0',
  muted: '#4a7a50',
  ink: '#050508',
};

const MOCK_ATHLETES: { profile: Profile; athlete: AthleteProfile }[] = [
  { profile: { id: '1', user_id: 'u1', username: 'marcus_rash', full_name: 'Marcus Rashford', avatar_url: null, cover_url: null, bio: 'Forward. Change maker.', country: 'United Kingdom', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a1', profile_id: '1', sport: 'Football', position: 'Striker', date_of_birth: null, availability: 'available' } },
  { profile: { id: '2', user_id: 'u2', username: 'serena_w', full_name: 'Serena Williams', avatar_url: null, cover_url: null, bio: '23 Grand Slams.', country: 'United States', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a2', profile_id: '2', sport: 'Tennis', position: 'Singles', date_of_birth: null, availability: 'open_to_offers' } },
  { profile: { id: '3', user_id: 'u3', username: 'kobe_8', full_name: 'Kobe Bryant', avatar_url: null, cover_url: null, bio: 'Mamba mentality forever.', country: 'United States', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a3', profile_id: '3', sport: 'Basketball', position: 'Shooting Guard', date_of_birth: null, availability: 'unavailable' } },
  { profile: { id: '4', user_id: 'u4', username: 'usain_bolt', full_name: 'Usain Bolt', avatar_url: null, cover_url: null, bio: '8x Olympic gold.', country: 'Jamaica', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a4', profile_id: '4', sport: 'Athletics', position: 'Sprinter', date_of_birth: null, availability: 'available' } },
  { profile: { id: '5', user_id: 'u5', username: 'neymar_jr', full_name: 'Neymar Jr', avatar_url: null, cover_url: null, bio: 'Skill. Flair. Magic.', country: 'Brazil', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a5', profile_id: '5', sport: 'Football', position: 'Winger', date_of_birth: null, availability: 'available' } },
  { profile: { id: '6', user_id: 'u6', username: 'lebron_james', full_name: 'LeBron James', avatar_url: null, cover_url: null, bio: 'King. More than an athlete.', country: 'United States', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a6', profile_id: '6', sport: 'Basketball', position: 'Small Forward', date_of_birth: null, availability: 'open_to_offers' } },
];

const PREVIEW: { name: string; sport: string; country: string; availability: string; offset: number }[] = [
  { name: 'Marcus Rashford', sport: 'Football', country: 'United Kingdom', availability: 'Available', offset: 0 },
  { name: 'Serena Williams', sport: 'Tennis', country: 'United States', availability: 'Open to offers', offset: 28 },
];

const STATS = [
  { value: '50K+', label: 'Athletes' },
  { value: '120+', label: 'Countries' },
  { value: '2K+', label: 'Brands & Scouts' },
  { value: '500K+', label: 'Highlights Watched' },
];

const FEATURES = [
  { icon: 'ti-video', title: 'Video Highlights', desc: 'Showcase your best moments in HD' },
  { icon: 'ti-chart-bar', title: 'Career Stats', desc: 'Season-by-season performance' },
  { icon: 'ti-search', title: 'Get Discovered', desc: 'Brands, coaches, and agents find you' },
  { icon: 'ti-run', title: 'Training Log', desc: 'Track every session and PB' },
];

const eyebrowFont: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: '11px',
  color: C.accent, letterSpacing: '0.18em', textTransform: 'uppercase',
};

function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center" style={{ gap: '10px', marginBottom: '20px' }}>
      <div style={{ width: '32px', height: '2px', background: C.accent }} />
      <span style={eyebrowFont}>{label}</span>
    </div>
  );
}

export default function Landing() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* ── Public navbar ── */}
      <nav
        className="flex items-center justify-between"
        style={{ height: '52px', background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 32px' }}
      >
        <Link to="/">
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '20px', color: C.accent, letterSpacing: '0.15em', textTransform: 'uppercase' }}>APRO</span>
        </Link>
        <div className="flex items-center" style={{ gap: '20px' }}>
          {[{ to: '/discover', l: 'Discover' }, { to: '/register', l: 'For Brands' }, { to: '/register', l: 'For Coaches' }].map((x, i) => (
            <Link key={i} to={x.to} className="hidden sm:inline" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: C.muted }}>{x.l}</Link>
          ))}
          <Link to="/register" style={{ background: C.accent, color: C.ink, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '5px 14px', borderRadius: '3px' }}>
            Join Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: C.bg, padding: '56px 32px 48px' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center" style={{ gap: '32px' }}>
          {/* Left col */}
          <div style={{ flexBasis: '60%' }} className="w-full">
            <Eyebrow label="The athlete identity platform" />
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(54px, 9vw, 100px)', lineHeight: 0.9, letterSpacing: '-0.025em', color: C.text, textTransform: 'uppercase' }}>
              YOUR<br />
              <span style={{ color: C.accent }}>GAME.</span><br />
              YOUR<br />
              <span style={{ color: C.accent }}>IDENTITY.</span>
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: C.muted, maxWidth: '320px', lineHeight: 1.65, marginTop: '20px' }}>
              One profile. Every highlight, stat, and achievement in one place. Let the world discover what you bring to the game.
            </p>
            <div className="flex flex-wrap items-center" style={{ gap: '12px', marginTop: '28px' }}>
              <Link to="/register" style={{ background: C.accent, color: C.ink, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 22px', borderRadius: '3px' }}>
                Create your profile →
              </Link>
              <Link to="/discover" style={{ border: `1px solid ${C.border}`, color: C.muted, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 22px', borderRadius: '3px' }}>
                Discover Athletes
              </Link>
            </div>
          </div>

          {/* Right col — preview cards (desktop only) */}
          <div className="hidden md:block" style={{ flexBasis: '40%' }}>
            <div className="relative" style={{ height: '260px' }}>
              {PREVIEW.map((p, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: `${p.offset}px`,
                    left: `${i * 40}px`,
                    width: '160px',
                    background: C.cardBg,
                    border: `0.5px solid ${C.border}`,
                    borderRadius: '4px',
                    padding: '12px',
                  }}
                >
                  <div className="flex items-center justify-center" style={{ width: '30px', height: '30px', borderRadius: '3px', background: C.accentMuted, marginBottom: '8px' }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '12px', color: C.accent }}>{initials(p.name)}</span>
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '13px', color: C.text, textTransform: 'uppercase' }}>
                    {p.name} <span style={{ fontSize: '11px' }}>{getCountryFlag(p.country)}</span>
                  </div>
                  <span style={{ display: 'inline-block', background: C.accentMuted, color: C.accent, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: '3px', marginTop: '6px' }}>
                    {p.sport}
                  </span>
                  <div className="flex items-center" style={{ gap: '5px', marginTop: '8px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '2px', background: C.accent }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: C.muted }}>{p.availability}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map(({ value, label }, i) => (
            <div key={label} className="text-center" style={{ padding: '16px 0', borderLeft: i % 4 === 0 ? 'none' : `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '36px', color: C.accent, lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '3px' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ background: C.bg, padding: '48px 32px' }}>
        <div className="max-w-6xl mx-auto">
          <Eyebrow label="Built for athletes" />
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 4vw, 40px)', color: C.text, textTransform: 'uppercase' }}>Everything You Need</h2>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '8px', marginTop: '24px' }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: '4px', padding: '18px 16px' }}>
                <i className={`ti ${f.icon}`} style={{ fontSize: '20px', color: C.accent, display: 'block', marginBottom: '10px' }} aria-hidden="true" />
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '12px', color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.title}</h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: C.muted, marginTop: '4px', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Athlete grid ── */}
      <section style={{ background: C.surface, padding: '48px 32px', borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto">
          <Eyebrow label="Discover talent" />
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 4vw, 40px)', color: C.text, textTransform: 'uppercase', marginBottom: '24px' }}>Already On Apro</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {MOCK_ATHLETES.map(({ profile, athlete }) => (
              <AthleteCard key={profile.id} profile={profile} athleteProfile={athlete} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: C.accent, margin: '0 32px 48px', borderRadius: '4px', padding: '32px' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between" style={{ gap: '20px' }}>
          <div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 4vw, 48px)', color: C.ink, textTransform: 'uppercase', lineHeight: 0.95 }}>
              READY TO OWN<br />YOUR STORY?
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#333', marginTop: '10px' }}>
              Join thousands of athletes building their professional identity.
            </p>
          </div>
          <Link to="/register" className="flex-shrink-0" style={{ background: C.ink, color: C.accent, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 22px', borderRadius: '3px' }}>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: '16px 32px' }}>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '18px', color: C.accent, letterSpacing: '0.15em', textTransform: 'uppercase' }}>APRO</span>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: C.muted }}>Your game. Your identity.</p>
        </div>
      </footer>
    </div>
  );
}
