import { Link } from 'react-router-dom';
import { getCountryFlag, initials } from '../lib/utils';
import type { Profile, AthleteProfile } from '../lib/types';

interface AthleteCardProps {
  profile: Profile;
  athleteProfile?: AthleteProfile | null;
  compact?: boolean;
}

export default function AthleteCard({ profile, athleteProfile, compact }: AthleteCardProps) {
  const sportInitial = athleteProfile?.sport?.[0]?.toUpperCase() || '?';

  return (
    <Link
      to={`/profile/${profile.username}`}
      className="group relative block overflow-visible hover:-translate-y-0.5 hover:border-accent/25 transition-all duration-150 border border-white/[0.06]"
      style={{ background: '#1A1A2E', borderRadius: '4px' }}
    >
      {/* Large faded sport initial — trading card feel */}
      <div
        className="absolute top-2 right-3 font-display font-black select-none pointer-events-none leading-none z-0"
        style={{ fontSize: '88px', color: 'rgba(255,255,255,0.03)' }}
        aria-hidden="true"
      >
        {sportInitial}
      </div>

      {/* Cover strip */}
      <div className="relative overflow-hidden" style={{ height: '72px', background: '#12121E', borderRadius: '4px 4px 0 0' }}>
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Avatar */}
      <div className="relative px-4">
        <div
          className="overflow-hidden bg-surface"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '4px',
            border: '2px solid #1A1A2E',
            marginTop: '-26px',
          }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display font-bold text-lg text-accent">
              {initials(profile.full_name)}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-2 pb-4 relative z-10">
        {/* Name + flag */}
        <div className="flex items-center gap-2 mb-1 min-w-0">
          <h3
            className="font-display font-black text-text truncate"
            style={{ fontSize: '16px', letterSpacing: '0.01em' }}
          >
            {profile.full_name.toUpperCase()}
          </h3>
          <span className="text-sm flex-shrink-0">{getCountryFlag(profile.country)}</span>
        </div>

        {/* Sport badge + position */}
        {athleteProfile?.sport && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="font-display font-semibold text-accent uppercase"
              style={{
                fontSize: '10px',
                background: 'rgba(232,255,71,0.1)',
                letterSpacing: '0.06em',
                padding: '2px 8px',
                borderRadius: '3px',
              }}
            >
              {athleteProfile.sport}
            </span>
            {athleteProfile.position && (
              <span className="text-text-muted" style={{ fontSize: '11px' }}>{athleteProfile.position}</span>
            )}
          </div>
        )}

        {/* Availability — static square dot, no pulse */}
        {athleteProfile?.availability === 'available' && !compact && (
          <div className="flex items-center gap-1.5">
            <div style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#34D399', flexShrink: 0 }} />
            <span className="font-medium text-success uppercase tracking-wide" style={{ fontSize: '10px' }}>Available</span>
          </div>
        )}
        {athleteProfile?.availability === 'open_to_offers' && !compact && (
          <div className="flex items-center gap-1.5">
            <div style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#E8FF47', flexShrink: 0 }} />
            <span className="font-medium text-accent uppercase tracking-wide" style={{ fontSize: '10px' }}>Open to offers</span>
          </div>
        )}
        {athleteProfile?.availability === 'unavailable' && !compact && (
          <div className="flex items-center gap-1.5">
            <div style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#F87171', flexShrink: 0 }} />
            <span className="font-medium text-error uppercase tracking-wide" style={{ fontSize: '10px' }}>Unavailable</span>
          </div>
        )}

        {profile.bio && !compact && (
          <p className="text-xs text-text-muted mt-2 line-clamp-2">{profile.bio}</p>
        )}
      </div>
    </Link>
  );
}
