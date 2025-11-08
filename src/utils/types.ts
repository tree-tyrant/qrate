// Centralized type definitions
export type AppMode = 
  | 'landing' 
  | 'role-selection'
  | 'host-login' 
  | 'signup' 
  | 'dj-login' 
  | 'dj-signup-login'
  | 'host-dashboard' 
  | 'create-event' 
  | 'edit-event' 
  | 'guest-event-code-entry'
  | 'guest-flow' 
  | 'dj-dashboard' 
  | 'qr-display' 
  | 'playlist-connection' 
  | 'dj-greeting' 
  | 'host-greeting' 
  | 'spotify-connection-test'
  | 'admin';

// Vibe Profile Types
export type VibeStrictness = 'strict' | 'loose' | 'open';

export interface VibeProfile {
  strictness: VibeStrictness;
  allowedGenres: string[];
  blockedGenres: string[];
  yearRange?: {
    min?: number;
    max?: number;
  };
  tempoRange?: {
    min?: number; // BPM
    max?: number; // BPM
  };
  energy?: {
    min?: number; // 0-1
    max?: number; // 0-1
  };
  danceability?: {
    min?: number; // 0-1
    max?: number; // 0-1
  };
  keywords: string[]; // Thematic keywords
  excludeKeywords: string[]; // Words that should exclude a track
  allowExplicit: boolean;
}

export interface TrackValidationResult {
  passed: boolean;
  track: any;
  score: number;
  reasons: string[];
}

// Guest Contribution Data
export interface GuestContribution {
  userId: string;
  spotifyUserId: string;
  displayName: string;
  arrivalTime: string; // ISO timestamp
  cohortIndex: number;
  presenceStatus: 'present' | 'absent' | 'unknown';
  lastLocationUpdate?: string; // ISO timestamp
  coordinates?: { lat: number; lon: number };
  tracks: Array<{
    id: string;
    name: string;
    artist: string;
    rank: number;
    timeframe: 'short_term' | 'medium_term' | 'long_term';
    isSaved: boolean;
    pts?: number; // Personal Taste Score
    weightedPTS?: number; // After contextual weighting
  }>;
}

// Event Configuration for Contextual Weighting
export interface EventWeightingConfig {
  geoFenceEnabled: boolean;
  geoFenceCenter?: { lat: number; lon: number };
  geoFenceRadius?: number; // meters
  decayConfig?: {
    presentDecayRate: number;
    absentDecayRate: number;
    useGentleDecayForAll: boolean;
  };
}

export interface Event {
  id: string;
  eventName: string;
  eventTheme: string;
  eventDescription?: string;
  code: string;
  date: string;
  time: string;
  location?: string;
  status: 'past' | 'live' | 'upcoming';
  guestCount: number;
  preferences: Array<{
    userId: string;
    artists: string[];
    genres: string[];
    recentTracks: string[];
  }>;
  // New: Guest contributions with PTS tracking
  guestContributions?: GuestContribution[];
  // New: Contextual weighting configuration
  weightingConfig?: EventWeightingConfig;
  connectedPlaylist?: any;
  finalQueue?: any[];
  insights?: any;
  shareLink?: string;
  qrCodeData?: string;
  trashedAt?: string;
  eventImage?: string;
  vibeProfile?: VibeProfile; // Vibe Gate configuration
}

export interface UserAccount {
  username: string;
  password: string;
  email: string;
  events?: Event[];
  trashedEvents?: Event[];
}

export interface EventFormData {
  name: string;
  theme: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  imageUrl?: string;
  vibeProfile?: VibeProfile;
}

// DJ Dashboard Engine Types
export type DJEngineMode = 'party-hits' | 'discovery' | 'mix-assist';

export interface DJEngineState {
  mode: DJEngineMode;
  subMode?: 'hitfinder' | 'mix-assist'; // For party-hits engine
  currentTrack: any | null;
  queueTracks: any[];
  playHistory: any[];
  filtersActive: boolean;
  weightPreset: 'crowd-pleaser' | 'balanced' | 'technical' | 'purist';
}

// Tip Jar Types
export type TipMessageType = 'REQUEST' | 'SHOUTOUT' | 'MESSAGE';

export interface Tip {
  id: string;
  amount: number;
  guestName: string;
  timestamp: string; // ISO timestamp
  message?: string;
  messageType?: TipMessageType;
  dismissed?: boolean;
  addedToQueue?: boolean;
  // For requests
  trackName?: string;
  trackArtist?: string;
  crowdScore?: number;
  themeMatch?: number;
}

export interface TipJarState {
  totalTips: number;
  tips: Tip[];
  lastTip?: {
    amount: number;
    guestName: string;
  };
}
