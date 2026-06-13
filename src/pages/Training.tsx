import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { getActivityColor } from '../lib/utils';
import { ACTIVITY_TYPES, type TrainingSession } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Plus, Trash2, Activity, LineChart } from 'lucide-react';

const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function activityMeta(type: string) {
  return ACTIVITY_TYPES.find((a) => a.value === type) || ACTIVITY_TYPES[5];
}

function keyMetric(s: TrainingSession): string | null {
  if (s.activity_type === 'running' || s.activity_type === 'cycling') {
    return s.run_data?.distance_km != null ? `${s.run_data.distance_km} km` : null;
  }
  if (s.activity_type === 'swimming') {
    return s.swim_data?.laps != null ? `${s.swim_data.laps} laps` : null;
  }
  if (s.activity_type === 'gym') {
    const count = s.strength_sets?.length || 0;
    return count > 0 ? `${count} set${count === 1 ? '' : 's'}` : null;
  }
  return null;
}

function rpeColor(rpe: number): string {
  if (rpe <= 3) return '#34D399';
  if (rpe <= 6) return '#EF9F27';
  return '#F87171';
}

export default function Training() {
  const { profile } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!profile) return;
    loadSessions();
  }, [profile]);

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      setToast(state.toast);
      window.history.replaceState({}, '');
      const t = setTimeout(() => setToast(''), 2500);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  const loadSessions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('training_sessions')
      .select('*, run_data(*), swim_data(*), strength_sets(*)')
      .eq('profile_id', profile!.id)
      .order('session_date', { ascending: false })
      .order('created_at', { ascending: false });
    setSessions((data as TrainingSession[]) || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    await supabase.from('training_sessions').delete().eq('id', id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  // ── Monthly totals ──
  const now = new Date();
  const monthSessions = sessions.filter((s) => {
    const d = new Date(s.session_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthHours = Math.round((monthSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60) * 10) / 10;

  // ── Weekly strip ──
  const weekStart = startOfWeek(now);
  const todayKey = toDateKey(now);
  const sessionDateKeys = new Set(sessions.map((s) => s.session_date));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { abbr: DAY_ABBR[i], dateNum: d.getDate(), key: toDateKey(d) };
  });

  // ── Group by date ──
  const groups: { date: string; items: TrainingSession[] }[] = [];
  for (const s of sessions) {
    const last = groups[groups.length - 1];
    if (last && last.date === s.session_date) last.items.push(s);
    else groups.push({ date: s.session_date, items: [s] });
  }

  const scrollToDate = (key: string) => {
    const el = document.getElementById(`date-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-primary pt-20 md:pt-20 pb-28">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="font-display font-black uppercase text-3xl tracking-wide">Training Log</h1>
            <p className="text-text-muted text-sm mt-1">
              {monthSessions.length} session{monthSessions.length === 1 ? '' : 's'} · {monthHours}h this month
            </p>
          </div>
          <button
            onClick={() => navigate('/training/progress')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '4px' }}
          >
            <LineChart className="w-4 h-4" /> Progress
          </button>
        </div>

        {/* Weekly summary strip */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {weekDays.map((d) => {
            const hasSession = sessionDateKeys.has(d.key);
            const isToday = d.key === todayKey;
            return (
              <button
                key={d.key}
                onClick={() => hasSession && scrollToDate(d.key)}
                className="flex flex-col items-center gap-1 py-2 transition-colors"
                style={{
                  background: isToday ? 'rgba(232,255,71,0.08)' : '#1A1A2E',
                  border: isToday ? '0.5px solid rgba(232,255,71,0.4)' : '0.5px solid rgba(255,255,255,0.06)',
                  borderRadius: '4px',
                  cursor: hasSession ? 'pointer' : 'default',
                }}
              >
                <span className="font-display font-bold uppercase" style={{ fontSize: '10px', color: isToday ? '#E8FF47' : '#8888A0' }}>{d.abbr}</span>
                <span className="font-display font-black" style={{ fontSize: '16px', color: isToday ? '#E8FF47' : '#F5F5F0' }}>{d.dateNum}</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: hasSession ? '#E8FF47' : 'transparent' }} />
              </button>
            );
          })}
        </div>

        {/* Session list */}
        {loading ? (
          <LoadingSpinner />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No sessions yet"
            description="Log your first training session to start tracking your progress."
            action={{ label: 'Log a session', onClick: () => navigate('/training/log') }}
          />
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.date} id={`date-${group.date}`} style={{ scrollMarginTop: '90px' }}>
                <h2 className="font-display font-bold uppercase text-sm text-text-muted mb-2">
                  {new Date(group.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h2>
                <div className="space-y-2">
                  {group.items.map((s) => {
                    const meta = activityMeta(s.activity_type);
                    const color = getActivityColor(s.activity_type);
                    const metric = keyMetric(s);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 p-3"
                        style={{ background: '#1A1A2E', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}
                      >
                        {/* Icon square */}
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{ width: '40px', height: '40px', borderRadius: '4px', background: `${color}22` }}
                        >
                          <i className={`ti ${meta.icon}`} style={{ fontSize: '22px', color }} aria-hidden="true" />
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-bold uppercase text-sm">{meta.label}</span>
                            {s.intensity_rpe != null && (
                              <span
                                className="font-display font-bold uppercase"
                                style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: `${rpeColor(s.intensity_rpe)}22`, color: rpeColor(s.intensity_rpe) }}
                              >
                                RPE {s.intensity_rpe}/10
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">
                            {s.duration_minutes} min{metric ? ` · ${metric}` : ''}
                          </p>
                          {s.notes && (
                            <p className="text-xs text-text-muted/70 mt-1 truncate">{s.notes.slice(0, 80)}</p>
                          )}
                        </div>

                        {/* Delete (own sessions) */}
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-text-muted hover:text-error transition-colors p-2 flex-shrink-0"
                          aria-label="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating log button */}
      <button
        onClick={() => navigate('/training/log')}
        className="fixed z-40 flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
        style={{
          bottom: '88px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '4px',
          background: '#E8FF47',
          color: '#0A0A0F',
        }}
        aria-label="Log a session"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-accent text-primary px-5 py-2.5 text-sm font-bold animate-slide-up whitespace-nowrap"
          style={{ borderRadius: '4px' }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
