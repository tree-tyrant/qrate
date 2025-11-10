// Custom hook for managing discovery queue
// Handles loading and managing hidden anthems and deep cuts

import { eventApi } from '@/utils/api';
import { generateCamelotKey } from '@/utils/djDashboardHelpers';
import type { Track } from './useDJDashboardState';

const DEFAULT_PREVIEW_DURATION_MS = 20000;
const MIN_PREVIEW_START_MS = 15000;

function extractPreviewUrl(track: any): string | undefined {
  return track.previewUrl || track.preview_url || track.external_preview_url;
}

function estimatePreviewStart(durationMs?: number): number | undefined {
  if (!durationMs || durationMs <= 0) {
    return undefined;
  }
  const heuristicStart = Math.round(durationMs * 0.4);
  const maxStart = Math.max(0, durationMs - DEFAULT_PREVIEW_DURATION_MS);
  return Math.max(MIN_PREVIEW_START_MS, Math.min(heuristicStart, maxStart));
}

interface UseDiscoveryQueueProps {
  eventCode: string;
  currentQueue: Track[];
  event?: {
    name?: string;
    theme?: string;
    description?: string;
  };
  djSpotifyToken?: string;
  loadingDiscovery: boolean;
  setLoadingDiscovery: (loading: boolean) => void;
  discoveryQueue: { anthems: Track[] };
  setDiscoveryQueue: (queue: { anthems: Track[] }) => void;
}

/**
 * Hook for managing discovery queue (hidden anthems, deep cuts)
 * Provides curated song suggestions that are theme-appropriate but less obvious
 */
export function useDiscoveryQueue({
  eventCode,
  currentQueue,
  event,
  djSpotifyToken,
  loadingDiscovery,
  setLoadingDiscovery,
  discoveryQueue,
  setDiscoveryQueue
}: UseDiscoveryQueueProps) {

  /**
   * Load discovery queue from backend or generate mock data
   */
  const loadDiscoveryQueue = async () => {
    setLoadingDiscovery(true);
    
    const isTestEvent = eventCode.toUpperCase() === 'POOL';
    
    // Extract Spotify track IDs from queue
    const queueTrackIds = currentQueue
      .filter(track => {
        // Filter for Spotify tracks
        return track.source === 'spotify' || 
               track.source === 'ai' || 
               track.id?.startsWith('spotify:') ||
               (track as any).spotifyTrackId ||
               (track as any).spotify_track_id;
      })
      .map(track => {
        // Extract Spotify ID
        if (track.id?.startsWith('spotify:track:')) {
          return track.id.replace('spotify:track:', '');
        }
        if (track.id?.startsWith('spotify:')) {
          return track.id.replace('spotify:', '');
        }
        return (track as any).spotifyTrackId || (track as any).spotify_track_id || track.id;
      })
      .filter(id => id && id.length > 0);
    
    // If queue is empty, return empty discovery queue
    if (queueTrackIds.length === 0) {
      setDiscoveryQueue({ anthems: [] });
      setLoadingDiscovery(false);
      return;
    }
    
    if (isTestEvent) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // For POOL test event, use mock data
    if (isTestEvent) {
      const mockAnthems: Track[] = [
      {
        id: 'anthem-1',
        title: 'Sunset Lover',
        artist: 'Petit Biscuit',
        album: 'Sunset Lover',
        duration: '3:43',
        matchScore: 72,
        themeMatch: 94,
        energy: 58,
        danceability: 74,
        source: 'ai',
        guestCount: 2,
        popularity: 35,
        passionDescription: 'Perfect theme match but under the radar. Could be a magical moment.',
        key: generateCamelotKey('anthem-1')
      },
      {
        id: 'anthem-2',
        title: 'Feel It Still',
        artist: 'Portugal. The Man',
        album: 'Woodstock',
        duration: '2:43',
        matchScore: 75,
        themeMatch: 91,
        energy: 79,
        danceability: 80,
        source: 'ai',
        guestCount: 3,
        popularity: 52,
        passionDescription: '91% theme match with moderate popularity. Safe creative choice.',
        key: generateCamelotKey('anthem-2')
      },
      {
        id: 'anthem-3',
        title: 'Electric Feel',
        artist: 'MGMT',
        album: 'Oracular Spectacular',
        duration: '3:49',
        matchScore: 77,
        themeMatch: 93,
        energy: 75,
        danceability: 83,
        source: 'ai',
        guestCount: 4,
        popularity: 48,
        passionDescription: 'Fits the vibe perfectly. Not overplayed, but recognizable.',
        key: generateCamelotKey('anthem-3')
      },
      {
        id: 'anthem-4',
        title: 'Island In The Sun',
        artist: 'Weezer',
        album: 'Weezer (Green Album)',
        duration: '3:20',
        matchScore: 73,
        themeMatch: 92,
        energy: 62,
        danceability: 72,
        source: 'ai',
        guestCount: 3,
        popularity: 44,
        passionDescription: 'Summer anthem that matches the pool party theme perfectly.',
        key: generateCamelotKey('anthem-4')
      },
      {
        id: 'anthem-5',
        title: 'Sunset',
        artist: 'The Midnight',
        album: 'Endless Summer',
        duration: '4:27',
        matchScore: 76,
        themeMatch: 96,
        energy: 68,
        danceability: 77,
        source: 'ai',
        guestCount: 2,
        popularity: 38,
        passionDescription: '96% theme match! Perfect for the golden hour moment.',
        key: generateCamelotKey('anthem-5')
      }
      ];

      setDiscoveryQueue({ anthems: mockAnthems });
      setLoadingDiscovery(false);
      return;
    }
    
    // For normal accounts, fetch from backend
    try {
      const response = await eventApi.getDiscoveryQueue(eventCode, queueTrackIds, djSpotifyToken);
      if (response.success && response.data?.anthems) {
        // Add keys to anthems
        const anthemsWithKeys = response.data.anthems.map((anthem: Track & { duration_ms?: number; durationMs?: number }) => {
          const previewUrl = extractPreviewUrl(anthem);
          const durationMs = anthem.duration_ms || anthem.durationMs;

          return {
            ...anthem,
            key: generateCamelotKey(anthem.id || anthem.title || ''),
            previewUrl,
            previewStartMs: anthem.previewStartMs ?? anthem.preview_start_ms ?? estimatePreviewStart(durationMs),
            previewDurationMs: anthem.previewDurationMs ?? anthem.preview_duration_ms ?? DEFAULT_PREVIEW_DURATION_MS,
          };
        });
        setDiscoveryQueue({ anthems: anthemsWithKeys });
        setLoadingDiscovery(false);
        return;
      }
    } catch (error) {
      console.error('Error loading discovery queue:', error);
    }
    
    // If backend fails, return empty (don't use mock data for normal accounts)
    setDiscoveryQueue({ anthems: [] });
    setLoadingDiscovery(false);
  };

  return {
    loadDiscoveryQueue
  };
}
