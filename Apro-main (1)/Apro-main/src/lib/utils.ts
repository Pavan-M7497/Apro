export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function getCountryFlag(country: string): string {
  const codes: Record<string, string> = {
    Argentina: '🇦🇷', Australia: '🇦🇺', Brazil: '🇧🇷', Canada: '🇨🇦',
    China: '🇨🇳', Colombia: '🇨🇴', France: '🇫🇷', Germany: '🇩🇪',
    India: '🇮🇳', Italy: '🇮🇹', Japan: '🇯🇵', Mexico: '🇲🇽',
    Netherlands: '🇳🇱', Nigeria: '🇳🇬', Portugal: '🇵🇹', 'South Africa': '🇿🇦',
    'South Korea': '🇰🇷', Spain: '🇪🇸', 'United Kingdom': '🇬🇧', 'United States': '🇺🇸',
  };
  return codes[country] || '🏳️';
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
