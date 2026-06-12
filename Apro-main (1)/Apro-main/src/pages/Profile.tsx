import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { getCountryFlag, initials, formatDate, timeAgo } from '../lib/utils';
import type { Profile as ProfileType, AthleteProfile, Highlight, Stat, Achievement } from '../lib/types';
import { Play, Trophy, BarChart3, Edit, Eye, Calendar, UserPlus, UserCheck, Share2, X } from 'lucide-react';
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

    // Athlete profile
    promises.push((async () => {
      const { data } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('profile_id', prof.id)
        .maybeSingle();
      if (data) setAthleteProfile(data);
    })());

    // Highlights
    promises.push((async () => {
      const { data } = await supabase
        .from('highlights')
        .select('*')
        .eq('profile_id', prof.id)
        .order('created_at', { ascending: false });
      if (data) setHighlights(data);
    })());

    // Stats
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

    // Achievements
    promises.push((async () => {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('profile_id', prof.id)
        .order('date', { ascending: false });
      if (data) setAchievements(data);
    })());

    // View count (last 7 days)
    promises.push((async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', prof.id)
        .gte('created_at', weekAgo);
      setViewCount(count || 0);
    })());

    // Check following
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

    // Record view
    if (!isOwn) {
      await supabase.from('profile_views').insert({
        profile_id: prof.id,
        viewer_id: myProfile?.id || null,
      });
    }

    setLoading(false);
  };

  const handleFollow = async () => {
    if (!myProfile || !profile) return;
    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', myProfile.id)
        .eq('following_id', profile.id);
    } else {
      await supabase
        .from('follows')
        .insert({
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
        await navigator.share({ title: profile.full_name, url });
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
    setToast('Profile link copied!');
    setTimeout(() => setToast(''), 2500);
  };

  if (loading) return <LoadingSpinner />;

  if (!profile) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Profile not found</h2>
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
        <div className="absolute inset-0 bg-primary/50" />
      </div>

      {/* Profile header */}
      <div className="relative max-w-4xl mx-auto px-4 -mt-16">
        <div className="flex items-end gap-4 mb-4">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-primary overflow-hidden bg-surface flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-accent bg-accent/10">
                {initials(profile.full_name)}
              </div>
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold">{profile.full_name}</h1>
              <span className="text-lg">{getCountryFlag(profile.country)}</span>
            </div>

            {athleteProfile && athleteProfile.sport && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                  {athleteProfile.sport}
                </span>
                {athleteProfile.position && (
                  <span className="text-sm text-text-muted">· {athleteProfile.position}</span>
                )}
              </div>
            )}

            {athleteProfile && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  athleteProfile.availability === 'available' ? 'bg-success animate-pulse' :
                  athleteProfile.availability === 'open_to_offers' ? 'bg-accent animate-pulse' :
                  'bg-error'
                }`} />
                <span className={`text-xs font-medium ${availabilityColor}`}>{availabilityLabel}</span>
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-text-muted mb-4 max-w-xl">{profile.bio}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {isOwn && (
            <Link
              to="/profile/edit"
              className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
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
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                isFollowing
                  ? 'bg-white/5 border border-white/10 text-text-muted hover:text-error'
                  : 'bg-accent text-primary hover:bg-accent-hover'
              }`}
            >
              {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {isFollowing ? 'Following' : 'Connect'}
            </button>
          )}
          {!user && !isOwn && (
            <Link
              to="/register"
              className="flex items-center gap-2 bg-accent text-primary px-5 py-2 rounded-lg text-sm font-bold hover:bg-accent-hover"
            >
              Join to connect
            </Link>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 mb-6">
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

        {/* Tab content */}
        {activeTab === 'highlights' && (
          highlights.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 pb-8">
              {highlights.map((h) => (
                <div key={h.id} className="bg-card rounded-xl overflow-hidden border border-white/5 hover:border-accent/10 transition-colors group cursor-pointer" onClick={() => setVideoModal(h)}>
                  <div className="relative aspect-video bg-surface">
                    {h.thumbnail_url ? (
                      <img src={h.thumbnail_url} alt={h.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-accent/50 group-hover:text-accent transition-colors" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Play className="w-10 h-10 text-white/80 group-hover:text-accent transition-colors" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold truncate">{h.title}</h3>
                    {h.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{h.description}</p>
                    )}
                    <span className="text-[10px] text-text-muted mt-2 block">{timeAgo(h.created_at)}</span>
                  </div>
                </div>
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

        {activeTab === 'stats' && (
          stats.length > 0 ? (
            <div className="overflow-x-auto pb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-3 text-text-muted font-medium">Season</th>
                    <th className="text-center py-3 px-3 text-text-muted font-medium">Apps</th>
                    <th className="text-center py-3 px-3 text-text-muted font-medium">Goals</th>
                    <th className="text-center py-3 px-3 text-text-muted font-medium">Assists</th>
                    <th className="text-center py-3 px-3 text-text-muted font-medium">Minutes</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-medium">{s.season}</td>
                      <td className="py-3 px-3 text-center text-text-muted">{s.appearances}</td>
                      <td className="py-3 px-3 text-center font-bold text-accent">{s.goals}</td>
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

        {activeTab === 'achievements' && (
          achievements.length > 0 ? (
            <div className="relative pb-8">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />
              <div className="space-y-6">
                {achievements.map((a) => (
                  <div key={a.id} className="relative pl-12">
                    <div className="absolute left-3 top-1 w-5 h-5 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
                      <Trophy className="w-2.5 h-2.5 text-accent" />
                    </div>
                    <div className="bg-card rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-sm">{a.title}</h3>
                        <span className="text-xs text-text-muted flex items-center gap-1">
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-accent text-primary px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg animate-slide-up">
          {toast}
        </div>
      )}

      {/* Video modal */}
      {videoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setVideoModal(null)}
        >
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-text truncate">{videoModal.title}</h3>
              <button
                onClick={() => setVideoModal(null)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0 ml-3"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <video
              src={videoModal.video_url}
              controls
              autoPlay
              className="w-full rounded-xl bg-black"
              style={{ maxHeight: '75vh' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
