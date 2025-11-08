// Custom hook for applying smart filters to track lists
// Handles content filtering, artist repetition, era bias, and audio feature filtering
// Performance optimized with useMemo and efficient data structures

import { useMemo } from 'react';
import type { Track, SmartFilters } from './useDJDashboardState';
import { getCompatibleKeys } from '../utils/djDashboardHelpers';
import { createLookupMap } from '../utils/performanceUtils';

interface UseSmartFiltersProps {
  smartFilters: SmartFilters;
  currentQueue: Track[];
  selectedSongForHarmonic: Track | null;
}

/**
 * Hook for applying smart filters to recommendations
 * Filters tracks based on various criteria like explicit content, artist repetition, etc.
 * Performance optimized with useMemo and Set lookups
 */
export function useSmartFilters({
  smartFilters,
  currentQueue,
  selectedSongForHarmonic
}: UseSmartFiltersProps) {

  // Create a Set of recent artists for O(1) lookup instead of O(n)
  const recentArtists = useMemo(() => {
    if (!smartFilters.preventArtistRepetition) return new Set<string>();
    
    const cooldownCount = Math.floor(smartFilters.artistCooldownMinutes / 3);
    return new Set(
      currentQueue
        .slice(-cooldownCount)
        .map(song => song.artist)
    );
  }, [currentQueue, smartFilters.preventArtistRepetition, smartFilters.artistCooldownMinutes]);

  /**
   * Apply smart filters to a list of tracks
   * Memoized to avoid recalculation when tracks or filters haven't changed
   */
  const applySmartFilters = useMemo(() => (tracks: Track[]): Track[] => {
    let filtered = [...tracks];

    // Content Filter - no explicit content
    if (smartFilters.noExplicit) {
      filtered = filtered.filter(track => !track.explicit);
    }

    // Repetition Velocity Control - prevent artist repetition
    // Uses pre-computed Set for O(1) lookups
    if (smartFilters.preventArtistRepetition && recentArtists.size > 0) {
      filtered = filtered.filter(track => !recentArtists.has(track.artist));
    }

    // Eras Bias - filter by decade
    if (smartFilters.eraFilterEnabled) {
      filtered = filtered.filter(track => {
        const year = track.releaseYear || new Date().getFullYear();
        const decade = Math.floor(year / 10) * 10;
        return decade >= smartFilters.eraMinDecade && decade <= smartFilters.eraMaxDecade;
      });
    }

    // Energy filter
    if (smartFilters.minEnergy > 0 || smartFilters.maxEnergy < 100) {
      filtered = filtered.filter(track => {
        const energy = track.energy || 50;
        return energy >= smartFilters.minEnergy && energy <= smartFilters.maxEnergy;
      });
    }

    // Danceability filter
    if (smartFilters.minDanceability > 0 || smartFilters.maxDanceability < 100) {
      filtered = filtered.filter(track => {
        const danceability = track.danceability || 50;
        return danceability >= smartFilters.minDanceability && danceability <= smartFilters.maxDanceability;
      });
    }

    // Valence (mood) filter
    if (smartFilters.minValence > 0 || smartFilters.maxValence < 100) {
      filtered = filtered.filter(track => {
        const valence = track.valence || 50;
        return valence >= smartFilters.minValence && valence <= smartFilters.maxValence;
      });
    }

    // Vocal Focus - prioritize tracks with vocals
    if (smartFilters.vocalFocus) {
      // Sort by instrumentalness (lower = more vocals)
      filtered = filtered.sort((a, b) => {
        const aInst = a.instrumentalness || 0.5;
        const bInst = b.instrumentalness || 0.5;
        return aInst - bInst;
      });
    }

    return filtered;
  }, [smartFilters, recentArtists]);

  /**
   * Apply harmonic flow filtering to recommendations
   * Memoized to avoid recalculation
   */
  const applyHarmonicFlow = useMemo(() => (tracks: Track[]): Track[] => {
    if (!smartFilters.harmonicFlow || !selectedSongForHarmonic || !selectedSongForHarmonic.key) {
      return tracks;
    }

    const selectedKey = selectedSongForHarmonic.key;
    const compatibleKeys = getCompatibleKeys(selectedKey);
    
    // Filter to only show harmonically compatible tracks
    const harmonicMatches = tracks.filter(song => {
      if (!song.key) return false;
      return song.key === compatibleKeys.perfect || 
             song.key === compatibleKeys.energyBoost || 
             song.key === compatibleKeys.energyDrop;
    });
    
    // Show selected song + 3 compatible tracks (one of each type if possible)
    const perfectMatch = harmonicMatches.find(s => s.key === compatibleKeys.perfect && s.id !== selectedSongForHarmonic.id);
    const energyBoost = harmonicMatches.find(s => s.key === compatibleKeys.energyBoost);
    const energyDrop = harmonicMatches.find(s => s.key === compatibleKeys.energyDrop);
    
    return [
      selectedSongForHarmonic,
      ...[perfectMatch, energyBoost, energyDrop].filter(Boolean) as Track[]
    ].slice(0, 4);
  }, [smartFilters.harmonicFlow, selectedSongForHarmonic]);

  return {
    applySmartFilters,
    applyHarmonicFlow
  };
}
