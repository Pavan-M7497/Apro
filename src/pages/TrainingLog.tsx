import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { getActivityColor } from '../lib/utils';
import { ACTIVITY_TYPES, STROKE_TYPES, type ActivityType } from '../lib/types';
import { ArrowLeft, Plus, Trash2, Trophy } from 'lucide-react';

const TEAM_SESSION_TYPES = ['Match', 'Training session', 'Drill session', 'Conditioning', 'Recovery'];

interface SetRow { reps: string; weight: string; }
interface ExerciseBlock { name: string; sets: SetRow[]; }

function rpeLabel(rpe: number): { label: string; color: string } {
  if (rpe <= 3) return { label: 'Light', color: '#34D399' };
  if (rpe <= 6) return { label: 'Moderate', color: '#EF9F27' };
  if (rpe <= 8) return { label: 'Hard', color: '#F87171' };
  return { label: 'Max effort', color: '#F87171' };
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function TrainingLog() {
  const { profile } = useAppStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [activityType, setActivityType] = useState<ActivityType | ''>('');

  // base fields
  const [date, setDate] = useState(todayStr());
  const [duration, setDuration] = useState('');
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // run / cycle
  const [distanceKm, setDistanceKm] = useState('');
  const [elevationM, setElevationM] = useState('');

  // swim
  const [poolLength, setPoolLength] = useState(25);
  const [laps, setLaps] = useState('');
  const [strokeType, setStrokeType] = useState(STROKE_TYPES[0]);

  // gym
  const [exercises, setExercises] = useState<ExerciseBlock[]>([{ name: '', sets: [{ reps: '', weight: '' }] }]);
  const [prevMax, setPrevMax] = useState<Record<string, number>>({});

  // team sport
  const [teamSessionType, setTeamSessionType] = useState(TEAM_SESSION_TYPES[0]);
  const [sportName, setSportName] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill sport from athlete profile + load previous strength records
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: ap } = await supabase
        .from('athlete_profiles')
        .select('sport')
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (ap?.sport) setSportName(ap.sport);
    })();
  }, [profile]);

  useEffect(() => {
    if (!profile || activityType !== 'gym') return;
    (async () => {
      const { data: sess } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('profile_id', profile.id);
      const ids = (sess || []).map((s: { id: string }) => s.id);
      if (ids.length === 0) return;
      const { data: sets } = await supabase
        .from('strength_sets')
        .select('exercise_name, weight_kg')
        .in('session_id', ids);
      const map: Record<string, number> = {};
      (sets || []).forEach((row: { exercise_name: string; weight_kg: number | null }) => {
        if (row.weight_kg == null) return;
        const key = row.exercise_name.trim().toLowerCase();
        map[key] = Math.max(map[key] || 0, Number(row.weight_kg));
      });
      setPrevMax(map);
    })();
  }, [profile, activityType]);

  const isCardio = activityType === 'running' || activityType === 'cycling';

  // ── Gym helpers ──
  const addSet = (exIdx: number) => {
    setExercises((prev) => prev.map((ex, i) => i === exIdx ? { ...ex, sets: [...ex.sets, { reps: '', weight: '' }] } : ex));
  };
  const addExercise = () => setExercises((prev) => [...prev, { name: '', sets: [{ reps: '', weight: '' }] }]);
  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const sets = ex.sets.filter((_, si) => si !== setIdx);
      return { ...ex, sets: sets.length ? sets : [{ reps: '', weight: '' }] };
    }));
  };
  const updateExerciseName = (exIdx: number, name: string) =>
    setExercises((prev) => prev.map((ex, i) => i === exIdx ? { ...ex, name } : ex));
  const updateSet = (exIdx: number, setIdx: number, field: keyof SetRow, value: string) =>
    setExercises((prev) => prev.map((ex, i) => i === exIdx ? {
      ...ex,
      sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s),
    } : ex));

  const isPB = (exName: string, weight: string): boolean => {
    const w = parseFloat(weight);
    if (!exName.trim() || !w) return false;
    const prev = prevMax[exName.trim().toLowerCase()];
    return prev == null ? false : w > prev;
  };

  const totalSwimDistance = (() => {
    const l = parseInt(laps);
    return l > 0 ? l * poolLength : 0;
  })();

  // ── Validation ──
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const dur = parseInt(duration);
    if (!duration || isNaN(dur) || dur <= 0) e.duration = 'Duration must be greater than 0';
    if (dur > 600) e.duration = 'Duration must be 600 minutes or less';
    if (!date) e.date = 'Date is required';
    else if (date > todayStr()) e.date = 'Date cannot be in the future';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!profile || !activityType) return;
    if (!validate()) return;
    setSaving(true);

    let finalNotes = notes.trim() || null;
    if (activityType === 'team_sport') {
      const prefix = `${teamSessionType}${sportName.trim() ? ` · ${sportName.trim()}` : ''}`;
      finalNotes = finalNotes ? `${prefix}\n${finalNotes}` : prefix;
    }

    const { data: session, error } = await supabase
      .from('training_sessions')
      .insert({
        profile_id: profile.id,
        activity_type: activityType,
        session_date: date,
        duration_minutes: parseInt(duration),
        intensity_rpe: rpe,
        notes: finalNotes,
        is_public: isPublic,
      })
      .select()
      .single();

    if (error || !session) {
      setSaving(false);
      setErrors({ submit: 'Could not save session. Please try again.' });
      return;
    }

    if (isCardio) {
      await supabase.from('run_data').insert({
        session_id: session.id,
        distance_km: distanceKm ? parseFloat(distanceKm) : null,
        elevation_m: elevationM ? parseInt(elevationM) : null,
      });
    } else if (activityType === 'swimming') {
      await supabase.from('swim_data').insert({
        session_id: session.id,
        pool_length_m: poolLength,
        laps: laps ? parseInt(laps) : null,
        total_distance_m: totalSwimDistance || null,
        stroke_type: strokeType,
      });
    } else if (activityType === 'gym') {
      const rows: { session_id: string; exercise_name: string; set_number: number; reps: number | null; weight_kg: number | null }[] = [];
      exercises.forEach((ex) => {
        if (!ex.name.trim()) return;
        ex.sets.forEach((s, idx) => {
          rows.push({
            session_id: session.id,
            exercise_name: ex.name.trim(),
            set_number: idx + 1,
            reps: s.reps ? parseInt(s.reps) : null,
            weight_kg: s.weight ? parseFloat(s.weight) : null,
          });
        });
      });
      if (rows.length) await supabase.from('strength_sets').insert(rows);
    }

    navigate('/training', { state: { toast: 'Session logged!' } });
  };

  const inputClass = 'w-full bg-surface border border-white/10 px-4 py-2.5 text-sm text-text focus:border-accent/50 transition-colors';
  const labelClass = 'block font-display font-bold uppercase text-xs text-text-muted mb-1.5';

  const current = rpeLabel(rpe);

  return (
    <div className="min-h-screen bg-primary pt-20 md:pt-20 pb-28">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => (step === 2 ? setStep(1) : navigate('/training'))}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 2 ? 'Activity type' : 'Back to log'}
        </button>

        <h1 className="font-display font-black uppercase text-3xl tracking-wide mb-6">Log a session</h1>

        {/* ── Step 1: Activity type ── */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {ACTIVITY_TYPES.map((a) => {
                const selected = activityType === a.value;
                const color = getActivityColor(a.value);
                return (
                  <button
                    key={a.value}
                    onClick={() => setActivityType(a.value)}
                    className="text-left p-4 transition-colors"
                    style={{
                      borderRadius: '4px',
                      border: selected ? '1.5px solid #E8FF47' : '0.5px solid rgba(255,255,255,0.1)',
                      background: selected ? 'rgba(232,255,71,0.06)' : '#1A1A2E',
                    }}
                  >
                    <i className={`ti ${a.icon}`} style={{ fontSize: '28px', color }} aria-hidden="true" />
                    <div className="font-display font-bold uppercase text-sm mt-2">{a.label}</div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => activityType && setStep(2)}
              disabled={!activityType}
              className="w-full font-display font-black uppercase py-3 transition-opacity"
              style={{
                borderRadius: '4px',
                background: activityType ? '#E8FF47' : 'rgba(255,255,255,0.06)',
                color: activityType ? '#0A0A0F' : '#8888A0',
                cursor: activityType ? 'pointer' : 'not-allowed',
                letterSpacing: '0.04em',
              }}
            >
              Next
            </button>
          </>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && activityType && (
          <div className="space-y-5">
            {/* Date + duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} style={{ borderRadius: '4px' }} />
                {errors.date && <p className="text-error text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className={labelClass}>Duration (min)</label>
                <input type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 45" className={inputClass} style={{ borderRadius: '4px' }} />
                {errors.duration && <p className="text-error text-xs mt-1">{errors.duration}</p>}
              </div>
            </div>

            {/* RPE slider */}
            <div>
              <label className={labelClass}>Intensity (RPE)</label>
              <input type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(parseInt(e.target.value))} className="w-full accent-accent" />
              <div className="flex items-center justify-between mt-1">
                <span className="text-text-muted text-xs">{rpe}/10</span>
                <span className="font-display font-bold uppercase text-xs" style={{ color: current.color }}>{current.label}</span>
              </div>
            </div>

            {/* ── Activity-specific fields ── */}
            {isCardio && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Distance (km)</label>
                  <input type="number" step="0.01" min={0} value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="e.g. 10.5" className={inputClass} style={{ borderRadius: '4px' }} />
                </div>
                <div>
                  <label className={labelClass}>Elevation gain (m)</label>
                  <input type="number" min={0} value={elevationM} onChange={(e) => setElevationM(e.target.value)} placeholder="optional" className={inputClass} style={{ borderRadius: '4px' }} />
                </div>
              </div>
            )}

            {activityType === 'swimming' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Pool length</label>
                    <select value={poolLength} onChange={(e) => setPoolLength(parseInt(e.target.value))} className={`${inputClass} appearance-none`} style={{ borderRadius: '4px' }}>
                      <option value={25}>25 m</option>
                      <option value={50}>50 m</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Laps</label>
                    <input type="number" min={0} value={laps} onChange={(e) => setLaps(e.target.value)} placeholder="e.g. 20" className={inputClass} style={{ borderRadius: '4px' }} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Stroke</label>
                  <select value={strokeType} onChange={(e) => setStrokeType(e.target.value)} className={`${inputClass} appearance-none`} style={{ borderRadius: '4px' }}>
                    {STROKE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {totalSwimDistance > 0 && (
                  <p className="text-sm text-text-muted">
                    Total distance: <span className="font-display font-bold text-accent">{totalSwimDistance} m</span>
                  </p>
                )}
              </div>
            )}

            {activityType === 'gym' && (
              <div className="space-y-4">
                {exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="p-3" style={{ background: '#1A1A2E', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                      placeholder="Exercise name (e.g. Bench press)"
                      className={`${inputClass} mb-3`}
                      style={{ borderRadius: '4px' }}
                    />
                    <div className="space-y-2">
                      {ex.sets.map((s, setIdx) => (
                        <div key={setIdx} className="flex items-center gap-2">
                          <span className="text-text-muted text-xs font-display font-bold w-10 flex-shrink-0">SET {setIdx + 1}</span>
                          <input type="number" min={0} value={s.reps} onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)} placeholder="reps" className={`${inputClass} flex-1`} style={{ borderRadius: '4px' }} />
                          <input type="number" step="0.5" min={0} value={s.weight} onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)} placeholder="kg" className={`${inputClass} flex-1`} style={{ borderRadius: '4px' }} />
                          {isPB(ex.name, s.weight) && (
                            <span className="flex items-center gap-1 text-accent flex-shrink-0" title="Personal best">
                              <Trophy className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-display font-bold uppercase hidden sm:inline">PB</span>
                            </span>
                          )}
                          <button onClick={() => removeSet(exIdx, setIdx)} className="text-text-muted hover:text-error p-1.5 flex-shrink-0" aria-label="Remove set">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addSet(exIdx)} className="flex items-center gap-1.5 text-accent text-xs font-display font-bold uppercase mt-3 hover:opacity-80">
                      <Plus className="w-3.5 h-3.5" /> Add set
                    </button>
                  </div>
                ))}
                <button
                  onClick={addExercise}
                  className="w-full flex items-center justify-center gap-2 py-3 font-display font-bold uppercase text-sm hover:bg-white/5 transition-colors"
                  style={{ border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '4px' }}
                >
                  <Plus className="w-4 h-4" /> Add exercise
                </button>
              </div>
            )}

            {activityType === 'team_sport' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Session type</label>
                  <select value={teamSessionType} onChange={(e) => setTeamSessionType(e.target.value)} className={`${inputClass} appearance-none`} style={{ borderRadius: '4px' }}>
                    {TEAM_SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sport</label>
                  <input type="text" value={sportName} onChange={(e) => setSportName(e.target.value)} placeholder="e.g. Football" className={inputClass} style={{ borderRadius: '4px' }} />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className={labelClass}>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it go?" rows={3} className={inputClass} style={{ borderRadius: '4px', resize: 'vertical' }} />
            </div>

            {/* Public toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-display font-bold uppercase text-xs text-text-muted">Show on your profile</span>
              <button
                type="button"
                onClick={() => setIsPublic((p) => !p)}
                className="relative transition-colors"
                style={{ width: '44px', height: '24px', borderRadius: '12px', background: isPublic ? '#E8FF47' : 'rgba(255,255,255,0.15)' }}
                aria-pressed={isPublic}
              >
                <span
                  className="absolute top-0.5 transition-all"
                  style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0A0A0F', left: isPublic ? '22px' : '2px' }}
                />
              </button>
            </label>

            {errors.submit && <p className="text-error text-sm">{errors.submit}</p>}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full font-display font-black uppercase py-3 hover:opacity-90 transition-opacity"
              style={{ borderRadius: '4px', background: '#E8FF47', color: '#0A0A0F', letterSpacing: '0.04em', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving…' : 'Save session'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
