// Utility functions for DJ Dashboard
// Extracted to improve code reusability and testability
// Performance optimized with caching and memoization

import { Badge } from '../components/ui/badge';
import { Music, Sparkles, Zap, Radio } from 'lucide-react';
import { getCachedAlbumCover, getCachedHarmonicInfo, memoize } from './performanceUtils';

// Album cover images pool
export const ALBUM_COVERS = [
  'https://images.unsplash.com/photo-1644855640845-ab57a047320e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFsYnVtJTIwY292ZXJ8ZW58MXx8fHwxNzYwOTMwMDYyfDA&ixlib=rb-4.1.0&q=80&w=400',
  'https://images.unsplash.com/photo-1564178413634-1ec30062c5e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHJlY29yZCUyMGFsYnVtfGVufDF8fHx8MTc2MTAwOTY3MHww&ixlib=rb-4.1.0&q=80&w=400',
  'https://images.unsplash.com/photo-1643964516811-acd68ed32c73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMG11c2ljJTIwYWxidW18ZW58MXx8fHwxNzYxMDE3NzcyfDA&ixlib=rb-4.1.0&q=80&w=400',
  'https://images.unsplash.com/photo-1653082658341-d18280d0c149?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwbXVzaWMlMjBjb3ZlcnxlbnwxfHx8fDE3NjEwMTc3NzJ8MA&ixlib=rb-4.1.0&q=80&w=400',
  'https://images.unsplash.com/photo-1509653382913-87a8ffd6ef25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYW5jZSUyMG11c2ljJTIwYWxidW18ZW58MXx8fHwxNzYxMDE3NzcyfDA&ixlib=rb-4.1.0&q=80&w=400',
];

// Mock Spotify Playlists
export const MOCK_SPOTIFY_PLAYLISTS = [
  {
    id: 'party-hits-2024',
    name: 'Party Hits 2024',
    trackCount: 87,
    tracks: [
      { id: 'spotify-1', name: 'Levitating', artist: 'Dua Lipa', duration: '3:23', album: 'Future Nostalgia' },
      { id: 'spotify-2', name: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20', album: 'After Hours' },
      { id: 'spotify-3', name: 'Save Your Tears', artist: 'The Weeknd', duration: '3:36', album: 'After Hours' },
      { id: 'spotify-4', name: 'good 4 u', artist: 'Olivia Rodrigo', duration: '2:58', album: 'SOUR' },
      { id: 'spotify-5', name: 'Stay', artist: 'The Kid LAROI, Justin Bieber', duration: '2:21', album: 'F*ck Love 3' },
    ]
  },
  {
    id: 'weekend-mix',
    name: 'My Weekend Mix',
    trackCount: 142,
    tracks: [
      { id: 'spotify-6', name: 'Starboy', artist: 'The Weeknd, Daft Punk', duration: '3:50', album: 'Starboy' },
      { id: 'spotify-7', name: 'One Dance', artist: 'Drake, WizKid, Kyla', duration: '2:54', album: 'Views' },
      { id: 'spotify-8', name: 'Roses (Imanbek Remix)', artist: 'SAINt JHN', duration: '2:51', album: 'Roses' },
      { id: 'spotify-9', name: 'Heat Waves', artist: 'Glass Animals', duration: '3:59', album: 'Dreamland' },
      { id: 'spotify-10', name: 'Pepas', artist: 'Farruko', duration: '4:30', album: 'La 167' },
    ]
  },
  {
    id: 'dj-favorites',
    name: 'DJ Favorites',
    trackCount: 203,
    tracks: [
      { id: 'spotify-11', name: 'Titanium', artist: 'David Guetta, Sia', duration: '4:05', album: 'Nothing but the Beat' },
      { id: 'spotify-12', name: 'Animals', artist: 'Martin Garrix', duration: '5:03', album: 'Animals' },
      { id: 'spotify-13', name: 'Wake Me Up', artist: 'Avicii', duration: '4:09', album: 'True' },
      { id: 'spotify-14', name: 'Clarity', artist: 'Zedd, Foxes', duration: '4:32', album: 'Clarity' },
      { id: 'spotify-15', name: 'Don\'t You Worry Child', artist: 'Swedish House Mafia', duration: '3:32', album: 'Until Now' },
    ]
  }
];

/**
 * Get a consistent album cover for a song based on its ID
 * Uses caching to avoid recalculating for the same ID
 */
export const getAlbumCover = (songId: string): string => {
  return getCachedAlbumCover(songId, (id) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ALBUM_COVERS[hash % ALBUM_COVERS.length];
  });
};

