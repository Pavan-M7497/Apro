import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { StateSelect } from '../components/StateSelect';
import LeaderboardList from '../components/LeaderboardList';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchAgeGroups } from '../lib/ageGroups';
import {
  fetchAthleteMeta, fetchBaseTimes, baseTimeKey, swimPoints, currentSeasonYear,
  bestPerAthlete, passesAthleteFilters,
  type AthleteMeta, type LeaderboardEntry,
} from '../lib/leaderboard';
import {
  EVENTS, GENDERS, formatSwimTime, type AgeGroup,
} from '../lib/types';
import { ChevronDown } from 'lucide-react';

type Board = 'swimming' | 'waterpolo' | 'diving';
type SwimTab = 'event' | 'points';
type WpTab = 'goals' | 'assists' | 'saves' | 'exclusions' | 'teams';

const DIVING_INDIVIDUAL = ['1m Springboard', '3m Springboard', '10m Platform'];
const MIN_MATCHES = 5;

const field =
  'w-full bg-white border border-line px-4 py-2.5 text-sm text-text focus:border-accent transition-colors appearance-none rounded-pill';
const label = 'block text-xs font-medium text-text-muted mb-1.5';

/** Aquatics convention: age is taken as of 31 December of the season. */
const refDateFor = (year: number) => `${year}-12-31`;

