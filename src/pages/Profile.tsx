import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { getCountryFlag, initials, formatDate, timeAgo } from '../lib/utils';
import type { Profile as ProfileType, AthleteProfile, Highlight, Stat, Achievement } from '../lib/types';
import { Play, Trophy, BarChart3, Edit, UserPlus, UserCheck, Share2, X, Calendar } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

type Tab = 'highlights' | 'stats' | 'achievements';

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
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display font-bold uppercase text-xl mb-2">Profile not found</h2>
          <Link to="/discover" className="text-accent text-sm hover:underline">Discover athletes</Link>
        </div>
      </div>
    );
  }

  const availabilityLabel = {
    available: 'Available',
    unavailable: 'Unavailable',
    open_to_offers: 'Open to offers',
  }[athleteProfile?.availability || 'available'];

  const availabilityDotColor = {
    available: '#34D399',
    unavailable: '#F87171',
    open_to_offers: '#E8FF47',
  }[athleteProfile?.availability || 'available'];

  const availabilityTextColor = {
    available: 'text-success',
    unavailable: 'text-error',
    open_to_offers: 'text-accent',
  }[athleteProfile?.availability || 'available'];

  return (
    <div className="min-h-screen bg-primary pb-20 md:pb-0">

      {/* ── Full-bleed cover ── */}
      <div className="relative w-full h-[220px] md:h-[300px]">
        {/* Image layer — clipped within */}
        <div className="absolute inset-0 overflow-hidden bg-card">
          {profile.cover_url && (
            <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
          )}
          {/* Functional gradient — makes name readable; only allowed gradient */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 30%, #0A0A0F 100%)' }}
          />
        </div>

        {/* Name + flag — absolute bottom-left */}
        <div className="absolute bottom-0 left-0 right-0" style={{ padding: '0 16px 16px' }}>
          <h1
            className="font-display font-black uppercase text-white leading-none"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)', letterSpacing: '-0.01em' }}
          >
            {profile.full_name}
            <span className="ml-2 align-middle" style={{ fontSize: '1.2rem' }}>{getCountryFlag(profile.country)}</span>
          </h1>
        </div>

        {/* Avatar — overflows cover bottom by 40px */}
        <div
          className="absolute overflow-hidden bg-surface"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '4px',
            border: '3px solid #0A0A0F',
            bottom: '-40px',
            left: '16px',
          }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display font-black text-3xl text-accent">
              {initials(profile.full_name)}
            </div>
          )}
        </div>
      </div>

      {/* ── Profile content — clears the avatar overflow ── */}
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '56px 16px 0' }}>

        {/* Sport + position + availability */}
        {athleteProfile && (
          <div className="flex items-center gap-3 flex-wrap mb-3">
            {athleteProfile.sport && (
              <span
                className="font-display font-semibold text-accent uppercase"
                style={{
                  fontSize: '10px',
                  background: 'rgba(232,255,71,0.1)',
                  letterSpacing: '0.06em',
                  padding: '3px 10px',
                  borderRadius: '3px',
                }}
              >
                {athleteProfile.sport}
              </span>
            )}
            {athleteProfile.position && (
              <span className="text-sm text-text-muted">· {athleteProfile.position}</span>
            )}
            <div className="flex items-center gap-1.5">
              <div style={{ width: '6px', height: '6px', borderRadius: '2px', background: availabilityDotColor, flexShrink: 0 }} />
              <span className={`text-xs font-medium uppercase tracking-wide ${availabilityTextColor}`} style={{ fontSize: '10px' }}>
                {availabilityLabel}
              </span>
            </div>
          </div>
        )}

        {profile.bio && (
          <p className="text-sm text-text-muted mb-5 max-w-xl leading-relaxed">{profile.bio}</p>
        )}

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {isOwn && (
            <Link
              to="/profile/edit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '4px' }}
            >
              <Edit className="w-4 h-4" /> Edit profile
            </Link>
          )}
          {canConnect && (
            <button
              onClick={handleFollow}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold transition-colors ${isFollowing ? 'hover:text-error' : 'hover:opacity-90'}`}
              style={
                isFollowing
                  ? { background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '4px' }
                  : { background: '#E8FF47', color: '#0A0A0F', borderRadius: '4px' }
              }
            >
              {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {isFollowing ? 'Following' : 'Connect'}
            </button>
          )}
          {!user && !isOwn && (
            <Link
              to="/register"
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: '#E8FF47', color: '#0A0A0F', borderRadius: '4px' }}
            >
              Join to connect
            </Link>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '4px' }}
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-0 border-b border-white/10 mb-6">
          {([
            { key: 'highlights', label: 'Highlights', icon: Play },
            { key: 'stats', label: 'Stats', icon: BarChart3 },
            { key: 'achievements', label: 'Achievements', icon: Trophy },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 text-sm font-medium transition-colors"
              style={{
                paddingTop: '8px',
                paddingBottom: '12px',
                borderBottom: activeTab === key ? '2px solid #E8FF47' : '2px solid transparent',
                color: activeTab === key ? '#E8FF47' : '#8888A0',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Highlights ── */}
        {activeTab === 'highlights' && (
          highlights.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 pb-8">
              {highlights.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setVideoModal(h)}
                  className="text-left overflow-hidden hover:border-accent/20 transition-colors group cursor-pointer w-full"
                  style={{ background: '#1A1A2E', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}
                >
                  <div className="relative aspect-video bg-surface">
                    {h.thumbnail_url ? (
                      <img src={h.thumbnail_url} alt={h.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-text-muted/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                      <div
                        className="flex items-center justify-center"
                        style={{ width: '40px', height: '40px', background: '#E8FF47', borderRadius: '3px' }}
                      >
                        <Play className="w-5 h-5 fill-current" style={{ color: '#0A0A0F' }} />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-bold uppercase truncate tracking-wide" style={{ fontSize: '13px' }}>{h.title}</h3>
                    {h.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{h.description}</p>
                    )}
                    <span className="text-[10px] text-text-muted mt-1.5 block">{timeAgo(h.created_at)}</span>
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
                  <tr style={{ background: '#12121E' }}>
                    <th className="text-left py-3 px-4 font-display font-semibold uppercase" style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#8888A0' }}>Season</th>
                    <th className="text-center py-3 px-3 font-display font-semibold uppercase" style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#8888A0' }}>Apps</th>
                    <th className="text-center py-3 px-3 font-display font-semibold uppercase" style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#8888A0' }}>Goals</th>
                    <th className="text-center py-3 px-3 font-display font-semibold uppercase" style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#8888A0' }}>Assists</th>
                    <th className="text-center py-3 px-3 font-display font-semibold uppercase" style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#8888A0' }}>Minutes</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => (
                    <tr key={s.id} className="border-b border-white/5" style={{ background: i % 2 === 0 ? '#1A1A2E' : 'rgba(26,26,46,0.5)' }}>
                      <td className="py-3 px-4 font-display font-semibold uppercase text-sm tracking-wide">{s.season}</td>
                      <td className="py-3 px-3 text-center text-text-muted">{s.appearances}</td>
                      <td className="py-3 px-3 text-center font-display font-bold" style={{ fontSize: '18px', color: '#E8FF47' }}>{s.goals}</td>
                      <td className="py-3 px-3 text-center text-text-muted">{s.assists}</td>
                      <td className="py-3 px-3 text-center text-text-muted">{s.minutes_played}</td>
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
              <div className="absolute left-5 top-0 bottom-0" style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <div className="space-y-6">
                {achievements.map((a) => (
                  <div key={a.id} className="relative pl-12">
                    <div
                      className="absolute left-3 top-1 flex items-center justify-center"
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '3px',
                        background: 'rgba(232,255,71,0.15)',
                        border: '1.5px solid #E8FF47',
                      }}
                    >
                      <Trophy className="w-2.5 h-2.5 text-accent" />
                    </div>
                    <div className="p-4" style={{ background: '#1A1A2E', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-display font-bold uppercase text-sm tracking-wide">{a.title}</h3>
                        <span className="text-xs text-text-muted flex items-center gap-1 flex-shrink-0 ml-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(a.date)}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">{a.description}</p>
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
      </div>

      {/* ── Own profile metric strip ── */}
      {isOwn && (
        <div style={{ background: '#12121E', borderTop: '0.5px solid rgba(255,255,255,0.06)', padding: '12px 0', marginTop: '32px' }}>
          <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 16px' }}>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-2xl text-accent">{viewCount}</span>
              <span className="text-text-muted uppercase tracking-wide" style={{ fontSize: '11px' }}>Views this week</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-accent text-primary px-5 py-2.5 text-sm font-bold animate-slide-up whitespace-nowrap"
          style={{ borderRadius: '4px' }}
        >
          {toast}
        </div>
      )}

      {/* ── Video Modal ── */}
      {videoModal && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.96)' }}
          onClick={() => setVideoModal(null)}
        >
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="font-display font-bold uppercase text-white truncate tracking-wide" style={{ fontSize: '16px' }}>
                  {videoModal.title}
                </h3>
                {videoModal.sport && (
                  <span
                    className="font-display font-semibold text-accent uppercase flex-shrink-0"
                    style={{ fontSize: '10px', background: 'rgba(232,255,71,0.1)', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '3px' }}
                  >
                    {videoModal.sport}
                  </span>
                )}
              </div>
              <button
                onClick={() => setVideoModal(null)}
                className="w-9 h-9 bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0 ml-3"
                style={{ borderRadius: '4px' }}
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
              className="w-full bg-black"
              style={{ maxHeight: '75vh', borderRadius: '4px' }}
            />
            {videoModal.description && (
              <p className="text-sm text-white/60 mt-3 px-1">{videoModal.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
