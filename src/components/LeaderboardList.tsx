import { Link } from 'react-router-dom';
import { initials } from '../lib/utils';
import VerificationBadge from './VerificationBadge';
import { MEET_LEVELS, meetLevelStyle } from '../lib/types';
import type { LeaderboardEntry } from '../lib/leaderboard';

interface Props {
  entries: LeaderboardEntry[];
  /** Column label above the right-hand secondary value, e.g. "Points". */
  secondaryLabel?: string;
  emptyMessage?: string;
}

/** Rank 1 solid lime circle, 2–3 a soft circle, 4+ a plain muted number. */
function RankMark({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span
        className="font-display flex items-center justify-center flex-shrink-0"
        style={{ width: '44px', height: '44px', borderRadius: '999px', background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 800, fontSize: '20px' }}
      >
        {rank}
      </span>
    );
  }
  if (rank <= 3) {
    return (
      <span
        className="font-display flex items-center justify-center flex-shrink-0"
        style={{ width: '44px', height: '44px', borderRadius: '999px', background: 'var(--surface-2)', color: 'var(--text)', fontWeight: 800, fontSize: '18px' }}
      >
        {rank}
      </span>
    );
  }
  return (
    <span
      className="font-display text-center flex-shrink-0"
      style={{ width: '44px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '17px' }}
    >
      {rank}
    </span>
  );
}

function MeetBadge({ level }: { level?: string | null }) {
  if (!level) return null;
  const meta = MEET_LEVELS.find((m) => m.id === level);
  if (!meta) return null;
  return (
    <span
      className="rounded-pill flex-shrink-0"
      style={{ ...meetLevelStyle(meta.id), fontSize: '11px', fontWeight: 600, padding: '3px 10px' }}
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
              className="flex items-center gap-4 transition-colors hover:border-line-strong"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '16px 20px',
              }}
            >
              {showRanks && <RankMark rank={rank} />}

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
                    style={{ fontWeight: 600, fontSize: rank === 1 && showRanks ? '24px' : '20px', color: 'var(--text)', lineHeight: 1 }}
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
