import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { useTheme } from '../contexts/ThemeContext';
import { initials } from '../lib/utils';
import {
  Home, Rss, Search, Upload, Activity, Calendar, Trophy,
  BookMarked, Users, Briefcase, LogOut, MessageCircle, type LucideIcon,
} from 'lucide-react';

interface NavLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

function linksForRole(role: string | undefined, username: string | undefined): NavLink[] {
  const profilePath = username ? `/profile/${username}` : '/profile';
  void profilePath; // profile reachable via mini-card
  switch (role) {
    case 'brand':
      return [
        { to: '/home', label: 'Home', icon: Home },
        { to: '/feed', label: 'Feed', icon: Rss },
        { to: '/discover', label: 'Search', icon: Search },
        { to: '/saved', label: 'Saved', icon: BookMarked },
        { to: '/calendar', label: 'Calendar', icon: Calendar },
        { to: '/leaderboard', label: 'Rankings', icon: Trophy },
      ];
    case 'coach':
      return [
        { to: '/home', label: 'Home', icon: Home },
        { to: '/feed', label: 'Feed', icon: Rss },
        { to: '/discover', label: 'Scout', icon: Search },
        { to: '/watchlist', label: 'Watchlist', icon: Users },
        { to: '/calendar', label: 'Calendar', icon: Calendar },
        { to: '/leaderboard', label: 'Rankings', icon: Trophy },
      ];
    case 'agent':
      return [
        { to: '/home', label: 'Home', icon: Home },
        { to: '/feed', label: 'Feed', icon: Rss },
        { to: '/discover', label: 'Scout', icon: Search },
        { to: '/roster', label: 'Roster', icon: Briefcase },
        { to: '/calendar', label: 'Calendar', icon: Calendar },
        { to: '/leaderboard', label: 'Rankings', icon: Trophy },
      ];
    case 'athlete':
    default:
      return [
        { to: '/home', label: 'Home', icon: Home },
        { to: '/feed', label: 'Feed', icon: Rss },
        { to: '/discover', label: 'Discover', icon: Search },
        { to: '/upload', label: 'Upload', icon: Upload },
        { to: '/training', label: 'Training', icon: Activity },
        { to: '/calendar', label: 'Calendar', icon: Calendar },
        { to: '/leaderboard', label: 'Rankings', icon: Trophy },
      ];
  }
}

export default function Sidebar() {
  const { user, profile, signOut } = useAppStore();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const base = linksForRole(profile?.role, profile?.username);
  // Messages available to all roles — insert after Home + Feed.
  const links = [...base.slice(0, 2), { to: '/messages', label: 'Messages', icon: MessageCircle }, { to: '/meets', label: 'Meets', icon: Calendar }, ...base.slice(2)];
  const mobileLinks = links.slice(0, 5);
  const inactiveColor = theme.textMuted;

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + '/');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const renderLink = ({ to, label, icon: Icon }: NavLink) => {
    const active = isActive(to);
    return (
      <Link
        key={to}
        to={to}
        className="flex items-center transition-colors"
        style={{
          gap: '12px',
          padding: '10px 16px',
          borderRadius: '999px',
          background: active ? theme.accentMuted : 'transparent',
          color: active ? theme.accentInk : inactiveColor,
          fontWeight: active ? 600 : 500,
        }}
      >
        <Icon className="w-[18px] h-[18px]" />
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px' }}>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-50"
        style={{ width: '220px', background: theme.bgSoft, borderRight: `1px solid ${theme.border}` }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px' }}>
          <Link to="/home" className="flex items-center" style={{ gap: '10px' }}>
            <span
              className="flex items-center justify-center flex-shrink-0 font-display"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '10px',
                background: theme.accent,
                color: theme.onAccent,
                fontWeight: 800,
                fontSize: '18px',
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              A
            </span>
            <span
              className="font-display"
              style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.01em', color: theme.text }}
            >
              Apro
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col" style={{ gap: '4px', padding: '0 12px' }}>
          {links.map(renderLink)}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile mini-card */}
        <div style={{ padding: '16px 14px', borderTop: `1px solid ${theme.border}` }}>
          <div className="flex items-center" style={{ gap: '10px' }}>
            <Link
              to={profile?.username ? `/profile/${profile.username}` : '/profile'}
              className="flex items-center flex-1 min-w-0"
              style={{ gap: '10px' }}
            >
              <div
                className="overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ width: '28px', height: '28px', borderRadius: '12px', background: theme.accentMuted }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '12px', color: theme.accentInk }}>
                    {initials(profile?.full_name || '?')}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div
                  className="truncate"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '14px', color: theme.text }}
                >
                  {profile?.full_name || 'Profile'}
                </div>
                <div className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: theme.textMuted, textTransform: 'capitalize' }}>
                  {profile?.role}
                </div>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 transition-colors"
              style={{ color: theme.textMuted }}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
        style={{ height: '64px', background: theme.bgSoft, borderTop: `1px solid ${theme.border}` }}
      >
        {mobileLinks.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center justify-center flex-1"
              style={{ gap: '3px', color: active ? theme.accent : inactiveColor }}
            >
              <Icon style={{ width: '20px', height: '20px' }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '9px' }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
