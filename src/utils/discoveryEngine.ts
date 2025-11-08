/**
 * Discovery Queue Engine (Creative Co-pilot / Synergy)
 * Suggests tracks based on musical compatibility with DJ's queue
 * Ignores crowd popularity, focuses on audio feature similarity
 */

import { AudioFeatures } from './recommendationEngines';

/**
 * Musical fingerprint - vector of audio features
 */
export interface MusicalFingerprint {
  bpm: number;
  key: number;
  mode: number;
  danceability: number;
  energy: number;
  valence: number;
  loudness: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
}

/**
 * Track with synergy score
 */
export interface SynergyTrack {
  trackId: string;
  name: string;
  artist: string;
  album?: string;
  audioFeatures: MusicalFingerprint;
  synergyScore: number;
  breakdown: {
    cosineSimilarity: number;
    bpmCompatibility: number;
    keyCompatibility: number;
    moodCompatibility: number;
  };
}

/**
 * Seed tracks in DJ queue
 */
export interface SeedTrack {
  trackId: string;
  name: string;
  artist: string;
  audioFeatures: MusicalFingerprint;
  queuePosition: number;
}

/**
 * Calculate average musical fingerprint from seed tracks
 */
export function calculateAverageFingerprint(
  seedTracks: SeedTrack[]
): MusicalFingerprint {
  if (seedTracks.length === 0) {
    throw new Error('Cannot calculate fingerprint from empty seed tracks');
  }
  
  const sum = seedTracks.reduce((acc, track) => ({
    bpm: acc.bpm + track.audioFeatures.bpm,
    key: acc.key + track.audioFeatures.key,
    mode: acc.mode + track.audioFeatures.mode,
    danceability: acc.danceability + track.audioFeatures.danceability,
    energy: acc.energy + track.audioFeatures.energy,
    valence: acc.valence + track.audioFeatures.valence,
    loudness: acc.loudness + track.audioFeatures.loudness,
    acousticness: acc.acousticness + track.audioFeatures.acousticness,
    instrumentalness: acc.instrumentalness + track.audioFeatures.instrumentalness,
    speechiness: acc.speechiness + track.audioFeatures.speechiness
  }), {
    bpm: 0, key: 0, mode: 0, danceability: 0, energy: 0,
    valence: 0, loudness: 0, acousticness: 0, instrumentalness: 0, speechiness: 0
  });
  
  const count = seedTracks.length;
  
  return {
    bpm: sum.bpm / count,
    key: Math.round(sum.key / count), // Round to nearest key
    mode: Math.round(sum.mode / count), // Round to 0 or 1
    danceability: sum.danceability / count,
    energy: sum.energy / count,
    valence: sum.valence / count,
    loudness: sum.loudness / count,
    acousticness: sum.acousticness / count,
    instrumentalness: sum.instrumentalness / count,
    speechiness: sum.speechiness / count
  };
}

/**
 * Convert musical fingerprint to normalized vector for cosine similarity
 */
