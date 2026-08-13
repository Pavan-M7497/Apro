import { Link } from 'react-router-dom';
import AthleteCard from '../components/AthleteCard';
import type { Profile, AthleteProfile } from '../lib/types';
import { DISCIPLINES } from '../lib/types';
import { Waves, Target, ArrowDown, type LucideIcon } from 'lucide-react';

const DISCIPLINE_ICONS: Record<string, LucideIcon> = {
  swimming: Waves,
  waterpolo: Target,
  diving: ArrowDown,
};

const DISCIPLINE_BLURB: Record<string, string> = {
  swimming: 'Pool times across every stroke and distance.',
  waterpolo: 'Season stats, positions, and match records.',
  diving: 'Springboard and platform scores.',
};

const mockProfile = (
  id: string,
  username: string,
  full_name: string,
  bio: string,
  state_code: string,
  city: string
): Profile => ({
  id, user_id: `u${id}`, username, full_name,
  avatar_url: null, cover_url: null, bio,
  country: 'India', state_code, city,
  club_id: null, gender: null,
  sfi_id: null, state_assoc_id: null,
  role: 'athlete', created_at: '', updated_at: '',
});

const mockAthlete = (id: string, sport: string, position: string): AthleteProfile => ({
  id: `a${id}`, profile_id: id, sport, position,
  date_of_birth: null, availability: 'available',
});

const FEATURED: { profile: Profile; athlete: AthleteProfile; best: string }[] = [
  {
    profile: mockProfile('1', 'ananya_s', 'Ananya Sharma', 'National record holder, freestyle sprint.', 'KA', 'Bengaluru'),
    athlete: mockAthlete('1', 'swimming', '100m Freestyle, 50m Freestyle'),
    best: '100m Freestyle · 55.42',
  },
  {
    profile: mockProfile('2', 'rohan_m', 'Rohan Mehta', 'Centre forward, state champion.', 'MH', 'Mumbai'),
    athlete: mockAthlete('2', 'waterpolo', 'Centre Forward'),
    best: 'Water polo · 34 goals in 2025-26',
  },
  {
    profile: mockProfile('3', 'kavya_r', 'Kavya Reddy', '3m springboard specialist.', 'TG', 'Hyderabad'),
    athlete: mockAthlete('3', 'diving', '3m Springboard'),
    best: '3m Springboard · 284.65 pts',
  },
];

const STATS = [
  { value: '3', label: 'Aquatic disciplines' },
  { value: '36', label: 'States & UTs' },
  { value: '100%', label: 'India-focused' },
];

export default function Landing() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── Top bar ── */}
      <nav className="flex items-center justify-between" style={{ padding: '20px 32px' }}>
        <Link to="/" className="font-display" style={{ fontWeight: 800, fontSize: '24px', letterSpacing: '-0.01em', color: 'var(--text)' }}>
          Apro
        </Link>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <Link
            to="/login"
            style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '12px 20px' }}
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-pill"
            style={{ background: 'var(--text)', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '12px 24px' }}
          >
            Join free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="text-center" style={{ padding: '64px 24px 72px', maxWidth: '760px', margin: '0 auto' }}>
        <span
          className="inline-block rounded-pill"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)', fontSize: '13px', fontWeight: 500, padding: '8px 18px' }}
        >
          Indian aquatics · Early access
        </span>

        <h1
          className="font-display"
          style={{
            fontWeight: 800,
            fontSize: 'clamp(44px, 7vw, 76px)',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            marginTop: '28px',
          }}
        >
          The record every Indian swimmer should have.
        </h1>

        <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '520px', margin: '20px auto 0' }}>
          Your times, your meets, your film — in one profile coaches, selectors, and sponsors can actually trust.
        </p>

        <div className="flex flex-wrap items-center justify-center" style={{ gap: '12px', marginTop: '36px' }}>
          <Link
            to="/register"
            className="rounded-pill"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontSize: '15px', fontWeight: 600, padding: '14px 28px' }}
          >
            Create your profile
          </Link>
          <Link
            to="/discover"
            className="rounded-pill"
            style={{ background: '#fff', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '15px', fontWeight: 600, padding: '14px 28px' }}
          >
            Browse athletes
          </Link>
        </div>
      </section>

      {/* ── Stat cards ── */}
      <section style={{ padding: '0 24px 72px', maxWidth: '900px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '16px' }}>
          {STATS.map((s) => (
            <div
              key={s.label}
              className="text-center"
              style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px 20px' }}
            >
              <div className="font-display" style={{ fontWeight: 800, fontSize: '42px', lineHeight: 1, color: 'var(--text)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Athletes ── */}
      <section style={{ padding: '0 24px 72px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 className="font-display" style={{ fontWeight: 800, fontSize: '32px', letterSpacing: '-0.01em', marginBottom: '8px' }}>
          Athletes on Apro
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          A snapshot of the profiles being built right now.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '16px' }}>
          {FEATURED.map(({ profile, athlete, best }) => (
            <AthleteCard key={profile.id} profile={profile} athleteProfile={athlete} bestLine={best} compact />
          ))}
        </div>
      </section>

      {/* ── Disciplines ── */}
      <section style={{ padding: '0 24px 72px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 className="font-display" style={{ fontWeight: 800, fontSize: '32px', letterSpacing: '-0.01em', marginBottom: '8px' }}>
          Built for three disciplines
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Each one gets the stats that actually matter to it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
          {DISCIPLINES.map((d) => {
            const Icon = DISCIPLINE_ICONS[d.id] || Waves;
            return (
              <div
                key={d.id}
                style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-soft)', marginBottom: '16px' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--accent-ink)' }} />
                </div>
                <h3 className="font-display" style={{ fontWeight: 800, fontSize: '19px', color: 'var(--text)' }}>
                  {d.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
                  {DISCIPLINE_BLURB[d.id]}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section style={{ padding: '0 24px 48px', maxWidth: '900px', margin: '0 auto' }}>
        <div
          className="text-center"
          style={{ background: 'var(--accent)', borderRadius: '16px', padding: '56px 32px' }}
        >
          <h2
            className="font-display"
            style={{ fontWeight: 800, fontSize: 'clamp(32px, 5vw, 46px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--on-accent)' }}
          >
            Ready to build your profile?
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--on-accent)', opacity: 0.75, marginTop: '14px' }}>
            Free while we're in early access.
          </p>
          <Link
            to="/register"
            className="inline-block rounded-pill"
            style={{ background: 'var(--text)', color: '#fff', fontSize: '15px', fontWeight: 600, padding: '14px 32px', marginTop: '28px' }}
          >
            Get started
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="flex flex-wrap items-center justify-between"
        style={{ borderTop: '1px solid var(--border)', padding: '24px 32px', gap: '12px' }}
      >
        <span className="font-display" style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text)' }}>Apro</span>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Indian aquatics, one profile.</p>
      </footer>
    </div>
  );
}
