/**
 * QRate Recommendation Engines
 * Two parallel engines for DJ dashboard: Party Hits & Mix Assist
 */

import { applyContextualWeighting, type GuestArrival, type EventConfig } from './contextualWeighting';
import { type GuestContribution } from './types';

/**
 * Track with aggregated popularity across all guests
 */
export interface AggregatedTrack {
  trackId: string;
  name: string;
  artist: string;
  album?: string;
  // Aggregate Popularity Score
  aps: number;
  // Contributing guests
  contributors: Array<{
    userId: string;
    displayName: string;
    basePTS: number;
    weightedPTS: number;
    timeDecayMultiplier: number;
    cohort: number;
    presenceStatus: 'present' | 'absent' | 'unknown';
  }>;
  // Metadata
  userCount: number;
  avgPTS: number;
  topContributor: string;
  // Flow compatibility (calculated relative to current track)
  flowScore?: number;
  bpmDiff?: number;
  keyCompatibility?: string;
  // Disqualification penalties
  repeatPenalty: number;
  artistFatigue: number;
  totalPenalty: number;
  // Final scores
  rankingScore?: number; // For Hitfinder mode
  qScore?: number; // For Mix Assist mode
}

/**
 * Audio features for a track
 */
export interface AudioFeatures {
  bpm: number;
  key: number; // 0-11 (C, C#, D, etc.)
  mode: number; // 0 = minor, 1 = major
  danceability: number;
  energy: number;
  valence: number;
  loudness: number;
  acousticness: number;
  instrumentalness: number;
}

/**
 * Currently playing track context
 */
export interface CurrentTrack {
  trackId: string;
  name: string;
  artist: string;
  audioFeatures: AudioFeatures;
  playedAt: Date;
}

/**
 * Recent play history for penalty calculation
 */
export interface PlayHistory {
  trackId: string;
  artist: string;
  playedAt: Date;
}

/**
 * DJ weight preferences
 */
export interface DJWeights {
  popularityWeight: number; // wa (0-1)
  flowWeight: number; // wf (0-1)
}

/**
 * Engine configuration
 */
export interface EngineConfig {
  mode: 'hitfinder' | 'mix-assist';
  weights: DJWeights;
  repeatWindowHours: number; // Penalty window for repeats
  artistFatigueCount: number; // Recent artist plays to check
  enableFlowScore: boolean; // Toggle flow scoring
}

/**
 * Calculate Aggregate Popularity Score (APS) for a track
 * APS = Σ(PTSi × TimeDecayMultiplieri) for all users with the track
 */
export function calculateAPS(
  trackId: string,
  guestContributions: GuestContribution[],
  eventConfig: EventConfig,
  currentTime: Date = new Date()
): {
  aps: number;
  contributors: AggregatedTrack['contributors'];
  userCount: number;
  avgPTS: number;
} {
  const contributors: AggregatedTrack['contributors'] = [];
  let totalWeightedPTS = 0;
  let totalBasePTS = 0;
  
  for (const guest of guestContributions) {
    // Find track in guest's contribution
    const track = guest.tracks.find(t => t.id === trackId);
    if (!track || !track.pts) continue;
    
    // Apply contextual weighting (time decay based on presence)
    const guestArrival: GuestArrival = {
      userId: guest.userId,
      arrivalTime: new Date(guest.arrivalTime),
      cohortIndex: guest.cohortIndex,
      presenceStatus: guest.presenceStatus,
      lastLocationUpdate: guest.lastLocationUpdate ? new Date(guest.lastLocationUpdate) : undefined,
      coordinates: guest.coordinates
    };
    
    const weighted = applyContextualWeighting(
      track.pts,
      guestArrival,
      eventConfig,
      undefined,
      currentTime
    );
    
    contributors.push({
      userId: guest.userId,
      displayName: guest.displayName,
      basePTS: track.pts,
      weightedPTS: weighted.weightedPTS,
      timeDecayMultiplier: weighted.timeDecayMultiplier,
      cohort: guest.cohortIndex,
      presenceStatus: weighted.metadata.presenceStatus
    });
    
    totalWeightedPTS += weighted.weightedPTS;
    totalBasePTS += track.pts;
  }
  
  const aps = totalWeightedPTS;
  const userCount = contributors.length;
  const avgPTS = userCount > 0 ? totalBasePTS / userCount : 0;
  
  return { aps, contributors, userCount, avgPTS };
}

