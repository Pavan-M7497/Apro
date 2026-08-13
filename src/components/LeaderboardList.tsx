import { Link } from 'react-router-dom';
import { initials } from '../lib/utils';
import VerificationBadge from './VerificationBadge';
import { MEET_LEVELS, MEET_LEVEL_COLORS } from '../lib/types';
import type { LeaderboardEntry } from '../lib/leaderboard';

interface Props {
  entries: LeaderboardEntry[];
  /** Column label above the right-hand secondary value, e.g. "Points". */
  secondaryLabel?: string;
  emptyMessage?: string;
}

/** Rank 1 is loud, 2–3 are emphasised, everyone else is muted. */
function rankStyle(rank: number): React.CSSProperties {
  if (rank === 1) {
    return { fontSize: '34px', fontWeight: 800, color: 'var(--accent-ink)', lineHeight: 1 };
  }
  if (rank <= 3) {
    return { fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 };
  }
  return { fontSize: '18px', fontWeight: 600, color: 'var(--text-soft)', lineHeight: 1 };
}

function MeetBadge({ level }: { level?: string | null }) {
  if (!level) return null;
  const meta = MEET_LEVELS.find((m) => m.id === level);
  if (!meta) return null;
  const color = MEET_LEVEL_COLORS[meta.id] || 'var(--text-muted)';
  return (
    <span
      className="rounded-pill flex-shrink-0"
      style={{ background: `${color}22`, color, fontSize: '11px', fontWeight: 500, padding: '3px 10px' }}
    >
      {meta.name}
    </span>
  );
}

export default function LeaderboardList({ entries, secondaryLabel, emptyMessage }: Props) {
  if (entries.length === 0) {
    return (
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '24px 0' }}>
        {emptyMessage || 'No results yet for this combination.'}
      </p>
    );
  }

  // Under three entries there is no meaningful ordering to convey.
  const showRanks = entries.length >= 3;

  return (
    <div>
      <div className="space-y-2">
        {entries.map((e, i) => {
          const rank = i + 1;
          return (
            <Link
              key={e.profileId}
              to={`/profile/${e.username}`}
              className="flex items-center gap-4 transition-colors hover:border-accent"
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '16px 20px',
              }}
            >
              {showRanks && (
                <span className="font-display text-center flex-shrink-0" style={{ ...rankStyle(rank), width: '44px' }}>
                  {rank}
                </span>
              )}

              {/* Avatar */}
              <div
                className="overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-soft)' }}
              >
                {e.avatarUrl ? (
                  <img src={e.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display" style={{ fontWeight: 800, fontSize: '15px', color: 'var(--accent-ink)' }}>
                    {initials(e.fullName)}
                  </span>
                )}
              </div>

              {/* Name + club */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-display flex items-center gap-1.5"
                  style={{ fontWeight: 800, fontSize: rank === 1 && showRanks ? '19px' : '17px', color: 'var(--text)' }}
                >
                  <span className="truncate">{e.fullName}</span>
                  <VerificationBadge tier={e.verificationTier} />
                  {e.isClaimed === false && (
                    <span
                      className="rounded-pill flex-shrink-0"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 500, padding: '2px 8px' }}
                    >
                      Unclaimed
                    </span>
                  )}
                </p>
                <p className="truncate" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {e.clubName || 'Unattached'}
                </p>
              </div>

              {/* Meet level */}
              <MeetBadge level={e.meetLevel} />

              {/* Key metric */}
              <div className="text-right flex-shrink-0">
                <div className="flex items-baseline gap-2 justify-end">
                  <span
                    className="font-display"
                    style={{
                      fontWeight: 800,
                      fontSize: rank === 1 && showRanks ? '26px' : '20px',
                      color: rank === 1 && showRanks ? 'var(--accent-ink)' : 'var(--text)',
                      lineHeight: 1,
                    }}
                  >
                    {e.metric}
                  </span>
                  {e.metricSub && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.metricSub}</span>
                  )}
                </div>
              </div>

              {/* Secondary column */}
              {e.secondary !== undefined && (
                <div className="text-right flex-shrink-0" style={{ minWidth: '64px' }}>
                  <div className="font-display" style={{ fontWeight: 800, fontSize: '17px', color: 'var(--text)' }}>
                    {e.secondary}
                  </div>
                  {secondaryLabel && (
                    <div style={{ fontSize: '10px', color: 'var(--text-soft)' }}>{secondaryLabel}</div>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {entries.length < 5 && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '16px' }}>
          Early days — {entries.length} athlete{entries.length === 1 ? '' : 's'} ranked. More results being added.
        </p>
      )}
    </div>
  );
}
