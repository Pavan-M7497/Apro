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
    <div className="min-h-screen bg-primary">

      {/* Hero */}
      <section className="pt-28 md:pt-36 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-accent" />
              <span className="font-display text-accent text-sm font-semibold uppercase tracking-widest">
                The athlete identity platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-black uppercase leading-none mb-6" style={{ fontSize: 'clamp(52px, 9vw, 96px)', letterSpacing: '-0.02em' }}>
              YOUR GAME.<br />
              <span className="text-accent">YOUR IDENTITY.</span>
            </h1>

            <p className="text-lg text-text-muted max-w-lg mb-10 leading-relaxed">
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

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/5">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center md:px-6">
                <p className="font-display font-black text-accent" style={{ fontSize: '28px' }}>{value}</p>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-accent" />
              <span className="font-display text-accent text-sm font-semibold uppercase tracking-widest">Platform</span>
            </div>
            <h2 className="font-display font-black uppercase text-text" style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.01em' }}>
              EVERYTHING YOU NEED
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-white/5 p-5 hover:border-white/10 transition-colors" style={{ borderRadius: '4px' }}>
                <div className="w-10 h-10 bg-accent/10 flex items-center justify-center mb-4" style={{ borderRadius: '4px' }}>
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display font-bold uppercase text-text text-sm tracking-wide mb-1">{title}</h3>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Athlete Grid */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-accent" />
              <span className="font-display text-accent text-sm font-semibold uppercase tracking-widest">Athletes</span>
            </div>
            <h2 className="font-display font-black uppercase text-text" style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.01em' }}>
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

      {/* CTA */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-accent p-10 md:p-16" style={{ borderRadius: '4px' }}>
            <div className="max-w-xl">
              <h2 className="font-display font-black uppercase text-primary mb-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                READY TO OWN YOUR STORY?
              </h2>
              <p className="text-primary/70 mb-8 text-sm leading-relaxed">
                Join thousands of athletes building their professional identity. Your career starts here.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-primary text-accent px-8 py-3.5 text-sm font-bold hover:bg-primary/80 transition-colors"
                style={{ borderRadius: '4px' }}
              >
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <span className="font-display font-black text-xl tracking-widest text-accent uppercase">APRO</span>
          <p className="text-xs text-text-muted">Your game. Your identity.</p>
        </div>
      </footer>
    </div>
  );
}
