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
      className="group relative bg-card border border-white/5 overflow-hidden hover:border-accent/30 transition-all duration-200 hover:-translate-y-0.5"
      style={{ borderRadius: '4px' }}
    >
      {/* Large faded sport letter — jersey number feel */}
      <div
        className="absolute top-2 right-3 font-display font-black text-white/[0.04] select-none pointer-events-none leading-none"
        style={{ fontSize: '72px' }}
        aria-hidden="true"
      >
        {sportInitial}
      </div>

      {/* Cover strip */}
      <div className="relative h-20 bg-surface">
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Avatar */}
      <div className="relative px-4 -mt-7">
        <div className="w-14 h-14 border-2 border-card overflow-hidden bg-surface" style={{ borderRadius: '4px' }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display font-bold text-lg text-accent bg-accent/10">
              {initials(profile.full_name)}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-2 pb-4">
        {/* Name row */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display font-bold text-text truncate" style={{ fontSize: '17px', letterSpacing: '0.01em' }}>
            {profile.full_name.toUpperCase()}
          </h3>
          <span className="text-sm flex-shrink-0">{getCountryFlag(profile.country)}</span>
        </div>

        {/* Sport + position */}
        {athleteProfile?.sport && (
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[11px] font-display font-semibold text-accent bg-accent/10 px-2 py-0.5 uppercase tracking-wide"
              style={{ borderRadius: '3px' }}
            >
              {athleteProfile.sport}
            </span>
            {athleteProfile.position && (
              <span className="text-[11px] text-text-muted">{athleteProfile.position}</span>
            )}
          </div>
        )}

        {/* Availability */}
        {athleteProfile?.availability === 'available' && !compact && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-success" style={{ borderRadius: '2px' }} />
            <span className="text-[10px] font-medium text-success tracking-wide uppercase">Available</span>
          </div>
        )}
        {athleteProfile?.availability === 'open_to_offers' && !compact && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-accent" style={{ borderRadius: '2px' }} />
            <span className="text-[10px] font-medium text-accent tracking-wide uppercase">Open to offers</span>
          </div>
        )}

        {profile.bio && !compact && (
          <p className="text-xs text-text-muted mt-2 line-clamp-2">{profile.bio}</p>
        )}
      </div>
    </Link>
  );
}
