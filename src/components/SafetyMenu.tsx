import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { REPORT_REASONS, type ReportReason } from '../lib/minors';
import { MoreHorizontal, Flag, Ban, X } from 'lucide-react';

/**
 * Report / block menu. Appears on every public profile and every message thread,
 * so a young athlete is never more than one tap from getting someone away from
 * them. Blocking is silent — the blocked person is not told.
 */
export default function SafetyMenu({
  targetProfileId,
  targetName,
  conversationId,
  onBlocked,
  tone = 'dark',
}: {
  targetProfileId: string;
  targetName: string;
  conversationId?: string;
  onBlocked?: () => void;
  /** 'dark' sits on a photo, 'light' sits on the page background. */
  tone?: 'dark' | 'light';
}) {
  const { profile: me } = useAppStore();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<'report' | 'block' | null>(null);
  const [reason, setReason] = useState<ReportReason>('inappropriate_messages');
  const [detail, setDetail] = useState('');
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Nothing to report or block on your own profile, and reporting needs an account.
  if (!me || me.id === targetProfileId) return null;

  const submitReport = async () => {
    setWorking(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: me.id,
      reported_id: targetProfileId,
      conversation_id: conversationId ?? null,
      reason,
      detail: detail.trim() || null,
    });
    setWorking(false);
    if (error) { setDone('Could not send the report. Please try again.'); return; }
    setModal(null);
    setDetail('');
    setDone('Report sent. Our team will review it.');
  };

  const submitBlock = async () => {
    setWorking(true);
    const { error } = await supabase
      .from('blocks')
      .insert({ blocker_id: me.id, blocked_id: targetProfileId });
    setWorking(false);
    // A duplicate block is already the outcome the user wanted.
    if (error && error.code !== '23505') { setDone('Could not block. Please try again.'); return; }
    setModal(null);
    setDone(`${targetName} can no longer message you.`);
    onBlocked?.();
  };

  const triggerStyle =
    tone === 'dark'
      ? { background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', color: '#fff' }
      : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' };

  const field =
    'w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-text focus:border-accent-ink transition-colors';

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center"
        style={{ ...triggerStyle, width: '30px', height: '30px', borderRadius: '12px' }}
        aria-label={`Safety options for ${targetName}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50"
          style={{
            top: '36px',
            minWidth: '190px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          <button
            role="menuitem"
            onClick={() => { setOpen(false); setModal('report'); }}
            className="w-full flex items-center gap-2 text-left hover:bg-surface transition-colors"
            style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text)' }}
          >
            <Flag className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> Report
          </button>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); setModal('block'); }}
            className="w-full flex items-center gap-2 text-left hover:bg-surface transition-colors"
            style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--error)', borderTop: '1px solid var(--border)' }}
          >
            <Ban className="w-4 h-4" /> Block
          </button>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !working && setModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full"
            style={{ maxWidth: '420px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="font-display font-black uppercase" style={{ fontSize: '20px', color: 'var(--text)' }}>
                {modal === 'report' ? `Report ${targetName}` : `Block ${targetName}?`}
              </h2>
              <button onClick={() => !working && setModal(null)} aria-label="Close" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {modal === 'report' ? (
              <>
                <p className="text-sm text-text-muted mb-4">
                  Tell us what happened. Reports are private — {targetName} is not told who reported them.
                </p>
                <div className="space-y-2 mb-4">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setReason(r.id)}
                      className="w-full text-left rounded-lg transition-colors"
                      style={
                        reason === r.id
                          ? { background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent-ink)', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }
                          : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '10px 14px', fontSize: '13px' }
                      }
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Anything else we should know? (optional)"
                  className={field}
                />
                <button
                  onClick={submitReport}
                  disabled={working}
                  className="w-full rounded-pill disabled:opacity-50"
                  style={{ marginTop: '16px', background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 700, fontSize: '14px', padding: '12px' }}
                >
                  {working ? 'Sending…' : 'Send report'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-text-muted mb-5">
                  They will not be able to message you, and you will not see their messages.
                  They are not told that you blocked them. You can undo this in your privacy settings.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModal(null)}
                    disabled={working}
                    className="flex-1 rounded-pill"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, padding: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitBlock}
                    disabled={working}
                    className="flex-1 rounded-pill disabled:opacity-50"
                    style={{ background: 'var(--error)', color: 'var(--on-error)', fontSize: '14px', fontWeight: 700, padding: '12px' }}
                  >
                    {working ? 'Blocking…' : 'Block'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {done && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[70]"
          style={{ bottom: '96px', background: 'var(--text)', color: 'var(--bg)', borderRadius: '12px', padding: '10px 18px', fontSize: '13px' }}
          onAnimationEnd={() => setDone('')}
        >
          {done}
          <button onClick={() => setDone('')} className="ml-3" style={{ opacity: 0.7 }} aria-label="Dismiss">✕</button>
        </div>
      )}
    </div>
  );
}