function Pills<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { id: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap" style={{ gap: '8px' }}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="rounded-pill transition-colors"
            style={{
              fontSize: '14px',
              fontWeight: on ? 600 : 500,
              padding: '10px 20px',
              background: on ? 'var(--accent-soft)' : 'transparent',
              color: on ? 'var(--accent-ink)' : 'var(--text-muted)',
              border: `1px solid ${on ? 'transparent' : 'var(--border)'}`,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Leaderboard() {
  const [board, setBoard] = useState<Board>('swimming');
  const [swimTab, setSwimTab] = useState<SwimTab>('event');
  const [wpTab, setWpTab] = useState<WpTab>('goals');

  // Shared filters
  const [gender, setGender] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [stateCode, setStateCode] = useState('');

  // Board-specific
  const [swimEvent, setSwimEvent] = useState(EVENTS.swimming[1]); // 100m Freestyle
  const [course, setCourse] = useState('LCM');
  const [diveEvent, setDiveEvent] = useState(DIVING_INDIVIDUAL[1]);
  const [season, setSeason] = useState('');
  const [seasons, setSeasons] = useState<string[]>([]);

  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [unqualified, setUnqualified] = useState<LeaderboardEntry[]>([]);
  const [showUnqualified, setShowUnqualified] = useState(false);
  const [loading, setLoading] = useState(true);

  const seasonYear = currentSeasonYear();
  const refDate = refDateFor(seasonYear);

  useEffect(() => { fetchAgeGroups().then(setAgeGroups); }, []);

  // Season options come from the data itself.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('waterpolo_stats').select('season');
      const list = Array.from(new Set(((data as any[]) || []).map((r) => r.season))).sort().reverse();
      setSeasons(list);
    })();
  }, []);

  const ageGroupOptions = useMemo(
    () => ageGroups.filter((g) => g.discipline === board).sort((a, b) => a.sort_order - b.sort_order),
    [ageGroups, board],
  );

  const toEntry = (meta: AthleteMeta, extra: Partial<LeaderboardEntry>): LeaderboardEntry => ({
    profileId: meta.profileId,
    username: meta.username,
    fullName: meta.fullName,
    avatarUrl: meta.avatarUrl,
    clubName: meta.clubName,
    metric: '',
    verificationTier: meta.verificationTier,
    isClaimed: meta.isClaimed,
    ...extra,
  });

  // ─────────────────────────── Swimming ───────────────────────────
  const loadSwimming = useCallback(async () => {
    let q = supabase
      .from('performance_records')
      .select('*')
      .eq('discipline', 'swimming')
      .not('result_seconds', 'is', null);

    if (swimTab === 'event') q = q.eq('event', swimEvent).eq('course', course);

    const { data } = await q;
    const rows = ((data as any[]) || []).filter((r) => Number(r.result_seconds) > 0);
    if (rows.length === 0) return { ranked: [], notQualified: [] };

    const meta = await fetchAthleteMeta(rows.map((r) => r.profile_id));
    const bases = await fetchBaseTimes(seasonYear);
    const filters = { gender, stateCode, ageGroup, discipline: 'swimming' };
    const visible = rows.filter((r) => passesAthleteFilters(meta.get(r.profile_id), filters, ageGroups, refDate));

    if (swimTab === 'event') {
      // Fastest time per athlete for this event + course.
      const best = bestPerAthlete(visible, (a, b) => Number(a.result_seconds) < Number(b.result_seconds));
      best.sort((a, b) => Number(a.result_seconds) - Number(b.result_seconds));
      return {
        ranked: best.map((r) => {
          const m = meta.get(r.profile_id)!;
          const base = m.gender ? bases.get(baseTimeKey(r.event, r.course, m.gender)) : undefined;
          const pts = swimPoints(base, Number(r.result_seconds));
          return toEntry(m, {
            metric: formatSwimTime(Number(r.result_seconds)),
            secondary: pts == null ? '—' : String(pts),
            meetLevel: r.meet_level,
          });
        }),
        notQualified: [],
      };
    }

    // "All events by points" — each athlete's single best points score.
    const scored = visible
      .map((r) => {
        const m = meta.get(r.profile_id)!;
        const base = m.gender ? bases.get(baseTimeKey(r.event, r.course, m.gender)) : undefined;
        return { row: r, meta: m, points: swimPoints(base, Number(r.result_seconds)) };
      })
      .filter((x) => x.points != null);

    const bestByAthlete = new Map<string, typeof scored[number]>();
    scored.forEach((x) => {
      const cur = bestByAthlete.get(x.meta.profileId);
      if (!cur || x.points! > cur.points!) bestByAthlete.set(x.meta.profileId, x);
    });

    const list = Array.from(bestByAthlete.values()).sort((a, b) => b.points! - a.points!);
    return {
      ranked: list.map((x) =>
        toEntry(x.meta, {
          metric: String(x.points),
          metricSub: `pts`,
          secondary: `${x.row.event} · ${x.row.course}`,
          meetLevel: x.row.meet_level,
        }),
      ),
      notQualified: [],
    };
  }, [swimTab, swimEvent, course, gender, stateCode, ageGroup, ageGroups, refDate, seasonYear]);

  // ─────────────────────────── Diving ───────────────────────────
  const loadDiving = useCallback(async () => {
    const { data } = await supabase
      .from('diving_results')
      .select('*')
      .eq('event', diveEvent)
      .in('event', DIVING_INDIVIDUAL); // synchro never appears on individual boards

    const rows = (data as any[]) || [];
    if (rows.length === 0) return { ranked: [], notQualified: [] };

    const meta = await fetchAthleteMeta(rows.map((r) => r.profile_id));
    const filters = { gender, stateCode, ageGroup, discipline: 'diving' };
    const visible = rows.filter((r) => passesAthleteFilters(meta.get(r.profile_id), filters, ageGroups, refDate));

    const best = bestPerAthlete(visible, (a, b) => Number(a.total_score) > Number(b.total_score));
    best.sort((a, b) => Number(b.total_score) - Number(a.total_score));

    return {
      ranked: best.map((r) => {
        const m = meta.get(r.profile_id)!;
        const bits: string[] = [];
        if (r.dive_count) bits.push(`${r.dive_count} dives`);
        if (r.average_dd) bits.push(`avg DD ${Number(r.average_dd).toFixed(2)}`);
        return toEntry(m, {
          metric: Number(r.total_score).toFixed(2),
          metricSub: bits.length ? bits.join(' · ') : undefined,
          meetLevel: r.meet_level,
        });
      }),
      notQualified: [],
    };
  }, [diveEvent, gender, stateCode, ageGroup, ageGroups, refDate]);

  // ─────────────────────────── Water polo ───────────────────────────
  const loadWaterpolo = useCallback(async () => {
    let q = supabase.from('waterpolo_stats').select('*');
    if (season) q = q.eq('season', season);
    const { data } = await q;
    const rows = (data as any[]) || [];
    if (rows.length === 0) return { ranked: [], notQualified: [] };

    const meta = await fetchAthleteMeta(rows.map((r) => r.profile_id));
    const filters = { gender, stateCode, ageGroup, discipline: 'waterpolo' };
    const visible = rows.filter((r) => passesAthleteFilters(meta.get(r.profile_id), filters, ageGroups, refDate));

    // Teams: total goals per club across rostered athletes.
    if (wpTab === 'teams') {
      const byClub = new Map<string, { name: string; goals: number; players: Set<string> }>();
      visible.forEach((r) => {
        const m = meta.get(r.profile_id);
        if (!m?.clubName) return;
        const cur = byClub.get(m.clubName) || { name: m.clubName, goals: 0, players: new Set<string>() };
        cur.goals += Number(r.goals) || 0;
        cur.players.add(m.profileId);
        byClub.set(m.clubName, cur);
      });
      const teams = Array.from(byClub.values()).sort((a, b) => b.goals - a.goals);
      return {
        ranked: teams.map((t, i) => ({
          profileId: `club-${i}-${t.name}`,
          username: '',
          fullName: t.name,
          avatarUrl: null,
          clubName: `${t.players.size} athlete${t.players.size === 1 ? '' : 's'}`,
          metric: String(t.goals),
          metricSub: 'goals',
        })),
        notQualified: [],
      };
    }

    const isSaves = wpTab === 'saves';
    // Saves is a goalkeeper stat; the rest are field-player stats.
    const pool = visible.filter((r) => (isSaves ? r.is_goalkeeper === true : r.is_goalkeeper !== true));

    const rate = (r: any): { value: number; display: string; sub: string } | null => {
      const matches = Number(r.matches) || 0;
      if (wpTab === 'saves') {
        const saves = Number(r.saves) || 0;
        const conceded = Number(r.goals_conceded) || 0;
        const faced = saves + conceded;
        if (faced === 0) return null;
        const pct = (saves / faced) * 100;
        return { value: pct, display: `${pct.toFixed(2)}%`, sub: `(${saves} of ${faced})` };
      }
      if (matches === 0) return null;
      const totalKey = wpTab === 'goals' ? 'goals' : wpTab === 'assists' ? 'assists' : 'exclusions_drawn';
      const total = Number(r[totalKey]) || 0;
      const per = total / matches;
      return { value: per, display: per.toFixed(2), sub: `(${total} in ${matches})` };
    };

    const build = (list: any[]) =>
      list
        .map((r) => ({ row: r, meta: meta.get(r.profile_id)!, calc: rate(r) }))
        .filter((x) => x.calc !== null)
        .sort((a, b) => b.calc!.value - a.calc!.value)
        .map((x) =>
          toEntry(x.meta, {
            metric: x.calc!.display,
            metricSub: x.calc!.sub,
            secondary: x.row.season,
          }),
        );

    const qualified = pool.filter((r) => (Number(r.matches) || 0) >= MIN_MATCHES);
    const partial = pool.filter((r) => {
      const m = Number(r.matches) || 0;
      return m >= 1 && m < MIN_MATCHES;
    });

    return { ranked: build(qualified), notQualified: build(partial) };
  }, [wpTab, season, gender, stateCode, ageGroup, ageGroups, refDate]);

  // ─────────────────────────── Dispatch ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const loader = board === 'swimming' ? loadSwimming : board === 'diving' ? loadDiving : loadWaterpolo;
        const { ranked, notQualified } = await loader();
        if (cancelled) return;
        setEntries(ranked);
        setUnqualified(notQualified);
      } catch {
        if (!cancelled) { setEntries([]); setUnqualified([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [board, loadSwimming, loadDiving, loadWaterpolo]);

  // ─────────────────────────── Heading ───────────────────────────
  const heading = useMemo(() => {
    const parts: string[] = [];
    if (board === 'swimming') {
      if (swimTab === 'points') parts.push('All events by points');
      else { parts.push(swimEvent); parts.push(course); }
    } else if (board === 'diving') {
      parts.push(diveEvent);
    } else {
      const names: Record<WpTab, string> = {
        goals: 'Goals per match', assists: 'Assists per match',
        saves: 'Save percentage', exclusions: 'Exclusions drawn per match',
        teams: 'Clubs by total goals',
      };
      parts.push(names[wpTab]);
      if (season) parts.push(season);
    }
    if (gender) parts.push(GENDERS.find((g) => g.id === gender)?.label || gender);
    if (ageGroup) parts.push(ageGroup);
    if (stateCode) parts.push(stateCode);
    return parts.join(' · ');
  }, [board, swimTab, swimEvent, course, diveEvent, wpTab, season, gender, ageGroup, stateCode]);

  const showAthleteFilters = !(board === 'waterpolo' && wpTab === 'teams');

  return (
    <div className="min-h-screen pt-8 md:pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-5">
        <h1 className="font-display" style={{ fontWeight: 800, fontSize: '34px', letterSpacing: '-0.01em', marginBottom: '24px' }}>
          Leaderboards
        </h1>

        {/* Discipline tabs */}
        <div style={{ marginBottom: '24px' }}>
          <Pills
            value={board}
            onChange={(b) => { setBoard(b); setAgeGroup(''); }}
            options={[
              { id: 'swimming', label: 'Swimming' },
              { id: 'waterpolo', label: 'Water Polo' },
              { id: 'diving', label: 'Diving' },
            ]}
          />
        </div>

        {/* Sub-tabs */}
        {board === 'swimming' && (
          <div style={{ marginBottom: '24px' }}>
            <Pills
              value={swimTab}
              onChange={setSwimTab}
              options={[{ id: 'event', label: 'By event' }, { id: 'points', label: 'All events by points' }]}
            />
          </div>
        )}
        {board === 'waterpolo' && (
          <div style={{ marginBottom: '24px' }}>
            <Pills
              value={wpTab}
              onChange={setWpTab}
              options={[
                { id: 'goals', label: 'Goals' },
                { id: 'assists', label: 'Assists' },
                { id: 'saves', label: 'Saves' },
                { id: 'exclusions', label: 'Exclusions drawn' },
                { id: 'teams', label: 'Teams' },
              ]}
            />
          </div>
        )}

        {/* Filters */}
        <div
          style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
            {board === 'swimming' && swimTab === 'event' && (
              <>
                <div>
                  <label className={label}>Event</label>
                  <select value={swimEvent} onChange={(e) => setSwimEvent(e.target.value)} className={field}>
                    {EVENTS.swimming.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Course</label>
                  <select value={course} onChange={(e) => setCourse(e.target.value)} className={field}>
                    <option value="LCM">Long course (50m)</option>
                    <option value="SCM">Short course (25m)</option>
                  </select>
                </div>
              </>
            )}

            {board === 'diving' && (
              <div>
                <label className={label}>Event</label>
                <select value={diveEvent} onChange={(e) => setDiveEvent(e.target.value)} className={field}>
                  {DIVING_INDIVIDUAL.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              </div>
            )}

            {board === 'waterpolo' && (
              <div>
                <label className={label}>Season</label>
                <select value={season} onChange={(e) => setSeason(e.target.value)} className={field}>
                  <option value="">All seasons</option>
                  {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {showAthleteFilters && (
              <>
                <div>
                  <label className={label}>Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={field}>
                    <option value="">All</option>
                    {GENDERS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Age group</label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className={field}
                    disabled={ageGroupOptions.length === 0}
                  >
                    <option value="">{ageGroupOptions.length === 0 ? 'None configured' : 'All ages'}</option>
                    {ageGroupOptions.map((g) => <option key={g.id} value={g.label}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>State</label>
                  <StateSelect
                    value={stateCode}
                    onChange={setStateCode}
                    placeholder="All states"
                    className="bg-white border border-line px-4 py-2.5 text-sm rounded-pill"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Board heading — the filter combination, never a "Top N" label */}
        <h2 className="font-display" style={{ fontWeight: 800, fontSize: '22px', marginBottom: '16px' }}>
          {heading}
        </h2>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <LeaderboardList
              entries={entries}
              secondaryLabel={
                board === 'swimming' && swimTab === 'event' ? 'Points'
                : board === 'swimming' ? 'Best event'
                : board === 'waterpolo' && wpTab !== 'teams' ? 'Season'
                : undefined
              }
              emptyMessage="No results yet for this combination."
            />

            {/* Water polo qualification gate */}
            {board === 'waterpolo' && wpTab !== 'teams' && unqualified.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <button
                  onClick={() => setShowUnqualified((v) => !v)}
                  className="flex items-center gap-2 rounded-pill"
                  style={{
                    background: '#fff', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, padding: '12px 24px',
                  }}
                >
                  <ChevronDown
                    className="w-4 h-4"
                    style={{ transform: showUnqualified ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
                  />
                  Not yet qualified ({unqualified.length})
                </button>

                {showUnqualified && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Needs {MIN_MATCHES}+ matches to rank.
                    </p>
                    <div className="space-y-2">
                      {unqualified.map((e) => (
                        <div
                          key={e.profileId}
                          className="flex items-center gap-4"
                          style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 20px' }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-display truncate" style={{ fontWeight: 800, fontSize: '16px' }}>{e.fullName}</p>
                            <p className="truncate" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{e.clubName || 'Unattached'}</p>
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{e.metricSub}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
