// Custom hook for managing discovery queue
// Handles loading and managing hidden anthems and deep cuts

import { eventApi } from '../utils/api';
import { generateCamelotKey } from '../utils/djDashboardHelpers';
import type { Track } from './useDJDashboardState';

interface UseDiscoveryQueueProps {
  eventCode: string;
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
    
    if (isTestEvent) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    try {
      // Try to get discovery data from backend
      const response = await eventApi.getInsights(eventCode);
      if (response.success && response.data?.discoveryQueue) {
        setDiscoveryQueue(response.data.discoveryQueue);
        setLoadingDiscovery(false);
        return;
      }
    } catch (error) {
      console.error('Error loading discovery queue:', error);
    }

    // Fallback to mock data
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
  };

  return {
    loadDiscoveryQueue
  };
}
