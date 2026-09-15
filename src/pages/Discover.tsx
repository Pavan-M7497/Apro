import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile, AthleteProfile } from '../lib/types';
import { ATHLETE_PUBLIC_COLUMNS, DISCIPLINES, eventsFor, MEET_LEVELS } from '../lib/types';
import { StateSelect } from '../components/StateSelect';
import AthleteCard from '../components/AthleteCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const AVAILABILITY = [
  { id: 'available', label: 'Available' },
  { id: 'open_to_offers', label: 'Open to offers' },
  { id: 'unavailable', label: 'Unavailable' },
];

const fieldClass =
  'w-full bg-card border border-line px-4 py-2.5 text-sm text-text focus:border-accent-ink transition-colors appearance-none rounded-xl';
const labelClass = 'block text-xs font-medium text-text-muted mb-1.5';

export default function Discover() {
  const [searchParams] = useSearchParams();
  const [athletes, setAthletes] = useState<{ profile: Profile; athlete: AthleteProfile | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [discipline, setDiscipline] = useState(searchParams.get('discipline') || searchParams.get('sport') || '');
  const [event, setEvent] = useState('');
  const [stateCode, setStateCode] = useState(searchParams.get('state') || '');
  const [meetLevel, setMeetLevel] = useState('');
  const [availability, setAvailability] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadAthletes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select(`*, athlete_profiles(${ATHLETE_PUBLIC_COLUMNS})`)
      .eq('role', 'athlete')
      .order('created_at', { ascending: false })
      .limit(50);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`);
    }
    if (stateCode) {
      query = query.eq('state_code', stateCode);
    }

    const { data } = await query;
    let results = (data || []) as any[];

    // Discipline + availability live on athlete_profiles
    if (discipline) {
      results = results.filter((r) => r.athlete_profiles?.sport === discipline);
    }
    if (availability) {
      results = results.filter((r) => r.athlete_profiles?.availability === availability);
    }
    // Tier 3+ means a result was matched from an official meet — a
    // self-declared ID (tier 2) does not count as verified here.
    if (verifiedOnly) {
      results = results.filter((r) => (r.verification_tier ?? 0) >= 3);
    }

    // Event / meet level come from performance_records
    if (event || meetLevel) {
      let perf = supabase.from('performance_records').select('profile_id');
      if (event) perf = perf.eq('event', event);
      if (meetLevel) perf = perf.eq('meet_level', meetLevel);
      const { data: rows } = await perf;
      const allowed = new Set((rows || []).map((r: { profile_id: string }) => r.profile_id));
      results = results.filter((r) => allowed.has(r.id));
    }

    setAthletes(
      results.map((r) => ({
        profile: r as Profile,
        athlete: (r.athlete_profiles as AthleteProfile) || null,
      }))
    );
    setLoading(false);
  }, [search, discipline, event, stateCode, meetLevel, availability, verifiedOnly]);

  useEffect(() => { loadAthletes(); }, [loadAthletes]);

  const clearFilters = () => {
    setDiscipline('');
    setEvent('');
    setStateCode('');
    setMeetLevel('');
    setAvailability('');
    setVerifiedOnly(false);
    setSearch('');
  };

  const active = [discipline, event, stateCode, meetLevel, availability, verifiedOnly ? 'verified' : ''].filter(Boolean);
  const hasFilters = active.length > 0;
  const eventOptions = eventsFor(discipline);

  const chip = (label: string, clear: () => void) => (
    <span
      key={label}
      className="inline-flex items-center gap-1.5 rounded-pill"
      style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)', fontSize: '11px', fontWeight: 500, padding: '5px 12px' }}
    >
      {label}
      <button onClick={clear} aria-label={`Clear ${label}`}><X className="w-3 h-3" /></button>
    </span>
  );

  return (
    <div className="min-h-screen pt-8 md:pt-12 pb-24">
      <div className="max-w-5xl mx-auto px-5">
        <h1 className="font-display mb-8" style={{ fontWeight: 800, fontSize: '34px', letterSpacing: '-0.01em' }}>
          Discover athletes
        </h1>

        {/* Search */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-white border border-line rounded-pill pl-11 pr-4 py-3 text-sm text-text focus:border-accent-ink transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-pill text-sm font-medium border transition-colors"
            style={
              hasFilters
                ? { background: 'var(--accent-soft)', color: 'var(--accent-ink)', borderColor: 'var(--accent)', padding: '12px 24px' }
                : { background: '#fff', color: 'var(--text-muted)', borderColor: 'var(--border)', padding: '12px 24px' }
            }
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasFilters && <span className="font-bold">{active.length}</span>}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div
            className="mb-5 animate-slide-up"
            style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-display" style={{ fontWeight: 800, fontSize: '17px' }}>Filters</span>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-text-muted hover:text-text flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Discipline</label>
                <select
                  value={discipline}
                  onChange={(e) => { setDiscipline(e.target.value); setEvent(''); }}
                  className={fieldClass}
                >
                  <option value="">All disciplines</option>
                  {DISCIPLINES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Event</label>
                <select
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className={fieldClass}
                  disabled={eventOptions.length === 0}
                >
                  <option value="">{eventOptions.length === 0 ? 'Pick a discipline first' : 'All events'}</option>
                  {eventOptions.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>State</label>
                <StateSelect
                  value={stateCode}
                  onChange={setStateCode}
                  placeholder="All states"
                  className="bg-white border border-line px-4 py-2.5 text-sm rounded-pill"
                />
              </div>
              <div>
                <label className={labelClass}>Meet level</label>
                <select value={meetLevel} onChange={(e) => setMeetLevel(e.target.value)} className={fieldClass}>
                  <option value="">Any level</option>
                  {MEET_LEVELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Verification</label>
                <button
                  type="button"
                  onClick={() => setVerifiedOnly((v) => !v)}
                  className="w-full rounded-pill text-sm text-left transition-colors"
                  style={
                    verifiedOnly
                      ? { background: 'var(--accent-soft)', color: 'var(--accent-ink)', border: '1px solid var(--accent)', fontWeight: 600, padding: '10px 16px' }
                      : { background: '#fff', color: 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 500, padding: '10px 16px' }
                  }
                >
                  {verifiedOnly ? 'Result-verified only' : 'All athletes'}
                </button>
              </div>
              <div>
                <label className={labelClass}>Availability</label>
                <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={fieldClass}>
                  <option value="">Any</option>
                  {AVAILABILITY.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {discipline && chip(DISCIPLINES.find((d) => d.id === discipline)?.name || discipline, () => { setDiscipline(''); setEvent(''); })}
            {event && chip(event, () => setEvent(''))}
            {stateCode && chip(stateCode, () => setStateCode(''))}
            {meetLevel && chip(MEET_LEVELS.find((m) => m.id === meetLevel)?.name || meetLevel, () => setMeetLevel(''))}
            {availability && chip(AVAILABILITY.find((a) => a.id === availability)?.label || availability, () => setAvailability(''))}
            {verifiedOnly && chip('Result-verified', () => setVerifiedOnly(false))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <LoadingSpinner />
        ) : athletes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {athletes.map(({ profile, athlete }) => (
              <AthleteCard key={profile.id} profile={profile} athleteProfile={athlete} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No athletes found"
            description={hasFilters ? 'No athletes match those filters yet. Apro is new — try widening your search.' : 'Apro is new — be the first athlete to build a profile.'}
          />
        )}
      </div>
    </div>
  );
}