/**
 * Calculate Flow Score (0-1) for harmonic mixing compatibility
 */
export function calculateFlowScore(
  candidateTrack: AudioFeatures,
  currentTrack: AudioFeatures
): {
  flowScore: number;
  bpmSimilarity: number;
  harmonicCompatibility: number;
  breakdown: {
    bpmDiff: number;
    keyDistance: number;
    energyDiff: number;
  };
} {
  // BPM Similarity (0-1)
  const bpmDiff = Math.abs(candidateTrack.bpm - currentTrack.bpm);
  let bpmSimilarity = 0;
  
  if (bpmDiff <= 5) {
    bpmSimilarity = 1.0; // Perfect match
  } else if (bpmDiff <= 10) {
    bpmSimilarity = 0.8; // Very good
  } else if (bpmDiff <= 20) {
    bpmSimilarity = 0.6; // Good
  } else if (bpmDiff <= 30) {
    bpmSimilarity = 0.4; // Acceptable
  } else {
    bpmSimilarity = 0.2; // Poor
  }
  
  // Harmonic Compatibility using Camelot Wheel / Circle of Fifths
  const keyDistance = calculateKeyDistance(
    candidateTrack.key,
    candidateTrack.mode,
    currentTrack.key,
    currentTrack.mode
  );
  
  let harmonicCompatibility = 0;
  
  if (keyDistance === 0) {
    harmonicCompatibility = 1.0; // Same key
  } else if (keyDistance === 1) {
    harmonicCompatibility = 0.9; // Adjacent key (perfect mix)
  } else if (keyDistance === 2) {
    harmonicCompatibility = 0.7; // Compatible
  } else if (keyDistance === 3) {
    harmonicCompatibility = 0.5; // Usable
  } else {
    harmonicCompatibility = 0.3; // Difficult
  }
  
  // Energy compatibility (prevent jarring jumps)
  const energyDiff = Math.abs(candidateTrack.energy - currentTrack.energy);
  const energyBonus = energyDiff < 0.3 ? 0.1 : 0; // Bonus for similar energy
  
  // Combined flow score (60% harmonic, 30% BPM, 10% energy)
  const flowScore = Math.min(1.0,
    (harmonicCompatibility * 0.6) +
    (bpmSimilarity * 0.3) +
    (energyBonus * 0.1)
  );
  
  return {
    flowScore,
    bpmSimilarity,
    harmonicCompatibility,
    breakdown: {
      bpmDiff,
      keyDistance,
      energyDiff
    }
  };
}

/**
 * Calculate key distance using Camelot Wheel logic
 * Returns 0-6 representing musical distance
 */
function calculateKeyDistance(
  key1: number,
  mode1: number,
  key2: number,
  mode2: number
): number {
  // Camelot wheel positions (0-23)
  const camelot1 = keytoCamelot(key1, mode1);
  const camelot2 = keytoCamelot(key2, mode2);
  
  // Calculate circular distance
  const diff = Math.abs(camelot1 - camelot2);
  const distance = Math.min(diff, 24 - diff);
  
  // Map to 0-6 scale
  return Math.min(6, Math.floor(distance / 2));
}

/**
 * Convert musical key + mode to Camelot wheel position
 */
function keytoCamelot(key: number, mode: number): number {
  // Simplified Camelot mapping
  // Major keys: 0-11, Minor keys: 12-23
  if (mode === 1) {
    // Major
    return key;
  } else {
    // Minor
    return key + 12;
  }
}

/**
 * Calculate disqualification penalties
 */
