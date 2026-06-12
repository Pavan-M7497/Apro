import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { getCountryFlag } from '../lib/utils';
import { COUNTRIES } from '../lib/types';
import { CalendarDays, Plus, X, ExternalLink, Users } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { SportSelect } from '../components/SportSelect';

interface Competition {
  id: string;
  title: string;
  sport: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  level: 'local' | 'regional' | 'national' | 'continental' | 'world';
  description: string | null;
  registration_url: string | null;
  stream_url: string | null;
  submitted_by: string | null;
  is_verified: boolean;
  participant_count?: number;
}

const LEVEL_COLORS: Record<string, string> = {
  local: 'text-text-muted bg-white/5',
  regional: 'text-info bg-info/10',
  national: 'text-warning bg-warning/10',
  continental: 'text-purple-400 bg-purple-400/10',
  world: 'text-accent bg-accent/10',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const { user, profile } = useAppStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [participatingIds, setParticipatingIds] = useState<string[]>([]);
  const [filterSport, setFilterSport] = useState('');
  const [filterCountry, setFilterCountry] = useState(profile?.country || '');
  const [filterLevel, setFilterLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Form state
  const [form, setForm] = useState({
    title: '', sport: '', country: '', city: '', start_date: '', end_date: '',
    level: 'national' as Competition['level'], description: '', registration_url: '', stream_url: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCompetitions();
  }, [filterSport, filterCountry, filterLevel]);

  useEffect(() => {
    if (user && profile) loadParticipating();
  }, [user, profile]);

  const loadCompetitions = async () => {
    setLoading(true);
    let query = supabase
      .from('competitions')
      .select('*')
      .order('start_date', { ascending: true });

    if (filterSport) query = query.eq('sport', filterSport);
    if (filterCountry) query = query.eq('country', filterCountry);
    if (filterLevel) query = query.eq('level', filterLevel as Competition['level']);

    const { data } = await query;
    const comps = (data || []) as Competition[];

    // Load participant counts
    const ids = comps.map((c) => c.id);
    if (ids.length > 0) {
      const { data: countData } = await supabase
        .from('competition_participants')
        .select('competition_id')
        .in('competition_id', ids);

      const counts: Record<string, number> = {};
      (countData || []).forEach((row: { competition_id: string }) => {
        counts[row.competition_id] = (counts[row.competition_id] || 0) + 1;
      });
      comps.forEach((c) => { c.participant_count = counts[c.id] || 0; });
    }

    setCompetitions(comps);
    setLoading(false);
  };

  const loadParticipating = async () => {
    const { data } = await supabase
      .from('competition_participants')
      .select('competition_id')
      .eq('profile_id', profile!.id);
    setParticipatingIds((data || []).map((r: { competition_id: string }) => r.competition_id));
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const datesWithComps = new Set(
    competitions.flatMap((c) => {
      const dates: string[] = [];
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
      return dates;
    })
  );

  const visibleComps = selectedDate
    ? competitions.filter((c) => {
        const s = new Date(c.start_date);
        const e = new Date(c.end_date);
        const d = new Date(selectedDate);
        return d >= s && d <= e;
      })
    : competitions.filter((c) => {
        const start = new Date(c.start_date);
        return start.getFullYear() === year && start.getMonth() === month;
      });

  const handleParticipate = async (compId: string) => {
    if (!profile) return;
    const isIn = participatingIds.includes(compId);
    if (isIn) {
      await supabase.from('competition_participants').delete()
        .eq('competition_id', compId).eq('profile_id', profile.id);
      setParticipatingIds(participatingIds.filter((id) => id !== compId));
    } else {
      await supabase.from('competition_participants').insert({
        competition_id: compId,
        profile_id: profile.id,
      });
      setParticipatingIds([...participatingIds, compId]);
    }
    loadCompetitions();
  };

  const handleSubmitForm = async () => {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.sport) { setFormError('Sport is required'); return; }
    if (!form.country) { setFormError('Country is required'); return; }
    if (!form.city.trim()) { setFormError('City is required'); return; }
    if (!form.start_date) { setFormError('Start date is required'); return; }
    if (!form.end_date) { setFormError('End date is required'); return; }
    if (form.end_date < form.start_date) { setFormError('End date must be after start date'); return; }

    setSubmitting(true);
    setFormError('');
    try {
      await supabase.from('competitions').insert({
        ...form,
        submitted_by: profile?.id || null,
        is_verified: false,
        description: form.description || null,
        registration_url: form.registration_url || null,
        stream_url: form.stream_url || null,
      });
      setShowForm(false);
      setForm({ title: '', sport: '', country: '', city: '', start_date: '', end_date: '', level: 'national', description: '', registration_url: '', stream_url: '' });
      loadCompetitions();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  return (
    <div className="min-h-screen bg-primary pt-20 md:pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="font-display font-black uppercase text-3xl tracking-wide mb-2">Competition calendar</h1>
        <p className="text-text-muted text-sm mb-6">Find and track upcoming competitions</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <SportSelect value={filterSport} onChange={setFilterSport} className="w-40" />
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="bg-card border border-white/10 px-3 py-2 text-sm text-text appearance-none"
            style={{ borderRadius: '4px' }}
          >
            <option value="">All countries</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-card border border-white/10 px-3 py-2 text-sm text-text appearance-none"
            style={{ borderRadius: '4px' }}
          >
            <option value="">All levels</option>
            {['local','regional','national','continental','world'].map((l) => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1); }}
            className="px-3 py-1.5 bg-card border border-white/10 text-sm hover:bg-white/5 transition-colors"
            style={{ borderRadius: '4px' }}
          >
            ‹
          </button>
          <h2 className="font-display font-black uppercase text-xl tracking-wide">{MONTHS[month]} {year}</h2>
          <button
            onClick={() => { if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1); }}
            className="px-3 py-1.5 bg-card border border-white/10 text-sm hover:bg-white/5 transition-colors"
            style={{ borderRadius: '4px' }}
          >
            ›
          </button>
        </div>

        {/* Calendar grid */}
        <div className="bg-card border border-white/5 p-4 mb-6" style={{ borderRadius: '4px' }}>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-display font-bold uppercase text-text-muted py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasComp = datesWithComps.has(dateStr);
              const isToday = dateStr === today.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(dateStr)}
                  className={`relative aspect-square flex flex-col items-center justify-center text-sm transition-colors ${
                    isSelected ? 'bg-accent text-primary font-bold' :
                    isToday ? 'border border-accent text-accent' :
                    hasComp ? 'text-text hover:bg-white/5' :
                    'text-text-muted hover:bg-white/5'
                  }`}
                  style={{ borderRadius: '4px' }}
                >
                  {day}
                  {hasComp && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent" style={{ borderRadius: '2px' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Competitions list */}
        <div ref={listRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-black uppercase text-xl tracking-wide">
              {selectedDate ? selectedDate : `${MONTHS[month]} competitions`}
            </h2>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-text-muted hover:text-text flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {loading ? <LoadingSpinner /> : visibleComps.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No competitions found"
              description="Try adjusting your filters or submit a competition."
            />
          ) : (
            <div className="space-y-3">
              {visibleComps.map((comp) => {
                const isLive = today >= new Date(comp.start_date) && today <= new Date(comp.end_date);
                const isParticipating = participatingIds.includes(comp.id);
                return (
                  <div key={comp.id} className="bg-card border border-white/5 p-4 hover:border-accent/20 transition-colors" style={{ borderRadius: '4px' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-display font-black uppercase text-base tracking-wide">{comp.title}</h3>
                          {!comp.is_verified && (
                            <span className="text-[10px] text-text-muted/60 border border-white/10 px-1.5 py-0.5 font-display uppercase" style={{ borderRadius: '3px' }}>
                              Unverified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`font-display text-[10px] font-bold uppercase px-2 py-0.5 ${LEVEL_COLORS[comp.level]}`} style={{ borderRadius: '3px' }}>
                            {comp.level}
                          </span>
                          <span className="font-display text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 uppercase" style={{ borderRadius: '3px' }}>
                            {comp.sport}
                          </span>
                          <span className="text-xs text-text-muted">
                            {getCountryFlag(comp.country)} {comp.city}, {comp.country}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">
                          {new Date(comp.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' – '}
                          {new Date(comp.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {comp.description && <p className="text-xs text-text-muted mt-1">{comp.description}</p>}
                        {(comp.participant_count ?? 0) > 0 && (
                          <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {comp.participant_count} athlete{comp.participant_count !== 1 ? 's' : ''} competing
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {isLive && comp.stream_url && (
                          <a
                            href={comp.stream_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-accent text-primary px-3 py-1.5 text-xs font-bold hover:bg-accent-hover transition-colors"
                            style={{ borderRadius: '4px' }}
                          >
                            <ExternalLink className="w-3 h-3" /> Watch Live
                          </a>
                        )}
                        {user && (
                          <button
                            onClick={() => handleParticipate(comp.id)}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                              isParticipating
                                ? 'bg-accent/20 text-accent border border-accent/30 hover:bg-error/10 hover:text-error hover:border-error/30'
                                : 'bg-white/5 border border-white/10 text-text-muted hover:text-text hover:border-white/20'
                            }`}
                            style={{ borderRadius: '4px' }}
                          >
                            {isParticipating ? "I'm competing ✓" : "I'm competing"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating + button */}
      {user && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 md:bottom-8 right-6 w-12 h-12 bg-accent text-primary flex items-center justify-center shadow-lg hover:bg-accent-hover transition-colors z-30"
          style={{ borderRadius: '4px' }}
          title="Submit a competition"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Submit form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="w-full max-w-lg bg-primary border border-white/10 p-6 overflow-y-auto max-h-[90vh]" style={{ borderRadius: '4px' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-black uppercase text-xl tracking-wide">Submit competition</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-error/10 border border-error/20 px-4 py-3 mb-4 text-sm text-error" style={{ borderRadius: '4px' }}>
                {formError}
              </div>
            )}

            <div className="space-y-3">
              {[
                { label: 'Title', key: 'title', type: 'text', placeholder: 'e.g. National Swimming Championship' },
                { label: 'City', key: 'city', type: 'text', placeholder: 'e.g. London' },
                { label: 'Start date', key: 'start_date', type: 'date', placeholder: '' },
                { label: 'End date', key: 'end_date', type: 'date', placeholder: '' },
                { label: 'Registration URL (optional)', key: 'registration_url', type: 'url', placeholder: 'https://...' },
                { label: 'Stream URL (optional)', key: 'stream_url', type: 'url', placeholder: 'https://...' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-surface border border-white/10 px-3 py-2 text-sm text-text placeholder:text-text-muted/40 focus:border-accent/50 transition-colors"
                    style={{ borderRadius: '4px' }}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Sport</label>
                <SportSelect value={form.sport} onChange={(s) => setForm({ ...form, sport: s })} />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full bg-surface border border-white/10 px-3 py-2 text-sm text-text appearance-none focus:border-accent/50"
                  style={{ borderRadius: '4px' }}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as Competition['level'] })}
                  className="w-full bg-surface border border-white/10 px-3 py-2 text-sm text-text appearance-none focus:border-accent/50"
                  style={{ borderRadius: '4px' }}
                >
                  {['local','regional','national','continental','world'].map((l) => (
                    <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full bg-surface border border-white/10 px-3 py-2 text-sm text-text placeholder:text-text-muted/40 focus:border-accent/50 resize-none"
                  style={{ borderRadius: '4px' }}
                />
              </div>
            </div>

            <button
              onClick={handleSubmitForm}
              disabled={submitting}
              className="w-full mt-5 bg-accent text-primary py-3 font-display font-black uppercase text-base tracking-wide hover:bg-accent-hover transition-colors disabled:opacity-50"
              style={{ borderRadius: '4px' }}
            >
              {submitting ? 'Submitting...' : 'Submit competition'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
