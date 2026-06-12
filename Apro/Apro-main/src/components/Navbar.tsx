import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { Home, Search, Upload, User, LogOut, X, Menu, Rss, CalendarDays, Trophy } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, profile, signOut } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const athleteLinks = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/feed', label: 'Feed', icon: Rss },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: profile ? `/profile/${profile.username}` : '/profile', label: 'Profile', icon: User },
  ];

  const brandLinks = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/discover', label: 'Search', icon: Search },
    { to: profile ? `/profile/${profile.username}` : '/profile', label: 'Profile', icon: User },
  ];

  const coachLinks = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/discover', label: 'Scout', icon: Search },
    { to: profile ? `/profile/${profile.username}` : '/profile', label: 'Profile', icon: User },
  ];

  const sharedLinks = [
    { to: '/leaderboard', label: 'Rankings', icon: Trophy },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  ];

  const roleLinks = profile?.role === 'athlete' ? athleteLinks
    : profile?.role === 'brand' ? brandLinks
    : (profile?.role === 'coach' || profile?.role === 'agent') ? coachLinks
    : [{ to: '/discover', label: 'Discover', icon: Search }];

  const links = [...roleLinks, ...sharedLinks];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-primary border-b border-white/5 h-16 items-center px-6">
        <Link to="/" className="mr-8">
          <span className="font-display text-2xl font-black tracking-widest text-accent uppercase">APRO</span>
        </Link>

        <div className="flex-1 flex items-center gap-1">
          {user && links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                isActive(to)
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                {profile?.full_name?.[0] || 'U'}
              </div>
              <span className="text-sm font-medium hidden lg:block">{profile?.full_name}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-text-muted hover:text-text transition-colors p-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-text-muted hover:text-text transition-colors">
              Log in
            </Link>
            <Link to="/register" className="bg-accent text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors">
              Sign up
            </Link>
          </div>
        )}
      </nav>

      {/* Mobile top bar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-primary border-b border-white/5 h-14 flex items-center justify-between px-4">
        <Link to="/">
          <span className="font-display text-xl font-black tracking-widest text-accent uppercase">APRO</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-text-muted">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-primary pt-14 animate-fade-in">
          <div className="flex flex-col p-6 gap-2">
            {user ? (
              <>
                {links.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive(to)
                        ? 'text-accent border-l-2 border-accent pl-3'
                        : 'text-text-muted hover:text-text hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                ))}
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-error hover:bg-error/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-base font-medium text-text-muted hover:text-text">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="bg-accent text-primary px-4 py-3 rounded-lg text-base font-bold text-center">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-white/5 h-16 flex items-center justify-around px-2">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive(to) ? 'text-accent' : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
