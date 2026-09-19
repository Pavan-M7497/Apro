import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { StateSelect } from '../components/StateSelect';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AddToCalendarButton from '../components/AddToCalendarButton';
import { MEET_LEVELS, meetLevelStyle, formatSwimTime } from '../lib/types';
import { formatDate } from '../lib/utils';
import { CalendarDays, ChevronDown } from 'lucide-react';

interface Meet {
  id: string;
  name: string;
  level: string;
  state_code: string | null;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
  course: string | null;
  source_note: string | null;
}

interface ResultRow {
  id: string;
  event: string;
  course: string | null;
  result_seconds: number | null;
  profile: { username: string; full_name: string } | null;
}

const field =
  'w-full bg-card border border-line px-4 py-2.5 text-sm text-text focus:border-accent-ink transition-colors appearance-none rounded-xl';
const labelCls = 'block text-xs font-medium text-text-muted mb-1.5';

export default function Meets() {
  const [meets, setMeets] = useState<Meet[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [from, setFrom] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ResultRow[]>>({});
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('meets')
        .select('*')
        .order('start_date', { ascending: false });
      setMeets((data as Meet[]) || []);
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(
    () =>
      meets.filter((m) => {
        if (level && m.level !== level) return false;
        if (stateCode && m.state_code !== stateCode) return false;
        if (from && (!m.start_date || m.start_date < from)) return false;
        return true;
      }),
    [meets, level, stateCode, from],
  );

  const toggle = async (m: Meet) => {
    if (expanded === m.id) { setExpanded(null); return; }
    setExpanded(m.id);
    if (results[m.id]) return;

    setLoadingResults(true);
    const { data } = await supabase
      .from('performance_records')
      .select('id, event, course, result_seconds, profile:profiles(username, full_name)')
      .eq('meet_name', m.name)
      .order('result_seconds', { ascending: true })
      .limit(50);
    setResults((prev) => ({ ...prev, [m.id]: (data as any as ResultRow[]) || [] }));
    setLoadingResults(false);
  };

  return (
    <div className="min-h-screen pt-8 md:pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-5">
        <h1 className="font-display" style={{ fontWeight: 800, fontSize: '34px', letterSpacing: '-0.01em', marginBottom: '8px' }}>
          Meets
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Results imported from official meet files.
        </p>

        {/* Filters */}
        <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '16px' }}>
            <div>
              <label className={labelCls}>Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={field}>
                <option value="">All levels</option>
                {MEET_LEVELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>State</label>
              <StateSelect value={stateCode} onChange={setStateCode} placeholder="All states"
                className="bg-white border border-line px-4 py-2.5 text-sm rounded-pill" />
            </div>
            <div>
              <label className={labelCls}>From date</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No meets yet"
            description="Imported meets will appear here as results are added."
          />
        ) : (
          <div className="space-y-3">
            {visible.map((m) => {
              const lvl = MEET_LEVELS.find((l) => l.id === m.level);
              const open = expanded === m.id;
              const rows = results[m.id] || [];
              return (
                <div key={m.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div className="flex items-center gap-3" style={{ padding: '20px 24px' }}>
                    <button onClick={() => toggle(m)} className="flex-1 min-w-0 text-left" aria-expanded={open}>
                      <div className="flex items-center flex-wrap" style={{ gap: '10px' }}>
                        <h3 className="font-display" style={{ fontWeight: 800, fontSize: '18px' }}>{m.name}</h3>
                        {lvl && (
                          <span className="rounded-pill" style={{ ...meetLevelStyle(m.level), fontSize: '11px', fontWeight: 600, padding: '3px 10px' }}>
                            {lvl.name}
                          </span>
                        )}
                        {m.course && m.course !== 'NA' && (
                          <span className="rounded-pill" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '11px', padding: '3px 10px' }}>
                            {m.course}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {[m.city, m.state_code].filter(Boolean).join(', ') || 'Venue not recorded'}
                        {m.start_date ? ` · ${formatDate(m.start_date)}` : ''}
                      </p>
                    </button>
                    <AddToCalendarButton
                      event={{
                        id: m.id,
                        title: m.name,
                        startDate: m.start_date || '',
                        endDate: m.end_date,
                        city: m.city,
                        region: m.state_code,
                        // Imported meets carry no registration link, so the
                        // listing on Aevon is the useful thing to point at.
                        url: `${window.location.origin}/meets`,
                        notes: m.source_note,
                      }}
                    />
                    <button
                      onClick={() => toggle(m)}
                      className="flex-shrink-0"
                      aria-label={open ? `Hide results for ${m.name}` : `Show results for ${m.name}`}
                    >
                      <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
                    </button>
                  </div>

                  {open && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 24px 24px' }}>
                      {loadingResults && rows.length === 0 ? (
                        <LoadingSpinner size="sm" />
                      ) : rows.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No individual results recorded for this meet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {rows.map((r) => (
                            <div key={r.id} className="flex items-center gap-3" style={{ fontSize: '13px' }}>
                              <span style={{ color: 'var(--text-muted)', minWidth: '150px' }}>{r.event}</span>
                              <a href={`/profile/${r.profile?.username}`} style={{ fontWeight: 600, color: 'var(--text)' }}>
                                {r.profile?.full_name || 'Unknown'}
                              </a>
                              <span className="ml-auto font-display" style={{ fontWeight: 800 }}>
                                {r.result_seconds != null ? formatSwimTime(Number(r.result_seconds)) : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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