export function calculatePenalties(
  trackId: string,
  artist: string,
  playHistory: PlayHistory[],
  config: EngineConfig,
  currentTime: Date = new Date()
): {
  repeatPenalty: number;
  artistFatigue: number;
  totalPenalty: number;
} {
  let repeatPenalty = 0;
  let artistFatigue = 0;
  
  const windowMs = config.repeatWindowHours * 60 * 60 * 1000;
  const recentPlays = playHistory.filter(
    p => (currentTime.getTime() - p.playedAt.getTime()) < windowMs
  );
  
  // Repeat Penalty: Large penalty if track was played recently
  const trackRepeats = recentPlays.filter(p => p.trackId === trackId);
  if (trackRepeats.length > 0) {
    const hoursSincePlay = (currentTime.getTime() - trackRepeats[0].playedAt.getTime()) / (1000 * 60 * 60);
    // Massive penalty if < 1 hour, decreasing over time
    repeatPenalty = Math.max(0, 10 - (hoursSincePlay / config.repeatWindowHours * 10));
  }
  
  // Artist Fatigue: Smaller penalty for recent artist plays
  const artistPlays = recentPlays
    .filter(p => p.artist.toLowerCase() === artist.toLowerCase())
    .slice(0, config.artistFatigueCount);
  
  if (artistPlays.length > 0) {
    // Penalty scales with number of recent plays
    artistFatigue = artistPlays.length * 0.5;
  }
  
  const totalPenalty = repeatPenalty + artistFatigue;
  
  return { repeatPenalty, artistFatigue, totalPenalty };
}

/**
 * Mode 1: Hitfinder View
 * RankingScore = (wa × APS) - D
 * Ignores flow, focuses on crowd popularity
 */
export function calculateHitfinderScore(
  aps: number,
  penalties: { totalPenalty: number },
  weights: DJWeights
): number {
  return (weights.popularityWeight * aps) - penalties.totalPenalty;
}

/**
 * Mode 2: Mix Assist View
 * QScore = (wa × APS) + (wf × FlowScore) - D
 * Balances popularity with harmonic mixing
 */
export function calculateMixAssistScore(
  aps: number,
  flowScore: number,
  penalties: { totalPenalty: number },
  weights: DJWeights
): number {
  return (weights.popularityWeight * aps) + (weights.flowWeight * flowScore * 10) - penalties.totalPenalty;
}

/**
 * Generate Party Hits recommendations
 * Complete engine that processes all contributions and returns ranked tracks
 */
export function generatePartyHits(
  guestContributions: GuestContribution[],
  eventConfig: EventConfig,
  playHistory: PlayHistory[],
  currentTrack: CurrentTrack | null,
  config: EngineConfig,
  audioFeaturesMap: Map<string, AudioFeatures> = new Map()
): AggregatedTrack[] {
  console.log(`🎵 Generating Party Hits (${config.mode} mode)...`);
  console.log(`📊 Processing ${guestContributions.length} guest contributions`);
  
  // Collect all unique tracks
  const trackMap = new Map<string, AggregatedTrack>();
  
  for (const guest of guestContributions) {
    for (const track of guest.tracks) {
      if (!trackMap.has(track.id)) {
        // First time seeing this track - calculate APS
        const apsData = calculateAPS(track.id, guestContributions, eventConfig);
        const penalties = calculatePenalties(track.id, track.artist, playHistory, config);
        
        trackMap.set(track.id, {
          trackId: track.id,
          name: track.name,
          artist: track.artist,
          album: undefined,
          aps: apsData.aps,
          contributors: apsData.contributors,
          userCount: apsData.userCount,
          avgPTS: apsData.avgPTS,
          topContributor: apsData.contributors[0]?.displayName || 'Unknown',
          repeatPenalty: penalties.repeatPenalty,
          artistFatigue: penalties.artistFatigue,
          totalPenalty: penalties.totalPenalty
        });
      }
    }
  }
  
  const tracks = Array.from(trackMap.values());
  console.log(`🎼 Found ${tracks.length} unique tracks`);
  
  // Calculate scores based on mode
  if (config.mode === 'hitfinder') {
    // Hitfinder: Just APS - Penalty
    for (const track of tracks) {
      track.rankingScore = calculateHitfinderScore(
        track.aps,
        { totalPenalty: track.totalPenalty },
        config.weights
      );
    }
    
    // Sort by ranking score
    tracks.sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
    
  } else if (config.mode === 'mix-assist' && currentTrack) {
    // Mix Assist: APS + FlowScore - Penalty
    for (const track of tracks) {
      const audioFeatures = audioFeaturesMap.get(track.trackId);
      
      if (audioFeatures && currentTrack.audioFeatures) {
        const flow = calculateFlowScore(audioFeatures, currentTrack.audioFeatures);
        track.flowScore = flow.flowScore;
        track.bpmDiff = flow.breakdown.bpmDiff;
        track.keyCompatibility = flow.harmonicCompatibility > 0.8 ? 'Perfect' :
                                 flow.harmonicCompatibility > 0.6 ? 'Good' :
                                 flow.harmonicCompatibility > 0.4 ? 'OK' : 'Difficult';
        
        track.qScore = calculateMixAssistScore(
          track.aps,
          flow.flowScore,
          { totalPenalty: track.totalPenalty },
          config.weights
        );
      } else {
        // No audio features - fallback to Hitfinder mode
        track.flowScore = 0;
        track.qScore = calculateHitfinderScore(
          track.aps,
          { totalPenalty: track.totalPenalty },
          config.weights
        );
      }
    }
    
    // Sort by Q-Score
    tracks.sort((a, b) => (b.qScore || 0) - (a.qScore || 0));
  }
  
  console.log(`✅ Party Hits generated: Top track has APS ${tracks[0]?.aps.toFixed(2)}`);
  
  return tracks;
}

