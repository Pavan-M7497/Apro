import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { useImageUpload } from '../hooks/useImageUpload';
import { initials, formatDate, timeAgo, getActivityColor, getRoleTheme, accentTextColor, calculateProfileCompleteness } from '../lib/utils';
import type { Profile as ProfileType, AthleteProfile, Highlight, Achievement, TrainingSession, PerformanceRecord, WaterpoloStat, DivingResult } from '../lib/types';
import { ACTIVITY_TYPES, eventsFor, MEET_LEVELS, meetLevelStyle, disciplineName, formatSwimTime } from '../lib/types';
import { Play, Trophy, BarChart3, UserPlus, UserCheck, Share2, X, Calendar, Activity, Camera } from 'lucide-react';
import VerificationBadge from '../components/VerificationBadge';
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
  const { user, profile: myProfile, fetchProfile } = useAppStore();
  const navigate = useNavigate();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { upload: uploadAvatar, uploading: avatarUploading } = useImageUpload('avatars');
  const { upload: uploadCover, uploading: coverUploading } = useImageUpload('covers');
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [perfRecords, setPerfRecords] = useState<PerformanceRecord[]>([]);
  const [wpStats, setWpStats] = useState<WaterpoloStat[]>([]);
  const [divingResults, setDivingResults] = useState<DivingResult[]>([]);
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
        const { data } = await supabase
          .from('performance_records')
          .select('*')
          .eq('profile_id', prof.id)
          .order('meet_date', { ascending: false });
        setPerfRecords((data as PerformanceRecord[]) || []);
      })());

      promises.push((async () => {
        const { data } = await supabase
          .from('waterpolo_stats')
          .select('*')
          .eq('profile_id', prof.id)
          .order('season', { ascending: false });
        setWpStats((data as WaterpoloStat[]) || []);
      })());

      promises.push((async () => {
        const { data } = await supabase
          .from('diving_results')
          .select('*')
          .eq('profile_id', prof.id)
          .order('meet_date', { ascending: false });
        setDivingResults((data as DivingResult[]) || []);
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

  const handleConnect = async () => {
    if (!myProfile || !profile) return;

    // Following is part of "connecting" — keep the follow relationship.
    if (!isFollowing) {
      await supabase.from('follows').insert({ follower_id: myProfile.id, following_id: profile.id });
      setIsFollowing(true);
    }

    // Find an existing conversation in either direction, else create one.
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_a.eq.${myProfile.id},participant_b.eq.${profile.id}),and(participant_a.eq.${profile.id},participant_b.eq.${myProfile.id})`)
      .maybeSingle();

    let convId = existing?.id as string | undefined;
    if (!convId) {
      const { data: created } = await supabase
        .from('conversations')
        .insert({ participant_a: myProfile.id, participant_b: profile.id })
        .select('id')
        .single();
      convId = created?.id;
    }

    if (convId) navigate(`/messages?conversation=${convId}`);
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

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file || !profile) return;
    setLocalAvatarUrl(URL.createObjectURL(file));
    const publicUrl = await uploadAvatar(file, `${profile.id}/avatar`);
    if (!publicUrl) return;
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
    if (user) await fetchProfile(user.id);
    showToast('Profile photo updated!');
  };

  const handleCoverChange = async (file: File | undefined) => {
    if (!file || !profile) return;
    setLocalCoverUrl(URL.createObjectURL(file));
    const publicUrl = await uploadCover(file, `${profile.id}/cover`);
    if (!publicUrl) return;
    await supabase.from('profiles').update({ cover_url: publicUrl }).eq('id', profile.id);
    if (user) await fetchProfile(user.id);
    showToast('Banner updated!');
  };

  if (loading) return <LoadingSpinner />;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display font-bold uppercase text-xl mb-2">Profile not found</h2>
          <Link to="/discover" className="text-accent-ink text-sm hover:underline">Discover athletes</Link>
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
    fontSize: '11px', fontWeight: 500, padding: '4px 12px',
    borderRadius: '999px', background: theme.accentMuted, color: theme.accentInk,
  };

  const tabs = [
    { key: 'highlights', label: 'Highlights' },
    { key: 'stats', label: 'Stats' },
    { key: 'achievements', label: 'Achievements' },
    ...(profile.role === 'athlete' ? [{ key: 'training', label: 'Training' }] : []),
  ] as { key: Tab; label: string }[];

  return (
    <div className="relative" style={{ minHeight: '100vh', padding: '24px 20px 0' }}>

      {/* ── Cover hero (full width) ── */}
      <div className="relative w-full overflow-hidden h-[220px] md:h-[300px] mx-auto" style={{ background: theme.surface, borderRadius: '16px', maxWidth: '1100px' }}>
        {(localCoverUrl || profile.cover_url) && (
          <img src={localCoverUrl || profile.cover_url || ''} alt="" className="w-full h-full object-cover" />
        )}
        {/* The one allowed gradient — name legibility */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)' }} />

        {/* Banner upload (own profile) */}
        {isOwn && (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleCoverChange(e.target.files?.[0])}
            />
            {!(localCoverUrl || profile.cover_url) ? (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="absolute flex items-center"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', gap: '8px', border: '1.5px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px 16px', zIndex: 10 }}
              >
                <Camera style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                  {coverUploading ? 'Uploading…' : 'Upload banner'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="absolute flex items-center justify-center"
                style={{ top: '10px', left: '10px', width: '32px', height: '32px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: '12px', zIndex: 10 }}
                aria-label="Change banner"
              >
                <Camera style={{ width: '14px', height: '14px', color: '#fff' }} />
              </button>
            )}
          </>
        )}

        {/* Action buttons — top right */}
        <div className="absolute flex" style={{ top: '12px', right: '16px', gap: '8px', zIndex: 10 }}>
          <button
            onClick={handleShare}
            className="flex items-center"
            style={{ gap: '4px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', color: '#fff', borderRadius: '12px', padding: '6px 12px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          {isOwn && (
            <Link
              to="/profile/edit"
              style={{ background: theme.accent, color: onAccent, borderRadius: '12px', padding: '6px 14px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
            >
              Edit
            </Link>
          )}
          {canConnect && (
            <button
              onClick={handleConnect}
              className="flex items-center"
              style={
                isFollowing
                  ? { gap: '4px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', color: '#fff', borderRadius: '12px', padding: '6px 14px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }
                  : { gap: '4px', background: 'var(--accent)', color: 'var(--on-accent)', borderRadius: '12px', padding: '6px 14px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }
              }
            >
              {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {isFollowing ? 'Following' : 'Connect'}
            </button>
          )}
          {!user && !isOwn && (
            <Link
              to="/register"
              style={{ background: theme.accent, color: onAccent, borderRadius: '12px', padding: '6px 14px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
            >
              Join
            </Link>
          )}
        </div>

        {/* Name + sport/availability — bottom left */}
        <div className="absolute" style={{ left: '20px', right: '20px', bottom: '12px', zIndex: 10 }}>
          <h1 className="flex items-center" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 'clamp(30px, 5vw, 48px)', color: '#FFFFFF', letterSpacing: '-0.015em', lineHeight: 1.05, gap: '10px' }}>
            {profile.full_name}
            <VerificationBadge tier={profile.verification_tier} size="md" />
          </h1>
          {athleteProfile && (
            <div className="flex items-center flex-wrap" style={{ gap: '10px', marginTop: '8px' }}>
              {athleteProfile.sport && <span style={badgeStyle}>{disciplineName(athleteProfile.sport)}</span>}
              {athleteProfile.position && (
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{athleteProfile.position}</span>
              )}
              <div className="flex items-center" style={{ gap: '5px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '999px', background: availabilityDotColor }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{availabilityLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Avatar overlapping cover ── */}
      <div className="relative inline-block" style={{ marginTop: '-36px', marginLeft: '32px', zIndex: 20 }}>
        <div
          onClick={() => isOwn && avatarInputRef.current?.click()}
          className="relative overflow-hidden"
          style={{ width: '84px', height: '84px', borderRadius: '12px', border: `4px solid ${theme.bg}`, background: theme.accentMuted, cursor: isOwn ? 'pointer' : 'default' }}
        >
          {(localAvatarUrl || profile.avatar_url) ? (
            <img src={localAvatarUrl || profile.avatar_url || ''} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '26px', color: theme.accentInk }}>
              {initials(profile.full_name)}
            </div>
          )}
          {/* Upload progress bar */}
          {avatarUploading && (
            <div className="absolute left-0 right-0 bottom-0" style={{ height: '2px', background: 'var(--border)' }}>
              <div className="animate-pulse" style={{ height: '100%', width: '100%', background: theme.accent }} />
            </div>
          )}
        </div>
        {isOwn && (
          <>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleAvatarChange(e.target.files?.[0])}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute flex items-center justify-center"
              style={{ width: '26px', height: '26px', borderRadius: '999px', background: theme.accent, bottom: '-4px', right: '-4px', border: `2px solid ${theme.bg}` }}
              aria-label="Change avatar"
            >
              <Camera style={{ width: '12px', height: '12px', color: onAccent }} />
            </button>
          </>
        )}
      </div>

      {/* ── Claim banner ── */}
      {profile.is_claimed === false && (
        <div
          className="flex flex-wrap items-center gap-4"
          style={{ maxWidth: '1100px', margin: '24px auto 0', background: 'var(--accent-soft)', borderRadius: '16px', padding: '20px 24px' }}
        >
          <div className="flex-1 min-w-0">
            <p className="font-display" style={{ fontWeight: 800, fontSize: '18px', color: 'var(--accent-ink)' }}>
              Is this you?
            </p>
            <p style={{ fontSize: '14px', color: 'var(--accent-ink)', opacity: 0.85, marginTop: '2px' }}>
              Claim this profile to add your photo, film, and bio.
            </p>
          </div>
          <Link
            to={`/claim/${profile.username}`}
            className="rounded-pill flex-shrink-0"
            style={{ background: 'var(--text)', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '12px 24px' }}
          >
            Claim this profile
          </Link>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div style={{ maxWidth: '1100px', margin: '28px auto 0' }}>
        <div className="grid grid-cols-3" style={{ gap: '16px' }}>
          {[
            { label: 'Views this week', value: viewCount, key: true },
            { label: 'Highlights', value: highlights.length, key: false },
            { label: 'Followers', value: followers, key: false },
          ].map((s2) => (
            <div
              key={s2.label}
              style={{ background: theme.bgSoft, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px 20px' }}
            >
              <div className="font-display" style={{ fontWeight: 800, fontSize: '40px', lineHeight: 1, color: s2.key ? theme.accentInk : theme.text }}>
                {s2.value}
              </div>
              <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '8px' }}>{s2.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content area ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 0 80px' }}>

        {/* Completeness bar (own) */}
        {isOwn && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ height: '3px', background: theme.border, borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completeness}%`, background: theme.accent }} />
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: theme.textMuted, textAlign: 'right', marginTop: '4px' }}>{completeness}% complete</div>
          </div>
        )}

        {profile.bio && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theme.textMuted, lineHeight: 1.6, marginBottom: '20px', maxWidth: '36rem' }}>{profile.bio}</p>
        )}

        {/* ── Tab bar ── */}
        <div className="flex flex-wrap" style={{ gap: '8px', marginBottom: '28px' }}>
          {tabs.map(({ key, label }) => {
            const on = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="rounded-pill transition-colors"
                style={{
                  fontSize: '14px',
                  fontWeight: on ? 600 : 500,
                  padding: '10px 20px',
                  background: on ? theme.accentMuted : 'transparent',
                  color: on ? theme.accentInk : theme.textMuted,
                  border: `1px solid ${on ? 'transparent' : theme.border}`,
                }}
              >
                {label}
              </button>
            );
          })}
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
                  style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '12px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
                >
                  <div className="relative aspect-video" style={{ background: theme.bg }}>
                    {h.thumbnail_url && (
                      <img src={h.thumbnail_url} alt={h.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center justify-center group-hover:brightness-110" style={{ width: '40px', height: '40px', background: theme.accent, borderRadius: '999px' }}>
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
          athleteProfile?.sport === 'diving' ? (
            divingResults.length > 0 ? (
              <div className="space-y-6 pb-8">
                {(() => {
                  // Group by event, ordered as the discipline lists them.
                  const order = eventsFor('diving');
                  const byEvent = new Map<string, DivingResult[]>();
                  divingResults.forEach((r) => {
                    if (!byEvent.has(r.event)) byEvent.set(r.event, []);
                    byEvent.get(r.event)!.push(r);
                  });
                  const rank = (ev: string) => {
                    const i = order.indexOf(ev);
                    return i === -1 ? order.length + 1 : i;
                  };
                  return Array.from(byEvent.entries())
                    .sort((a, b) => rank(a[0]) - rank(b[0]))
                    .map(([event, rows]) => {
                      const best = rows.reduce((acc, r) =>
                        Number(r.total_score) > Number(acc.total_score) ? r : acc, rows[0]);
                      return (
                        <div key={event} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
                            <h3 className="font-display" style={{ fontWeight: 800, fontSize: '18px' }}>{event}</h3>
                            <span className="font-display" style={{ fontWeight: 800, fontSize: '30px', lineHeight: 1, color: 'var(--text)' }}>
                              {Number(best.total_score).toFixed(2)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {rows.map((r) => {
                              const level = MEET_LEVELS.find((m) => m.id === r.meet_level);
                              return (
                                <div key={r.id} className="flex items-center gap-3 flex-wrap" style={{ fontSize: '13px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{r.meet_name || 'Unnamed meet'}</span>
                                  {level && (
                                    <span
                                      className="rounded-pill"
                                      style={{ ...meetLevelStyle(level.id), fontSize: '11px', fontWeight: 600, padding: '3px 10px' }}
                                    >
                                      {level.name}
                                    </span>
                                  )}
                                  {r.dive_count && (
                                    <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>{r.dive_count} dives</span>
                                  )}
                                  {r.average_dd && (
                                    <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>avg DD {Number(r.average_dd).toFixed(2)}</span>
                                  )}
                                  {r.is_personal_best && (
                                    <span className="rounded-pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)', fontSize: '11px', fontWeight: 600, padding: '3px 10px' }}>
                                      PB
                                    </span>
                                  )}
                                  <span className="ml-auto" style={{ color: 'var(--text-soft)' }}>
                                    {Number(r.total_score).toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No scores yet"
                description={isOwn ? 'No scores yet. Add your first competition — even a district meet is a starting point.' : "This athlete hasn't added scores yet."}
              />
            )
          ) : athleteProfile?.sport === 'waterpolo' ? (
            wpStats.length > 0 ? (
              <div className="space-y-3 pb-8">
                {wpStats.map((w) => (
                  <div key={w.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                      <div>
                        <p className="font-display" style={{ fontWeight: 800, fontSize: '18px' }}>{w.season}</p>
                        {w.competition && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{w.competition}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {([['Matches', w.matches], ['Goals', w.goals], ['Assists', w.assists], ['Saves', w.saves], ['Exclusions', w.exclusions_drawn]] as const).map(([label, val]) => (
                        <div key={label}>
                          <div className="font-display" style={{ fontWeight: 800, fontSize: '28px', lineHeight: 1, color: label === 'Goals' ? 'var(--accent-ink)' : 'var(--text)' }}>{val}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No season stats yet"
                description={isOwn ? 'No season stats yet. Add your first season.' : "This athlete hasn't added season stats yet."}
              />
            )
          ) : perfRecords.length > 0 ? (
            <div className="space-y-6 pb-8">
              {(() => {
                // Group by event, ordered as the discipline lists them.
                const order = eventsFor(athleteProfile?.sport);
                const byEvent = new Map<string, PerformanceRecord[]>();
                perfRecords.forEach((r) => {
                  if (!byEvent.has(r.event)) byEvent.set(r.event, []);
                  byEvent.get(r.event)!.push(r);
                });
                const rank = (ev: string) => {
                  const i = order.indexOf(ev);
                  return i === -1 ? order.length + 1 : i;
                };
                return Array.from(byEvent.entries())
                  .sort((a, b) => rank(a[0]) - rank(b[0]))
                  .map(([event, rows]) => {
                    const best = rows.find((r) => r.is_personal_best) || rows[0];
                    return (
                      <div key={event} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
                          <h3 className="font-display" style={{ fontWeight: 800, fontSize: '18px' }}>{event}</h3>
                          <span className="font-display" style={{ fontWeight: 800, fontSize: '30px', lineHeight: 1, color: 'var(--text)' }}>
                            {best.result_seconds != null
                              ? formatSwimTime(Number(best.result_seconds))
                              : best.result_points != null
                              ? `${best.result_points} pts`
                              : '—'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {rows.map((r) => {
                            const level = MEET_LEVELS.find((m) => m.id === r.meet_level);
                            return (
                              <div key={r.id} className="flex items-center gap-3 flex-wrap" style={{ fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{r.meet_name || 'Unnamed meet'}</span>
                                {level && (
                                  <span
                                    className="rounded-pill"
                                    style={{ ...meetLevelStyle(level.id), fontSize: '11px', fontWeight: 600, padding: '3px 10px' }}
                                  >
                                    {level.name}
                                  </span>
                                )}
                                {r.course && r.course !== 'NA' && (
                                  <span className="rounded-pill" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '11px', padding: '3px 10px' }}>
                                    {r.course}
                                  </span>
                                )}
                                {r.is_personal_best && (
                                  <span className="rounded-pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)', fontSize: '11px', fontWeight: 600, padding: '3px 10px' }}>
                                    PB
                                  </span>
                                )}
                                <span className="ml-auto" style={{ color: 'var(--text-soft)' }}>
                                  {r.result_seconds != null
                                    ? formatSwimTime(Number(r.result_seconds))
                                    : r.result_points != null
                                    ? `${r.result_points} pts`
                                    : '—'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No times yet"
              description={isOwn ? 'No times yet. Add your first race — even a district heat is a starting point.' : "This athlete hasn't added times yet."}
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
                      style={{ left: '0', top: '2px', width: '20px', height: '20px', borderRadius: '999px', background: theme.accentMuted, border: `1.5px solid ${theme.accent}` }}
                    >
                      <Trophy style={{ width: '10px', height: '10px', color: theme.accent }} />
                    </div>
                    <div style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '12px', padding: '10px 12px' }}>
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
                    <div key={label} style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '12px', padding: '14px' }}>
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
                      <div key={s.id} className="flex items-center gap-3 p-3" style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '12px' }}>
                        <div className="flex items-center justify-center flex-shrink-0" style={{ width: '36px', height: '36px', borderRadius: '12px', background: `${color}22` }}>
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
                    style={{ border: `0.5px solid ${theme.border}`, borderRadius: '12px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: theme.text, textTransform: 'uppercase' }}
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
          style={{ background: theme.accent, color: onAccent, padding: '10px 20px', borderRadius: '12px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}
        >
          {toast}
        </div>
      )}

      {/* ── Video Modal (faux fullscreen) ── */}
      {videoModal && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center animate-fade-in"
          style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.98)', zIndex: 100, padding: '12px' }}
          onClick={() => setVideoModal(null)}
        >
          <div className="w-full" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
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
                style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }}
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
              style={{ width: '100%', backgroundColor: '#000', borderRadius: '12px', maxHeight: '75vh', display: 'block' }}
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
