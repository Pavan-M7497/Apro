export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

/** Apro is India-only — every athlete carries the Indian flag. */
export function getCountryFlag(_country?: string): string {
  return '🇮🇳';
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

/** Single light accent. Per-role colour worlds were removed. */
export function getRoleAccent(_role?: string): string {
  return '#B8E62E';
}

export interface RoleTheme {
  bg: string;          // page background
  bgSoft: string;      // card / panel background
  surface: string;     // input + secondary fill
  border: string;      // hairline border
  accent: string;      // lime accent
  accentMuted: string; // accent-soft fill
  accentInk: string;   // readable text on accent-soft
  text: string;        // primary text
  textMuted: string;   // secondary text
  textSoft: string;    // tertiary text
  onAccent: string;    // text on a solid accent fill
  logoColor: string;   // Apro wordmark colour
}

const LIGHT_THEME: RoleTheme = {
  bg: '#FFFFFF',
  bgSoft: '#FAFAF7',
  surface: '#F4F4EF',
  border: '#ECECE6',
  accent: '#B8E62E',
  accentMuted: '#EFFAC8',
  accentInk: '#4A6B00',
  text: '#0E0E10',
  textMuted: '#7A7A75',
  textSoft: '#A8A8A2',
  onAccent: '#0E0E10',
  logoColor: '#0E0E10',
};

/** One light theme for everyone — `role` is ignored. */
export function getRoleTheme(_role?: string): RoleTheme {
  return LIGHT_THEME;
}

// Contrasting text colour to sit on top of an accent fill.
export function accentTextColor(_role?: string): string {
  return '#0E0E10';
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

/** Accent-soft fill. Per-role colour worlds were removed. */
export function getRoleAccentMuted(_role?: string): string {
  return '#EFFAC8';
}

