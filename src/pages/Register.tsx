import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Zap, Mail, Lock, Eye, EyeOff, User, Globe, ChevronRight, ChevronLeft, Dumbbell, Briefcase, ClipboardList, Handshake } from 'lucide-react';
import type { UserRole } from '../lib/types';
import { COUNTRIES } from '../lib/types';
import { SportSelect, PositionSelect } from '../components/SportSelect';

const ROLES: { value: UserRole; label: string; desc: string; icon: typeof Dumbbell }[] = [
  { value: 'athlete', label: 'Athlete', desc: 'Showcase your skills and get discovered', icon: Dumbbell },
  { value: 'brand', label: 'Brand', desc: 'Find athletes that match your values', icon: Briefcase },
  { value: 'coach', label: 'Coach', desc: 'Discover talent and build your team', icon: ClipboardList },
  { value: 'agent', label: 'Agent', desc: 'Connect with the next generation of stars', icon: Handshake },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>('athlete');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [sport, setSport] = useState('');
  const [position, setPosition] = useState('');
  const [dob, setDob] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateStep2 = () => {
    if (!fullName.trim()) return 'Name is required';
    if (!email.trim() || !email.includes('@')) return 'Valid email is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!country) return 'Please select a country';
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

  const handleSignUp = async () => {
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          country,
          sport: role === 'athlete' ? sport : undefined,
          position: role === 'athlete' ? position : undefined,
          date_of_birth: role === 'athlete' && dob ? dob : undefined,
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
            <Zap className="w-8 h-8 text-accent" fill="currentColor" />
            <span className="text-2xl font-black tracking-tight">Apro</span>
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
                s <= step ? 'bg-accent' : 'bg-white/10'
              } ${role !== 'athlete' && s === 3 ? 'hidden' : ''}`}
            />
          ))}
        </div>

        <div className="bg-card rounded-xl p-6 border border-white/5">
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
                        ? 'border-accent bg-accent/10'
                        : 'border-white/10 hover:border-white/20 bg-surface'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${role === value ? 'text-accent' : 'text-text-muted'}`} />
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
                    className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 transition-colors"
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
                    className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 transition-colors"
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
                    className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent/50 transition-colors"
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
                <label className="block text-sm font-medium text-text-muted mb-1.5">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text focus:border-accent/50 transition-colors appearance-none"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Athlete-specific */}
          {step === 3 && role === 'athlete' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold mb-2">Athlete details</h2>

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
                <label className="block text-sm font-medium text-text-muted mb-1.5">Date of birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm text-text focus:border-accent/50 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => { setStep(step - 1); setError(''); }}
                className="flex items-center gap-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-white/10 text-text-muted hover:text-text hover:border-white/20 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={step === 3 || (step === 2 && role !== 'athlete') ? handleSignUp : handleNext}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 bg-accent text-primary py-2.5 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : (
                <>
                  {step === 3 || (step === 2 && role !== 'athlete') ? 'Create account' : 'Continue'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-sm text-text-muted mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
