import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { getRoleAccent, formatPace, formatDate } from '../lib/utils';
import type { TrainingSession } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Dumbbell, Gauge, Route, TrendingUp } from 'lucide-react';

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

interface WeekBucket { label: string; minutes: number; }
interface PB { exercise: string; weight: number; date: string; lastActivity: string; }

export default function TrainingProgress() {
  const { profile } = useAppStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('training_sessions')
        .select('*, run_data(*), strength_sets(*)')
        .eq('profile_id', profile.id)
        .order('session_date', { ascending: false });
      setSessions((data as TrainingSession[]) || []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="min-h-screen bg-primary pt-20"><LoadingSpinner /></div>;

  const roleAccent = getRoleAccent(profile?.role);

  // ── Weekly volume (last 12 weeks) ──
  const thisWeekStart = startOfWeek(new Date());
  const weeks: WeekBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const ws = new Date(thisWeekStart);
    ws.setDate(thisWeekStart.getDate() - i * 7);
    weeks.push({ label: ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), minutes: 0 });
  }
  sessions.forEach((s) => {
    const ws = startOfWeek(new Date(s.session_date));
    const diffWeeks = Math.round((thisWeekStart.getTime() - ws.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const idx = 11 - diffWeeks;
    if (idx >= 0 && idx < 12) weeks[idx].minutes += s.duration_minutes;
  });
  const maxMinutes = Math.max(1, ...weeks.map((w) => w.minutes));

  // ── Personal bests (gym) ──
  const pbMap = new Map<string, PB>();
  sessions.forEach((s) => {
    (s.strength_sets || []).forEach((set) => {
      if (set.weight_kg == null) return;
      const key = set.exercise_name.trim().toLowerCase();
      const existing = pbMap.get(key);
      const weight = Number(set.weight_kg);
      if (!existing) {
        pbMap.set(key, { exercise: set.exercise_name.trim(), weight, date: s.session_date, lastActivity: s.session_date });
      } else {
        if (weight > existing.weight) { existing.weight = weight; existing.date = s.session_date; }
        if (s.session_date > existing.lastActivity) existing.lastActivity = s.session_date;
      }
    });
  });
  const pbs = Array.from(pbMap.values()).sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));

  // ── Running milestones ──
  let fastestPace: number | null = null;
  let longestRun = 0;
  let totalKm = 0;
  sessions.forEach((s) => {
    if (s.activity_type !== 'running') return;
    const rd = s.run_data;
    if (!rd) return;
    if (rd.pace_seconds_per_km != null && rd.pace_seconds_per_km > 0) {
      fastestPace = fastestPace == null ? rd.pace_seconds_per_km : Math.min(fastestPace, rd.pace_seconds_per_km);
    }
    if (rd.distance_km != null) {
      longestRun = Math.max(longestRun, Number(rd.distance_km));
      totalKm += Number(rd.distance_km);
    }
  });

  return (
    <div className="min-h-screen bg-primary pt-20 md:pt-20 pb-28">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={() => navigate('/training')} className="flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to log
        </button>
        <h1 className="font-display font-black uppercase text-3xl tracking-wide mb-8">Progress</h1>

        {/* ── Weekly volume chart ── */}
        <section className="mb-10">
          <h2 className="font-display font-black uppercase mb-4" style={{ fontSize: '18px', letterSpacing: '0.02em' }}>Weekly volume</h2>
          <div className="flex items-end justify-between gap-1.5" style={{ height: '180px' }}>
            {weeks.map((w, i) => {
              const hours = Math.round((w.minutes / 60) * 10) / 10;
              const heightPct = (w.minutes / maxMinutes) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${w.minutes} min`}>
                  <span className="text-[9px] text-text-muted mb-1" style={{ opacity: w.minutes > 0 ? 1 : 0.4 }}>{hours || ''}</span>
                  <div
                    className="w-full transition-all"
                    style={{
                      height: `${Math.max(heightPct, w.minutes > 0 ? 4 : 0)}%`,
                      minHeight: w.minutes > 0 ? '4px' : '0',
                      background: w.minutes > 0 ? roleAccent : 'rgba(255,255,255,0.06)',
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                  <span className="text-[8px] text-text-muted mt-1.5 whitespace-nowrap" style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }}>{w.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Running milestones ── */}
        <section className="mb-10">
          <h2 className="font-display font-black uppercase mb-4" style={{ fontSize: '18px', letterSpacing: '0.02em' }}>Running milestones</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Gauge, label: 'Fastest pace', value: formatPace(fastestPace) },
              { icon: TrendingUp, label: 'Longest run', value: longestRun > 0 ? `${Math.round(longestRun * 10) / 10} km` : '—' },
              { icon: Route, label: 'Total distance', value: totalKm > 0 ? `${Math.round(totalKm * 10) / 10} km` : '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ background: '#1A1A2E', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '16px' }}>
                <Icon className="w-4 h-4 text-accent mb-2" />
                <div className="font-display font-black text-accent" style={{ fontSize: '24px', lineHeight: 1 }}>{value}</div>
                <div className="text-text-muted uppercase" style={{ fontSize: '10px', letterSpacing: '0.06em', marginTop: '6px' }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Personal bests ── */}
        <section>
          <h2 className="font-display font-black uppercase mb-4" style={{ fontSize: '18px', letterSpacing: '0.02em' }}>Personal bests</h2>
          {pbs.length === 0 ? (
            <p className="text-sm text-text-muted">Log gym sessions with weights to see your personal bests here.</p>
          ) : (
            <div className="space-y-2">
              {pbs.map((pb) => (
                <div key={pb.exercise} className="flex items-center gap-3 p-3" style={{ background: '#1A1A2E', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: '36px', height: '36px', borderRadius: '4px', background: 'rgba(239,159,39,0.15)' }}>
                    <Dumbbell className="w-4 h-4" style={{ color: '#EF9F27' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold uppercase text-sm truncate">{pb.exercise}</p>
                    <p className="text-[10px] text-text-muted">{formatDate(pb.date)}</p>
                  </div>
                  <span className="font-display font-black text-accent text-xl flex-shrink-0">{pb.weight} kg</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
