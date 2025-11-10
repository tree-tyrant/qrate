// Mock data for event metrics and analytics
// Only used for 'tester' account - 'demo' account shows empty/real data

// Helper to check if current user is tester
export function isTesterAccount(username?: string): boolean {
  if (username) {
    return username === 'tester';
  }
  
  if (typeof window === 'undefined') return false;
  try {
    // Check if there's a stored current user
    const storedUser = sessionStorage.getItem('qrate_current_user') || 
                      localStorage.getItem('qrate_current_user');
    return storedUser === 'tester';
  } catch {
    return false;
  }
}

// Helper to check if current user is demo account
export function isDemoAccount(username?: string): boolean {
  if (username) {
    return username === 'demo';
  }
  
  if (typeof window === 'undefined') return false;
  try {
    // Check if there's a stored current user
    const storedUser = sessionStorage.getItem('qrate_current_user') || 
                      localStorage.getItem('qrate_current_user');
    return storedUser === 'demo';
  } catch {
    return false;
  }
}

// Replace assets with Unsplash stock photos
const STOCK_PHOTO_1 = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJ0eSUyMGNlbGVicmF0aW9uJTIwcGVvcGxlfGVufDF8fHx8MTc2MDUzMzg5MHww&ixlib=rb-4.1.0&q=80&w=1080';
const STOCK_PHOTO_2 = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWIlMjBwYXJ0eSUyMGxpZ2h0c3xlbnwxfHx8fDE3NjA0NjMyNjF8MA&ixlib=rb-4.1.0&q=80&w=1080';
const STOCK_PHOTO_3 = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbHViJTIwZGFuY2luZ3xlbnwxfHx8fDE3NjA1Mzc5MTd8MA&ixlib=rb-4.1.0&q=80&w=1080';

// Get mock data based on username - only return data for tester account
export function getMockPhotoAlbum(username?: string): string[] {
  return isTesterAccount(username) ? [
    'https://images.unsplash.com/photo-1623794104182-1908b2b1431c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJ0eSUyMGNlbGVicmF0aW9uJTIwcGVvcGxlfGVufDF8fHx8MTc2MDUzMzg5MHww&ixlib=rb-4.1.0&q=80&w=1080',
    STOCK_PHOTO_2,
    'https://images.unsplash.com/photo-1581974896920-8eb94f3fb650?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWIlMjBkaiUyMGRhbmNpbmd8ZW58MXx8fHwxNzYwNTM3OTE3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    STOCK_PHOTO_1,
    STOCK_PHOTO_3
  ] : [];
}

// Legacy export for backward compatibility - will be empty for non-tester accounts
export const MOCK_PHOTO_ALBUM = getMockPhotoAlbum();

export function getMockGuestFeedback(username?: string) {
  return isTesterAccount(username) ? [
  {
    name: 'Sarah Mitchell',
    rating: 5,
    feedback: 'Absolutely **amazing night!** The DJ knew exactly what the **crowd wanted**.',
    photo: 'https://images.unsplash.com/photo-1690444963408-9573a17a8058?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NjEwNTgwMTB8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    name: 'Mike Chen',
    rating: 5,
    feedback: '**Best party** I\'ve been to this year. The **vibe** was **perfect** from start to finish!',
    photo: 'https://images.unsplash.com/photo-1614917752523-3e61c00e5e68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMHNtaWxpbmd8ZW58MXx8fHwxNzYxMDY4MTMwfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    name: 'Alex Rodriguez',
    rating: 4,
    feedback: '**Great music choices** throughout the night. Would love more **variety** in the first hour next time.',
    photo: 'https://images.unsplash.com/photo-1656582117510-3a177bf866c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBwb3J0cmFpdCUyMGhhcHB5fGVufDF8fHx8MTc2MTA4OTU2NXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    name: 'Jessica Park',
    rating: 4,
    feedback: 'The **energy** was incredible and the DJ **read the crowd perfectly**. **Fantastic experience** overall!',
    photo: 'https://images.unsplash.com/photo-1675705444858-97005ce93298?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZmFjZXxlbnwxfHx8fDE3NjEwNjQzOTh8MA&ixlib=rb-4.1.0&q=80&w=1080'
  }
  ] : [];
}

// Legacy export for backward compatibility
export const MOCK_GUEST_FEEDBACK = getMockGuestFeedback();