export function fingerprintToVector(fingerprint: MusicalFingerprint): number[] {
  return [
    fingerprint.bpm / 200,              // Normalize BPM to 0-1 (assume max 200)
    fingerprint.key / 11,                // Normalize key to 0-1 (0-11 keys)
    fingerprint.mode,                    // Already 0 or 1
    fingerprint.danceability,            // Already 0-1
    fingerprint.energy,                  // Already 0-1
    fingerprint.valence,                 // Already 0-1
    (fingerprint.loudness + 60) / 60,    // Normalize loudness (-60 to 0 dB)
    fingerprint.acousticness,            // Already 0-1
    fingerprint.instrumentalness,        // Already 0-1
    fingerprint.speechiness              // Already 0-1
  ];
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between 0 (completely different) and 1 (identical)
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate synergy score with detailed breakdown
 */
export function calculateSynergyScore(
  candidateFingerprint: MusicalFingerprint,
  seedFingerprint: MusicalFingerprint
): {
  synergyScore: number;
  breakdown: SynergyTrack['breakdown'];
} {
  // Convert to vectors
  const candidateVector = fingerprintToVector(candidateFingerprint);
  const seedVector = fingerprintToVector(seedFingerprint);
  
  // Base cosine similarity (60% weight)
  const cosineSim = cosineSimilarity(candidateVector, seedVector);
  
  // BPM compatibility (20% weight)
  const bpmDiff = Math.abs(candidateFingerprint.bpm - seedFingerprint.bpm);
  let bpmCompatibility = 0;
  if (bpmDiff <= 5) bpmCompatibility = 1.0;
  else if (bpmDiff <= 10) bpmCompatibility = 0.8;
  else if (bpmDiff <= 20) bpmCompatibility = 0.6;
  else if (bpmDiff <= 30) bpmCompatibility = 0.4;
  else bpmCompatibility = 0.2;
  
  // Key compatibility (10% weight)
  const keyDist = Math.min(
    Math.abs(candidateFingerprint.key - seedFingerprint.key),
    12 - Math.abs(candidateFingerprint.key - seedFingerprint.key)
  );
  const keyCompatibility = 1 - (keyDist / 6);
  
  // Mood compatibility (10% weight) - energy + valence similarity
  const energyDiff = Math.abs(candidateFingerprint.energy - seedFingerprint.energy);
  const valenceDiff = Math.abs(candidateFingerprint.valence - seedFingerprint.valence);
  const moodCompatibility = 1 - ((energyDiff + valenceDiff) / 2);
  
  // Combined synergy score
  const synergyScore = 
    (cosineSim * 0.6) +
    (bpmCompatibility * 0.2) +
    (keyCompatibility * 0.1) +
    (moodCompatibility * 0.1);
  
  return {
    synergyScore,
    breakdown: {
      cosineSimilarity: cosineSim,
      bpmCompatibility,
      keyCompatibility,
      moodCompatibility
    }
  };
}

/**
 * Generate Discovery Queue recommendations
 */
export function generateDiscoveryQueue(
  seedTracks: SeedTrack[],
  candidateTracks: Array<{
    trackId: string;
    name: string;
    artist: string;
    album?: string;
    audioFeatures: MusicalFingerprint;
  }>,
  options: {
    limit?: number;
    minSynergyScore?: number;
  } = {}
): SynergyTrack[] {
  const { limit = 20, minSynergyScore = 0.5 } = options;
  
  console.log(`🎨 Generating Discovery Queue from ${seedTracks.length} seed tracks...`);
  
  if (seedTracks.length === 0) {
    console.warn('⚠️ No seed tracks provided for Discovery Queue');
    return [];
  }
  
  // Calculate average fingerprint of seed tracks
  const avgFingerprint = calculateAverageFingerprint(seedTracks);
  console.log('🎵 Average fingerprint:', {
    bpm: avgFingerprint.bpm.toFixed(1),
    energy: avgFingerprint.energy.toFixed(2),
    valence: avgFingerprint.valence.toFixed(2)
  });
  
  // Calculate synergy for each candidate
  const synergyTracks: SynergyTrack[] = candidateTracks
    .filter(track => !seedTracks.some(s => s.trackId === track.trackId)) // Exclude seeds
    .map(track => {
      const synergy = calculateSynergyScore(track.audioFeatures, avgFingerprint);
      
      return {
        trackId: track.trackId,
        name: track.name,
        artist: track.artist,
        album: track.album,
        audioFeatures: track.audioFeatures,
        synergyScore: synergy.synergyScore,
        breakdown: synergy.breakdown
      };
    })
    .filter(track => track.synergyScore >= minSynergyScore) // Filter by threshold
    .sort((a, b) => b.synergyScore - a.synergyScore) // Sort by synergy
    .slice(0, limit);
  
  console.log(`✅ Generated ${synergyTracks.length} discovery suggestions`);
  if (synergyTracks.length > 0) {
    console.log(`🎯 Top synergy score: ${synergyTracks[0].synergyScore.toFixed(3)}`);
  }
  
  return synergyTracks;
}

/**
 * Get synergy explanation for UI display
 */
export function getSynergyExplanation(track: SynergyTrack, seedFingerprint: MusicalFingerprint): string {
  const parts: string[] = [];
  
  // BPM
  const bpmDiff = Math.abs(track.audioFeatures.bpm - seedFingerprint.bpm);
  if (bpmDiff <= 5) {
    parts.push('Perfect BPM match');
  } else if (bpmDiff <= 10) {
    parts.push(`Similar tempo (${bpmDiff > 0 ? '+' : ''}${(track.audioFeatures.bpm - seedFingerprint.bpm).toFixed(0)} BPM)`);
  }
  
  // Energy
  if (Math.abs(track.audioFeatures.energy - seedFingerprint.energy) < 0.15) {
    parts.push('Matching energy');
  }
  
  // Mood
  if (Math.abs(track.audioFeatures.valence - seedFingerprint.valence) < 0.15) {
    parts.push('Similar mood');
  }
  
  // Key
  const keyDist = Math.min(
    Math.abs(track.audioFeatures.key - seedFingerprint.key),
    12 - Math.abs(track.audioFeatures.key - seedFingerprint.key)
  );
  if (keyDist <= 1) {
    parts.push('Harmonically compatible');
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Musically similar';
}

/**
 * Example/test function
 */
export function testDiscoveryEngine() {
  console.log('🧪 Testing Discovery Engine...\n');
  
  // Mock seed tracks (DJ's current queue)
  const seedTracks: SeedTrack[] = [
    {
      trackId: 'seed_1',
      name: 'Techno Track 1',
      artist: 'Artist A',
      queuePosition: 1,
      audioFeatures: {
        bpm: 128,
        key: 5, // F
        mode: 0, // Minor
        danceability: 0.8,
        energy: 0.85,
        valence: 0.4,
        loudness: -6,
        acousticness: 0.1,
        instrumentalness: 0.7,
        speechiness: 0.05
      }
    },
    {
      trackId: 'seed_2',
      name: 'Techno Track 2',
      artist: 'Artist B',
      queuePosition: 2,
      audioFeatures: {
        bpm: 130,
        key: 7, // G
        mode: 0,
        danceability: 0.75,
        energy: 0.82,
        valence: 0.45,
        loudness: -5,
        acousticness: 0.05,
        instrumentalness: 0.8,
        speechiness: 0.03
      }
    }
  ];
  
  // Mock candidate tracks
  const candidates = [
    {
      trackId: 'cand_1',
      name: 'Perfect Match',
      artist: 'Artist C',
      audioFeatures: {
        bpm: 129, // Very close
        key: 5, // Same key!
        mode: 0,
        danceability: 0.78,
        energy: 0.83,
        valence: 0.42,
        loudness: -5.5,
        acousticness: 0.08,
        instrumentalness: 0.75,
        speechiness: 0.04
      }
    },
    {
      trackId: 'cand_2',
      name: 'Mood Mismatch',
      artist: 'Artist D',
      audioFeatures: {
        bpm: 128,
        key: 0, // C - distant key
        mode: 1, // Major - different mode
        danceability: 0.5,
        energy: 0.3, // Much lower energy
        valence: 0.9, // Much happier
        loudness: -12,
        acousticness: 0.6,
        instrumentalness: 0.1,
        speechiness: 0.2
      }
    }
  ];
  
  const discoveries = generateDiscoveryQueue(seedTracks, candidates, {
    limit: 10,
    minSynergyScore: 0.3
  });
  
  console.log('\n📊 Discovery Results:');
  discoveries.forEach((track, i) => {
    console.log(`\n${i + 1}. ${track.name} - ${track.artist}`);
    console.log(`   Synergy: ${track.synergyScore.toFixed(3)}`);
    console.log(`   Breakdown:`);
    console.log(`     - Cosine Similarity: ${track.breakdown.cosineSimilarity.toFixed(3)}`);
    console.log(`     - BPM Compatibility: ${track.breakdown.bpmCompatibility.toFixed(3)}`);
    console.log(`     - Key Compatibility: ${track.breakdown.keyCompatibility.toFixed(3)}`);
    console.log(`     - Mood Compatibility: ${track.breakdown.moodCompatibility.toFixed(3)}`);
  });
}
