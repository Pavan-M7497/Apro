import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import type { Profile, AthleteProfile } from '../lib/types';
import { SPORTS, COUNTRIES, POSITIONS } from '../lib/types';
import AthleteCard from '../components/AthleteCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function Discover() {
  useAppStore();
  const [athletes, setAthletes] = useState<{ profile: Profile; athlete: AthleteProfile | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadAthletes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*, athlete_profiles(*)')
      .eq('role', 'athlete')
      .order('created_at', { ascending: false })
      .limit(50);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`);
    }
    if (countryFilter) {
      query = query.eq('country', countryFilter);
    }

    const { data } = await query;

    let results = (data || []) as any[];

    // Client-side filter by sport/position since they're in athlete_profiles
    if (sportFilter) {
      results = results.filter((r) =>
        r.athlete_profiles && r.athlete_profiles.sport === sportFilter
      );
    }
    if (positionFilter) {
      results = results.filter((r) =>
        r.athlete_profiles && r.athlete_profiles.position === positionFilter
      );
    }

    setAthletes(
      results.map((r) => ({
        profile: r as Profile,
        athlete: (r.athlete_profiles as AthleteProfile) || null,
      }))
    );
    setLoading(false);
  }, [search, sportFilter, countryFilter, positionFilter]);

  useEffect(() => { loadAthletes(); }, [loadAthletes]);

  const clearFilters = () => {
    setSportFilter('');
    setCountryFilter('');
    setPositionFilter('');
    setSearch('');
  };

  const hasFilters = sportFilter || countryFilter || positionFilter;

  return (
    <div className="min-h-screen pt-6 md:pt-10 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Discover Athletes</h1>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athletes by name..."
              className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              hasFilters
                ? 'border-accent/30 bg-accent/10 text-accent'
                : 'border-white/10 text-text-muted hover:text-text hover:border-white/20'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-accent text-primary text-xs flex items-center justify-center font-bold">
                {[sportFilter, countryFilter, positionFilter].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="bg-card rounded-xl p-4 border border-white/5 mb-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Filters</span>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-accent hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Sport</label>
                <select
                  value={sportFilter}
                  onChange={(e) => { setSportFilter(e.target.value); setPositionFilter(''); }}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs text-text focus:border-accent/50 transition-colors appearance-none"
                >
                  <option value="">All sports</option>
                  {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Country</label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs text-text focus:border-accent/50 transition-colors appearance-none"
                >
                  <option value="">All countries</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Position</label>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs text-text focus:border-accent/50 transition-colors appearance-none"
                  disabled={!sportFilter}
                >
                  <option value="">All positions</option>
                  {sportFilter && (POSITIONS[sportFilter] || []).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {sportFilter && (
              <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                {sportFilter}
                <button onClick={() => { setSportFilter(''); setPositionFilter(''); }}><X className="w-3 h-3" /></button>
              </span>
            )}
            {countryFilter && (
              <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                {countryFilter}
                <button onClick={() => setCountryFilter('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {positionFilter && (
              <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                {positionFilter}
                <button onClick={() => setPositionFilter('')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <LoadingSpinner />
        ) : athletes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {athletes.map(({ profile, athlete }) => (
              <AthleteCard key={profile.id} profile={profile} athleteProfile={athlete} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No athletes found"
            description={hasFilters ? "Try adjusting your filters or search terms." : "Be the first athlete to join Apro!"}
          />
        )}
      </div>
    </div>
  );
}
