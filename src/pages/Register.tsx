import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, User, Globe, ChevronRight, ChevronLeft, Dumbbell, Briefcase, ClipboardList, Handshake } from 'lucide-react';
import { AevonLockup } from '../components/Logo';
import type { UserRole, Gender } from '../lib/types';
import { GENDERS } from '../lib/types';
import { StateSelect } from '../components/StateSelect';
import { DisciplineSelect, WaterpoloPositionSelect, PrimaryEventsSelect } from '../components/DisciplineSelect';
import { isMinor } from '../lib/minors';

const ROLES: { value: UserRole; label: string; desc: string; icon: typeof Dumbbell }[] = [
  { value: 'athlete', label: 'Athlete', desc: 'Log your times and get discovered', icon: Dumbbell },
  { value: 'brand', label: 'Brand / Sponsor', desc: 'Back athletes who match your values', icon: Briefcase },
  { value: 'coach', label: 'Coach / Selector', desc: 'Find talent and build your squad', icon: ClipboardList },
  { value: 'agent', label: 'Agent', desc: 'Represent the next generation', icon: Handshake },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>('athlete');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [sport, setSport] = useState('');
  const [position, setPosition] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [gender, setGender] = useState<Gender | ''>('');
  const [dob, setDob] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateStep2 = () => {
    if (!fullName.trim()) return 'Name is required';
    if (!email.trim() || !email.includes('@')) return 'Valid email is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!stateCode) return 'Please select a state';
    return null;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      if (role === 'athlete') {
        setStep(3);
      } else {
        handleSignUp();
      }
    }
  };

  const underage = isMinor(dob);

  const validateStep3 = () => {
    if (!sport) return 'Please select a discipline';
    if (!gender) return 'Please select a gender — leaderboards are split by it';
    if (underage) {
      if (!parentName.trim()) return "Please enter a parent or guardian's name";
      if (!parentEmail.trim() || !parentEmail.includes('@')) return "Please enter a parent or guardian's email";
      if (parentEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
        return 'The guardian email must be different from the athlete’s own email';
      }
    }
    return null;
  };

  const handleSignUp = async () => {
    if (role === 'athlete') {
      const err = validateStep3();
      if (err) { setError(err); return; }
    }
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          country: 'India',
          state_code: stateCode,
          gender: role === 'athlete' ? gender : undefined,
          sport: role === 'athlete' ? sport : undefined,
          position: role === 'athlete' ? (sport === 'waterpolo' ? position : events.join(', ')) : undefined,
          date_of_birth: role === 'athlete' && dob ? dob : undefined,
          // The server re-derives age from date_of_birth and ignores these
          // unless the account really is under 18 (migration 015).
          parent_name: underage ? parentName.trim() : undefined,
          parent_email: underage ? parentEmail.trim() : undefined,
        },
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'An account with this email already exists'
        : authError.message);
      return;
    }

    navigate('/feed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <AevonLockup size={30} />
          </Link>
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-text-muted text-sm">Step {step} of {role === 'athlete' ? 3 : 2}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-accent' : 'bg-surface'
              } ${role !== 'athlete' && s === 3 ? 'hidden' : ''}`}
            />
          ))}
        </div>

        <div className="bg-card rounded-xl p-6 border border-line">
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 mb-4 text-sm text-error">
              {error}
            </div>
          )}

          {/* Step 1: Role selection */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold mb-4">I am joining as...</h2>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setRole(value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      role === value
                        ? 'border-accent-ink bg-accent-soft'
                        : 'border-line hover:border-line bg-surface'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${role === value ? 'text-accent-ink' : 'text-text-muted'}`} />
                    <div className="font-bold text-sm text-text">{label}</div>
                    <div className="text-xs text-text-muted mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Basic info */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold mb-2">Tell us about you</h2>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-surface border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent-ink transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full bg-surface border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent-ink transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-surface border border-line rounded-lg pl-10 pr-10 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent-ink transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">State</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted z-10" />
                  <StateSelect
                    value={stateCode}
                    onChange={setStateCode}
                    className="bg-surface-1 border border-line rounded-pill pl-10 pr-4 py-2.5 text-sm focus:border-accent-ink transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Athlete-specific */}
          {step === 3 && role === 'athlete' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold mb-2">Athlete details</h2>

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
                          : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 500, padding: '10px 16px' }
                      }
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-1.5">Leaderboards are split by gender.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Date of birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-sm text-text focus:border-accent-ink transition-colors"
                />
                <p className="text-xs text-text-muted mt-1.5">
                  Used for age-group rankings. Only your age group is ever shown — never your date of birth.
                </p>
              </div>

              {/* Guardian consent — under 18 */}
              {underage && (
                <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: '16px', padding: '18px' }}>
                  <h3 className="font-display font-black uppercase" style={{ fontSize: '16px', color: 'var(--accent-ink)', marginBottom: '6px' }}>
                    Parent or guardian consent
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--accent-ink)', lineHeight: 1.6, marginBottom: '14px' }}>
                    You’re under 18, so we need a parent or guardian to know about this account.
                    We’ll email them a copy of your privacy settings and how to contact us.
                    Your profile starts private: your city and date of birth are never shown,
                    and only verified coaches and clubs can message you. You can change this later.
                  </p>

                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--accent-ink)' }}>
                    Parent or guardian’s name
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Their full name"
                    className="w-full bg-surface-1 border border-line rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent-ink transition-colors mb-3"
                  />

                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--accent-ink)' }}>
                    Parent or guardian’s email
                  </label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="their@email.com"
                    className="w-full bg-surface-1 border border-line rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent-ink transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => { setStep(step - 1); setError(''); }}
                className="flex items-center gap-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-line text-text-muted hover:text-text hover:border-line transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={step === 3 || (step === 2 && role !== 'athlete') ? handleSignUp : handleNext}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 bg-accent text-on-accent py-2.5 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : (
                <>
                  {step === 3 || (step === 2 && role !== 'athlete') ? 'Create account' : 'Continue'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-text-muted mt-4" style={{ fontSize: '12px', lineHeight: 1.6 }}>
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-accent-ink hover:underline">Terms</Link> and{' '}
            <Link to="/privacy" className="text-accent-ink hover:underline">Privacy Policy</Link>.
          </p>

          <p className="text-center text-sm text-text-muted mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-ink font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
