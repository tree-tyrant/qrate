// Custom hook for managing event insights and recommendations
// Extracted to separate business logic from UI

import { useEffect } from 'react';
import { toast } from 'sonner';
import { eventApi, utils } from '../utils/api';
import { camelotKeyFromAudio, generateCamelotKey } from '../utils/djDashboardHelpers';
import type { Track } from './useDJDashboardState';

const MIN_PREVIEW_START_MS = 15000;
const DEFAULT_PREVIEW_START_MS = 30000;
const DEFAULT_PREVIEW_DURATION_MS = 20000;

function getPreviewUrlFromRecommendation(rec: any): string | undefined {
  return (
    rec.song?.preview_url ||
    rec.song?.previewUrl ||
    rec.preview_url ||
    rec.previewUrl ||
    rec.song?.external_preview_url ||
    rec.external_preview_url
  );
}

function getPreviewDurationMs(rec: any): number | undefined {
  return rec.song?.preview_duration_ms || rec.preview_duration_ms || rec.song?.previewDurationMs || rec.previewDurationMs;
}

function estimatePreviewStartMs(rec: any): number | undefined {
  const explicitOffset = rec.song?.chorus_offset_ms || rec.song?.chorusOffsetMs || rec.chorus_offset_ms || rec.chorusOffsetMs;
  if (typeof explicitOffset === 'number' && explicitOffset >= 0) {
    return explicitOffset;
  }

  const durationMs =
    rec.song?.duration_ms ||
    rec.song?.durationMs ||
    rec.duration_ms ||
    rec.durationMs ||
    (typeof rec.song?.duration === 'number' ? rec.song.duration : undefined);

  if (typeof durationMs === 'number' && durationMs > 0) {
    const heuristicStart = Math.round(durationMs * 0.4);
    const maxStart = Math.max(0, durationMs - DEFAULT_PREVIEW_DURATION_MS);
    return Math.max(MIN_PREVIEW_START_MS, Math.min(heuristicStart, maxStart));
  }

  return DEFAULT_PREVIEW_START_MS;
}

interface UseEventInsightsProps {
  eventCode: string;
  eventGuestCount: number;
  eventPreferences: any[];
  loadingInsights: boolean;
  setLoadingInsights: (loading: boolean) => void;
  recommendations: Track[];
  setRecommendations: (recs: Track[]) => void;
  insights: any;
  setInsights: (insights: any) => void;
  setPreviousCrowdScore: (score: number) => void;
  refreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;
  hasNewUpdates: boolean;
  setHasNewUpdates: (hasUpdates: boolean) => void;
  setPreviousRecommendations: (recs: Track[]) => void;
  setPreviousRanks: (ranks: Map<string, number>) => void;
  setActiveTab: (tab: string) => void;
  newGuestsToAdd: number;
  setNewGuestsToAdd: (count: number) => void;
}

/**
 * Hook for managing event insights and AI recommendations
 * Handles loading, refreshing, and updating recommendations based on guest preferences
 */
