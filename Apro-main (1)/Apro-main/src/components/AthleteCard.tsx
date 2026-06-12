import { Link } from 'react-router-dom';
import { getCountryFlag, initials } from '../lib/utils';
import type { Profile, AthleteProfile } from '../lib/types';

interface AthleteCardProps {
  profile: Profile;
  athleteProfile?: AthleteProfile | null;
  compact?: boolean;
}

export default function AthleteCard({ profile, athleteProfile, compact }: AthleteCardProps) {
  return (
    <Link
      to={`/profile/${profile.username}`}
      className="group bg-card rounded-xl border border-white/5 overflow-hidden hover:border-accent/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5"
    >
      {/* Cover */}
      <div className="relative h-24 bg-card">
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-card/60" />
      </div>

      {/* Avatar */}
      <div className="relative px-4 -mt-8">
        <div className="w-14 h-14 rounded-full border-2 border-card overflow-hidden bg-surface">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-accent bg-accent/10">
              {initials(profile.full_name)}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-text text-sm truncate">{profile.full_name}</h3>
          <span className="text-xs">{getCountryFlag(profile.country)}</span>
        </div>

        {athleteProfile && athleteProfile.sport && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              {athleteProfile.sport}
            </span>
            {athleteProfile.position && (
              <span className="text-xs text-text-muted">
                {athleteProfile.position}
              </span>
            )}
          </div>
        )}

        {athleteProfile?.availability === 'available' && !compact && (
          <div className="mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-medium text-success">Available</span>
          </div>
        )}

        {profile.bio && !compact && (
          <p className="text-xs text-text-muted mt-2 line-clamp-2">{profile.bio}</p>
        )}
      </div>
    </Link>
  );
}