/**
 * Default DJ weight presets
 */
export const DJ_PRESETS = {
  crowdPleaser: {
    popularityWeight: 0.9,
    flowWeight: 0.1
  },
  balanced: {
    popularityWeight: 0.6,
    flowWeight: 0.4
  },
  technical: {
    popularityWeight: 0.3,
    flowWeight: 0.7
  },
  purist: {
    popularityWeight: 0.1,
    flowWeight: 0.9
  }
};

/**
 * Default engine configuration
 */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  mode: 'hitfinder',
  weights: DJ_PRESETS.balanced,
  repeatWindowHours: 3,
  artistFatigueCount: 3,
  enableFlowScore: true
};

/**
 * Example usage and testing
 */
export function testRecommendationEngines() {
  console.log('🧪 Testing Recommendation Engines...\n');
  
  // Mock data
  const mockContributions: GuestContribution[] = [
    {
      userId: 'user_1',
      spotifyUserId: 'spotify_1',
      displayName: 'Alice',
      arrivalTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      cohortIndex: 0,
      presenceStatus: 'present',
      tracks: [
        { id: 'track_1', name: 'Track 1', artist: 'Artist A', rank: 1, timeframe: 'short_term', isSaved: true, pts: 1.65 },
        { id: 'track_2', name: 'Track 2', artist: 'Artist B', rank: 2, timeframe: 'short_term', isSaved: false, pts: 1.56 }
      ]
    },
    {
      userId: 'user_2',
      spotifyUserId: 'spotify_2',
      displayName: 'Bob',
      arrivalTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      cohortIndex: 1,
      presenceStatus: 'present',
      tracks: [
        { id: 'track_1', name: 'Track 1', artist: 'Artist A', rank: 5, timeframe: 'medium_term', isSaved: false, pts: 1.0 },
        { id: 'track_3', name: 'Track 3', artist: 'Artist C', rank: 1, timeframe: 'short_term', isSaved: true, pts: 1.65 }
      ]
    }
  ];
  
  const eventConfig: EventConfig = {
    eventId: 'test',
    startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
    eventSize: 'large',
    geoFenceEnabled: false
  };
  
  const config = DEFAULT_ENGINE_CONFIG;
  
  const hits = generatePartyHits(mockContributions, eventConfig, [], null, config);
  
  console.log('\n📊 Party Hits Results:');
  hits.forEach((track, i) => {
    console.log(`${i + 1}. ${track.name} - ${track.artist}`);
    console.log(`   APS: ${track.aps.toFixed(2)}, Users: ${track.userCount}, Score: ${track.rankingScore?.toFixed(2)}`);
  });
}
