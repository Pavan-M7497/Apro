import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { StateSelect } from '../components/StateSelect';
import LoadingSpinner from '../components/LoadingSpinner';
import { MEET_LEVELS, formatSwimTime } from '../lib/types';
import {
  bestMatch, defaultAction, isAmbiguous, parseTimeToSeconds, parseDob,
  generateClaimToken, placeholderUsername,
  MATCH_THRESHOLD, AMBIGUOUS_THRESHOLD,
  type MatchCandidate, type RowAction,
} from '../lib/matching';
import { Upload, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Admin gate. This is a UI-level gate only — it hides the screen, it does not
 * secure the tables. Replace with a server-side role check before launch.
 */
const ADMIN_PROFILE_IDS: string[] = [
  // e.g. '00000000-0000-0000-0000-000000000000'
];

interface ParsedRow {
  key: string;
  name: string;
  club: string;
  dob: string;
  event: string;
  course: string;
  discipline: string;
  rawResult: string;
  resultSeconds: number | null;
  totalScore: number | null;
  matchedProfileId: string | null;
  matchedName: string | null;
  confidence: number;
  reason: string;
  action: RowAction;
}

const field =
  'w-full bg-white border border-line px-4 py-2.5 text-sm text-text focus:border-accent transition-colors appearance-none rounded-pill';
const labelCls = 'block text-xs font-medium text-text-muted mb-1.5';
const card = { background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' };

export default function AdminImport() {
  const { profile } = useAppStore();
  const [step, setStep] = useState(1);

  // Step 1 — meet
  const [meet, setMeet] = useState({
    name: '', level: 'state', state_code: '', city: '',
    start_date: '', end_date: '', course: 'LCM', source_note: '',
  });

  // Step 2/3 — rows
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [working, setWorking] = useState(false);

  // Step 4
  const [committed, setCommitted] = useState<{ matched: number; created: number; skipped: number } | null>(null);
  const [commitError, setCommitError] = useState('');

  const isAdmin = !!profile && ADMIN_PROFILE_IDS.includes(profile.id);

  if (!profile) return <div className="min-h-screen pt-12"><LoadingSpinner /></div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-12 md:pt-16 pb-24">
        <div className="max-w-2xl mx-auto px-5">
          <h1 className="font-display" style={{ fontWeight: 800, fontSize: '30px', marginBottom: '12px' }}>
            Import is restricted
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            This tool is limited to Apro operators. Add your profile id to{' '}
            <code style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '6px' }}>ADMIN_PROFILE_IDS</code>{' '}
            in <code style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '6px' }}>src/pages/AdminImport.tsx</code> to enable it.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '16px' }}>
            Your profile id: <code>{profile.id}</code>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 2: parse the CSV and match against existing athletes ──
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setParseError('');
    setWorking(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        try {
          const raw = res.data.filter((r) => (r.name || '').trim());
          if (raw.length === 0) {
            setParseError('No rows with a name column were found.');
            setWorking(false);
            return;
          }

          // Candidate pool: every athlete profile with its club and DOB.
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, club_id, athlete_profiles(date_of_birth)')
            .eq('role', 'athlete');

          const clubIds = Array.from(new Set(((profs as any[]) || []).map((p) => p.club_id).filter(Boolean)));
          const clubNames = new Map<string, string>();
          if (clubIds.length > 0) {
            const { data: clubs } = await supabase.from('clubs').select('id, name').in('id', clubIds);
            ((clubs as any[]) || []).forEach((c) => clubNames.set(c.id, c.name));
          }

          const candidates: MatchCandidate[] = ((profs as any[]) || []).map((p) => ({
            profileId: p.id,
            fullName: p.full_name,
            clubName: p.club_id ? clubNames.get(p.club_id) ?? null : null,
            dateOfBirth: p.athlete_profiles?.date_of_birth ?? null,
          }));
          const byId = new Map(candidates.map((c) => [c.profileId, c]));

          const parsed: ParsedRow[] = raw.map((r, i) => {
            const name = (r.name || '').trim();
            const club = (r.club || '').trim();
            const dob = (r.dob || '').trim();
            const discipline = (r.discipline || 'swimming').trim().toLowerCase();
            const value = (r.time_or_score || '').trim();

            // Diving is judged on points; everything else is on the clock.
            const isScored = discipline === 'diving';
            const seconds = isScored ? null : parseTimeToSeconds(value);
            const score = isScored ? (Number(value) || null) : null;

            const m = bestMatch({ name, club, dob }, candidates);
            return {
              key: `row-${i}`,
              name, club, dob,
              event: (r.event || '').trim(),
              course: (r.course || meet.course || 'NA').trim().toUpperCase(),
              discipline,
              rawResult: value,
              resultSeconds: seconds,
              totalScore: score,
              matchedProfileId: m.profileId,
              matchedName: m.profileId ? byId.get(m.profileId)?.fullName ?? null : null,
              confidence: m.confidence,
              reason: m.reason,
              action: m.profileId ? defaultAction(m.confidence) : 'create',
            };
          });

          setRows(parsed);
          setStep(3);
        } catch (err: any) {
          setParseError(err.message || 'Could not read that file.');
        } finally {
          setWorking(false);
        }
      },
      error: (err) => { setParseError(err.message); setWorking(false); },
    });
  };

  const setRowAction = (key: string, action: RowAction) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, action } : r)));

  const counts = {
    match: rows.filter((r) => r.action === 'match').length,
    create: rows.filter((r) => r.action === 'create').length,
    skip: rows.filter((r) => r.action === 'skip').length,
    pending: rows.filter((r) => r.action === 'pending').length,
    ambiguous: rows.filter((r) => isAmbiguous(r.confidence)).length,
  };

  // ── Step 4: commit ──
  const commit = async () => {
    setWorking(true);
    setCommitError('');
    try {
      const { data: meetRow, error: meetErr } = await supabase
        .from('meets')
        .insert({
          name: meet.name,
          level: meet.level,
          state_code: meet.state_code || null,
          city: meet.city || null,
          start_date: meet.start_date || null,
          end_date: meet.end_date || null,
          course: meet.course,
          source_note: meet.source_note || null,
        })
        .select()
        .single();
      if (meetErr) throw meetErr;

      const { data: batch, error: batchErr } = await supabase
        .from('import_batches')
        .insert({ meet_id: meetRow.id, row_count: rows.length, status: 'review' })
        .select()
        .single();
      if (batchErr) throw batchErr;

      let matched = 0, created = 0, skipped = 0;

      for (const r of rows) {
        if (r.action === 'skip' || r.action === 'pending') { skipped++; continue; }

        let profileId = r.matchedProfileId;

        if (r.action === 'create') {
          const { data: newProfile, error: pErr } = await supabase
            .from('profiles')
            .insert({
              user_id: null,
              username: placeholderUsername(r.name),
              full_name: r.name,
              country: 'India',
              state_code: meet.state_code || null,
              city: r.club || null,
              role: 'athlete',
              is_claimed: false,
              claim_token: generateClaimToken(),
              verification_tier: 3, // results came from an official import
            })
            .select()
            .single();
          if (pErr) throw pErr;
          profileId = newProfile.id;

          await supabase.from('athlete_profiles').insert({
            profile_id: profileId,
            sport: r.discipline,
            position: '',
            date_of_birth: parseDob(r.dob),
            availability: 'available',
          });
          created++;
        } else {
          matched++;
        }

        if (!profileId) continue;

        if (r.discipline === 'diving') {
          if (r.totalScore == null) continue;
          const { data: existing } = await supabase
            .from('diving_results')
            .select('total_score')
            .eq('profile_id', profileId)
            .eq('event', r.event);
          const isPB = ((existing as any[]) || []).every((e) => r.totalScore! > Number(e.total_score));

          await supabase.from('diving_results').insert({
            profile_id: profileId,
            event: r.event,
            total_score: r.totalScore,
            meet_name: meet.name,
            meet_level: meet.level,
            meet_date: meet.start_date || null,
            is_personal_best: isPB,
            verified: true,
          });
        } else {
          if (r.resultSeconds == null) continue;
          const { data: existing } = await supabase
            .from('performance_records')
            .select('result_seconds')
            .eq('profile_id', profileId)
            .eq('event', r.event)
            .eq('course', r.course);
          const isPB = ((existing as any[]) || []).every(
            (e) => e.result_seconds == null || r.resultSeconds! < Number(e.result_seconds),
          );

          await supabase.from('performance_records').insert({
            profile_id: profileId,
            discipline: r.discipline,
            event: r.event,
            course: r.course,
            result_seconds: r.resultSeconds,
            meet_name: meet.name,
            meet_level: meet.level,
            meet_date: meet.start_date || null,
            is_personal_best: isPB,
            verified: true,
          });
        }

        await supabase.from('import_rows').insert({
          batch_id: batch.id,
          raw_name: r.name,
          raw_club: r.club || null,
          raw_dob: r.dob || null,
          event: r.event,
          course: r.course,
          result_seconds: r.resultSeconds,
          total_score: r.totalScore,
          discipline: r.discipline,
          matched_profile_id: r.action === 'match' ? r.matchedProfileId : profileId,
          match_confidence: r.confidence,
          action: r.action,
        });
      }

      await supabase
        .from('import_batches')
        .update({
          matched_count: matched,
          created_count: created,
          ambiguous_count: counts.ambiguous,
          status: 'committed',
        })
        .eq('id', batch.id);

      setCommitted({ matched, created, skipped });
      setStep(4);
    } catch (err: any) {
      setCommitError(err.message || 'Commit failed.');
    } finally {
      setWorking(false);
    }
  };

  const stepValid1 = meet.name.trim() && meet.level;

  return (
    <div className="min-h-screen pt-8 md:pt-12 pb-24">
      <div className="max-w-5xl mx-auto px-5">
        <h1 className="font-display" style={{ fontWeight: 800, fontSize: '32px', marginBottom: '8px' }}>
          Import meet results
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Step {step} of 4 — nothing is written until you commit.
        </p>

        {/* ── Step 1: meet details ── */}
        {step === 1 && (
          <div style={card}>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '16px' }}>
              <div className="sm:col-span-2">
                <label className={labelCls}>Meet name</label>
                <input className={field} value={meet.name}
                  onChange={(e) => setMeet({ ...meet, name: e.target.value })}
                  placeholder="e.g. 48th Junior National Aquatic Championships" />
              </div>
              <div>
                <label className={labelCls}>Level</label>
                <select className={field} value={meet.level} onChange={(e) => setMeet({ ...meet, level: e.target.value })}>
                  {MEET_LEVELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Course</label>
                <select className={field} value={meet.course} onChange={(e) => setMeet({ ...meet, course: e.target.value })}>
                  <option value="LCM">Long course (50m)</option>
                  <option value="SCM">Short course (25m)</option>
                  <option value="NA">Not applicable</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>State</label>
                <StateSelect value={meet.state_code} onChange={(v) => setMeet({ ...meet, state_code: v })}
                  placeholder="Select state" className="bg-white border border-line px-4 py-2.5 text-sm rounded-pill" />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input className={field} value={meet.city} onChange={(e) => setMeet({ ...meet, city: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Start date</label>
                <input type="date" className={field} value={meet.start_date} onChange={(e) => setMeet({ ...meet, start_date: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>End date</label>
                <input type="date" className={field} value={meet.end_date} onChange={(e) => setMeet({ ...meet, end_date: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Source note</label>
                <input className={field} value={meet.source_note}
                  onChange={(e) => setMeet({ ...meet, source_note: e.target.value })}
                  placeholder="Where these results came from" />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!stepValid1}
              className="inline-flex items-center gap-2 rounded-pill disabled:opacity-50"
              style={{ background: 'var(--text)', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '12px 24px', marginTop: '20px' }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 2: upload ── */}
        {step === 2 && (
          <div style={card}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              CSV columns: <code>name, club, dob, event, course, time_or_score, discipline</code>
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '20px' }}>
              Times may be mm:ss.SS, ss.SS, or plain seconds. Diving rows use a score in time_or_score.
            </p>

            <label
              className="flex flex-col items-center justify-center cursor-pointer"
              style={{ border: '1.5px dashed var(--border)', borderRadius: '16px', padding: '40px' }}
            >
              <Upload className="w-6 h-6 mb-3" style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                {working ? 'Reading…' : 'Choose a CSV file'}
              </span>
              <input type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>

            {parseError && <p style={{ fontSize: '13px', color: 'var(--error)', marginTop: '12px' }}>{parseError}</p>}

            <button onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-pill"
              style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, padding: '12px 24px', marginTop: '20px' }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        {/* ── Step 3: review ── */}
        {step === 3 && (
          <div>
            <div className="flex flex-wrap items-center" style={{ gap: '10px', marginBottom: '16px' }}>
              {[
                { label: `${counts.match} to match`, tone: 'ok' },
                { label: `${counts.create} new profiles`, tone: 'ok' },
                { label: `${counts.pending} need a decision`, tone: counts.pending ? 'warn' : 'ok' },
                { label: `${counts.skip} skipped`, tone: 'ok' },
              ].map((c) => (
                <span key={c.label} className="rounded-pill" style={{
                  background: c.tone === 'warn' ? '#FDF0D5' : 'var(--accent-soft)',
                  color: c.tone === 'warn' ? '#8A5A00' : 'var(--accent-ink)',
                  fontSize: '12px', fontWeight: 500, padding: '6px 14px',
                }}>{c.label}</span>
              ))}
            </div>

            {counts.pending > 0 && (
              <div className="flex items-start gap-2" style={{ background: '#FDF0D5', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#8A5A00', marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: '#8A5A00' }}>
                  {counts.pending} row{counts.pending === 1 ? '' : 's'} scored between {AMBIGUOUS_THRESHOLD} and {MATCH_THRESHOLD}.
                  Confirm each before committing.
                </p>
              </div>
            )}

            <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <table className="w-full" style={{ fontSize: '13px', minWidth: '860px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-soft)' }}>
                    {['Name in file', 'Event', 'Result', 'Proposed match', 'Confidence', 'Action'].map((h) => (
                      <th key={h} className="text-left" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ color: 'var(--text-soft)', fontSize: '12px' }}>
                          {[r.club, r.dob].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {r.event}<br />
                        <span style={{ fontSize: '11px', color: 'var(--text-soft)' }}>{r.discipline} · {r.course}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.discipline === 'diving'
                          ? (r.totalScore != null ? r.totalScore.toFixed(2) : <span style={{ color: 'var(--error)' }}>unreadable</span>)
                          : (r.resultSeconds != null ? formatSwimTime(r.resultSeconds) : <span style={{ color: 'var(--error)' }}>unreadable</span>)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.matchedName || <span style={{ color: 'var(--text-soft)' }}>No candidate</span>}
                        {r.matchedName && <div style={{ fontSize: '11px', color: 'var(--text-soft)' }}>{r.reason}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="rounded-pill" style={{
                          background: r.confidence >= MATCH_THRESHOLD ? 'var(--accent-soft)' : isAmbiguous(r.confidence) ? '#FDF0D5' : 'var(--surface-2)',
                          color: r.confidence >= MATCH_THRESHOLD ? 'var(--accent-ink)' : isAmbiguous(r.confidence) ? '#8A5A00' : 'var(--text-muted)',
                          fontSize: '12px', fontWeight: 600, padding: '4px 10px',
                        }}>
                          {r.confidence.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={r.action}
                          onChange={(e) => setRowAction(r.key, e.target.value as RowAction)}
                          className="bg-white border border-line rounded-pill px-3 py-1.5"
                          style={{ fontSize: '12px' }}
                        >
                          <option value="pending">Undecided</option>
                          <option value="match" disabled={!r.matchedProfileId}>Match</option>
                          <option value="create">Create new</option>
                          <option value="skip">Skip</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {commitError && <p style={{ fontSize: '13px', color: 'var(--error)', marginTop: '12px' }}>{commitError}</p>}

            <div className="flex flex-wrap items-center" style={{ gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-pill"
                style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, padding: '12px 24px' }}>
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={commit} disabled={working}
                className="inline-flex items-center gap-2 rounded-pill disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontSize: '14px', fontWeight: 600, padding: '12px 24px' }}>
                {working ? 'Committing…' : `Commit ${counts.match + counts.create} rows`}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: done ── */}
        {step === 4 && committed && (
          <div style={card}>
            <CheckCircle2 className="w-8 h-8 mb-3" style={{ color: 'var(--accent-ink)' }} />
            <h2 className="font-display" style={{ fontWeight: 800, fontSize: '22px', marginBottom: '8px' }}>Import committed</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {committed.matched} result{committed.matched === 1 ? '' : 's'} added to existing athletes.<br />
              {committed.created} unclaimed profile{committed.created === 1 ? '' : 's'} created — each is discoverable and ready to claim.<br />
              {committed.skipped} row{committed.skipped === 1 ? '' : 's'} skipped.
            </p>
            <button
              onClick={() => { setStep(1); setRows([]); setCommitted(null); setMeet({ ...meet, name: '' }); }}
              className="inline-flex items-center gap-2 rounded-pill"
              style={{ background: 'var(--text)', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '12px 24px', marginTop: '20px' }}
            >
              Import another meet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
