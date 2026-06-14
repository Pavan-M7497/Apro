import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { calculateProfileCompleteness } from '../lib/utils';
import { useImageUpload } from '../hooks/useImageUpload';
import { useTheme } from '../contexts/ThemeContext';
import { SportSelect, PositionSelect } from '../components/SportSelect';
import { CountrySelect } from '../components/CountrySelect';
import type { AthleteProfile, Stat, Achievement } from '../lib/types';
import { Camera, Save, User, Globe, Dumbbell, FileText, BarChart3, Trophy, Plus, Trash2 } from 'lucide-react';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAppStore();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [country, setCountry] = useState(profile?.country || '');
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

  const theme = useTheme();
  const { upload: uploadAvatar, uploading: avatarUploading } = useImageUpload('avatars');
  const { upload: uploadCover, uploading: coverUploading } = useImageUpload('covers');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2500);
  };
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState<Stat[]>([]);
  const [newStat, setNewStat] = useState({ season: '', appearances: '0', goals: '0', assists: '0', minutes_played: '0' });
  const [addingStat, setAddingStat] = useState(false);

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

      // Load stats
      const { data: statsData } = await supabase
        .from('stats')
        .select('*')
        .eq('athlete_profile_id', ap.id)
        .order('season', { ascending: false });
      if (statsData) setStats(statsData);
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
          country,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      if (profile.role === 'athlete') {
        const apData: any = { sport, position, availability };
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

  const handleAddStat = async () => {
    if (!athleteProfile) return;
    if (!newStat.season.trim()) { setError('Season is required'); return; }
    setAddingStat(true);
    try {
      const { data, error: statError } = await supabase
        .from('stats')
        .insert({
          athlete_profile_id: athleteProfile.id,
          season: newStat.season,
          appearances: parseInt(newStat.appearances) || 0,
          goals: parseInt(newStat.goals) || 0,
          assists: parseInt(newStat.assists) || 0,
          minutes_played: parseInt(newStat.minutes_played) || 0,
        })
        .select()
        .single();
      if (statError) throw statError;
      if (data) setStats([data, ...stats]);
      setNewStat({ season: '', appearances: '0', goals: '0', assists: '0', minutes_played: '0' });
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add stat');
    } finally {
      setAddingStat(false);
    }
  };

  const handleDeleteStat = async (id: string) => {
    const { error: delError } = await supabase.from('stats').delete().eq('id', id);
    if (delError) { setError(delError.message); return; }
    setStats(stats.filter((s) => s.id !== id));
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
    { ...profile, full_name: fullName, bio, country, avatar_url: avatarPreview, cover_url: coverPreview },
    profile.role === 'athlete' ? { sport, position, date_of_birth: athleteProfile?.date_of_birth || null } : null
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-6 md:pt-10 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

        {notice && (
          <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-accent text-primary px-5 py-2.5 text-sm font-bold animate-slide-up whitespace-nowrap" style={{ borderRadius: '4px' }}>
            {notice}
          </div>
        )}

        {/* Completeness bar */}
        <div className="bg-card rounded-xl p-4 border border-white/5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile completeness</span>
            <span className="text-sm font-bold text-accent">{completeness}%</span>
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
            className="h-32 md:h-40 bg-surface border-2 border-dashed border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-accent/20 transition-colors relative"
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
              className="w-20 h-20 rounded-full bg-surface border-2 border-dashed border-white/10 overflow-hidden cursor-pointer hover:border-accent/20 transition-colors flex-shrink-0"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-accent bg-accent/10">
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
                className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text focus:border-accent/50 transition-colors"
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
                placeholder="Tell the world about yourself..."
                className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Country</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted z-10" />
              <CountrySelect
                value={country}
                onChange={setCountry}
                className="bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Athlete-specific fields */}
          {profile.role === 'athlete' && (
            <>
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <Dumbbell className="w-4 h-4 text-accent" /> Athlete Details
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Sport</label>
                <SportSelect value={sport} onChange={(s) => { setSport(s); setPosition(''); }} />
              </div>

              {sport && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Position</label>
                  <PositionSelect sport={sport} value={position} onChange={setPosition} />
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
                            : a === 'open_to_offers' ? 'bg-accent/20 text-accent border border-accent/30'
                            : 'bg-error/20 text-error border border-error/30'
                          : 'bg-surface border border-white/10 text-text-muted hover:text-text'
                      }`}
                    >
                      {a.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats section */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-accent" /> Season Stats
                </h3>

                {stats.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 px-2 text-text-muted font-medium">Season</th>
                          <th className="text-center py-2 px-2 text-text-muted font-medium">Apps</th>
                          <th className="text-center py-2 px-2 text-text-muted font-medium">Goals</th>
                          <th className="text-center py-2 px-2 text-text-muted font-medium">Assists</th>
                          <th className="text-center py-2 px-2 text-text-muted font-medium">Mins</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((s) => (
                          <tr key={s.id} className="border-b border-white/5">
                            <td className="py-2 px-2 font-medium">{s.season}</td>
                            <td className="py-2 px-2 text-center text-text-muted">{s.appearances}</td>
                            <td className="py-2 px-2 text-center font-bold text-accent">{s.goals}</td>
                            <td className="py-2 px-2 text-center text-text-muted">{s.assists}</td>
                            <td className="py-2 px-2 text-center text-text-muted">{s.minutes_played}</td>
                            <td className="py-2 px-1">
                              <button onClick={() => handleDeleteStat(s.id)} className="text-text-muted hover:text-error transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add stat form */}
                <div className="bg-surface rounded-lg p-3 border border-white/5">
                  <p className="text-xs font-medium text-text-muted mb-2">Add season</p>
                  <div className="grid grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="Season"
                      value={newStat.season}
                      onChange={(e) => setNewStat({ ...newStat, season: e.target.value })}
                      className="bg-card border border-white/5 rounded px-2 py-1.5 text-xs text-text placeholder:text-text-muted/40 focus:border-accent/30"
                    />
                    <input
                      type="number"
                      placeholder="Apps"
                      value={newStat.appearances}
                      onChange={(e) => setNewStat({ ...newStat, appearances: e.target.value })}
                      className="bg-card border border-white/5 rounded px-2 py-1.5 text-xs text-text placeholder:text-text-muted/40 focus:border-accent/30"
                    />
                    <input
                      type="number"
                      placeholder="Goals"
                      value={newStat.goals}
                      onChange={(e) => setNewStat({ ...newStat, goals: e.target.value })}
                      className="bg-card border border-white/5 rounded px-2 py-1.5 text-xs text-text placeholder:text-text-muted/40 focus:border-accent/30"
                    />
                    <input
                      type="number"
                      placeholder="Assists"
                      value={newStat.assists}
                      onChange={(e) => setNewStat({ ...newStat, assists: e.target.value })}
                      className="bg-card border border-white/5 rounded px-2 py-1.5 text-xs text-text placeholder:text-text-muted/40 focus:border-accent/30"
                    />
                    <input
                      type="number"
                      placeholder="Mins"
                      value={newStat.minutes_played}
                      onChange={(e) => setNewStat({ ...newStat, minutes_played: e.target.value })}
                      className="bg-card border border-white/5 rounded px-2 py-1.5 text-xs text-text placeholder:text-text-muted/40 focus:border-accent/30"
                    />
                  </div>
                  <button
                    onClick={handleAddStat}
                    disabled={addingStat}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {addingStat ? 'Adding...' : 'Add stat'}
                  </button>
                </div>
              </div>

              {/* Achievements section */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-accent" /> Achievements
                </h3>

                {achievements.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {achievements.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 bg-surface rounded-lg p-3 border border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-4 h-4 text-accent" />
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
                <div className="bg-surface rounded-lg p-3 border border-white/5">
                  <p className="text-xs font-medium text-text-muted mb-2">Add achievement</p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Title (e.g. League Champion)"
                      value={newAchievement.title}
                      onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                      className="w-full bg-card border border-white/5 rounded px-3 py-1.5 text-xs text-text placeholder:text-text-muted/40 focus:border-accent/30"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newAchievement.description}
                      onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                      className="w-full bg-card border border-white/5 rounded px-3 py-1.5 text-xs text-text placeholder:text-text-muted/40 focus:border-accent/30"
                    />
                    <input
                      type="date"
                      value={newAchievement.date}
                      onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })}
                      className="bg-card border border-white/5 rounded px-3 py-1.5 text-xs text-text focus:border-accent/30"
                    />
                    <div>
                      <label className="text-[10px] text-text-muted block mb-1">Proof (optional — image)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        className="text-xs text-text-muted file:mr-2 file:py-1 file:px-2 file:text-xs file:bg-accent/10 file:text-accent file:border-0 file:rounded"
                      />
                      {proofFile && <p className="text-[10px] text-accent mt-1">{proofFile.name}</p>}
                    </div>
                  </div>
                  <button
                    onClick={handleAddAchievement}
                    disabled={addingAchievement}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {addingAchievement ? 'Adding...' : 'Add achievement'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Apro Score */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', color: theme.accent }}>Apro Score</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: theme.textMuted, marginTop: '4px', marginBottom: '12px' }}>
            Your score determines your ranking on the leaderboard.
          </p>
          <button
            onClick={calculateAproScore}
            disabled={calculatingScore}
            className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: theme.accent, color: '#050508', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', borderRadius: '4px', padding: '8px 16px' }}
          >
            {calculatingScore && (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ borderColor: '#050508', borderTopColor: 'transparent' }} />
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
