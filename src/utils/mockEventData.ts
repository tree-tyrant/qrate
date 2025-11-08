import image_084c5bbf68118a9f580036193a3398d12beb4b49 from 'figma:asset/084c5bbf68118a9f580036193a3398d12beb4b49.png';
import image_e85c69fcb4fd004e277565cea8b31e7465479ca6 from 'figma:asset/e85c69fcb4fd004e277565cea8b31e7465479ca6.png';
import image_e3cc7cd6962096cc1d22faa288d5a58a28f09cf6 from 'figma:asset/e3cc7cd6962096cc1d22faa288d5a58a28f09cf6.png';
// Mock data for event metrics and analytics

export const MOCK_PHOTO_ALBUM = [
  'https://images.unsplash.com/photo-1623794104182-1908b2b1431c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJ0eSUyMGNlbGVicmF0aW9uJTIwcGVvcGxlfGVufDF8fHx8MTc2MDUzMzg5MHww&ixlib=rb-4.1.0&q=80&w=1080',
  image_e3cc7cd6962096cc1d22faa288d5a58a28f09cf6,
  'https://images.unsplash.com/photo-1581974896920-8eb94f3fb650?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWIlMjBkaiUyMGRhbmNpbmd8ZW58MXx8fHwxNzYwNTM3OTE3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  image_084c5bbf68118a9f580036193a3398d12beb4b49,
  image_e85c69fcb4fd004e277565cea8b31e7465479ca6
];

export const MOCK_GUEST_FEEDBACK = [
  {
    name: 'Sarah L.',
    feedback: 'Amazing event with great music. I danced all night!',
    rating: 5
  },
  {
    name: 'Mike D.',
    feedback: 'Perfect vibe, the DJ nailed the transitions between eras.',
    rating: 5
  },
  {
    name: 'Jessica R.',
    feedback: 'Best party I\'ve been to this year. Loved every minute!',
    rating: 5
  },
  {
    name: 'Tom H.',
    feedback: 'Great energy, awesome crowd, and incredible music selection.',
    rating: 4
  },
  {
    name: 'Emma K.',
    feedback: 'The throwback tracks were on point! Will definitely come again.',
    rating: 5
  }
];

export const MOCK_PARTY_ANTHEMS = [
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
];

export function generateVibeTimeline(eventDuration: number = 240) {
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
  currentTrack?: any
): number {
  // Calculate how well the current track aligns with crowd preferences
  // Return 0 if no data (clean slate for new events)
  if (!currentTrack || preferences.length === 0) {
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

export function getEnergyLevel(currentTime?: Date): 'Chill' | 'Grooving' | 'Peaking' {
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

export const LIVE_EVENT_MOCK_DATA = {
  liveGuestCount: 128,
  liveVibeScore: 88,
  topGenres: ['Tropical House', 'Deep House', 'Electronic'],
  energyLevel: 'Grooving' as const,
  energyPercent: 72
};
