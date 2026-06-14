import { COUNTRIES } from './types';

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

const FLAG_BY_NAME = new Map(COUNTRIES.map((c) => [c.name, c.flag]));

export function getCountryFlag(country: string): string {
  return FLAG_BY_NAME.get(country) || '🏳️';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function calculateProfileCompleteness(profile: any, athleteProfile: any): number {
  let total = 0;
  let filled = 0;
  const fields = ['full_name', 'username', 'bio', 'avatar_url', 'cover_url', 'country'];
  fields.forEach((f) => {
    total++;
    if (profile[f]) filled++;
  });
  if (profile.role === 'athlete' && athleteProfile) {
    ['sport', 'position', 'date_of_birth'].forEach((f) => {
      total++;
      if (athleteProfile[f]) filled++;
    });
  } else if (profile.role === 'athlete') {
    total += 3;
  }
  return Math.round((filled / total) * 100);
}

export function generateUsername(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const num = Math.floor(Math.random() * 999);
  return `${base}${num}`;
}

export function getRoleAccent(role: string | undefined): string {
  switch (role) {
    case 'brand':   return '#378ADD';
    case 'coach':   return '#EF9F27';
    case 'agent':   return '#D4537E';
    case 'athlete':
    default:        return '#E8FF47';
  }
}

export interface RoleTheme {
  bg: string;          // darkest bg
  surface: string;     // card/sidebar bg
  border: string;      // subtle border colour
  accent: string;      // primary accent
  accentMuted: string; // accent at low opacity for fills
  text: string;        // primary text
  textMuted: string;   // muted/secondary text
  logoColor: string;   // APRO wordmark colour
}

export function getRoleTheme(role: string | undefined): RoleTheme {
  switch (role) {
    case 'brand': return {
      bg: '#03080F', surface: '#04101A', border: '#0a1e30',
      accent: '#378ADD', accentMuted: 'rgba(55,138,221,0.1)',
      text: '#E8F4FD', textMuted: '#1a4a6e', logoColor: '#378ADD'
    };
    case 'coach': return {
      bg: '#0E0800', surface: '#140C00', border: '#2a1a00',
      accent: '#EF9F27', accentMuted: 'rgba(239,159,39,0.1)',
      text: '#FDF6E8', textMuted: '#6a4a10', logoColor: '#EF9F27'
    };
    case 'agent': return {
      bg: '#0E0308', surface: '#160510', border: '#2a0a18',
      accent: '#D4537E', accentMuted: 'rgba(212,83,126,0.1)',
      text: '#FDE8F0', textMuted: '#7a2545', logoColor: '#D4537E'
    };
    case 'athlete':
    default: return {
      bg: '#050A06', surface: '#08100A', border: '#1a2e1c',
      accent: '#E8FF47', accentMuted: 'rgba(232,255,71,0.08)',
      text: '#F5FFF0', textMuted: '#4a7a50', logoColor: '#E8FF47'
    };
  }
}

// Contrasting text colour to sit on top of theme.accent fills.
export function accentTextColor(role: string | undefined): string {
  return role === 'brand' || role === 'agent' || role === 'coach' ? '#ffffff' : '#050508';
}

export function getActivityColor(activityType: string): string {
  switch (activityType) {
    case 'running':    return '#378ADD'; // blue
    case 'cycling':    return '#34D399'; // green
    case 'swimming':   return '#2DD4BF'; // teal
    case 'gym':        return '#EF9F27'; // amber
    case 'team_sport': return '#A78BFA'; // purple
    case 'general':
    default:           return '#8888A0'; // gray
  }
}

export function formatPace(secondsPerKm: number | null | undefined): string {
  if (!secondsPerKm || secondsPerKm <= 0) return '—';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}

export function getRoleAccentMuted(role: string | undefined): string {
  switch (role) {
    case 'brand':   return 'rgba(55,138,221,0.12)';
    case 'coach':   return 'rgba(239,159,39,0.12)';
    case 'agent':   return 'rgba(212,83,126,0.12)';
    case 'athlete':
    default:        return 'rgba(232,255,71,0.10)';
  }
}
