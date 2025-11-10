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
  | 'dj-gig' 
  | 'qr-display' 
  | 'playlist-connection' 
  | 'dj-greeting' 
  | 'host-greeting' 
  | 'admin';

// Vibe Profile Types
export type VibeStrictness = 'strict' | 'loose' | 'open';

export interface VibeProfile {
  strictness: VibeStrictness;
  allowedGenres: string[];
  blockedGenres: string[];
  blockedArtists: string[];
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
  track: TrackInput;
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
    isFollowedArtist?: boolean;
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
  connectedPlaylist?: EventPlaylist;
  finalQueue?: TrackInput[];
  insights?: {
    totalGuests?: number;
    topGenres?: string[];
    topArtists?: string[];
    averageEnergy?: number;
    [key: string]: unknown;
  };
  shareLink?: string;
  qrCodeData?: string;
  trashedAt?: string;
  eventImage?: string;
  vibeProfile?: VibeProfile; // Vibe Gate configuration
}

export type UserRole = 'host' | 'dj';

export interface MarketplaceProfile {
  id: string;
  email: string;
  role: UserRole;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
  location?: string | null;
  bio?: string | null;
  media?: DJMediaItem[];
  pricePackages?: DJPricePackage[];
  specialties?: string[];
  availabilityWindow?: string | null;
  profileCompletedAt?: string | null;
  onboardingStep?: string | null;
}

export interface UserAccount {
  id: string;
  role: UserRole;
  email: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  legacyPassword?: string | null;
  events?: Event[];
  trashedEvents?: Event[];
  metadata?: Record<string, unknown>;
}

export interface DJMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  description?: string;
}

export interface DJPricePackage {
  id: string;
  name: string;
  priceRange: string;
  description?: string;
  isFeatured?: boolean;
}

export interface DJAnalyticsMetric {
  name: string;
  value: string | number;
  context?: string;
}

export interface DJVibeSegment {
  label: string;
  percent: number;
}

export interface DJBookingRequest {
  id: string;
  title: string;
  date: string;
  location: string;
  budget: string;
  status: 'New' | 'Reviewing' | 'Responded' | 'Booked';
  hostName?: string;
  eventType?: string;
  messagePreview?: string;
}

export interface DJEarningsSummary {
  lifetime: string;
  upcoming: string;
  tips: string;
  pendingPayout: string;
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
  currentTrack: TrackInput | null;
  queueTracks: TrackInput[];
  playHistory: TrackInput[];
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
  // Spotify track data (when available)
  spotifyTrackId?: string;
  spotifyAlbumArt?: string;
  spotifyPreviewUrl?: string;
  spotifyDurationMs?: number;
  spotifyAlbumName?: string;
  eventId?: string;
  djEarnings?: number;
  platformFee?: number;
}

export interface TipJarState {
  totalTips: number;
  tips: Tip[];
  lastTip?: {
    amount: number;
    guestName: string;
  };
}

// Song Request System Types
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'played' | 'queued';
export type VoteType = 'upvote' | 'downvote';

export interface SongRequest {
  id: string;
  eventCode: string;
  guestId: string;
  spotifyTrackId?: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  previewUrl?: string;
  durationMs?: number;
  status: RequestStatus;
  voteCount: number;
  downvoteCount: number;
  tipAmount: number;
  requesterName?: string;
  submittedAt: string;
  playedAt?: string;
  metadata?: {
    bpm?: number;
    key?: string;
    energy?: number;
    danceability?: number;
    compatibilityScore?: number;
    genre?: string[];
    [key: string]: unknown;
  };
}

export interface RequestVote {
  id: string;
  requestId: string;
  guestId: string;
  voteType: VoteType;
  createdAt: string;
}

export interface RequestSettings {
  eventCode: string;
  requestsEnabled: boolean;
  votingEnabled: boolean;
  paidRequestsEnabled: boolean;
  genreRestrictions?: string[];
  artistRestrictions?: string[];
  openTime?: string;
  closeTime?: string;
  minVoteThreshold: number;
  maxRequestsPerGuest: number;
  autoAcceptThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequestAnalytics {
  id: string;
  eventCode: string;
  metricName: string;
  metricValue: number;
  timestamp: string;
  metadata?: {
    [key: string]: unknown;
  };
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Spotify API Types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string; id?: string }>;
  album?: {
    name: string;
    images?: Array<{ url: string; height?: number; width?: number }>;
    release_date?: string;
  };
  duration_ms?: number;
  preview_url?: string | null;
  explicit?: boolean;
  popularity?: number;
  external_urls?: {
    spotify?: string;
  };
}

export interface SpotifyUserData {
  profile?: {
    id: string;
    display_name?: string;
    email?: string;
    images?: Array<{ url: string }>;
  };
  top_tracks?: {
    short_term?: SpotifyTrack[];
    medium_term?: SpotifyTrack[];
    long_term?: SpotifyTrack[];
  };
  top_artists?: {
    short_term?: Array<{ id: string; name: string; genres?: string[] }>;
    medium_term?: Array<{ id: string; name: string; genres?: string[] }>;
    long_term?: Array<{ id: string; name: string; genres?: string[] }>;
  };
  saved_tracks?: SpotifyTrack[];
  playlists?: Array<{
    id: string;
    name: string;
    track_count?: number;
    images?: Array<{ url: string }>;
  }>;
  followed_artists?: Array<{
    id: string;
    name: string;
    genres?: string[];
    popularity?: number;
    images?: Array<{ url: string }>;
  }>;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  public?: boolean;
  tracks?: {
    items?: Array<{
      track?: SpotifyTrack;
    }>;
  };
}

export type EventPlaylist =
  | SpotifyPlaylist
  | {
      id: string;
      name: string;
      trackCount?: number;
      duration?: string;
      tracks?: unknown[];
      image?: string;
      owner?: string;
      description?: string;
      public?: boolean;
    };

// Guest Preferences Types
export interface GuestPreferences {
  guestId?: string;
  spotifyUserData?: SpotifyUserData;
  guestContribution?: Partial<GuestContribution>;
  stats?: Record<string, unknown>;
  source?: string;
  additionalPreferences?: {
    favoriteGenres?: string[];
    favoriteArtists?: string[];
    mood?: string;
    energyLevel?: 'low' | 'medium' | 'high';
    [key: string]: unknown;
  };
}

// Discovery Queue Types
export interface DiscoveryQueueResponse {
  anthems: Array<{
    id: string;
    name: string;
    artist: string;
    [key: string]: unknown;
  }>;
}

// Algorithm API Types
export interface TrackInput {
  id: string;
  name: string;
  artist?: string;
  artists?: string[];
  [key: string]: unknown;
}

export interface PTSResult {
  trackId: string;
  userId: string;
  pts: number;
  breakdown?: {
    [key: string]: number;
  };
}

export interface VibeValidationInput {
  track: TrackInput;
  vibeProfile: VibeProfile;
}

// Storage Types
export type StorageValue = string | number | boolean | object | null;
