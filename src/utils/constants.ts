import type { UserAccount } from './types';

// Helper function to get live pool party time (always 1 hour ago for demo)
export function getLivePoolPartyDateTime() {
  const now = new Date();
  now.setHours(now.getHours() - 1); // Start 1 hour ago
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

// Demo Events with mock data (for demo account only to showcase features)
export const DEMO_EVENTS_MOCK_DATA = [
  {
    id: 'event-pool',
    eventName: 'Pool Party',
    eventTheme: 'Tropical House',
    eventDescription: 'Summer vibes and tropical beats by the pool',
    code: 'POOL',
    ...getLivePoolPartyDateTime(), // Dynamic date/time
    location: 'Miami Beach Resort',
    status: 'live' as const,
    guestCount: 128,
    eventImage: 'https://images.unsplash.com/photo-1562866470-3774249bef10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb29sJTIwcGFydHklMjBzdW1tZXJ8ZW58MXx8fHwxNzYwNTM1NjY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    preferences: [
      { userId: '1', artists: ['Kygo', 'Matoma', 'Thomas Jack'], genres: ['Tropical House', 'Deep House', 'Chill'], recentTracks: ['Firestone', 'Old Thing Back', 'Rivers'] },
      { userId: '2', artists: ['Robin Schulz', 'Felix Jaehn', 'Lost Frequencies'], genres: ['Tropical House', 'Deep House'], recentTracks: ['Sugar', 'Aint Nobody', 'Are You With Me'] },
      { userId: '3', artists: ['Klingande', 'Sam Feldt', 'Bakermat'], genres: ['Deep House', 'Tropical House'], recentTracks: ['Jubel', 'Show Me Love', 'One Day'] },
      { userId: '4', artists: ['Sigala', 'Jonas Blue', 'Kungs'], genres: ['Dance', 'Tropical House', 'Pop'], recentTracks: ['Easy Love', 'Fast Car', 'This Girl'] },
      { userId: '5', artists: ['Galantis', 'The Him', 'Alle Farben'], genres: ['Dance', 'Tropical House'], recentTracks: ['Runaway', 'Broken Love', 'Bad Ideas'] }
    ],
    finalQueue: [],
    vibeProfile: {
      strictness: 'loose' as const,
      allowedGenres: ['R&B', 'Pop', 'Soul', 'Funk'],
      blockedGenres: [],
      yearRange: {
        min: 1980,
        max: 2000
      },
      energy: {
        min: 0.6,
        max: 1.0
      },
      danceability: {
        min: 0.8,
        max: 1.0
      },
      keywords: ['chill', 'groovy', 'upbeat', 'retro'],
      excludeKeywords: [],
      allowExplicit: false
    }
  }
] as const;

// Generate initial events for demo and tester accounts
// Demo account starts fresh with no events (like a new user)
export function getInitialEvents(username: string) {
  // Demo account starts with no events - complete reset for fresh start
  if (username === 'demo') {
    return [];
  }
  
  // Tester account gets sample events for testing
  const poolPartyTime = getLivePoolPartyDateTime();
  
  const events = [
    {
      id: 'event-pool-' + username,
      eventName: 'Pool Party',
      eventTheme: 'Tropical House',
      eventDescription: 'Summer vibes and tropical beats by the pool',
      code: 'POOL',
      ...poolPartyTime,
      location: 'Miami Beach Resort',
      status: 'live' as const,
      guestCount: 128,
      preferences: DEMO_EVENTS_MOCK_DATA[0].preferences,
      finalQueue: [],
      eventImage: 'https://images.unsplash.com/photo-1562866470-3774249bef10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb29sJTIwcGFydHklMjBzdW1tZXJ8ZW58MXx8fHwxNzYwNTM1NjY2fDA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'event-halloween-' + username,
      eventName: 'Halloween Mixer',
      eventTheme: 'Dark House & Tech',
      eventDescription: 'Spooky beats and dark vibes for Halloween night',
      code: 'SPOOKY',
      date: '2025-10-31',
      time: '21:00',
      location: 'The Underground Club',
      status: 'upcoming' as const,
      guestCount: 0,
      preferences: [],
      finalQueue: [],
      eventImage: 'https://images.unsplash.com/photo-1625612446042-afd3fe024131?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWIlMjBwYXJ0eSUyMGxpZ2h0c3xlbnwxfHx8fDE3NjA0NjMyNjF8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'event-newyear-' + username,
      eventName: 'New Year Celebration',
      eventTheme: 'Top 40 & Dance',
      eventDescription: 'Ring in 2025 with the biggest hits',
      code: 'NYE2025',
      date: '2025-12-31',
      time: '22:00',
      location: 'Grand Ballroom',
      status: 'upcoming' as const,
      guestCount: 0,
      preferences: [],
      finalQueue: [],
      eventImage: 'https://images.unsplash.com/photo-1650584997985-e713a869ee77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMGNlbGVicmF0aW9uJTIwcGFydHl8ZW58MXx8fHwxNzYwNTAyNDgwfDA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'event-retro-' + username,
      eventName: 'Retro Night',
      eventTheme: '80s & 90s Hits',
      eventDescription: 'Classic throwback party',
      code: 'RETRO',
      date: '2024-08-15',
      time: '20:00',
      location: 'Retro Lounge',
      status: 'past' as const,
      guestCount: 87,
      preferences: Array(87).fill(null).map((_, i) => ({
        userId: `user-${i}`,
        artists: [],
        genres: [],
        recentTracks: []
      })),
      finalQueue: [],
      eventImage: 'https://images.unsplash.com/photo-1702873036982-fd89e3d20121?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbHViJTIwZGlzY28lMjBiYWxsfGVufDF8fHx8MTc2MDUzNTY2Nnww&ixlib=rb-4.1.0&q=80&w=1080'
    }
  ];
  
  return events;
}

export const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  { 
    id: 'demo',
    role: 'host',
    email: 'demo@example.com',
    username: 'demo', 
    displayName: 'Demo Host',
    legacyPassword: 'demo',
    events: getInitialEvents('demo'),
    trashedEvents: [] 
  },
  { 
    id: 'tester',
    role: 'host',
    email: 'tester@example.com',
    username: 'tester', 
    displayName: 'Tester Host',
    legacyPassword: 'tester',
    events: getInitialEvents('tester'),
    trashedEvents: [] 
  }
];

export const STORAGE_KEYS = {
  USER_ACCOUNTS: 'qrate_user_accounts',
  SPOTIFY_ACCESS_TOKEN: 'spotify_access_token',
  SPOTIFY_REFRESH_TOKEN: 'spotify_refresh_token',
  SPOTIFY_EXPIRES_AT: 'spotify_expires_at',
  SPOTIFY_OAUTH_VERSION: 'spotify_oauth_version'
} as const;

// Current OAuth scope version - increment this to force re-authentication
export const SPOTIFY_OAUTH_VERSION = '2.0.0';

export const TIMEOUTS = {
  EVENT_LOAD: 8000,
  EVENT_CREATE: 15000,
  EVENT_UPDATE: 10000,
  BACKEND_SYNC: 5000,
  ERROR_DISPLAY: 8000,
  SAVE_DEBOUNCE: 1000,
  PRELOAD_DELAY: 1500
} as const;
