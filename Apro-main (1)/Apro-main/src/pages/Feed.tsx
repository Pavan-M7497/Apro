import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import type { Profile as ProfileType, Highlight, Achievement } from '../lib/types';
import { getCountryFlag, initials, timeAgo } from '../lib/utils';
import { Play, Trophy, UserPlus, UserCheck, Rss } from 'lucide-react';
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

  useEffect(() => {
    if (!user || !myProfile) return;
    loadFeed();
  }, [user, myProfile]);

  const loadFeed = async () => {
    setLoading(true);

    // Get following list
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

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', followingIds);

    const profileMap = new Map((profiles || []).map((p: ProfileType) => [p.id, p]));

    // Get highlights from followed
    const { data: highlights } = await supabase
      .from('highlights')
      .select('*')
      .in('profile_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get achievements from followed
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .in('profile_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(20);

    const feedItems: FeedItemData[] = [];

    (highlights || []).forEach((h: Highlight) => {
      const prof = profileMap.get(h.profile_id);
      if (prof) {
        feedItems.push({
          id: `h-${h.id}`,
          type: 'highlight',
          profile: prof,
          highlight: h,
          created_at: h.created_at,
        });
      }
    });

    (achievements || []).forEach((a: Achievement) => {
      const prof = profileMap.get(a.profile_id);
      if (prof) {
        feedItems.push({
          id: `a-${a.id}`,
          type: 'achievement',
          profile: prof,
          achievement: a,
          created_at: a.date,
        });
      }
    });

    feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(feedItems.slice(0, 30));
    setLoading(false);
  };

  const handleFollowToggle = async (profileId: string) => {
    if (!myProfile) return;
    const isFollowing = following.includes(profileId);

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', myProfile.id)
        .eq('following_id', profileId);
      setFollowing(following.filter((id) => id !== profileId));
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: myProfile.id, following_id: profileId });
      setFollowing([...following, profileId]);
    }
  };

  return (
    <div className="min-h-screen bg-primary pt-20 md:pt-20 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Feed</h1>

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
                <div key={item.id} className="bg-card rounded-xl border border-white/5 overflow-hidden animate-fade-in">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4">
                    <Link to={`/profile/${item.profile.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-surface overflow-hidden">
                        {item.profile.avatar_url ? (
                          <img src={item.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-accent bg-accent/10">
                            {initials(item.profile.full_name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold">{item.profile.full_name}</span>
                          <span className="text-xs">{getCountryFlag(item.profile.country)}</span>
                        </div>
                        <span className="text-xs text-text-muted">{timeAgo(item.created_at)}</span>
                      </div>
                    </Link>

                    {item.profile.id !== myProfile?.id && (
                      <button
                        onClick={() => handleFollowToggle(item.profile.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          isFollowingItem
                            ? 'bg-white/5 border border-white/10 text-text-muted hover:text-error'
                            : 'bg-accent text-primary hover:bg-accent-hover'
                        }`}
                      >
                        {isFollowingItem ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                        {isFollowingItem ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  {item.type === 'highlight' && item.highlight && (
                    <div>
                      <div className="relative aspect-video bg-surface">
                        {item.highlight.thumbnail_url ? (
                          <img src={item.highlight.thumbnail_url} alt={item.highlight.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-10 h-10 text-accent/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <Play className="w-12 h-12 text-white/70" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-sm">{item.highlight.title}</h3>
                        {item.highlight.description && (
                          <p className="text-xs text-text-muted mt-1">{item.highlight.description}</p>
                        )}
                        <span className="text-[10px] text-accent font-medium bg-accent/10 px-2 py-0.5 rounded-full mt-2 inline-block">
                          {item.highlight.sport}
                        </span>
                      </div>
                    </div>
                  )}

                  {item.type === 'achievement' && item.achievement && (
                    <div className="p-4 pt-0">
                      <div className="bg-surface rounded-xl p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">{item.achievement.title}</h3>
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
    </div>
  );
}