export function useEventInsightsManagement({
  eventCode,
  eventGuestCount,
  eventPreferences,
  loadingInsights,
  setLoadingInsights,
  recommendations,
  setRecommendations,
  insights,
  setInsights,
  setPreviousCrowdScore,
  refreshing,
  setRefreshing,
  hasNewUpdates,
  setHasNewUpdates,
  setPreviousRecommendations,
  setPreviousRanks,
  setActiveTab,
  newGuestsToAdd,
  setNewGuestsToAdd
}: UseEventInsightsProps) {

  /**
   * Load event insights and recommendations from backend or mock data
   */
  const loadEventInsights = async () => {
    setLoadingInsights(true);
    
    // Add delay for Pool Party demo event to make it look like AI is processing
    const isTestEvent = eventCode.toUpperCase() === 'POOL';
    
    if (isTestEvent) {
      await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 second delay
    }
    
    try {
      const response = await eventApi.getInsights(eventCode);
      if (response.success && response.data?.insights) {
        setInsights(response.data.insights);
        if (response.data.insights.recommendations && response.data.insights.recommendations.length > 0) {
          setRecommendations(response.data.insights.recommendations.map((rec: any, index: number) => {
            const baseId = rec.song?.id || rec.id || `rec-${index}-${Date.now()}`;
            const featureKey = rec.audioFeatures?.key;
            const featureMode = rec.audioFeatures?.mode;
            const audioFeatures = {
              danceability: rec.audioFeatures?.danceability ?? (Math.random() * 0.4 + 0.6),
              energy: rec.audioFeatures?.energy ?? (Math.random() * 0.4 + 0.5),
              valence: rec.audioFeatures?.valence ?? (Math.random() * 0.6 + 0.3),
              tempo: rec.audioFeatures?.tempo ?? rec.audioFeatures?.bpm ?? (Math.random() * 80 + 100),
              key: typeof featureKey === 'number' ? featureKey : undefined,
              mode: typeof featureMode === 'number' ? featureMode : undefined
            };
            const camelotKey =
              camelotKeyFromAudio(audioFeatures.key ?? null, audioFeatures.mode ?? null) ||
              (typeof rec.song?.camelotKey === 'string' ? rec.song.camelotKey : undefined) ||
              (typeof rec.song?.key === 'string' ? rec.song.key : undefined) ||
              generateCamelotKey(baseId);

            return {
              id: baseId,
              name: rec.song?.name,
              title: rec.song?.name,
              artists: rec.song?.artists,
              artist: Array.isArray(rec.song?.artists) ? rec.song.artists.join(', ') : rec.song?.artists?.[0] || 'Unknown Artist',
              album: rec.song?.album || 'Unknown Album',
              duration: utils.formatDuration((rec.song?.duration_ms || 180000)),
              matchScore: Math.round(rec.averageScore || rec.song?.weight || 75),
              guestCount: rec.guestCount || 1,
              playlistCount: rec.playlistCount || Math.floor(Math.random() * 25) + 1,
              crowdAffinity: rec.crowdAffinity || Math.floor(Math.random() * 40) + 60,
              transitionSongs: rec.transitionSongs || [],
              audioFeatures,
              key: camelotKey,
              reasons: [
                `${rec.guestCount || 1} guest${(rec.guestCount || 1) > 1 ? 's' : ''} love this`,
                rec.averageScore > 80 ? 'High crowd match' : 'Good crowd match',
                'AI recommended'
              ],
              energy: Math.round((audioFeatures.energy || 0.7) * 100),
              danceability: Math.round((audioFeatures.danceability || 0.75) * 100),
              source: 'ai' as const,
              weight: rec.song?.weight,
              popularity: rec.song?.popularity,
              previewUrl: getPreviewUrlFromRecommendation(rec),
              previewStartMs: estimatePreviewStartMs(rec),
              previewDurationMs: getPreviewDurationMs(rec),
            };
          }));
          console.log('✅ Loaded AI recommendations from backend:', response.data.insights.recommendations.length);
          setLoadingInsights(false);
          return;
        }
      }
      
      console.log('ℹ️ No backend recommendations available');
    } catch (error) {
      console.error('Error loading event insights:', error);
    }
    
    // Only show mock data if event has actual guests/preferences
    const hasRealData = eventGuestCount > 0 || eventPreferences.length > 0;
    
    if (!hasRealData) {
      console.log('ℹ️ No guest data yet - showing empty state for recommendations');
      setInsights(null);
      setRecommendations([]);
      setLoadingInsights(false);
      return;
    }
    
    // Only show mock data for test event (POOL code)
    if (recommendations.length === 0 && isTestEvent) {
      // Load mock data for POOL test event
      loadMockData();
    }
    
    setLoadingInsights(false);
  };

  /**
   * Load mock data for testing purposes
   */
  const loadMockData = () => {
    setInsights({
      totalGuests: eventGuestCount || 5,
      topGenres: [
        { name: 'Reggae', weight: 52, percentage: 78 },
        { name: 'R&B', weight: 45, percentage: 67 },
        { name: 'Merengue', weight: 38, percentage: 56 }
      ],
      topArtists: [
        { name: 'Kygo', weight: 42, count: 5, appearances: 3, crowdPresence: 60 },
        { name: 'Robin Schulz', weight: 38, count: 4, appearances: 2, crowdPresence: 40 },
        { name: 'Lost Frequencies', weight: 35, count: 4, appearances: 4, crowdPresence: 80 }
      ],
      topDecades: [
        { decade: '2010s', percentage: 62 },
        { decade: '2020s', percentage: 25 },
        { decade: '2000s', percentage: 8 },
        { decade: '1990s', percentage: 5 }
      ],
      energyLevel: 87,
      danceability: 84,
      crowdAffinity: 92,
      audienceProfile: {
        avgPopularity: 84,
        profile: 'Mainstream Hits',
        insight: 'This crowd loves anthems. Stick to the hits and well-known remixes for the biggest reaction.'
      }
    });
    
    // Create mock recommendations with keys
    const mockRecommendations: Track[] = [
      { id: 'ai-1', title: 'Firestone', artist: 'Kygo ft. Conrad Sewell', album: 'Cloud Nine', duration: '4:11', matchScore: 96, themeMatch: 93, energy: 75, danceability: 82, source: 'ai', guestCount: 5, playlistCount: 23, crowdAffinity: 96, topTrackForGuests: 5 },
      { id: 'ai-2', title: 'Sugar', artist: 'Robin Schulz ft. Francesco Yates', album: 'Sugar', duration: '3:35', matchScore: 94, themeMatch: 91, energy: 78, danceability: 85, source: 'ai', guestCount: 4, playlistCount: 19, crowdAffinity: 90, recentPlays: 4 },
      { id: 'ai-3', title: 'Are You With Me', artist: 'Lost Frequencies', album: 'Less Is More', duration: '3:14', matchScore: 92, themeMatch: 89, energy: 72, danceability: 80, source: 'ai', guestCount: 4, playlistCount: 17, crowdAffinity: 88, trendingRecent: true },
      { id: 'ai-4', title: 'Fast Car', artist: 'Jonas Blue ft. Dakota', album: 'Blue', duration: '3:33', matchScore: 90, themeMatch: 87, energy: 76, danceability: 78, source: 'ai', guestCount: 3, playlistCount: 15 },
      { id: 'ai-5', title: 'Jubel', artist: 'Klingande', album: 'Jubel', duration: '3:19', matchScore: 89, themeMatch: 86, energy: 74, danceability: 82, source: 'ai', guestCount: 3, topTrackForGuests: 2 },
      { id: 'ai-6', title: 'This Girl', artist: 'Kungs vs Cookin\' On 3 Burners', album: 'Layers', duration: '3:15', matchScore: 87, themeMatch: 84, energy: 80, danceability: 85, source: 'ai', guestCount: 3, recentPlays: 3 },
      { id: 'ai-7', title: 'Show Me Love', artist: 'Sam Feldt ft. Kimberly Anne', album: 'Show Me Love', duration: '3:03', matchScore: 85, themeMatch: 82, energy: 73, danceability: 79, source: 'ai', guestCount: 2, playlistCount: 14 },
      { id: 'ai-8', title: 'Stole the Show', artist: 'Kygo ft. Parson James', album: 'Cloud Nine', duration: '3:44', matchScore: 84, themeMatch: 81, energy: 71, danceability: 77, source: 'ai', guestCount: 3, playlistCount: 15, losingInfluence: true },
      { id: 'ai-9', title: 'Summer', artist: 'Calvin Harris', album: 'Motion', duration: '3:43', matchScore: 83, themeMatch: 80, energy: 82, danceability: 81, source: 'ai', guestCount: 4, playlistCount: 21, crowdAffinity: 88, recentPlays: 2 },
      { id: 'ai-10', title: 'Prayer in C', artist: 'Lilly Wood & The Prick (Robin Schulz Remix)', album: 'Prayer in C', duration: '3:13', matchScore: 82, themeMatch: 79, energy: 70, danceability: 75, source: 'ai', guestCount: 3, playlistCount: 18, crowdAffinity: 84 },
      { id: 'ai-11', title: 'Stolen Dance', artist: 'Milky Chance', album: 'Sadnecessary', duration: '3:14', matchScore: 80, themeMatch: 75, energy: 68, danceability: 74, source: 'ai', guestCount: 2, playlistCount: 16, crowdAffinity: 82, topTrackForGuests: 1 },
      { id: 'ai-12', title: 'Outside', artist: 'Calvin Harris ft. Ellie Goulding', album: 'Motion', duration: '3:44', matchScore: 79, themeMatch: 76, energy: 77, danceability: 76, source: 'ai', guestCount: 3, playlistCount: 19, crowdAffinity: 83 },
      { id: 'ai-13', title: 'Lean On', artist: 'Major Lazer & DJ Snake ft. MØ', album: 'Peace Is The Mission', duration: '2:56', matchScore: 78, themeMatch: 77, energy: 75, danceability: 78, source: 'ai', guestCount: 4, playlistCount: 22, crowdAffinity: 86 },
      { id: 'ai-14', title: 'Hey Brother', artist: 'Avicii', album: 'True', duration: '4:15', matchScore: 77, themeMatch: 74, energy: 72, danceability: 73, source: 'ai', guestCount: 2, playlistCount: 14, crowdAffinity: 80 }
    ];
    
    // Add keys to all recommendations
    const recommendationsWithKeys = mockRecommendations.map((song, index) => {
      const numericKey = index % 12;
      const mode = index % 2 === 0 ? 1 : 0;
      const camelotKey = camelotKeyFromAudio(numericKey, mode) || generateCamelotKey(song.id);

      return {
        ...song,
        key: camelotKey,
        audioFeatures: {
          energy: (song.energy ?? 70) / 100,
          danceability: (song.danceability ?? 70) / 100,
          valence: song.themeMatch ? Math.min(0.95, Math.max(0.05, song.themeMatch / 100)) : 0.6,
          tempo: 110 + (index * 4) % 30,
          key: numericKey,
          mode
        }
      };
    });
    
    // Sort by matchScore descending
    setRecommendations(recommendationsWithKeys.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)));
    
    // Track crowd score for trend detection
    if (insights?.crowdAffinity !== undefined) {
      setPreviousCrowdScore(insights.crowdAffinity);
    }
  };

  /**
   * Refresh recommendations with dynamic score changes
   */
  const refreshRecommendations = async () => {
    setRefreshing(true);
    setHasNewUpdates(false);
    setPreviousRecommendations([...recommendations]);
    setActiveTab('recommendations');
    
    // Store current ranks before update
    const currentRanks = new Map<string, number>();
    recommendations.forEach((song, index) => {
      currentRanks.set(song.id, index + 1);
    });
    
    // Simulate dynamic updates
    setTimeout(() => {
      setRecommendations(prev => {
        const updated = prev.map(song => {
          const scoreChange = (Math.random() * 14) + 8;
          const direction = Math.random() > 0.5 ? 1 : -1;
          
          return {
            ...song,
            matchScore: Math.max(30, Math.min(95, (song.matchScore || 75) + (scoreChange * direction))),
            themeMatch: Math.max(30, Math.min(95, (song.themeMatch || 75) + (Math.random() * 10 - 5))),
            guestCount: song.guestCount ? song.guestCount + Math.floor(Math.random() * 3) : song.guestCount,
            playlistCount: song.playlistCount ? song.playlistCount + Math.floor(Math.random() * 2) : song.playlistCount
          };
        });
        
        const sorted = updated.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        
        return sorted.map((song, newIndex) => {
          const newRank = newIndex + 1;
          const previousRank = currentRanks.get(song.id);
          let rankChange = undefined;
          
          if (previousRank !== undefined) {
            rankChange = previousRank - newRank;
          }
          
          return { ...song, rankChange };
        });
      });
      
      setPreviousRanks(currentRanks);
      
      // Update insights with dynamic values
      if (insights) {
        const currentCrowdAffinity = insights.crowdAffinity || 92;
        setPreviousCrowdScore(currentCrowdAffinity);
        
        const newCrowdAffinity = Math.max(80, Math.min(98, currentCrowdAffinity + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3 + 1)));
        
        setInsights({
          ...insights,
          crowdAffinity: newCrowdAffinity,
          totalGuests: (insights.totalGuests || eventGuestCount || 0) + newGuestsToAdd
        });
        
        setNewGuestsToAdd(0);
      }
    }, 800);
    
    await loadEventInsights();
    setRefreshing(false);
  };

  return {
    loadEventInsights,
    refreshRecommendations
  };
}
