import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { getCountryFlag, initials, timeAgo } from '../lib/utils';
import { StateSelect } from '../components/StateSelect';
import { formatSwimTime } from '../lib/types';
import type { Profile } from '../lib/types';
import { Eye, Play, Users, Upload, Search, UserPlus, UserCheck, Trophy, Plus } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { DisciplineSelect } from '../components/DisciplineSelect';

// ── Athlete Home ────────────────────────────────────────────────────────────
interface ProfileViewRow {
  id: string;
  created_at: string;
  viewer_id: string | null;
  viewer?: Profile | null;
}

interface HighlightRow {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  sport: string;
  created_at: string;
  view_count: number;
}

function AthleteHome() {
  const { profile } = useAppStore();
  const navigate = useNavigate();
  const [viewsThisWeek, setViewsThisWeek] = useState(0);
  const [bestResult, setBestResult] = useState<{ label: string; value: string } | null>(null);
  const [recentViewers, setRecentViewers] = useState<ProfileViewRow[]>([]);
  const [recentHighlights, setRecentHighlights] = useState<HighlightRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [viewsRes, viewersRes, highlightsRes] = await Promise.all([
      supabase.from('profile_views').select('*', { count: 'exact', head: true })
        .eq('profile_id', profile!.id).gte('created_at', weekAgo),
      supabase.from('profile_views').select('id, created_at, viewer_id')
        .eq('profile_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('highlights').select('id, title, video_url, thumbnail_url, sport, created_at')
        .eq('profile_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(2),
    ]);

    setViewsThisWeek(viewsRes.count || 0);

    const viewers = (viewersRes.data || []) as ProfileViewRow[];
    const viewerIds = viewers.filter((v) => v.viewer_id).map((v) => v.viewer_id!);
    if (viewerIds.length > 0) {
      const { data: viewerProfiles } = await supabase
        .from('profiles').select('*').in('id', viewerIds);
      const pMap = new Map((viewerProfiles || []).map((p: Profile) => [p.id, p]));
      setRecentViewers(viewers.map((v) => ({ ...v, viewer: v.viewer_id ? pMap.get(v.viewer_id) || null : null })));
    } else {
      setRecentViewers(viewers);
    }

    setRecentHighlights((highlightsRes.data || []) as HighlightRow[]);

    // Headline result: fastest personal best, or top diving score.
    const [{ data: swims }, { data: dives }] = await Promise.all([
      supabase.from('performance_records')
        .select('event, result_seconds, is_personal_best')
        .eq('profile_id', profile!.id)
        .not('result_seconds', 'is', null)
        .order('result_seconds', { ascending: true })
        .limit(1),
      supabase.from('diving_results')
        .select('event, total_score')
        .eq('profile_id', profile!.id)
        .order('total_score', { ascending: false })
        .limit(1),
    ]);

    const swim = (swims || [])[0] as { event: string; result_seconds: number } | undefined;
    const dive = (dives || [])[0] as { event: string; total_score: number } | undefined;
    if (swim) {
      setBestResult({ label: swim.event, value: formatSwimTime(Number(swim.result_seconds)) });
    } else if (dive) {
      setBestResult({ label: dive.event, value: Number(dive.total_score).toFixed(2) });
    } else {
      setBestResult(null);
    }

    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Headline metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <Eye className="w-4 h-4 mb-2" style={{ color: 'var(--accent-ink)' }} />
          <div className="font-display" style={{ fontWeight: 800, fontSize: '44px', lineHeight: 1, color: 'var(--text)' }}>{viewsThisWeek}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Profile views this week</div>
        </div>

        <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <Trophy className="w-4 h-4 mb-2" style={{ color: 'var(--accent-ink)' }} />
          {bestResult ? (
            <>
              <div className="font-display" style={{ fontWeight: 800, fontSize: '44px', lineHeight: 1, color: 'var(--text)' }}>
                {bestResult.value}
              </div>
              <div className="truncate" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Best result · {bestResult.label}
              </div>
            </>
          ) : (
            <>
              <div className="font-display" style={{ fontWeight: 800, fontSize: '44px', lineHeight: 1, color: 'var(--text-soft)' }}>—</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>No results yet</div>
            </>
          )}
        </div>
      </div>

      {/* Primary CTA */}
      <button
        onClick={() => navigate('/profile/edit')}
        className="w-full flex items-center justify-center gap-2 rounded-pill hover:opacity-90 transition-opacity"
        style={{ background: 'var(--accent)', color: 'var(--on-accent)', padding: '16px', fontSize: '15px', fontWeight: 600 }}
      >
        <Plus className="w-5 h-5" />
        Add a result
      </button>

      {/* Who viewed you */}
      <div>
        <h2 className="font-display font-black uppercase" style={{ fontSize: '18px', letterSpacing: '0.02em', marginBottom: '12px' }}>Who viewed you</h2>
        {recentViewers.length === 0 ? (
          <p className="text-sm text-text-muted">No views yet</p>
        ) : (
          <div className="space-y-2">
            {recentViewers.map((v) => (
              <div key={v.id} className="flex items-center gap-3" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px' }}>
                {v.viewer ? (
                  <Link to={`/profile/${v.viewer.username}`} className="flex items-center gap-3 flex-1 hover:opacity-80">
                    <div className="w-8 h-8 flex-shrink-0 overflow-hidden bg-surface" style={{ borderRadius: '12px' }}>
                      {v.viewer.avatar_url ? (
                        <img src={v.viewer.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-display font-bold text-accent-ink bg-accent-soft">
                          {initials(v.viewer.full_name)}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{v.viewer.full_name}</span>
                      <span className="ml-1.5 inline-block" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '10px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: '999px' }}>
                        {v.viewer.role}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 flex-shrink-0 bg-surface flex items-center justify-center" style={{ borderRadius: '12px' }}>
                      <Eye className="w-4 h-4 text-text-muted/40" />
                    </div>
                    <span className="text-sm text-text-muted">Someone viewed your profile</span>
                  </div>
                )}
                <span className="text-[10px] text-text-muted flex-shrink-0">{timeAgo(v.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secondary action */}
      <button
        onClick={() => navigate('/upload')}
        className="w-full flex items-center justify-center gap-2 rounded-pill transition-colors"
        style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text)', padding: '16px', fontSize: '15px', fontWeight: 600 }}
      >
        <Upload className="w-5 h-5" />
        Upload a highlight
      </button>

      {/* Recent highlights */}
      {recentHighlights.length > 0 && (
        <div>
          <h2 className="font-display font-black uppercase" style={{ fontSize: '18px', letterSpacing: '0.02em', marginBottom: '12px' }}>Recent highlights</h2>
          <div className="grid grid-cols-2 gap-3">
            {recentHighlights.map((h) => (
              <Link
                key={h.id}
                to={`/profile/${profile?.username}`}
                className="bg-card border border-line overflow-hidden hover:border-line-strong transition-colors"
                style={{ borderRadius: '12px' }}
              >
                <div className="relative aspect-video bg-surface">
                  {h.thumbnail_url ? (
                    <img src={h.thumbnail_url} alt={h.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-accent-ink/30" />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="font-display font-bold uppercase text-xs tracking-wide truncate">{h.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Brand Home ───────────────────────────────────────────────────────────────
function BrandHome() {
  const navigate = useNavigate();
  const [sport, setSport] = useState('');
  const [country, setCountry] = useState('');
  const [newAthletes, setNewAthletes] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'athlete')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        setNewAthletes((data || []) as Profile[]);
        setLoading(false);
      });
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (country) params.set('state', country);
    navigate(`/discover?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="bg-card border border-line p-4" style={{ borderRadius: '12px' }}>
        <h2 className="font-display font-black uppercase" style={{ fontSize: '18px', letterSpacing: '0.02em', marginBottom: '12px' }}>Find athletes</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <DisciplineSelect value={sport} onChange={setSport} className="flex-1" />
          <StateSelect value={country} onChange={setCountry} placeholder="All states" className="flex-1 bg-surface border border-line px-4 py-2.5 text-sm rounded-pill" />
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderRadius: '999px', fontWeight: 600 }}
          >
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      {/* Saved shortlists placeholder */}
      <div>
        <h2 className="font-display font-black uppercase" style={{ fontSize: '18px', letterSpacing: '0.02em', marginBottom: '12px' }}>Saved shortlists</h2>
        <div className="bg-card border border-line p-6 text-center" style={{ borderRadius: '12px' }}>
          <p className="text-text-muted text-sm mb-3">No shortlists yet</p>
          <p className="text-xs text-text-muted/60">Create shortlists to save and organise athletes you're interested in — coming soon.</p>
        </div>
      </div>

      {/* New on Apro */}
      <div>
        <h2 className="font-display font-black uppercase" style={{ fontSize: '18px', letterSpacing: '0.02em', marginBottom: '12px' }}>New on Apro</h2>
        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {newAthletes.map((a) => (
              <Link
                key={a.id}
                to={`/profile/${a.username}`}
                className="bg-card border border-line p-3 hover:border-line-strong transition-colors text-center"
                style={{ borderRadius: '12px' }}
              >
                <div className="w-12 h-12 mx-auto overflow-hidden bg-surface mb-2" style={{ borderRadius: '12px' }}>
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display font-black text-accent-ink text-sm bg-accent-soft">
                      {initials(a.full_name)}
                    </div>
                  )}
                </div>
                <p className="font-display font-bold uppercase text-xs tracking-wide truncate">{a.full_name}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{getCountryFlag(a.country)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Post opportunity CTA */}
      <Link
        to="/opportunities"
        className="w-full flex items-center justify-center gap-3 py-4 font-display font-black uppercase text-base tracking-wide hover:bg-surface transition-colors"
        style={{ border: '1px solid var(--border-strong)', color: 'var(--text)', borderRadius: '999px', fontWeight: 600 }}
      >
        Post an opportunity
      </Link>
    </div>
  );
}

// ── Coach/Agent Home ─────────────────────────────────────────────────────────
function CoachHome() {
  const { profile } = useAppStore();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [sport, setSport] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadWatchlist();
  }, [profile]);

  const loadWatchlist = async () => {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', profile!.id);

    const ids = (follows || []).map((f: { following_id: string }) => f.following_id);
    setFollowing(ids);

    if (ids.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids)
        .eq('role', 'athlete')
        .order('updated_at', { ascending: false });
      setWatchlist((data || []) as Profile[]);
    }
    setLoading(false);
  };

  const handleFollowToggle = async (profileId: string) => {
    if (!profile) return;
    const isFollowing = following.includes(profileId);
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', profile.id).eq('following_id', profileId);
      setFollowing(following.filter((id) => id !== profileId));
      setWatchlist(watchlist.filter((p) => p.id !== profileId));
    } else {
      await supabase.from('follows').insert({ follower_id: profile.id, following_id: profileId });
      setFollowing([...following, profileId]);
    }
  };

  const handleScout = () => {
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (country) params.set('state', country);
    navigate(`/discover?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Talent search shortcut */}
      <div className="bg-card border border-line p-4" style={{ borderRadius: '12px' }}>
        <h2 className="font-display font-black uppercase" style={{ fontSize: '18px', letterSpacing: '0.02em', marginBottom: '12px' }}>Talent search</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <DisciplineSelect value={sport} onChange={setSport} className="flex-1" />
          <StateSelect value={country} onChange={setCountry} placeholder="All states" className="flex-1 bg-surface border border-line px-4 py-2.5 text-sm rounded-pill" />
          <button
            onClick={handleScout}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderRadius: '999px', fontWeight: 600 }}
          >
            <Search className="w-4 h-4" /> Scout
          </button>
        </div>
      </div>

      {/* Watchlist */}
      <div>
        <h2 className="font-display font-black uppercase" style={{ fontSize: '18px', letterSpacing: '0.02em', marginBottom: '12px' }}>My watchlist</h2>
        {loading ? <LoadingSpinner /> : watchlist.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Watchlist is empty"
            description="Follow athletes from the discover page to add them to your watchlist."
            action={{ label: 'Discover athletes', onClick: () => navigate('/discover') }}
          />
        ) : (
          <div className="space-y-2">
            {watchlist.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-card border border-line p-3 hover:border-line-strong transition-colors" style={{ borderRadius: '12px' }}>
                <Link to={`/profile/${a.username}`} className="flex items-center gap-3 flex-1 hover:opacity-80">
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-surface" style={{ borderRadius: '12px' }}>
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-black text-sm text-accent-ink bg-accent-soft">
                        {initials(a.full_name)}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-display font-bold uppercase text-sm tracking-wide">{a.full_name}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-text-muted">{getCountryFlag(a.country)}</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleFollowToggle(a.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors flex-shrink-0 ${
                    following.includes(a.id)
                      ? 'bg-surface border border-line text-text-muted hover:text-error'
                      : 'hover:opacity-90'
                  }`}
                  style={
                    following.includes(a.id)
                      ? { borderRadius: '999px' }
                      : { background: 'var(--accent)', color: 'var(--on-accent)', borderRadius: '999px' }
                  }
                >
                  {following.includes(a.id) ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                  {following.includes(a.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Home component ──────────────────────────────────────────────────────
export default function Home() {
  const { user, profile } = useAppStore();
  const navigate = useNavigate();

  if (!user || !profile) {
    // Redirect guests to landing
    navigate('/');
    return null;
  }

  const heading = profile.role === 'athlete'
    ? `Welcome back, ${profile.full_name.split(' ')[0]}`
    : profile.role === 'brand'
    ? 'Brand dashboard'
    : 'Scout dashboard';

  
  return (
    <div className="min-h-screen pt-6 md:pt-10 pb-24">
      <div className="max-w-3xl mx-auto px-4">
        <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: '24px', borderRadius: '16px' }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '28px', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text)', margin: 0 }}>
            {heading}
          </h1>
        </div>

        {profile.role === 'athlete' && <AthleteHome />}
        {profile.role === 'brand' && <BrandHome />}
        {(profile.role === 'coach' || profile.role === 'agent') && <CoachHome />}
      </div>
    </div>
  );
}
