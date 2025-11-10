// Custom hook for applying smart filters to track lists
// Handles content filtering, artist repetition, era bias, and audio feature filtering
// Performance optimized with useMemo and efficient data structures

import { useMemo } from 'react';
import type { Track, SmartFilters } from './useDJDashboardState';
import { camelotKeyFromAudio } from '@/utils/djDashboardHelpers';
import { createLookupMap } from '@/utils/performanceUtils';

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
    if (!smartFilters.harmonicFlow || !selectedSongForHarmonic) {
      return tracks;
    }

    const getTrackCamelotKey = (track: Track | null): string | null => {
      if (!track) return null;
      if (track.key) return track.key;
      if (typeof track.audioFeatures?.key === 'number') {
        return camelotKeyFromAudio(track.audioFeatures.key, track.audioFeatures.mode ?? null);
      }
      return null;
    };

    const parseCamelotKey = (key: string | null) => {
      if (!key) return null;
      const match = key.match(/^(\d{1,2})([AB])$/i);
      if (!match) return null;
      const number = parseInt(match[1], 10);
      if (Number.isNaN(number)) return null;
      return {
        number: ((number - 1 + 12) % 12) + 1,
        letter: match[2].toUpperCase() as 'A' | 'B'
      };
    };

    const selectedCamelotKey = parseCamelotKey(getTrackCamelotKey(selectedSongForHarmonic));

    if (!selectedCamelotKey) {
      return tracks;
    }

    const evaluateCompatibility = (candidateKey: ReturnType<typeof parseCamelotKey>) => {
      if (!candidateKey) {
        return { score: 0, matchType: 'distant' as const };
      }

      const numberDiff = Math.abs(selectedCamelotKey.number - candidateKey.number);
      const circularDiff = Math.min(numberDiff, 12 - numberDiff);
      const sameLetter = selectedCamelotKey.letter === candidateKey.letter;
      const delta = (candidateKey.number - selectedCamelotKey.number + 12) % 12;

      if (circularDiff === 0 && sameLetter) return { score: 1.0, matchType: 'perfect' as const };
      if (circularDiff === 0) return { score: 0.9, matchType: 'relative' as const };
      if (circularDiff === 1 && sameLetter) {
        return {
          score: 0.8,
          matchType: delta === 1 ? ('energyBoost' as const) : ('energyDrop' as const)
        };
      }
      if (circularDiff === 1) return { score: 0.65, matchType: 'adjacent' as const };
      if (circularDiff === 2 && sameLetter) return { score: 0.5, matchType: 'compatible' as const };
      if (circularDiff === 2) return { score: 0.4, matchType: 'compatible' as const };
      return { score: 0.2, matchType: 'distant' as const }; // minimal compatibility
    };

    const scoredTracks = tracks.map((track, index) => {
      const trackCamelot = parseCamelotKey(getTrackCamelotKey(track));
      const { score, matchType } = evaluateCompatibility(trackCamelot);
      return {
        track,
        score,
        matchType,
        index
      };
    });

    const matches = scoredTracks
      .filter(item => item.score >= 0.4 && item.track.id !== selectedSongForHarmonic.id)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const matchScoreA = a.track.matchScore ?? 0;
        const matchScoreB = b.track.matchScore ?? 0;
        if (matchScoreB !== matchScoreA) return matchScoreB - matchScoreA;
        return a.index - b.index;
      })
      .map((item, orderIndex) => ({
        ...item.track,
        harmonicCompatibilityScore: item.score,
        harmonicMatchType: item.matchType
      }));

    if (matches.length === 0) {
      return tracks;
    }

    const selectedTrack = {
      ...selectedSongForHarmonic,
      harmonicCompatibilityScore: 1,
      harmonicMatchType: 'perfect'
    };

    return [selectedTrack, ...matches];
  }, [smartFilters.harmonicFlow, selectedSongForHarmonic]);

  return {
    applySmartFilters,
    applyHarmonicFlow
  };
}