/**
 * Generate random Camelot key for a song
 */
export const generateCamelotKey = (songId: string): string => {
  const keys = ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
                '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'];
  let hash = 0;
  for (let i = 0; i < songId.length; i++) {
    hash = ((hash << 5) - hash) + songId.charCodeAt(i);
    hash = hash & hash;
  }
  return keys[Math.abs(hash) % keys.length];
};

/**
 * Get harmonically compatible keys
 * Memoized for performance since this is called frequently
 */
export const getCompatibleKeys = memoize(
  (key: string): { perfect: string; energyBoost: string; energyDrop: string } => {
    const number = parseInt(key);
    const letter = key.slice(-1);
    
    const nextNumber = number === 12 ? 1 : number + 1;
    const prevNumber = number === 1 ? 12 : number - 1;
    
    return {
      perfect: key, // Same key
      energyBoost: `${nextNumber}${letter}`, // One step up
      energyDrop: `${prevNumber}${letter}` // One step down
    };
  },
  { maxSize: 50 }
);

/**
 * Get harmonic compatibility description
 * Uses caching to avoid recalculation
 */
export const getHarmonicDescription = (key: string, targetKey: string): { label: string; description: string } | null => {
  return getCachedHarmonicInfo(key, targetKey, (k: string, tk: string) => {
    if (k === tk) {
      return { label: 'Perfect Match', description: 'Same key. Will mix seamlessly.' };
    }
    
    const compatible = getCompatibleKeys(tk);
    if (k === compatible.energyBoost) {
      return { label: 'Energy Boost', description: 'One step up. Will raise the energy.' };
    }
    if (k === compatible.energyDrop) {
      return { label: 'Energy Drop', description: 'One step down. Will mellow the vibe.' };
    }
    
    return null;
  });
};

/**
 * Generate contextual metric for a song
 */
export const getSongMetric = (song: any): string => {
  if (song.losingInfluence) {
    return "Losing influence: Most fans of this song may have left.";
  }
  if (song.trendingRecent) {
    return "Trending with guests who arrived in the last 30 minutes.";
  }
  if (song.topTrackForGuests && song.topTrackForGuests > 0) {
    return `This is a Top 10 track for ${song.topTrackForGuests} guest${song.topTrackForGuests > 1 ? 's' : ''}`;
  }
  if (song.recentPlays && song.recentPlays > 0) {
    return `${song.recentPlays} guest${song.recentPlays > 1 ? 's' : ''} played this song recently`;
  }
  if (song.playlistCount && song.playlistCount > 0) {
    return `This song is in ${song.playlistCount} guest${song.playlistCount > 1 ? 's' : ''} playlists`;
  }
  return `${song.guestCount || 1} guest${(song.guestCount || 1) > 1 ? 's' : ''} love this`;
};

/**
 * Get source badge for a track
 */
export const getSourceBadge = (source: string): JSX.Element | null => {
  switch (source) {
    case 'ai':
      return <Badge className="text-xs bg-[var(--neon-purple)]/30 border-[var(--neon-purple)] text-[var(--neon-purple)] text-[rgb(215,72,255)] font-[Inter] text-[11px]">
        <Sparkles className="w-3 h-3 mr-1" />
        AI
      </Badge>;
    case 'spotify':
      return <Badge className="text-xs bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
        <Music className="w-3 h-3 mr-1" />
        Spotify
      </Badge>;
    case 'apple':
      return <Badge className="text-xs bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0">
        <Music className="w-3 h-3 mr-1" />
        Apple
      </Badge>;
    case 'tip-request':
      return <Badge className="text-xs bg-gradient-to-r from-[var(--neon-yellow)]/20 to-[var(--neon-yellow)]/10 text-[var(--neon-yellow)] border border-[var(--neon-yellow)]/30">
        <Zap className="w-3 h-3 mr-1" />
        Guest Suggestion
      </Badge>;
    case 'hidden-anthems':
      return <Badge className="text-xs bg-gradient-to-r from-[var(--neon-pink)]/20 to-[var(--neon-pink)]/10 text-[var(--neon-pink)] border border-[var(--neon-pink)]/30">
        <Radio className="w-3 h-3 mr-1" />
        Hidden Anthem
      </Badge>;
    default:
      return null;
  }
};

/**
 * Detect if touch device for better DnD experience
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
