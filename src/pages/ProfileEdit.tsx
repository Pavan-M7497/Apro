import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { calculateProfileCompleteness } from '../lib/utils';
import { useImageUpload } from '../hooks/useImageUpload';
import { useTheme } from '../contexts/ThemeContext';
import { DisciplineSelect, WaterpoloPositionSelect, PrimaryEventsSelect } from '../components/DisciplineSelect';
import { StateSelect } from '../components/StateSelect';
import type { AthleteProfile, Achievement, PerformanceRecord, WaterpoloStat } from '../lib/types';
import { MEET_LEVELS, TIMED_DISCIPLINES, SCORED_DISCIPLINES, formatSwimTime, parsePrimaryEvents, eventsFor, GENDERS, VERIFICATION_TIERS } from '../lib/types';
import VerificationBadge, { TIER_META } from '../components/VerificationBadge';
import { Camera, Save, User, Globe, Dumbbell, FileText, BarChart3, Trophy, Plus, Trash2 } from 'lucide-react';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAppStore();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [stateCode, setStateCode] = useState(profile?.state_code || '');
  const [city, setCity] = useState(profile?.city || '');
  const [gender, setGender] = useState<string>(profile?.gender || '');
  const [events, setEvents] = useState<string[]>([]);
  const [sport, setSport] = useState('');
  const [position, setPosition] = useState('');
  const [availability, setAvailability] = useState<string>('available');
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(profile?.cover_url || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [calculatingScore, setCalculatingScore] = useState(false);

  // Verification
  const [sfiId, setSfiId] = useState(profile?.sfi_id || '');
  const [verifNote, setVerifNote] = useState('');
  const [submittingVerif, setSubmittingVerif] = useState(false);
  const [verifSubmitted, setVerifSubmitted] = useState(false);
  const [verifDoc, setVerifDoc] = useState<File | null>(null);

  const theme = useTheme();
  const { upload: uploadAvatar, uploading: avatarUploading } = useImageUpload('avatars');
  const { upload: uploadCover, uploading: coverUploading } = useImageUpload('covers');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2500);
  };
  const [loading, setLoading] = useState(true);

  // Stats
  const [perfRecords, setPerfRecords] = useState<PerformanceRecord[]>([]);
  const [wpStats, setWpStats] = useState<WaterpoloStat[]>([]);
  const [savingRow, setSavingRow] = useState(false);
  const emptyPerf = { event: '', course: 'LCM', min: '', sec: '', hun: '', points: '', meet_name: '', meet_level: 'state', meet_date: '' };
  const [newPerf, setNewPerf] = useState(emptyPerf);
  const emptyWp = { season: '', competition: '', matches: '0', goals: '0', assists: '0', saves: '0', exclusions_drawn: '0' };
  const [newWp, setNewWp] = useState(emptyWp);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievement, setNewAchievement] = useState({ title: '', description: '', date: '' });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [addingAchievement, setAddingAchievement] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    loadAthleteData();
  }, [user, profile]);

  const loadAthleteData = async () => {
    if (profile?.role !== 'athlete') { setLoading(false); return; }
    const { data: ap } = await supabase
      .from('athlete_profiles')
      .select('*')
      .eq('profile_id', profile!.id)
      .maybeSingle();
    if (ap) {
      setAthleteProfile(ap);
      setSport(ap.sport);
      setPosition(ap.position);
      setAvailability(ap.availability);

      if (ap.sport !== 'waterpolo') setEvents(parsePrimaryEvents(ap.position));

      if (ap.sport === 'waterpolo') {
        const { data: wp } = await supabase
          .from('waterpolo_stats')
          .select('*')
          .eq('profile_id', profile!.id)
          .order('season', { ascending: false });
        setWpStats((wp as WaterpoloStat[]) || []);
      } else {
        const { data: pr } = await supabase
          .from('performance_records')
          .select('*')
          .eq('profile_id', profile!.id)
          .order('meet_date', { ascending: false });
        setPerfRecords((pr as PerformanceRecord[]) || []);
      }
    }

    // Load achievements
    const { data: achievementsData } = await supabase
      .from('achievements')
      .select('*')
      .eq('profile_id', profile!.id)
      .order('date', { ascending: false });
    if (achievementsData) setAchievements(achievementsData);

    setLoading(false);
  };

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file || !profile) return;
    setAvatarPreview(URL.createObjectURL(file));
    const publicUrl = await uploadAvatar(file, `${profile.id}/avatar`);
    if (!publicUrl) return;
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
    if (user) await fetchProfile(user.id);
    showNotice('Profile photo updated!');
  };

  const handleCoverChange = async (file: File | undefined) => {
    if (!file || !profile) return;
    setCoverPreview(URL.createObjectURL(file));
    const publicUrl = await uploadCover(file, `${profile.id}/cover`);
    if (!publicUrl) return;
    await supabase.from('profiles').update({ cover_url: publicUrl }).eq('id', profile.id);
    if (user) await fetchProfile(user.id);
    showNotice('Banner updated!');
  };

  async function calculateAproScore() {
    if (!profile) return;
    setCalculatingScore(true);

    const fields = [profile.full_name, profile.bio, profile.avatar_url, profile.cover_url, profile.country, athleteProfile?.sport, athleteProfile?.position, athleteProfile?.date_of_birth];
    const filled = fields.filter(Boolean).length;
    const completeness = Math.round((filled / fields.length) * 20);

    const tierScore = (profile.verification_tier || 0) * 10;

    const { data: achievs } = await supabase.from('achievements').select('category').eq('profile_id', profile.id);
    const weights: Record<string, number> = { world: 30, continental: 20, national: 15, regional: 8, title: 10, award: 6, record: 8, selection: 10, other: 2 };
    const achievScore = Math.min(30, (achievs || []).reduce((sum: number, a: { category: string }) => sum + (weights[a.category] || 2), 0));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase.from('profile_views').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id).gte('created_at', thirtyDaysAgo);
    const engagementScore = Math.min(20, Math.floor((count || 0) / 5));

    const total = completeness + tierScore + achievScore + engagementScore;
    const breakdown = { completeness, verification: tierScore, achievements: achievScore, engagement: engagementScore };

    await supabase.from('apro_scores').upsert({
      profile_id: profile.id,
      sport: athleteProfile?.sport || '',
      country: profile.country || '',
      score: total,
      breakdown,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

    setCalculatingScore(false);
    showNotice(`Apro Score updated: ${total}/100`);
  }

  const tier = profile?.verification_tier ?? 0;

  /** Tier 2: the athlete self-declares an SFI / state association number. */
  const submitIdVerification = async () => {
    if (!profile) return;
    const id = sfiId.trim();
    if (!id) { setError('Enter your SFI or state association number'); return; }
    setSubmittingVerif(true);
    try {
      const { error: reqErr } = await supabase.from('verification_requests').insert({
        profile_id: profile.id,
        requested_tier: 2,
        sfi_id: id,
        note: verifNote.trim() || null,
      });
      if (reqErr) throw reqErr;

      // Tier 2 is self-declared, so it applies immediately.
      await supabase
        .from('profiles')
        .update({ sfi_id: id, verification_tier: Math.max(tier, 2) })
        .eq('id', profile.id);

      if (user) await fetchProfile(user.id);
      setVerifSubmitted(true);
      setError('');
      showNotice('ID saved — you are now tier 2.');
    } catch (err: any) {
      setError(err.message || 'Could not submit verification');
    } finally {
      setSubmittingVerif(false);
    }
  };

  /** Tier 4: upload supporting proof for manual association review. */
  const submitAssociationRequest = async () => {
    if (!profile) return;
    setSubmittingVerif(true);
    try {
      let documentUrl: string | null = null;
      if (verifDoc) {
        const ext = verifDoc.name.split('.').pop();
        const path = `${profile.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('verification-docs')
          .upload(path, verifDoc, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('verification-docs').getPublicUrl(path);
        documentUrl = data.publicUrl;
      }

      const { error: reqErr } = await supabase.from('verification_requests').insert({
        profile_id: profile.id,
        requested_tier: 4,
        sfi_id: profile.sfi_id,
        document_url: documentUrl,
        note: verifNote.trim() || null,
      });
      if (reqErr) throw reqErr;

      setVerifSubmitted(true);
      setVerifDoc(null);
      setError('');
      showNotice('Request sent for association review.');
    } catch (err: any) {
      setError(err.message || 'Could not submit request');
    } finally {
      setSubmittingVerif(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setError('');
    setSaving(true);

    try {
      // Avatar/cover are uploaded immediately on selection; here we only
      // persist the text fields.
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio || null,
          country: 'India',
          state_code: stateCode || null,
          city: city || null,
          gender: gender || null,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      if (profile.role === 'athlete') {
        const apData: any = { sport, position: sport === 'waterpolo' ? position : events.join(', '), availability };
        if (athleteProfile) {
          const { error: apError } = await supabase
            .from('athlete_profiles')
            .update(apData)
            .eq('id', athleteProfile.id);
          if (apError) throw apError;
        } else {
          const { error: apError } = await supabase
            .from('athlete_profiles')
            .insert({ profile_id: profile.id, ...apData });
          if (apError) throw apError;
        }
      }

      await fetchProfile(user!.id);
      navigate(`/profile/${profile.username}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const isTimed = TIMED_DISCIPLINES.includes(sport);
  const isScored = SCORED_DISCIPLINES.includes(sport);

  const handleAddPerformance = async () => {
    if (!profile) return;
    if (!newPerf.event) { setError('Event is required'); return; }
    const total =
      (parseInt(newPerf.min || '0') || 0) * 60 +
      (parseInt(newPerf.sec || '0') || 0) +
      (parseInt(newPerf.hun || '0') || 0) / 100;
    const resultSeconds = isTimed ? Math.round(total * 100) / 100 : null;
    const resultPoints = isScored && newPerf.points ? parseFloat(newPerf.points) : null;
    if (isTimed && (!resultSeconds || resultSeconds <= 0)) { setError('Enter a valid time'); return; }
    const course = isTimed ? newPerf.course : 'NA';

    setSavingRow(true);
    try {
      // A new row is a PB when it beats every existing result for the same
      // event + course: fastest time, or highest score for judged events.
      const sameSet = perfRecords.filter((r) => r.event === newPerf.event && r.course === course);
      let isPB: boolean;
      if (isTimed) {
        isPB = sameSet.every((r) => r.result_seconds == null || resultSeconds! < Number(r.result_seconds));
      } else if (resultPoints != null) {
        isPB = sameSet.every((r) => r.result_points == null || resultPoints > Number(r.result_points));
      } else {
        isPB = sameSet.length === 0;
      }

      const { data, error: perfErr } = await supabase
        .from('performance_records')
        .insert({
          profile_id: profile.id,
          discipline: sport,
          event: newPerf.event,
          course,
          result_seconds: resultSeconds,
          result_points: resultPoints,
          meet_name: newPerf.meet_name || null,
          meet_level: newPerf.meet_level || null,
          meet_date: newPerf.meet_date || null,
          is_personal_best: isPB,
        })
        .select()
        .single();
      if (perfErr) throw perfErr;

      // The new PB demotes the previous holder for that event + course.
      if (isPB && sameSet.length > 0) {
        await supabase
          .from('performance_records')
          .update({ is_personal_best: false })
          .eq('profile_id', profile.id)
          .eq('event', newPerf.event)
          .eq('course', course)
          .neq('id', data.id);
      }

      setPerfRecords((prev) => [
        data as PerformanceRecord,
        ...(isPB
          ? prev.map((r) =>
              r.event === newPerf.event && r.course === course ? { ...r, is_personal_best: false } : r
            )
          : prev),
      ]);
      setNewPerf(emptyPerf);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add result');
    } finally {
      setSavingRow(false);
    }
  };

  const handleDeletePerformance = async (id: string) => {
    const { error: delErr } = await supabase.from('performance_records').delete().eq('id', id);
    if (delErr) { setError(delErr.message); return; }
    setPerfRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddWpStat = async () => {
    if (!profile) return;
    if (!newWp.season.trim()) { setError('Season is required'); return; }
    setSavingRow(true);
    try {
      const { data, error: wpErr } = await supabase
        .from('waterpolo_stats')
        .insert({
          profile_id: profile.id,
          season: newWp.season,
          competition: newWp.competition || null,
          matches: parseInt(newWp.matches) || 0,
          goals: parseInt(newWp.goals) || 0,
          assists: parseInt(newWp.assists) || 0,
          saves: parseInt(newWp.saves) || 0,
          exclusions_drawn: parseInt(newWp.exclusions_drawn) || 0,
        })
        .select()
        .single();
      if (wpErr) throw wpErr;
      setWpStats((prev) => [data as WaterpoloStat, ...prev]);
      setNewWp(emptyWp);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add season');
    } finally {
      setSavingRow(false);
    }
  };

  const handleDeleteWpStat = async (id: string) => {
    const { error: delErr } = await supabase.from('waterpolo_stats').delete().eq('id', id);
    if (delErr) { setError(delErr.message); return; }
    setWpStats((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddAchievement = async () => {
    if (!profile) return;
    if (!newAchievement.title.trim()) { setError('Title is required'); return; }
    if (!newAchievement.date) { setError('Date is required'); return; }
    setAddingAchievement(true);
    try {
      let proof_url: string | null = null;
      if (proofFile) {
        const ext = proofFile.name.split('.').pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('verification-docs')
          .upload(path, proofFile, { upsert: true });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from('verification-docs').getPublicUrl(path);
          proof_url = publicUrl;
        }
      }
      const { data, error: achError } = await supabase
        .from('achievements')
        .insert({
          profile_id: profile.id,
          title: newAchievement.title,
          description: newAchievement.description || '',
          date: newAchievement.date,
          proof_url,
          verification_status: proof_url ? 'pending' : 'unverified',
        })
        .select()
        .single();
      if (achError) throw achError;
      if (data) setAchievements([data, ...achievements]);
      setNewAchievement({ title: '', description: '', date: '' });
      setProofFile(null);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add achievement');
    } finally {
      setAddingAchievement(false);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    const { error: delError } = await supabase.from('achievements').delete().eq('id', id);
    if (delError) { setError(delError.message); return; }
    setAchievements(achievements.filter((a) => a.id !== id));
  };

  if (!user || !profile) {
    navigate('/login');
    return null;
  }

  const completeness = calculateProfileCompleteness(
    { ...profile, full_name: fullName, bio, country: 'India', state_code: stateCode, avatar_url: avatarPreview, cover_url: coverPreview },
    profile.role === 'athlete' ? { sport, position, date_of_birth: athleteProfile?.date_of_birth || null } : null
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-6 md:pt-10 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

        {notice && (
          <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-accent text-primary px-5 py-2.5 text-sm font-bold animate-slide-up whitespace-nowrap" style={{ borderRadius: '12px' }}>
            {notice}
          </div>
        )}

        {/* Completeness bar */}
        <div className="bg-card rounded-xl p-4 border border-line mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile completeness</span>
            <span className="text-sm font-bold text-accent-ink">{completeness}%</span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 mb-4 text-sm text-error">
            {error}
          </div>
        )}

        {/* Cover */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-muted mb-2">Cover photo</label>
          <div
            onClick={() => document.getElementById('cover-input')?.click()}
            className="h-32 md:h-40 bg-surface border-2 border-dashed border-line rounded-xl overflow-hidden cursor-pointer hover:border-accent/20 transition-colors relative"
          >
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center gap-2">
                <Camera className="w-6 h-6 text-text-muted/30" />
                <span className="text-xs text-text-muted/50">{coverUploading ? 'Uploading…' : 'Upload banner'}</span>
              </div>
            )}
            <input
              id="cover-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleCoverChange(e.target.files?.[0])}
            />
          </div>
        </div>

        {/* Avatar */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-muted mb-2">Avatar</label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => document.getElementById('avatar-input')?.click()}
              className="w-20 h-20 rounded-full bg-surface border-2 border-dashed border-line overflow-hidden cursor-pointer hover:border-accent/20 transition-colors flex-shrink-0"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-accent-ink bg-accent-soft">
                  {fullName?.[0] || '?'}
                </div>
              )}
            </div>
            <input
              id="avatar-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleAvatarChange(e.target.files?.[0])}
            />
            <p className="text-xs text-text-muted">{avatarUploading ? 'Uploading…' : 'Click to change avatar'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm text-text focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Bio</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="A short bio — club, coach, what you swim…"
                className="w-full bg-surface border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* State + city */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">State</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted z-10" />
                <StateSelect
                  value={stateCode}
                  onChange={setStateCode}
                  className="bg-white border border-line rounded-pill pl-10 pr-4 py-2.5 text-sm focus:border-accent transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full bg-white border border-line rounded-pill px-4 py-2.5 text-sm text-text focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Athlete-specific fields */}
          {profile.role === 'athlete' && (
            <>
              <div className="border-t border-line pt-4">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <Dumbbell className="w-4 h-4 text-accent-ink" /> Athlete Details
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Discipline</label>
                <DisciplineSelect value={sport} onChange={(d) => { setSport(d); setPosition(''); setEvents([]); }} />
              </div>

              {sport === 'waterpolo' && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Position</label>
                  <WaterpoloPositionSelect value={position} onChange={setPosition} />
                </div>
              )}

              {sport && sport !== 'waterpolo' && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Primary events</label>
                  <PrimaryEventsSelect discipline={sport} value={events} onChange={setEvents} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Availability</label>
                <div className="flex gap-2">
                  {(['available', 'open_to_offers', 'unavailable'] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAvailability(a)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        availability === a
                          ? a === 'available' ? 'bg-success/20 text-success border border-success/30'
                            : a === 'open_to_offers' ? 'bg-accent-soft text-accent-ink border border-accent/30'
                            : 'bg-error/20 text-error border border-error/30'
                          : 'bg-surface border border-line text-text-muted hover:text-text'
                      }`}
                    >
                      {a.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Gender</label>
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id)}
                      className="flex-1 rounded-pill text-sm transition-colors"
                      style={
                        gender === g.id
                          ? { background: 'var(--accent-soft)', color: 'var(--accent-ink)', border: '1px solid var(--accent)', fontWeight: 600, padding: '10px 16px' }
                          : { background: '#fff', color: 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 500, padding: '10px 16px' }
                      }
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-1.5">Required — leaderboards are split by gender.</p>
              </div>

              {/* Results */}
              <div className="border-t border-line pt-6">
                <h3 className="font-display flex items-center gap-2 mb-4" style={{ fontWeight: 800, fontSize: '17px' }}>
                  <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent-ink)' }} />
                  {sport === 'waterpolo' ? 'Season stats' : 'Results'}
                </h3>

                {sport === 'waterpolo' ? (
                  <>
                    {wpStats.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {wpStats.map((w) => (
                          <div key={w.id} className="flex items-center gap-3 p-4" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px' }}>
                            <div className="flex-1 min-w-0">
                              <p className="font-display" style={{ fontWeight: 800, fontSize: '15px' }}>{w.season}</p>
                              <p className="text-xs text-text-muted">{w.competition || 'Season total'}</p>
                            </div>
                            <div className="flex items-center gap-4 text-center">
                              {[['MP', w.matches], ['G', w.goals], ['A', w.assists], ['S', w.saves]].map(([k, v]) => (
                                <div key={k as string}>
                                  <div className="font-display" style={{ fontWeight: 800, fontSize: '18px' }}>{v as number}</div>
                                  <div className="text-text-muted" style={{ fontSize: '9px' }}>{k as string}</div>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => handleDeleteWpStat(w.id)} className="text-text-muted hover:text-error transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                      <p className="text-xs font-medium text-text-muted mb-3">Add a season</p>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input type="text" placeholder="Season (e.g. 2025-26)" value={newWp.season}
                          onChange={(e) => setNewWp({ ...newWp, season: e.target.value })}
                          className="bg-white border border-line rounded-pill px-4 py-2 text-sm" />
                        <input type="text" placeholder="Competition" value={newWp.competition}
                          onChange={(e) => setNewWp({ ...newWp, competition: e.target.value })}
                          className="bg-white border border-line rounded-pill px-4 py-2 text-sm" />
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {([['matches', 'MP'], ['goals', 'G'], ['assists', 'A'], ['saves', 'S'], ['exclusions_drawn', 'EX']] as const).map(([key, label]) => (
                          <div key={key}>
                            <label className="block text-text-muted mb-1" style={{ fontSize: '10px' }}>{label}</label>
                            <input type="number" min={0} value={(newWp as any)[key]}
                              onChange={(e) => setNewWp({ ...newWp, [key]: e.target.value })}
                              className="w-full bg-white border border-line rounded-pill px-3 py-2 text-sm" />
                          </div>
                        ))}
                      </div>
                      <button onClick={handleAddWpStat} disabled={savingRow}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-pill disabled:opacity-50"
                        style={{ background: 'var(--text)', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '10px 20px' }}>
                        <Plus className="w-4 h-4" /> {savingRow ? 'Adding…' : 'Add season'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {perfRecords.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {perfRecords.map((r) => (
                          <div key={r.id} className="flex items-center gap-3 p-4" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px' }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-display" style={{ fontWeight: 800, fontSize: '15px' }}>{r.event}</p>
                                {r.course && r.course !== 'NA' && (
                                  <span className="rounded-pill" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '10px', padding: '2px 8px' }}>{r.course}</span>
                                )}
                                {r.is_personal_best && (
                                  <span className="rounded-pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)', fontSize: '10px', fontWeight: 600, padding: '2px 8px' }}>PB</span>
                                )}
                              </div>
                              <p className="text-xs text-text-muted mt-0.5">
                                {r.meet_name || 'Unnamed meet'}{r.meet_date ? ` · ${r.meet_date}` : ''}
                              </p>
                            </div>
                            <span className="font-display flex-shrink-0" style={{ fontWeight: 800, fontSize: '20px' }}>
                              {r.result_seconds != null ? formatSwimTime(Number(r.result_seconds)) : r.result_points != null ? `${r.result_points} pts` : '—'}
                            </span>
                            <button onClick={() => handleDeletePerformance(r.id)} className="text-text-muted hover:text-error transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                      <p className="text-xs font-medium text-text-muted mb-3">Add a result</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <select value={newPerf.event} onChange={(e) => setNewPerf({ ...newPerf, event: e.target.value })}
                          className="bg-white border border-line rounded-pill px-4 py-2 text-sm appearance-none">
                          <option value="">Select event</option>
                          {eventsFor(sport).map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                        </select>
                        {isTimed && (
                          <select value={newPerf.course} onChange={(e) => setNewPerf({ ...newPerf, course: e.target.value })}
                            className="bg-white border border-line rounded-pill px-4 py-2 text-sm appearance-none">
                            <option value="LCM">Long course (50m)</option>
                            <option value="SCM">Short course (25m)</option>
                          </select>
                        )}
                      </div>

                      {isTimed ? (
                        <div className="mb-3">
                          <label className="block text-text-muted mb-1" style={{ fontSize: '10px' }}>Time</label>
                          <div className="flex items-center gap-2">
                            <input type="number" min={0} placeholder="min" value={newPerf.min}
                              onChange={(e) => setNewPerf({ ...newPerf, min: e.target.value })}
                              className="w-20 bg-white border border-line rounded-pill px-3 py-2 text-sm text-center" />
                            <span className="text-text-muted">:</span>
                            <input type="number" min={0} max={59} placeholder="sec" value={newPerf.sec}
                              onChange={(e) => setNewPerf({ ...newPerf, sec: e.target.value })}
                              className="w-20 bg-white border border-line rounded-pill px-3 py-2 text-sm text-center" />
                            <span className="text-text-muted">.</span>
                            <input type="number" min={0} max={99} placeholder="hs" value={newPerf.hun}
                              onChange={(e) => setNewPerf({ ...newPerf, hun: e.target.value })}
                              className="w-20 bg-white border border-line rounded-pill px-3 py-2 text-sm text-center" />
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <label className="block text-text-muted mb-1" style={{ fontSize: '10px' }}>Points</label>
                          <input type="number" step="0.01" min={0} placeholder="e.g. 284.65" value={newPerf.points}
                            onChange={(e) => setNewPerf({ ...newPerf, points: e.target.value })}
                            className="w-40 bg-white border border-line rounded-pill px-4 py-2 text-sm" />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input type="text" placeholder="Meet name" value={newPerf.meet_name}
                          onChange={(e) => setNewPerf({ ...newPerf, meet_name: e.target.value })}
                          className="bg-white border border-line rounded-pill px-4 py-2 text-sm" />
                        <select value={newPerf.meet_level} onChange={(e) => setNewPerf({ ...newPerf, meet_level: e.target.value })}
                          className="bg-white border border-line rounded-pill px-4 py-2 text-sm appearance-none">
                          {MEET_LEVELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <input type="date" value={newPerf.meet_date}
                          onChange={(e) => setNewPerf({ ...newPerf, meet_date: e.target.value })}
                          className="bg-white border border-line rounded-pill px-4 py-2 text-sm" />
                      </div>

                      <button onClick={handleAddPerformance} disabled={savingRow}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-pill disabled:opacity-50"
                        style={{ background: 'var(--text)', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '10px 20px' }}>
                        <Plus className="w-4 h-4" /> {savingRow ? 'Adding…' : 'Add result'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Achievements section */}
              <div className="border-t border-line pt-4">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-accent-ink" /> Achievements
                </h3>

                {achievements.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {achievements.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 bg-surface rounded-lg p-3 border border-line">
                        <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-4 h-4 text-accent-ink" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <p className="text-xs text-text-muted truncate">{a.description}</p>
                        </div>
                        <button onClick={() => handleDeleteAchievement(a.id)} className="text-text-muted hover:text-error transition-colors flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add achievement form */}
                <div className="bg-surface rounded-lg p-3 border border-line">
                  <p className="text-xs font-medium text-text-muted mb-2">Add achievement</p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Title (e.g. League Champion)"
                      value={newAchievement.title}
                      onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                      className="w-full bg-card border border-line rounded px-3 py-1.5 text-xs text-text placeholder:text-text-muted/40 focus:border-accent/30"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newAchievement.description}
                      onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                      className="w-full bg-card border border-line rounded px-3 py-1.5 text-xs text-text placeholder:text-text-muted/40 focus:border-accent/30"
                    />
                    <input
                      type="date"
                      value={newAchievement.date}
                      onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })}
                      className="bg-card border border-line rounded px-3 py-1.5 text-xs text-text focus:border-accent/30"
                    />
                    <div>
                      <label className="text-[10px] text-text-muted block mb-1">Proof (optional — image)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        className="text-xs text-text-muted file:mr-2 file:py-1 file:px-2 file:text-xs file:bg-accent-soft file:text-accent-ink file:border-0 file:rounded"
                      />
                      {proofFile && <p className="text-[10px] text-accent-ink mt-1">{proofFile.name}</p>}
                    </div>
                  </div>
                  <button
                    onClick={handleAddAchievement}
                    disabled={addingAchievement}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-accent-ink hover:text-accent-ink-hover transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {addingAchievement ? 'Adding...' : 'Add achievement'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Verification */}
        <div className="mt-8 pt-6 border-t border-line">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display" style={{ fontWeight: 800, fontSize: '17px' }}>Verification</h3>
            <VerificationBadge tier={tier} size="md" />
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            You are at <strong style={{ color: 'var(--text)' }}>tier {tier} — {VERIFICATION_TIERS[tier]?.name}</strong>.
            {tier >= 2 && ` ${TIER_META[tier]?.tooltip}.`}
          </p>
          {tier < 4 && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              <strong style={{ color: 'var(--text)' }}>Next — tier {tier + 1} ({VERIFICATION_TIERS[tier + 1]?.name}):</strong>{' '}
              {VERIFICATION_TIERS[tier + 1]?.earned}
            </p>
          )}

          {/* Tier < 2 — self-declare an ID */}
          {tier < 2 && (
            <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
              <label className="block text-sm font-medium text-text-muted mb-1.5">SFI or state association number</label>
              <input
                type="text"
                value={sfiId}
                onChange={(e) => setSfiId(e.target.value)}
                placeholder="e.g. SFI-2024-01234"
                className="w-full bg-white border border-line rounded-pill px-4 py-2.5 text-sm text-text focus:border-accent transition-colors mb-3"
              />
              <input
                type="text"
                value={verifNote}
                onChange={(e) => setVerifNote(e.target.value)}
                placeholder="Anything we should know (optional)"
                className="w-full bg-white border border-line rounded-pill px-4 py-2.5 text-sm text-text focus:border-accent transition-colors mb-3"
              />
              <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginBottom: '12px' }}>
                Self-declared. It marks your ID as on file — it does not verify your results.
              </p>
              <button
                onClick={submitIdVerification}
                disabled={submittingVerif}
                className="inline-flex items-center gap-2 rounded-pill disabled:opacity-60"
                style={{ background: 'var(--text)', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '10px 20px' }}
              >
                {submittingVerif ? 'Submitting…' : 'Submit ID'}
              </button>
            </div>
          )}

          {/* Tier 2 — request association confirmation */}
          {tier === 2 && (
            <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Upload a club or association letter to request tier 4. Optional — tier 3 arrives on its own
                once one of your results is matched from an official meet.
              </p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setVerifDoc(e.target.files?.[0] || null)}
                className="text-xs text-text-muted file:mr-2 file:py-1.5 file:px-3 file:text-xs file:rounded-pill file:border-0 file:bg-accent-soft file:text-accent-ink mb-3"
              />
              {verifDoc && <p style={{ fontSize: '12px', color: 'var(--accent-ink)', marginBottom: '8px' }}>{verifDoc.name}</p>}
              <input
                type="text"
                value={verifNote}
                onChange={(e) => setVerifNote(e.target.value)}
                placeholder="Club or association name (optional)"
                className="w-full bg-white border border-line rounded-pill px-4 py-2.5 text-sm text-text focus:border-accent transition-colors mb-3"
              />
              <button
                onClick={submitAssociationRequest}
                disabled={submittingVerif}
                className="inline-flex items-center gap-2 rounded-pill disabled:opacity-60"
                style={{ background: 'var(--text)', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '10px 20px' }}
              >
                {submittingVerif ? 'Sending…' : 'Request association review'}
              </button>
            </div>
          )}

          {verifSubmitted && (
            <p style={{ fontSize: '13px', color: 'var(--accent-ink)', marginTop: '12px' }}>
              Submitted. We'll be in touch if we need anything else.
            </p>
          )}
        </div>

        {/* Apro Score */}
        <div className="mt-8 pt-6 border-t border-line">
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', color: theme.accent }}>Apro Score</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: theme.textMuted, marginTop: '4px', marginBottom: '12px' }}>
            Your score determines your ranking on the leaderboard.
          </p>
          <button
            onClick={calculateAproScore}
            disabled={calculatingScore}
            className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: theme.accent, color: 'var(--on-accent)', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', borderRadius: '12px', padding: '8px 16px' }}
          >
            {calculatingScore && (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--on-accent)', borderTopColor: 'transparent' }} />
            )}
            {calculatingScore ? 'Calculating…' : 'Calculate my score'}
          </button>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-8 bg-accent text-primary py-3 rounded-xl text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}
