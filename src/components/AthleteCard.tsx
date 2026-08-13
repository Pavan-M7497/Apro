import { useState } from 'react';
import { Link } from 'react-router-dom';
import { initials } from '../lib/utils';
import type { Profile, AthleteProfile } from '../lib/types';
import { disciplineName, parsePrimaryEvents } from '../lib/types';

interface AthleteCardProps {
  profile: Profile;
  athleteProfile?: AthleteProfile | null;
  compact?: boolean;
  /** Optional headline result, e.g. "100m Freestyle · 52.14". */
  bestLine?: string;
}

const AVAILABILITY_LABEL: Record<string, string> = {
  available: 'Available',
  open_to_offers: 'Open to offers',
  unavailable: 'Unavailable',
};

export default function AthleteCard({ profile, athleteProfile, compact, bestLine }: AthleteCardProps) {
  const [hover, setHover] = useState(false);

  const discipline = disciplineName(athleteProfile?.sport);
  const isWaterpolo = athleteProfile?.sport === 'waterpolo';
  const events = isWaterpolo ? [] : parsePrimaryEvents(athleteProfile?.position);
  const secondary =
    bestLine ||
    (isWaterpolo ? athleteProfile?.position : events[0]) ||
    AVAILABILITY_LABEL[athleteProfile?.availability || ''] ||
    '';

  return (
    <Link
      to={`/profile/${profile.username}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="block transition-all duration-150"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${hover ? '#D8D8CF' : 'var(--border)'}`,
        borderRadius: '16px',
        padding: '20px',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Avatar tile */}
      <div
        className="overflow-hidden flex items-center justify-center"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: 'var(--accent-soft)',
          marginBottom: '14px',
        }}
      >
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
        ) : (
          <span
            className="font-display"
            style={{ fontWeight: 800, fontSize: '18px', color: 'var(--accent-ink)' }}
          >
            {initials(profile.full_name)}
          </span>
        )}
      </div>

      {/* Name */}
      <h3
        className="font-display truncate"
        style={{ fontWeight: 800, fontSize: '19px', letterSpacing: '-0.01em', color: 'var(--text)' }}
      >
        {profile.full_name}
      </h3>

      {/* Unclaimed marker */}
      {profile.is_claimed === false && (
        <span
          className="inline-block"
          style={{
            background: 'var(--surface-2)', color: 'var(--text-muted)',
            fontSize: '11px', fontWeight: 500, padding: '4px 12px',
            borderRadius: '999px', marginTop: '8px', marginRight: '6px',
          }}
        >
          Unclaimed
        </span>
      )}

      {/* Discipline pill */}
      {discipline && (
        <span
          className="inline-block"
          style={{
            background: 'var(--accent-soft)',
            color: 'var(--accent-ink)',
            fontSize: '11px',
            fontWeight: 500,
            padding: '4px 12px',
            borderRadius: '999px',
            marginTop: '8px',
          }}
        >
          {discipline}
        </span>
      )}

      {/* Best event / secondary line */}
      {secondary && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px' }} className="truncate">
          {secondary}
        </p>
      )}

      {profile.bio && !compact && (
        <p
          className="line-clamp-2"
          style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '8px', lineHeight: 1.5 }}
        >
          {profile.bio}
        </p>
      )}
    </Link>
  );
}
