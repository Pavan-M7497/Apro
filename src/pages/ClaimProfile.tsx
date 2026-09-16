import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import LoadingSpinner from '../components/LoadingSpinner';
import { parseDob } from '../lib/matching';
import { CheckCircle2 } from 'lucide-react';

interface Target {
  id: string;
  username: string;
  full_name: string;
  /** Is there a date of birth or SFI id on file to check a claim against? */
  checkable: boolean;
  is_claimed: boolean;
}

const field =
  'w-full bg-white border border-line rounded-pill px-4 py-2.5 text-sm text-text focus:border-accent-ink transition-colors';
const card = { background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' };

export default function ClaimProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, profile: myProfile, fetchProfile } = useAppStore();

  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(true);
  const [sfi, setSfi] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, is_claimed')
        .eq('username', username!)
        .maybeSingle();
      if (data) {
        const d = data as any;
        // Neither the date of birth nor the SFI id comes to the browser — both
        // are what the claim is checked against, and shipping either would hand
        // an attacker the answer needed to claim a child's profile. All we ask
        // is whether there is anything on file to check at all.
        const { data: checkable } = await supabase.rpc('claim_is_checkable', {
          target_profile: d.id,
        });
        setTarget({
          id: d.id, username: d.username, full_name: d.full_name,
          is_claimed: d.is_claimed ?? true,
          checkable: checkable === true,
        });
      }
      setLoading(false);
    })();
  }, [username]);

  const claim = async () => {
    if (!target || !user) return;
    setWorking(true);
    setError('');

    try {
      // Nothing on file to check against — route to manual review instead of
      // handing over the profile on an unverifiable claim.
      if (!target.checkable) {
        await supabase.from('verification_requests').insert({
          profile_id: target.id,
          requested_tier: 4,
          sfi_id: sfi.trim() || null,
          note: `Claim request for @${target.username}. Entered DOB: ${dob || 'none'}.`,
        });
        setPendingReview(true);
        return;
      }

      const { data: matched } = await supabase.rpc('claim_matches', {
        target_profile: target.id,
        candidate_dob: parseDob(dob),
        candidate_sfi: sfi.trim() || null,
      });

      if (matched !== true) {
        setError("That doesn't match our record for this athlete. Check the date of birth or SFI number and try again.");
        return;
      }

      // Results came from an official import, so a confirmed claim lands at tier 3.
      const { error: upErr } = await supabase
        .from('profiles')
        .update({
          user_id: user.id,
          is_claimed: true,
          claim_token: null,
          verification_tier: 3,
          verified_at: new Date().toISOString(),
          ...(sfi.trim() ? { sfi_id: sfi.trim() } : {}),
        })
        .eq('id', target.id);
      if (upErr) throw upErr;

      await fetchProfile(user.id);
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Could not complete the claim.');
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-12"><LoadingSpinner /></div>;

  if (!target) {
    return (
      <div className="min-h-screen pt-12 md:pt-16 pb-24">
        <div className="max-w-lg mx-auto px-5">
          <h1 className="font-display" style={{ fontWeight: 800, fontSize: '28px', marginBottom: '10px' }}>Profile not found</h1>
          <Link to="/discover" style={{ color: 'var(--accent-ink)', fontSize: '14px' }}>Browse athletes</Link>
        </div>
      </div>
    );
  }

  if (target.is_claimed && !done) {
    return (
      <div className="min-h-screen pt-12 md:pt-16 pb-24">
        <div className="max-w-lg mx-auto px-5">
          <h1 className="font-display" style={{ fontWeight: 800, fontSize: '28px', marginBottom: '10px' }}>
            Already claimed
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            {target.full_name}'s profile belongs to an Aevon account. If you believe this is a mistake, get in touch.
          </p>
          <Link to={`/profile/${target.username}`} className="inline-block rounded-pill"
            style={{ background: 'var(--text)', color: '#fff', fontSize: '14px', fontWeight: 600, padding: '12px 24px' }}>
            View profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 md:pt-16 pb-24">
      <div className="max-w-lg mx-auto px-5">
        <h1 className="font-display" style={{ fontWeight: 800, fontSize: '30px', letterSpacing: '-0.01em', marginBottom: '8px' }}>
          Claim {target.full_name}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
          This profile was created from official meet results. Confirm it's you to take
          ownership and add your photo, film, and bio.
        </p>

        {done ? (
          <div style={card}>
            <CheckCircle2 className="w-8 h-8 mb-3" style={{ color: 'var(--accent-ink)' }} />
            <h2 className="font-display" style={{ fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>Profile claimed</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              It's yours. Your results were imported from official meets, so you're already verified at tier 3.
            </p>
            <button onClick={() => navigate('/profile/edit')} className="rounded-pill"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontSize: '14px', fontWeight: 600, padding: '12px 24px' }}>
              Finish your profile
            </button>
          </div>
        ) : pendingReview ? (
          <div style={card}>
            <h2 className="font-display" style={{ fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>Sent for review</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              We don't have a date of birth or SFI number on file for this athlete, so we'll confirm
              this claim by hand. We'll be in touch.
            </p>
          </div>
        ) : !user ? (
          <div style={card}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Sign in or create an account first — the profile gets linked to it.
            </p>
            <div className="flex flex-wrap" style={{ gap: '10px' }}>
              <Link to="/register" className="rounded-pill"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontSize: '14px', fontWeight: 600, padding: '12px 24px' }}>
                Create account
              </Link>
              <Link to="/login" className="rounded-pill"
                style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontWeight: 600, padding: '12px 24px' }}>
                Log in
              </Link>
            </div>
          </div>
        ) : myProfile ? (
          <div style={card}>
            <h2 className="font-display" style={{ fontWeight: 800, fontSize: '18px', marginBottom: '8px' }}>
              Your account already has a profile
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              You're signed in as {myProfile.full_name}. An account can only hold one profile, so this
              claim needs merging by hand — get in touch and we'll move the results across.
            </p>
          </div>
        ) : (
          <div style={card}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Enter either your date of birth or your SFI number to confirm.
            </p>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Date of birth</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={`${field} mb-4`} />

            <label className="block text-xs font-medium text-text-muted mb-1.5">SFI number</label>
            <input type="text" value={sfi} onChange={(e) => setSfi(e.target.value)}
              placeholder="Optional if you gave a date of birth" className={`${field} mb-4`} />

            {error && <p style={{ fontSize: '13px', color: 'var(--error)', marginBottom: '12px' }}>{error}</p>}

            <button onClick={claim} disabled={working || (!dob && !sfi.trim())}
              className="rounded-pill disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontSize: '14px', fontWeight: 600, padding: '12px 24px' }}>
              {working ? 'Checking…' : 'Claim this profile'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
