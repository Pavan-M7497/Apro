import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { getCountryFlag, initials, formatDate, timeAgo, getRoleAccent, getActivityColor, getRoleTheme, accentTextColor, calculateProfileCompleteness } from '../lib/utils';
import type { Profile as ProfileType, AthleteProfile, Highlight, Stat, Achievement, TrainingSession } from '../lib/types';
import { ACTIVITY_TYPES } from '../lib/types';
import { Play, Trophy, BarChart3, UserPlus, UserCheck, Share2, X, Calendar, Activity, Camera } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

type Tab = 'highlights' | 'stats' | 'achievements' | 'training';

const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function computeStreak(dateKeys: Set<string>): number {
  const oneDay = 86400000;
  let day = new Date();
  day.setHours(0, 0, 0, 0);
  if (!dateKeys.has(dateKey(day))) {
    day = new Date(day.getTime() - oneDay);
    if (!dateKeys.has(dateKey(day))) return 0;
  }
  let streak = 0;
  while (dateKeys.has(dateKey(day))) {
    streak++;
    day = new Date(day.getTime() - oneDay);
  }
  return streak;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile: myProfile } = useAppStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('highlights');
  const [viewCount, setViewCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [videoModal, setVideoModal] = useState<Highlight | null>(null);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [trainingLoaded, setTrainingLoaded] = useState(false);
  const [followers, setFollowers] = useState(0);

  const isOwn = user && myProfile && myProfile.username === username;
  const canConnect = user && !isOwn && (myProfile?.role === 'brand' || myProfile?.role === 'coach' || myProfile?.role === 'agent');

  useEffect(() => {
    if (!username) return;
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (videoModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [videoModal]);

  useEffect(() => {
    if (activeTab !== 'training' || trainingLoaded || !profile) return;
    (async () => {
      const { data } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('is_public', true)
        .order('session_date', { ascending: false })
        .order('created_at', { ascending: false });
      setTrainingSessions((data as TrainingSession[]) || []);
      setTrainingLoaded(true);
    })();
  }, [activeTab, trainingLoaded, profile]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const loadProfile = async () => {
    setLoading(true);
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username!)
      .maybeSingle();

    if (!prof) { setLoading(false); return; }
    setProfile(prof);

    const promises: Promise<void>[] = [];

    promises.push((async () => {
      const { data } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('profile_id', prof.id)
        .maybeSingle();
      if (data) setAthleteProfile(data);
    })());

    promises.push((async () => {
      const { data } = await supabase
        .from('highlights')
        .select('*')
        .eq('profile_id', prof.id)
        .order('created_at', { ascending: false });
      if (data) setHighlights(data);
    })());

    if (prof.role === 'athlete') {
      promises.push((async () => {
        const { data: ap } = await supabase
          .from('athlete_profiles')
          .select('id')
          .eq('profile_id', prof.id)
          .maybeSingle();
        if (ap) {
          const { data } = await supabase
            .from('stats')
            .select('*')
            .eq('athlete_profile_id', ap.id)
            .order('season', { ascending: false });
          if (data) setStats(data);
        }
      })());
    }

    promises.push((async () => {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('profile_id', prof.id)
        .order('date', { ascending: false });
      if (data) setAchievements(data);
    })());

    promises.push((async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', prof.id)
        .gte('created_at', weekAgo);
      setViewCount(count || 0);
    })());

    promises.push((async () => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', prof.id);
      setFollowers(count || 0);
    })());

    if (user && myProfile && !isOwn) {
      promises.push((async () => {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', myProfile.id)
          .eq('following_id', prof.id)
          .maybeSingle();
        setIsFollowing(!!data);
      })());
    }

    await Promise.all(promises);

    // Debounced view tracking — only record once per 30 minutes per profile
    if (!isOwn) {
      const debounceKey = `view_${prof.id}`;
      const lastViewed = localStorage.getItem(debounceKey);
      const thirtyMinutes = 30 * 60 * 1000;
      const shouldRecord = !lastViewed || (Date.now() - parseInt(lastViewed)) > thirtyMinutes;

      if (shouldRecord) {
        await supabase.from('profile_views').insert({
          profile_id: prof.id,
          viewer_id: myProfile?.id || null,
        });
        localStorage.setItem(debounceKey, Date.now().toString());
      }
    }

    setLoading(false);
  };

  const handleFollow = async () => {
    if (!myProfile || !profile) return;
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', myProfile.id)
        .eq('following_id', profile.id);
    } else {
      await supabase.from('follows').insert({
        follower_id: myProfile.id,
        following_id: profile.id,
      });
    }
    setIsFollowing(!isFollowing);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: profile?.full_name, url });
        showToast('Profile shared!');
      } catch {
        await navigator.clipboard.writeText(url);
        showToast('Profile link copied!');
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Profile link copied!');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display font-bold uppercase text-xl mb-2">Profile not found</h2>
          <Link to="/discover" className="text-accent text-sm hover:underline">Discover athletes</Link>
        </div>
      </div>
    );
  }

  // ── Viewed athlete's implied theme (athlete profiles = lime) ──
  const theme = getRoleTheme(profile.role);
  const onAccent = accentTextColor(profile.role);

  const availabilityLabel = {
    available: 'Available',
    unavailable: 'Unavailable',
    open_to_offers: 'Open to offers',
  }[athleteProfile?.availability || 'available'];

  const availabilityDotColor = {
    available: '#34D399',
    unavailable: '#F87171',
    open_to_offers: theme.accent,
  }[athleteProfile?.availability || 'available'];

  const completeness = isOwn ? calculateProfileCompleteness(profile, athleteProfile) : 0;

  const badgeStyle: React.CSSProperties = {
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '10px',
    textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px',
    borderRadius: '3px', background: theme.accentMuted, color: theme.accent,
  };

  const tabs = [
    { key: 'highlights', label: 'Highlights' },
    { key: 'stats', label: 'Stats' },
    { key: 'achievements', label: 'Achievements' },
    ...(profile.role === 'athlete' ? [{ key: 'training', label: 'Training' }] : []),
  ] as { key: Tab; label: string }[];

  return (
    <div className="relative" style={{ minHeight: '100vh' }}>

      {/* ── Cover hero (full width) ── */}
      <div className="relative w-full overflow-hidden h-[240px] md:h-[320px]" style={{ background: theme.surface }}>
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        )}
        {/* The one allowed gradient — name legibility */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 20%, ${theme.bg} 100%)` }} />

        {/* Action buttons — top right */}
        <div className="absolute flex" style={{ top: '12px', right: '16px', gap: '8px', zIndex: 10 }}>
          <button
            onClick={handleShare}
            className="flex items-center"
            style={{ gap: '4px', background: 'rgba(0,0,0,0.5)', border: '0.5px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '4px', padding: '6px 12px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          {isOwn && (
            <Link
              to="/profile/edit"
              style={{ background: theme.accent, color: onAccent, borderRadius: '4px', padding: '6px 14px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
            >
              Edit
            </Link>
          )}
          {canConnect && (
            <button
              onClick={handleFollow}
              className="flex items-center"
              style={
                isFollowing
                  ? { gap: '4px', background: 'rgba(0,0,0,0.5)', border: '0.5px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '4px', padding: '6px 14px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }
                  : { gap: '4px', background: getRoleAccent(myProfile?.role), color: accentTextColor(myProfile?.role), borderRadius: '4px', padding: '6px 14px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }
              }
            >
              {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {isFollowing ? 'Following' : 'Connect'}
            </button>
          )}
          {!user && !isOwn && (
            <Link
              to="/register"
              style={{ background: theme.accent, color: onAccent, borderRadius: '4px', padding: '6px 14px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
            >
              Join
            </Link>
          )}
        </div>

        {/* Name + sport/availability — bottom left */}
        <div className="absolute" style={{ left: '20px', right: '20px', bottom: '12px', zIndex: 10 }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 5vw, 52px)', color: '#F5FFF0', textTransform: 'uppercase', letterSpacing: '-0.015em', lineHeight: 1 }}>
            {profile.full_name}
            <span style={{ fontSize: '0.5em', marginLeft: '8px' }}>{getCountryFlag(profile.country)}</span>
          </h1>
          {athleteProfile && (
            <div className="flex items-center flex-wrap" style={{ gap: '10px', marginTop: '8px' }}>
              {athleteProfile.sport && <span style={badgeStyle}>{athleteProfile.sport}</span>}
              {athleteProfile.position && (
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{athleteProfile.position}</span>
              )}
              <div className="flex items-center" style={{ gap: '5px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '2px', background: availabilityDotColor }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{availabilityLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Avatar overlapping cover ── */}
      <div className="relative inline-block" style={{ marginTop: '-40px', marginLeft: '20px', zIndex: 20 }}>
        <div className="overflow-hidden" style={{ width: '72px', height: '72px', borderRadius: '4px', border: `3px solid ${theme.bg}`, background: theme.surface }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '20px', color: theme.accent }}>
              {initials(profile.full_name)}
            </div>
          )}
        </div>
        {isOwn && (
          <Link
            to="/profile/edit"
            className="absolute flex items-center justify-center"
            style={{ width: '16px', height: '16px', borderRadius: '3px', background: theme.accent, bottom: '-2px', right: '-2px' }}
            aria-label="Change avatar"
          >
            <Camera style={{ width: '10px', height: '10px', color: onAccent }} />
          </Link>
        )}
      </div>

      {/* ── Stat strip ── */}
      <div className="w-full grid grid-cols-3" style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, marginTop: '12px' }}>
        {[
          { label: 'Views this week', value: viewCount, key: true },
          { label: 'Highlights', value: highlights.length, key: false },
          { label: 'Followers', value: followers, key: false },
        ].map((s, i) => (
          <div key={s.label} className="text-center" style={{ padding: '12px 0', borderLeft: i === 0 ? 'none' : `1px solid ${theme.border}` }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '28px', lineHeight: 1, color: s.key ? theme.accent : theme.text }}>{s.value}</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Content area ── */}
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '20px 20px 80px' }}>

        {/* Completeness bar (own) */}
        {isOwn && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ height: '3px', background: theme.border, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completeness}%`, background: theme.accent }} />
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: theme.textMuted, textAlign: 'right', marginTop: '4px' }}>{completeness}% complete</div>
          </div>
        )}

        {profile.bio && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theme.textMuted, lineHeight: 1.6, marginBottom: '20px', maxWidth: '36rem' }}>{profile.bio}</p>
        )}

        {/* ── Tab bar ── */}
        <div className="flex" style={{ borderBottom: `1px solid ${theme.border}`, marginBottom: '20px' }}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '11px',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '0 0 10px', marginRight: '24px',
                borderBottom: activeTab === key ? `2px solid ${theme.accent}` : '2px solid transparent',
                color: activeTab === key ? theme.accent : theme.textMuted,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Highlights ── */}
        {activeTab === 'highlights' && (
          highlights.length > 0 ? (
            <div className="grid grid-cols-2" style={{ gap: '8px' }}>
              {highlights.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setVideoModal(h)}
                  className="text-left overflow-hidden group cursor-pointer w-full transition-all duration-150 hover:-translate-y-px"
                  style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '4px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
                >
                  <div className="relative aspect-video" style={{ background: theme.bg }}>
                    {h.thumbnail_url && (
                      <img src={h.thumbnail_url} alt={h.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center justify-center group-hover:brightness-110" style={{ width: '40px', height: '40px', background: theme.accent, borderRadius: '3px' }}>
                        <Play style={{ width: '18px', height: '18px', color: onAccent }} className="fill-current" />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <h3 className="truncate" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '11px', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h.title}</h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: theme.textMuted, marginTop: '2px' }}>{timeAgo(h.created_at)}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Play}
              title="No highlights yet"
              description={isOwn ? "Upload your first highlight to showcase your skills." : "This athlete hasn't uploaded highlights yet."}
              action={isOwn ? { label: 'Upload video', onClick: () => navigate('/upload') } : undefined}
            />
          )
        )}

        {/* ── Stats ── */}
        {activeTab === 'stats' && (
          stats.length > 0 ? (
            <div className="overflow-x-auto pb-8">
              <table className="w-full text-sm" style={{ borderRadius: '4px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: theme.surface }}>
                    {['Season', 'Apps', 'Goals', 'Assists', 'Minutes'].map((h, i) => (
                      <th key={h} className={i === 0 ? 'text-left py-3 px-4' : 'text-center py-3 px-3'} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', color: theme.textMuted, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? theme.surface : 'transparent', borderBottom: `1px solid ${theme.border}` }}>
                      <td className="py-3 px-4 font-display font-semibold uppercase text-sm tracking-wide" style={{ color: theme.text }}>{s.season}</td>
                      <td className="py-3 px-3 text-center" style={{ color: theme.textMuted }}>{s.appearances}</td>
                      <td className="py-3 px-3 text-center font-display font-bold" style={{ fontSize: '18px', color: theme.accent }}>{s.goals}</td>
                      <td className="py-3 px-3 text-center" style={{ color: theme.textMuted }}>{s.assists}</td>
                      <td className="py-3 px-3 text-center" style={{ color: theme.textMuted }}>{s.minutes_played}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No stats yet"
              description={isOwn ? "Add your season stats to track your performance." : "This athlete hasn't added stats yet."}
            />
          )
        )}

        {/* ── Achievements ── */}
        {activeTab === 'achievements' && (
          achievements.length > 0 ? (
            <div className="relative pb-8">
              <div className="absolute top-0 bottom-0" style={{ left: '9px', width: '1px', background: theme.border }} />
              <div className="space-y-6">
                {achievements.map((a) => (
                  <div key={a.id} className="relative" style={{ paddingLeft: '32px' }}>
                    <div
                      className="absolute flex items-center justify-center"
                      style={{ left: '0', top: '2px', width: '20px', height: '20px', borderRadius: '3px', background: theme.accentMuted, border: `1.5px solid ${theme.accent}` }}
                    >
                      <Trophy style={{ width: '10px', height: '10px', color: theme.accent }} />
                    </div>
                    <div style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '4px', padding: '10px 12px' }}>
                      <div className="flex items-center justify-between mb-1">
                        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '12px', color: theme.text, textTransform: 'uppercase' }}>{a.title}</h3>
                        <span className="flex items-center gap-1 flex-shrink-0 ml-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: theme.textMuted }}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(a.date)}
                        </span>
                      </div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: theme.textMuted }}>{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Trophy}
              title="No achievements yet"
              description={isOwn ? "Add your achievements to build your career timeline." : "This athlete hasn't added achievements yet."}
            />
          )
        )}

        {/* ── Training ── */}
        {activeTab === 'training' && (
          !trainingLoaded ? (
            <LoadingSpinner />
          ) : (() => {
            const now = new Date();
            const monthSessions = trainingSessions.filter((s) => {
              const d = new Date(s.session_date);
              return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            });
            const monthHours = Math.round((monthSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60) * 10) / 10;
            const streak = computeStreak(new Set(trainingSessions.map((s) => s.session_date)));
            const last5 = trainingSessions.slice(0, 5);
            const meta = (type: string) => ACTIVITY_TYPES.find((a) => a.value === type) || ACTIVITY_TYPES[5];

            if (trainingSessions.length === 0) {
              return (
                <EmptyState
                  icon={Activity}
                  title="No training logged"
                  description={isOwn ? "Log your training sessions to track your progress over time." : "This athlete hasn't shared any training yet."}
                  action={isOwn ? { label: 'Log a session', onClick: () => navigate('/training/log') } : undefined}
                />
              );
            }

            return (
              <div className="pb-8">
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Sessions this month', value: monthSessions.length },
                    { label: 'Hours this month', value: monthHours },
                    { label: 'Active streak', value: `${streak}d` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '4px', padding: '14px' }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '28px', lineHeight: 1, color: theme.accent }}>{value}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {last5.map((s) => {
                    const m = meta(s.activity_type);
                    const color = getActivityColor(s.activity_type);
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-3" style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '4px' }}>
                        <div className="flex items-center justify-center flex-shrink-0" style={{ width: '36px', height: '36px', borderRadius: '4px', background: `${color}22` }}>
                          <i className={`ti ${m.icon}`} style={{ fontSize: '20px', color }} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: theme.text, textTransform: 'uppercase' }}>{m.label}</span>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: theme.textMuted }}>{s.duration_minutes} min</p>
                        </div>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: theme.textMuted }} className="flex-shrink-0">{formatDate(s.session_date)}</span>
                      </div>
                    );
                  })}
                </div>

                {isOwn && (
                  <button
                    onClick={() => navigate('/training')}
                    className="w-full flex items-center justify-center gap-2 mt-4 py-3"
                    style={{ border: `0.5px solid ${theme.border}`, borderRadius: '4px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: theme.text, textTransform: 'uppercase' }}
                  >
                    <Activity className="w-4 h-4" /> View full training log
                  </button>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up whitespace-nowrap"
          style={{ background: theme.accent, color: onAccent, padding: '10px 20px', borderRadius: '4px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}
        >
          {toast}
        </div>
      )}

      {/* ── Video Modal (faux fullscreen) ── */}
      {videoModal && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center animate-fade-in"
          style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.97)', zIndex: 100 }}
          onClick={() => setVideoModal(null)}
        >
          <div className="w-full" style={{ maxWidth: '800px', padding: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="truncate" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '16px', color: '#fff', textTransform: 'uppercase' }}>
                  {videoModal.title}
                </h3>
                {videoModal.sport && <span style={badgeStyle} className="flex-shrink-0">{videoModal.sport}</span>}
              </div>
              <button
                onClick={() => setVideoModal(null)}
                className="flex items-center justify-center flex-shrink-0 ml-3"
                style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', color: '#fff' }}
                aria-label="Close video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <video
              src={videoModal.video_url}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="w-full"
              style={{ background: '#000', borderRadius: '4px', maxHeight: '75vh' }}
            />
            {videoModal.description && (
              <p className="mt-3 px-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{videoModal.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