export function getMockPartyAnthems(username?: string) {
  return isTesterAccount(username) ? [
  {
    name: 'Billie Jean',
    artist: 'Michael Jackson',
    aps: 94,
    duration: 294000
  },
  {
    name: 'Don\'t Stop Believin\'',
    artist: 'Journey',
    aps: 91,
    duration: 249000
  },
  {
    name: 'I Wanna Dance with Somebody',
    artist: 'Whitney Houston',
    aps: 89,
    duration: 291000
  },
  {
    name: 'Sweet Child O\' Mine',
    artist: 'Guns N\' Roses',
    aps: 87,
    duration: 356000
  },
  {
    name: 'Livin\' on a Prayer',
    artist: 'Bon Jovi',
    aps: 85,
    duration: 249000
  }
  ] : [];
}

// Legacy export for backward compatibility
export const MOCK_PARTY_ANTHEMS = getMockPartyAnthems();

export function generateVibeTimeline(eventDuration: number = 240, username?: string) {
  // Only generate mock data for tester account
  if (!isTesterAccount(username)) {
    return [];
  }
  
  // Generate a realistic vibe timeline over the event duration (in minutes)
  const dataPoints: Array<{ time: string; vibeScore: number; energyLevel: number }> = [];
  const intervals = Math.min(eventDuration / 15, 16); // Max 16 data points
  
  for (let i = 0; i <= intervals; i++) {
    const minutes = Math.floor((eventDuration / intervals) * i);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const time = `${hours}:${mins.toString().padStart(2, '0')}`;
    
    // Create a realistic arc: slow start, peak in middle, maintain high toward end
    const progress = i / intervals;
    let vibeScore: number;
    let energyLevel: number;
    
    if (progress < 0.2) {
      // Warm-up phase
      vibeScore = 65 + progress * 50 + Math.random() * 5;
      energyLevel = 40 + progress * 80 + Math.random() * 10;
    } else if (progress < 0.7) {
      // Peak phase
      vibeScore = 85 + Math.random() * 10;
      energyLevel = 75 + Math.random() * 20;
    } else {
      // Wind-down but still high energy
      vibeScore = 80 + Math.random() * 8;
      energyLevel = 70 + (1 - progress) * 15 + Math.random() * 10;
    }
    
    dataPoints.push({
      time,
      vibeScore: Math.min(100, Math.round(vibeScore)),
      energyLevel: Math.min(100, Math.round(energyLevel))
    });
  }
  
  return dataPoints;
}

export function calculateLiveVibeScore(
  preferences: any[] = [],
  currentTrack?: any,
  username?: string
): number {
  // Calculate how well the current track aligns with crowd preferences
  // Return 0 if no data (clean slate for new events) or not tester account
  if (!isTesterAccount(username) || !currentTrack || preferences.length === 0) {
    return 0;
  }
  
  // For events with real data, return a realistic score
  return Math.floor(82 + Math.random() * 13); // 82-95%
}

export function getTopGenres(preferences: any[], limit: number = 3): string[] {
  const genreMap = new Map<string, number>();
  
  preferences.forEach(pref => {
    (pref.genres || []).forEach((genre: string) => {
      genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });
  });
  
  // Return empty array if no genres found (clean slate for new events)
  if (genreMap.size === 0) {
    return [];
  }
  
  return Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre);
}

export function getEnergyLevel(currentTime?: Date, username?: string): 'Chill' | 'Grooving' | 'Peaking' {
  // Only simulate for tester account, otherwise return default
  if (!isTesterAccount(username)) {
    return 'Chill';
  }
  
  // Simulate energy based on time or random for demo
  if (!currentTime) {
    const rand = Math.random();
    if (rand < 0.3) return 'Chill';
    if (rand < 0.7) return 'Grooving';
    return 'Peaking';
  }
  
  const hour = currentTime.getHours();
  if (hour < 22) return 'Chill';
  if (hour < 24) return 'Grooving';
  return 'Peaking';
}

export function calculateMusicSyncedPercent(
  preferences: any[] = [],
  totalInvited: number = 0
): number {
  if (totalInvited === 0) {
    return preferences.length > 0 ? 100 : 0;
  }
  
  return Math.min(100, Math.round((preferences.length / totalInvited) * 100));
}

export const UPCOMING_EVENT_MOCK_DATA = {
  invitesSent: 0, // Not using QRate for invites yet
  rsvpsConfirmed: 0,
  musicSynced: 0
};

export function getLiveEventMockData(username?: string) {
  return isTesterAccount(username) ? {
    liveGuestCount: 128,
    liveVibeScore: 88,
    topGenres: ['Tropical House', 'Deep House', 'Electronic'],
    energyLevel: 'Grooving' as const,
    energyPercent: 72
  } : {
    liveGuestCount: 0,
    liveVibeScore: 0,
    topGenres: [],
    energyLevel: 'Chill' as const,
    energyPercent: 0
  };
}

// Legacy export for backward compatibility
export const LIVE_EVENT_MOCK_DATA = getLiveEventMockData();
