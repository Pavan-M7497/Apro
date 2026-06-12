export type UserRole = 'athlete' | 'brand' | 'coach' | 'agent';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  country: string;
  role: UserRole;
  verification_tier?: number;
  created_at: string;
  updated_at: string;
}

export interface AthleteProfile {
  id: string;
  profile_id: string;
  sport: string;
  position: string;
  date_of_birth: string | null;
  availability: 'available' | 'unavailable' | 'open_to_offers';
}

export interface Highlight {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  sport: string;
  created_at: string;
}

export interface Stat {
  id: string;
  athlete_profile_id: string;
  season: string;
  appearances: number;
  goals: number;
  assists: number;
  clean_sheets: number | null;
  minutes_played: number;
}

export interface Achievement {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  date: string;
  icon: string | null;
  verified?: boolean;
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  proof_url?: string | null;
  flag_count?: number;
}

export interface ProfileView {
  id: string;
  profile_id: string;
  viewer_id: string | null;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FeedItem {
  id: string;
  type: 'highlight' | 'achievement' | 'profile_update';
  profile: Profile;
  highlight?: Highlight;
  achievement?: Achievement;
  created_at: string;
}

export const SPORTS = [
  'Football', 'Basketball', 'Tennis', 'Athletics', 'Swimming',
  'Cricket', 'Rugby', 'Boxing', 'MMA', 'Volleyball',
  'Handball', 'Cycling', 'Golf', 'Baseball', 'Hockey',
];

export const COUNTRIES = [
  'Argentina', 'Australia', 'Brazil', 'Canada', 'China',
  'Colombia', 'France', 'Germany', 'India', 'Italy',
  'Japan', 'Mexico', 'Netherlands', 'Nigeria', 'Portugal',
  'South Africa', 'South Korea', 'Spain', 'United Kingdom', 'United States',
];

export const POSITIONS: Record<string, string[]> = {
  Football: ['Goalkeeper', 'Defender', 'Midfielder', 'Striker', 'Winger'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Tennis: ['Singles', 'Doubles'],
  Athletics: ['Sprinter', 'Marathon', 'Jumper', 'Thrower', 'Hurdler'],
  Swimming: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Medley'],
  Cricket: ['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'],
  Rugby: ['Forward', 'Back', 'Halfback', 'Center', 'Wing'],
  Boxing: ['Heavyweight', 'Middleweight', 'Welterweight', 'Lightweight'],
  MMA: ['Striker', 'Grappler', 'All-rounder'],
  Volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero'],
  Handball: ['Goalkeeper', 'Left Wing', 'Right Wing', 'Center Back', 'Pivot'],
  Cycling: ['Sprinter', 'Climber', 'Time Trialist', 'All-rounder'],
  Golf: ['Professional', 'Amateur'],
  Baseball: ['Pitcher', 'Catcher', 'Infielder', 'Outfielder'],
  Hockey: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
};
