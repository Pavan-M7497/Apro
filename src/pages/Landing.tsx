import { Link } from 'react-router-dom';
import { ArrowRight, Play, Trophy, Users, TrendingUp } from 'lucide-react';
import AthleteCard from '../components/AthleteCard';
import type { Profile, AthleteProfile } from '../lib/types';

const MOCK_ATHLETES: { profile: Profile; athlete: AthleteProfile }[] = [
  { profile: { id: '1', user_id: 'u1', username: 'marcus_rash', full_name: 'Marcus Rashford', avatar_url: null, cover_url: null, bio: 'Forward. Change maker.', country: 'United Kingdom', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a1', profile_id: '1', sport: 'Football', position: 'Striker', date_of_birth: null, availability: 'available' } },
  { profile: { id: '2', user_id: 'u2', username: 'serena_w', full_name: 'Serena Williams', avatar_url: null, cover_url: null, bio: '23 Grand Slams.', country: 'United States', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a2', profile_id: '2', sport: 'Tennis', position: 'Singles', date_of_birth: null, availability: 'open_to_offers' } },
  { profile: { id: '3', user_id: 'u3', username: 'kobe_8', full_name: 'Kobe Bryant', avatar_url: null, cover_url: null, bio: 'Mamba mentality forever.', country: 'United States', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a3', profile_id: '3', sport: 'Basketball', position: 'Shooting Guard', date_of_birth: null, availability: 'unavailable' } },
  { profile: { id: '4', user_id: 'u4', username: 'usain_bolt', full_name: 'Usain Bolt', avatar_url: null, cover_url: null, bio: '8x Olympic gold.', country: 'Jamaica', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a4', profile_id: '4', sport: 'Athletics', position: 'Sprinter', date_of_birth: null, availability: 'available' } },
  { profile: { id: '5', user_id: 'u5', username: 'neymar_jr', full_name: 'Neymar Jr', avatar_url: null, cover_url: null, bio: 'Skill. Flair. Magic.', country: 'Brazil', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a5', profile_id: '5', sport: 'Football', position: 'Winger', date_of_birth: null, availability: 'available' } },
  { profile: { id: '6', user_id: 'u6', username: 'lebron_james', full_name: 'LeBron James', avatar_url: null, cover_url: null, bio: 'King. More than an athlete.', country: 'United States', role: 'athlete', created_at: '', updated_at: '' }, athlete: { id: 'a6', profile_id: '6', sport: 'Basketball', position: 'Small Forward', date_of_birth: null, availability: 'open_to_offers' } },
];

const FEATURES = [
  { icon: Play, title: 'Video Highlights', desc: 'Showcase your best moments in HD' },
  { icon: Trophy, title: 'Achievements', desc: 'Build your career timeline' },
  { icon: Users, title: 'Get Discovered', desc: 'Brands, coaches, and agents find you' },
  { icon: TrendingUp, title: 'Track Stats', desc: 'Season-by-season performance' },
];

const STATS = [
  { value: '50K+', label: 'Athletes' },
  { value: '120+', label: 'Countries' },
  { value: '2K+', label: 'Brands & scouts' },
  { value: '500K+', label: 'Highlights watched' },
];

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>

      {/* ── Hero ── background: #0A0A0F */}
      <section className="pt-28 md:pt-36 pb-20 md:pb-28" style={{ background: '#0A0A0F' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            {/* Headline — the biggest element on the page */}
            <h1
              className="font-display font-black uppercase"
              style={{
                fontSize: 'clamp(56px, 10vw, 104px)',
                letterSpacing: '-0.02em',
                lineHeight: 0.95,
                marginBottom: '28px',
              }}
            >
              YOUR GAME.<br />
              <span className="text-accent">YOUR IDENTITY.</span>
            </h1>

            {/* 2px accent rule */}
            <div style={{ width: '48px', height: '2px', background: '#E8FF47', marginBottom: '20px' }} />

            {/* Subtitle */}
            <p
              className="text-text-muted"
              style={{ fontSize: '16px', maxWidth: '480px', marginBottom: '40px', lineHeight: 1.6 }}
            >
              One profile. Every highlight. Every stat. Every achievement. Let the world discover what you bring to the game.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-accent text-primary px-8 py-3.5 text-sm font-bold hover:bg-accent-hover transition-colors"
                style={{ borderRadius: '4px' }}
              >
                Join as Athlete <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 border border-white/15 text-text px-8 py-3.5 text-sm font-medium hover:border-white/30 hover:bg-white/5 transition-colors"
                style={{ borderRadius: '4px' }}
              >
                Discover Athletes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── background: #12121E */}
      <section className="border-y border-white/5" style={{ background: '#12121E' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/5">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center md:px-6">
                <p className="font-display font-black text-accent" style={{ fontSize: '40px', lineHeight: 1 }}>{value}</p>
                <p
                  className="font-medium text-text-muted mt-1.5 uppercase"
                  style={{ fontSize: '11px', letterSpacing: '0.1em' }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── background: #0A0A0F */}
      <section className="py-20 md:py-28" style={{ background: '#0A0A0F' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <h2
              className="font-display font-black uppercase text-text"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.01em' }}
            >
              EVERYTHING YOU NEED
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="hover:border-white/[0.1] transition-colors"
                style={{
                  background: '#1A1A2E',
                  border: '0.5px solid rgba(255,255,255,0.06)',
                  borderRadius: '4px',
                  padding: '20px',
                }}
              >
                <div
                  className="flex items-center justify-center mb-4"
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'rgba(232,255,71,0.08)',
                    borderRadius: '4px',
                  }}
                >
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <h3
                  className="font-display font-bold uppercase text-text tracking-widest mb-1"
                  style={{ fontSize: '13px' }}
                >
                  {title}
                </h3>
                <p className="text-text-muted" style={{ fontSize: '12px' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Athlete Grid ── background: #12121E */}
      <section className="py-20 md:py-28 border-t border-white/5" style={{ background: '#12121E' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <h2
              className="font-display font-black uppercase text-text"
              style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.01em' }}
            >
              ALREADY ON APRO
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {MOCK_ATHLETES.map(({ profile, athlete }) => (
              <AthleteCard key={profile.id} profile={profile} athleteProfile={athlete} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── full-bleed accent background: #E8FF47 */}
      <section style={{ background: '#E8FF47' }}>
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-xl">
            <h2
              className="font-display font-black uppercase"
              style={{
                fontSize: 'clamp(32px, 5vw, 56px)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: '#0A0A0F',
                marginBottom: '16px',
              }}
            >
              READY TO OWN YOUR STORY?
            </h2>
            <p style={{ color: 'rgba(10,10,15,0.65)', marginBottom: '32px', fontSize: '14px', lineHeight: 1.6 }}>
              Join thousands of athletes building their professional identity. Your career starts here.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ background: '#0A0A0F', color: '#E8FF47', padding: '14px 32px', borderRadius: '4px' }}
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-white/5" style={{ background: '#0A0A0F' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <span className="font-display font-black text-xl tracking-widest text-accent uppercase">APRO</span>
          <p className="text-xs text-text-muted">Your game. Your identity.</p>
        </div>
      </footer>
    </div>
  );
}
