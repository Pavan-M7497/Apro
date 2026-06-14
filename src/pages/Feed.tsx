import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import type { Profile as ProfileType, Highlight, Achievement } from '../lib/types';
import { getCountryFlag, initials, timeAgo } from '../lib/utils';
import { Play, Trophy, UserPlus, UserCheck, Rss, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

interface FeedItemData {
  id: string;
  type: 'highlight' | 'achievement';
  profile: ProfileType;
  highlight?: Highlight;
  achievement?: Achievement;
  created_at: string;
}

export default function Feed() {
  const { user, profile: myProfile } = useAppStore();
  const [items, setItems] = useState<FeedItemData[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoModal, setVideoModal] = useState<Highlight | null>(null);

  useEffect(() => {
    if (!user || !myProfile) return;
    loadFeed();
  }, [user, myProfile]);

  useEffect(() => {
    if (videoModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [videoModal]);

  const loadFeed = async () => {
    setLoading(true);

    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', myProfile!.id);

    const followingIds = (follows || []).map((f: any) => f.following_id);
    setFollowing(followingIds);

    if (followingIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', followingIds);

    const profileMap = new Map((profiles || []).map((p: ProfileType) => [p.id, p]));

    const { data: highlights } = await supabase
      .from('highlights')
      .select('*')
      .in('profile_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .in('profile_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(20);

    const feedItems: FeedItemData[] = [];

    (highlights || []).forEach((h: Highlight) => {
      const prof = profileMap.get(h.profile_id);
      if (prof) feedItems.push({ id: `h-${h.id}`, type: 'highlight', profile: prof, highlight: h, created_at: h.created_at });
    });

    (achievements || []).forEach((a: Achievement) => {
      const prof = profileMap.get(a.profile_id);
      if (prof) feedItems.push({ id: `a-${a.id}`, type: 'achievement', profile: prof, achievement: a, created_at: a.date });
    });

    feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(feedItems.slice(0, 30));
    setLoading(false);
  };

  const handleFollowToggle = async (profileId: string) => {
    if (!myProfile) return;
    const isFollowing = following.includes(profileId);
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', myProfile.id)
        .eq('following_id', profileId);
      setFollowing(following.filter((id) => id !== profileId));
    } else {
      await supabase.from('follows').insert({ follower_id: myProfile.id, following_id: profileId });
      setFollowing([...following, profileId]);
    }
  };

  return (
    <div className="relative min-h-screen pt-6 md:pt-10 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="font-display font-black uppercase text-2xl tracking-wide mb-6" style={{ letterSpacing: '0.02em' }}>Feed</h1>

        {loading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Rss}
            title="Your feed is empty"
            description="Follow athletes to see their highlights and achievements here."
            action={{ label: 'Discover athletes', onClick: () => window.location.href = '/discover' }}
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const isFollowingItem = following.includes(item.profile.id);
              return (
                <div key={item.id} className="bg-card border border-white/5 overflow-hidden animate-fade-in" style={{ borderRadius: '4px' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-4">
                    <Link to={`/profile/${item.profile.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-10 h-10 overflow-hidden bg-surface flex-shrink-0" style={{ borderRadius: '4px' }}>
                        {item.profile.avatar_url ? (
                          <img src={item.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-display font-bold text-accent bg-accent/10">
                            {initials(item.profile.full_name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold uppercase text-sm tracking-wide">{item.profile.full_name}</span>
                          <span className="text-xs">{getCountryFlag(item.profile.country)}</span>
                        </div>
                        <span className="text-xs text-text-muted">{timeAgo(item.created_at)}</span>
                      </div>
                    </Link>

                    {item.profile.id !== myProfile?.id && (
                      <button
                        onClick={() => handleFollowToggle(item.profile.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
                          isFollowingItem
                            ? 'bg-white/5 border border-white/10 text-text-muted hover:text-error'
                            : 'bg-accent text-primary hover:bg-accent-hover'
                        }`}
                        style={{ borderRadius: '3px' }}
                      >
                        {isFollowingItem ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                        {isFollowingItem ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>

                  {/* Highlight content — clickable to open video */}
                  {item.type === 'highlight' && item.highlight && (
                    <div>
                      <button
                        className="w-full text-left group cursor-pointer"
                        onClick={() => item.highlight && setVideoModal(item.highlight)}
                        aria-label={`Play ${item.highlight.title}`}
                      >
                        <div className="relative aspect-video bg-surface">
                          {item.highlight.thumbnail_url ? (
                            <img src={item.highlight.thumbnail_url} alt={item.highlight.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-10 h-10 text-accent/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 bg-accent/90 group-hover:bg-accent flex items-center justify-center transition-colors" style={{ borderRadius: '3px' }}>
                              <Play className="w-6 h-6 text-primary fill-current" />
                            </div>
                          </div>
                        </div>
                      </button>
                      <div className="p-4">
                        <h3 className="font-display font-bold uppercase text-sm tracking-wide">{item.highlight.title}</h3>
                        {item.highlight.description && (
                          <p className="text-xs text-text-muted mt-1">{item.highlight.description}</p>
                        )}
                        <span className="font-display text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 mt-2 inline-block uppercase tracking-wide" style={{ borderRadius: '3px' }}>
                          {item.highlight.sport}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Achievement content */}
                  {item.type === 'achievement' && item.achievement && (
                    <div className="p-4 pt-0">
                      <div className="bg-surface p-4 flex items-start gap-3" style={{ borderRadius: '4px' }}>
                        <div className="w-10 h-10 bg-accent/10 flex items-center justify-center flex-shrink-0" style={{ borderRadius: '3px' }}>
                          <Trophy className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold uppercase text-sm tracking-wide">{item.achievement.title}</h3>
                          <p className="text-xs text-text-muted mt-0.5">{item.achievement.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {videoModal && (
        <div
          className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center animate-fade-in"
          style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.98)', zIndex: 100, padding: '12px' }}
          onClick={() => setVideoModal(null)}
        >
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
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
            <video
              src={videoModal.video_url}
              controls
              autoPlay
              playsInline
              webkit-playsinline="true"
              preload="metadata"
              controlsList="nodownload"
              style={{ width: '100%', backgroundColor: '#000', borderRadius: '4px', maxHeight: '75vh', display: 'block' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
