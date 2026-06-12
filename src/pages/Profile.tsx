import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { getCountryFlag, initials, formatDate, timeAgo } from '../lib/utils';
import type { Profile as ProfileType, AthleteProfile, Highlight, Stat, Achievement } from '../lib/types';
import { Play, Trophy, BarChart3, Edit, Eye, Calendar, UserPlus, UserCheck, Share2, X, Flag, CheckCircle, Clock } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AproScoreBadge from '../components/AproScoreBadge';
import VerificationBadge from '../components/VerificationBadge';

type Tab = 'highlights' | 'stats' | 'achievements';

interface Competition {
  id: string;
  title: string;
  sport: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  level: string;
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
  const [upcomingComps, setUpcomingComps] = useState<Competition[]>([]);

  const isOwn = user && myProfile && myProfile.username === username;
  const canConnect = user && !isOwn && (myProfile?.role === 'brand' || myProfile?.role === 'coach' || myProfile?.role === 'agent');

  useEffect(() => {
    if (!username) return;
    loadProfile();
  }, [username]);

  // Lock body scroll when video modal is open
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

    // Load upcoming competitions for this profile
    const { data: participations } = await supabase
      .from('competition_participants')
      .select('competition_id')
      .eq('profile_id', prof.id);
    if (participations && participations.length > 0) {
      const compIds = participations.map((p: { competition_id: string }) => p.competition_id);
      const today = new Date().toISOString().split('T')[0];
      const { data: comps } = await supabase
        .from('competitions')
        .select('id, title, sport, country, city, start_date, end_date, level')
        .in('id', compIds)
        .gte('end_date', today)
        .order('start_date', { ascending: true })
        .limit(5);
      if (comps) setUpcomingComps(comps as Competition[]);
    }

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

