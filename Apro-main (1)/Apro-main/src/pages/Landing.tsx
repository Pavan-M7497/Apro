import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Play, Trophy, Users, TrendingUp } from 'lucide-react';
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

export default function Landing() {
  return (
    <div className="min-h-screen bg-primary">
      {/* Hero */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" fill="currentColor" />
            The future of athlete identity
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Your game.<br />
            <span className="text-accent">Your identity.</span>
          </h1>

          <p className="text-lg md:text-xl text-text-muted max-w-xl mx-auto mb-10">
            One profile. Every highlight. Every stat. Every achievement. Let the world discover what you bring to the game.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="bg-accent text-primary px-8 py-3.5 rounded-xl text-base font-bold hover:bg-accent-hover transition-all flex items-center gap-2"
            >
              Join as Athlete <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/discover"
              className="border border-white/10 text-text px-8 py-3.5 rounded-xl text-base font-medium hover:bg-white/5 hover:border-accent/20 transition-all flex items-center gap-2"
            >
              Discover Athletes
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card/50 rounded-xl p-5 border border-white/5 hover:border-accent/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-bold text-sm text-text mb-1">{title}</h3>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Athlete Grid */}
      <section className="py-16 md:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Athletes already on <span className="text-accent">Apro</span>
            </h2>
            <p className="text-text-muted">The next generation of sports professionals</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {MOCK_ATHLETES.map(({ profile, athlete }) => (
              <AthleteCard key={profile.id} profile={profile} athleteProfile={athlete} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-accent/10 rounded-2xl p-8 md:p-12 border border-accent/10">
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              Ready to own your story?
            </h2>
            <p className="text-text-muted mb-8 max-w-md mx-auto">
              Join thousands of athletes building their professional identity. Your career starts here.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-accent text-primary px-8 py-3.5 rounded-xl text-base font-bold hover:bg-accent-hover transition-all"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" fill="currentColor" />
            <span className="text-sm font-bold">Apro</span>
          </div>
          <p className="text-xs text-text-muted">Your game. Your identity.</p>
        </div>
      </footer>
    </div>
  );
}
