import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCountryFlag, initials } from '../lib/utils';
import { COUNTRIES } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Trophy } from 'lucide-react';

interface ScoreRow {
  id: string;
  profile_id: string;
  sport: string;
  country: string;
  score: number;
  breakdown: {
    profile_completeness: number;
    verification_tier: number;
    achievement_weight: number;
    engagement: number;
  };
  profile: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
  };
}

interface SportOption {
  name: string;
}

export default function Leaderboard() {
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  useEffect(() => {
    loadSports();
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedSport, selectedCountry]);

  const loadSports = async () => {
    const { data } = await supabase
      .from('sports_list')
      .select('name')
      .order('is_official', { ascending: false })
      .order('usage_count', { ascending: false });
    if (data) setSports(data.map((s: SportOption) => s.name));
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    let query = supabase
      .from('apro_scores')
      .select('*, profile:profiles(username, full_name, avatar_url, role)')
      .order('score', { ascending: false })
      .limit(20);

    if (selectedSport) query = query.eq('sport', selectedSport);
    if (selectedCountry) query = query.eq('country', selectedCountry);

    const { data } = await query;
    setRows((data as ScoreRow[]) || []);
    setLoading(false);
  };

  const tierLabel = (score: ScoreRow) => {
    if (!score.breakdown) return null;
    const b = score.breakdown;
    return (
      <div className="bg-primary border border-white/10 p-3 text-xs space-y-1.5" style={{ borderRadius: '4px', minWidth: '200px' }}>
        <div className="font-display font-black uppercase text-accent text-sm mb-2">Score breakdown</div>
        <div className="flex justify-between">
          <span className="text-text-muted">Profile</span>
          <span className="font-bold">{b.profile_completeness ?? 0}/20</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Verification</span>
          <span className="font-bold">{b.verification_tier ?? 0}/30</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Achievements</span>
          <span className="font-bold">{b.achievement_weight ?? 0}/30</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Engagement</span>
          <span className="font-bold">{b.engagement ?? 0}/20</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-6 md:pt-10 pb-24">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-display font-black uppercase text-3xl tracking-wide mb-2">Leaderboard</h1>
        <p className="text-text-muted text-sm mb-6">Top athletes ranked by Apro Score</p>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="bg-card border border-white/10 px-4 py-2 text-sm text-text focus:border-accent/50 transition-colors appearance-none"
            style={{ borderRadius: '4px' }}
          >
            <option value="">All sports</option>
            {sports.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-card border border-white/10 px-4 py-2 text-sm text-text focus:border-accent/50 transition-colors appearance-none"
            style={{ borderRadius: '4px' }}
          >
            <option value="">All countries</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No rankings yet"
            description="Athletes will appear here once their Apro Scores are calculated."
          />
        ) : (
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div
                key={row.id}
                className="relative bg-card border border-white/5 hover:border-accent/20 transition-colors"
                style={{ borderRadius: '4px' }}
                onMouseEnter={() => setTooltipId(row.id)}
                onMouseLeave={() => setTooltipId(null)}
              >
                <Link
                  to={`/profile/${row.profile?.username}`}
                  className="flex items-center gap-4 p-4"
                >
                  {/* Rank */}
                  <span
                    className="font-display font-black text-center flex-shrink-0"
                    style={{
                      width: i === 0 ? '48px' : '32px',
                      fontSize: i === 0 ? '56px' : i <= 2 ? '28px' : '20px',
                      color: i === 0 ? '#E8FF47' : i === 1 ? '#8888A0' : i === 2 ? '#EF9F27' : 'rgba(255,255,255,0.2)',
                      lineHeight: 1,
                    }}
                  >
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-surface" style={{ borderRadius: '4px' }}>
                    {row.profile?.avatar_url ? (
                      <img src={row.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-black text-sm text-text-muted bg-surface">
                        {initials(row.profile?.full_name || '?')}
                      </div>
                    )}
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-black uppercase text-sm tracking-wide truncate">
                        {row.profile?.full_name}
                      </span>
                      <span>{getCountryFlag(row.country)}</span>
                    </div>
                    {row.sport && (
                      <span className="font-display text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 uppercase tracking-wide mt-1 inline-block" style={{ borderRadius: '3px' }}>
                        {row.sport}
                      </span>
                    )}
                  </div>

                  {/* Score bar + number */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:block w-24">
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${row.score}%`, background: '#E8FF47', borderRadius: '2px' }} />
                      </div>
                    </div>
                    <span className="font-display font-black text-accent w-12 text-right" style={{ fontSize: '22px' }}>
                      {row.score}
                    </span>
                  </div>
                </Link>

                {/* Breakdown tooltip */}
                {tooltipId === row.id && row.breakdown && (
                  <div className="absolute right-4 top-full mt-1 z-10">
                    {tierLabel(row)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