  const handleFlagAchievement = async (achievementId: string) => {
    if (!myProfile) { showToast('Sign in to report'); return; }
    try {
      await supabase.from('achievement_flags').insert({
        achievement_id: achievementId,
        reporter_id: myProfile.id,
        reason: 'Reported as inaccurate',
      });
      showToast('Achievement reported');
    } catch {
      showToast('Already reported');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: profile?.full_name, url });
        showToast('Profile shared!');
      } catch {
        // User cancelled — fall back to clipboard silently
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

  const availabilityColor = {
    available: 'text-success',
    unavailable: 'text-error',
    open_to_offers: 'text-accent',
  }[athleteProfile?.availability || 'available'];

  const availabilityLabel = {
    available: 'Available',
    unavailable: 'Unavailable',
    open_to_offers: 'Open to offers',
  }[athleteProfile?.availability || 'available'];

  return (
    <div className="min-h-screen bg-primary pb-20 md:pb-0">
      {/* Cover */}
      <div className="relative h-40 md:h-56 bg-card">
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-primary/40" />
      </div>

      {/* Profile header */}
      <div className="relative max-w-4xl mx-auto px-4 -mt-16">
        <div className="flex items-end gap-4 mb-4">
          <div className="w-24 h-24 md:w-28 md:h-28 border-4 border-primary overflow-hidden bg-surface flex-shrink-0" style={{ borderRadius: '4px' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display font-black text-3xl text-accent bg-accent/10">
                {initials(profile.full_name)}
              </div>
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-black uppercase" style={{ fontSize: 'clamp(20px, 4vw, 28px)', letterSpacing: '-0.01em' }}>
                {profile.full_name}
              </h1>
              <span className="text-lg">{getCountryFlag(profile.country)}</span>
              {profile.verification_tier != null && profile.verification_tier > 0 && (
                <VerificationBadge tier={profile.verification_tier} size="md" />
              )}
              <AproScoreBadge profileId={profile.id} />
            </div>

            {athleteProfile?.sport && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="font-display font-semibold text-xs text-accent bg-accent/10 px-2.5 py-0.5 uppercase tracking-wide" style={{ borderRadius: '3px' }}>
                  {athleteProfile.sport}
                </span>
                {athleteProfile.position && (
                  <span className="text-sm text-text-muted">· {athleteProfile.position}</span>
                )}
              </div>
            )}

            {athleteProfile && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className={`w-1.5 h-1.5 ${
                  athleteProfile.availability === 'available' ? 'bg-success' :
                  athleteProfile.availability === 'open_to_offers' ? 'bg-accent' :
                  'bg-error'
                }`} style={{ borderRadius: '2px' }} />
                <span className={`text-xs font-medium ${availabilityColor}`}>{availabilityLabel}</span>
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-text-muted mb-5 max-w-xl leading-relaxed">{profile.bio}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {isOwn && (
            <Link
              to="/profile/edit"
              className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
              style={{ borderRadius: '4px' }}
            >
              <Edit className="w-4 h-4" /> Edit profile
            </Link>
          )}
          {isOwn && (
            <div className="flex items-center gap-1.5 text-text-muted text-sm">
              <Eye className="w-4 h-4" />
              <span>{viewCount} views this week</span>
            </div>
          )}
          {canConnect && (
            <button
              onClick={handleFollow}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold transition-colors ${
                isFollowing
                  ? 'bg-white/5 border border-white/10 text-text-muted hover:text-error'
                  : 'bg-accent text-primary hover:bg-accent-hover'
              }`}
              style={{ borderRadius: '4px' }}
            >
              {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {isFollowing ? 'Following' : 'Connect'}
            </button>
          )}
          {!user && !isOwn && (
            <Link
              to="/register"
              className="flex items-center gap-2 bg-accent text-primary px-5 py-2 text-sm font-bold hover:bg-accent-hover transition-colors"
              style={{ borderRadius: '4px' }}
            >
              Join to connect
            </Link>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
            style={{ borderRadius: '4px' }}
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-white/10 mb-6">
          {([
            { key: 'highlights', label: 'Highlights', icon: Play },
            { key: 'stats', label: 'Stats', icon: BarChart3 },
            { key: 'achievements', label: 'Achievements', icon: Trophy },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Highlights tab */}
        {activeTab === 'highlights' && (
          highlights.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 pb-8">
              {highlights.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setVideoModal(h)}
                  className="text-left bg-card border border-white/5 overflow-hidden hover:border-accent/20 transition-colors group cursor-pointer w-full"
                  style={{ borderRadius: '4px' }}
                >
                  <div className="relative aspect-video bg-surface">
                    {h.thumbnail_url ? (
                      <img src={h.thumbnail_url} alt={h.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-accent/40 group-hover:text-accent transition-colors" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 bg-accent/90 flex items-center justify-center group-hover:bg-accent transition-colors" style={{ borderRadius: '2px' }}>
                        <Play className="w-5 h-5 text-primary fill-current" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-bold uppercase text-sm truncate tracking-wide">{h.title}</h3>
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

        {/* Stats tab */}
        {activeTab === 'stats' && (
          stats.length > 0 ? (
            <div className="overflow-x-auto pb-8">
              <table className="w-full text-sm" style={{ borderRadius: '4px', overflow: 'hidden' }}>
                <thead>
                  <tr className="bg-surface">
                    <th className="text-left py-3 px-4 font-display font-semibold uppercase text-xs tracking-wide text-text-muted">Season</th>
                    <th className="text-center py-3 px-3 font-display font-semibold uppercase text-xs tracking-wide text-text-muted">Apps</th>
                    <th className="text-center py-3 px-3 font-display font-semibold uppercase text-xs tracking-wide text-text-muted">Goals</th>
                    <th className="text-center py-3 px-3 font-display font-semibold uppercase text-xs tracking-wide text-text-muted">Assists</th>
                    <th className="text-center py-3 px-3 font-display font-semibold uppercase text-xs tracking-wide text-text-muted">Minutes</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => (
                    <tr key={s.id} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-card' : 'bg-card/50'}`}>
                      <td className="py-3 px-4 font-display font-semibold uppercase text-sm tracking-wide">{s.season}</td>
                      <td className="py-3 px-3 text-center text-text-muted">{s.appearances}</td>
                      <td className="py-3 px-3 text-center font-display font-bold text-accent text-base">{s.goals}</td>
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

        {/* Achievements tab */}
        {activeTab === 'achievements' && (
          achievements.length > 0 ? (
            <div className="relative pb-8">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />
              <div className="space-y-6">
                {achievements.map((a) => (
                  <div key={a.id} className="relative pl-12">
                    <div className="absolute left-3 top-1 w-5 h-5 bg-accent/20 border-2 border-accent flex items-center justify-center" style={{ borderRadius: '3px' }}>
                      <Trophy className="w-2.5 h-2.5 text-accent" />
                    </div>
                    <div className="bg-card border border-white/5 p-4" style={{ borderRadius: '4px' }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-display font-bold uppercase text-sm tracking-wide truncate">{a.title}</h3>
                          {a.verified && (
                            <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" title="Verified" />
                          )}
                          {!a.verified && a.verification_status === 'pending' && (
                            <span className="text-[10px] text-text-muted font-medium flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {(a.flag_count ?? 0) >= 3 && (
                            <span className="text-[10px] text-error font-medium flex-shrink-0">Disputed</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(a.date)}
                          </span>
                          {user && !isOwn && (
                            <button
                              onClick={() => handleFlagAchievement(a.id)}
                              className="text-text-muted hover:text-error transition-colors"
                              title="Report this claim"
                            >
                              <Flag className="w-3 h-3" />
                            </button>
                          )}
                        </div>
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

      {/* Upcoming competitions */}
      {upcomingComps.length > 0 && (
        <div className="mt-6 pb-6">
          <h2 className="font-display font-black uppercase text-lg tracking-wide mb-3">Upcoming competitions</h2>
          <div className="space-y-2">
            {upcomingComps.map((c) => (
              <div key={c.id} className="bg-card border border-white/5 p-3 flex items-center gap-3" style={{ borderRadius: '4px' }}>
                <span className={`font-display text-[10px] font-bold uppercase px-2 py-0.5 ${
                  c.level === 'world' ? 'text-accent bg-accent/10' :
                  c.level === 'continental' ? 'text-purple-400 bg-purple-400/10' :
                  c.level === 'national' ? 'text-warning bg-warning/10' :
                  c.level === 'regional' ? 'text-info bg-info/10' :
                  'text-text-muted bg-white/5'
                }`} style={{ borderRadius: '3px' }}>
                  {c.level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold uppercase text-sm tracking-wide truncate">{c.title}</p>
                  <p className="text-[11px] text-text-muted">{c.city}, {c.country} · {new Date(c.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span className="font-display text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 uppercase flex-shrink-0" style={{ borderRadius: '3px' }}>
                  {c.sport}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-accent text-primary px-5 py-2.5 text-sm font-bold animate-slide-up whitespace-nowrap" style={{ borderRadius: '4px' }}>
          {toast}
        </div>
      )}

      {/* Video Modal — using a portal-style full viewport overlay */}
      {videoModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setVideoModal(null)}
        >
          <div
            className="w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="font-display font-bold uppercase text-white truncate tracking-wide" style={{ fontSize: '16px' }}>
                  {videoModal.title}
                </h3>
                {videoModal.sport && (
                  <span className="font-display text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 uppercase tracking-wide flex-shrink-0" style={{ borderRadius: '3px' }}>
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

            {/* Video player */}
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
