/**
 * Smart Filters & Quick Presets System
 * Presentation-layer filtering for DJ dashboard recommendations
 */

import { AggregatedTrack, AudioFeatures } from './recommendationEngines';
import { SynergyTrack, MusicalFingerprint } from './discoveryEngine';

/**
 * Smart Filter configuration
 */
export interface SmartFiltersConfig {
  // Content Filter
  noExplicit: boolean;
  
  // Repetition Velocity Control
  repetitionVelocity: 'low' | 'medium' | 'high' | 'off';
  repetitionVelocityN: number; // Custom N value
  
  // Era Bias
  eraBias: string | null; // e.g., "1980s", "1990s", "2000s", "2010s", "2020s"
  eraBiasMultiplier: number; // Score multiplier (e.g., 1.5)
  
  // Audio Feature Modulation
  energyMin: number | null; // 0-1
  energyMax: number | null; // 0-1
  danceabilityMin: number | null; // 0-1
  valenceMin: number | null; // 0-1
  valenceMax: number | null; // 0-1
  
  // Vocal Emphasis
  vocalEmphasis: boolean;
  instrumentalnessMax: number; // Max instrumentalness (e.g., 0.2)
}

/**
 * Track with metadata needed for filtering
 */
export interface FilterableTrack {
  trackId: string;
  name: string;
  artist: string;
  explicit?: boolean;
  releaseYear?: number;
  audioFeatures?: MusicalFingerprint | AudioFeatures;
  score: number; // Original score (APS, Q-Score, or Synergy)
}

/**
 * Play history for artist fatigue tracking
 */
export interface ArtistPlayHistory {
  artist: string;
  playedAt: Date;
  position: number; // How many songs ago (1 = last song)
}

/**
 * Quick Preset definitions
 */
export interface QuickPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: SmartFiltersConfig;
}

/**
 * Default filter configuration (all filters off)
 */
export const DEFAULT_FILTERS: SmartFiltersConfig = {
  noExplicit: false,
  repetitionVelocity: 'off',
  repetitionVelocityN: 5,
  eraBias: null,
  eraBiasMultiplier: 1.5,
  energyMin: null,
  energyMax: null,
  danceabilityMin: null,
  valenceMin: null,
  valenceMax: null,
  vocalEmphasis: false,
  instrumentalnessMax: 0.2
};

/**
 * Quick Presets library
 */
export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'family-friendly',
    name: 'Family Friendly',
    description: 'No explicit content',
    icon: '👨‍👩‍👧‍👦',
    config: {
      ...DEFAULT_FILTERS,
      noExplicit: true
    }
  },
  {
    id: 'high-energy-throwback',
    name: 'High-Energy Throwback',
    description: 'Intense nostalgic hits from 80s-90s',
    icon: '⚡',
    config: {
      ...DEFAULT_FILTERS,
      energyMin: 0.75,
      eraBias: '1980-1999',
      eraBiasMultiplier: 1.8,
      repetitionVelocity: 'low' // Allow multiple hits from iconic artists
    }
  },
  {
    id: 'vocal-showcase',
    name: 'Vocal Showcase',
    description: 'Powerful vocals, wide artist variety',
    icon: '🎤',
    config: {
      ...DEFAULT_FILTERS,
      vocalEmphasis: true,
      instrumentalnessMax: 0.2,
      repetitionVelocity: 'high' // Ensure broad range of artists
    }
  },
  {
    id: 'peak-hour',
    name: 'Peak Hour',
    description: 'Maximum energy and danceability',
    icon: '🔥',
    config: {
      ...DEFAULT_FILTERS,
      energyMin: 0.8,
      danceabilityMin: 0.7,
      repetitionVelocity: 'medium'
    }
  },
  {
    id: 'cool-down',
    name: 'Cool Down / End of Night',
    description: 'Mellow, soulful vibes',
    icon: '🌙',
    config: {
      ...DEFAULT_FILTERS,
      energyMax: 0.5,
      valenceMax: 0.6,
      repetitionVelocity: 'low' // Classic tracks okay
    }
  }
];

/**
 * Get repetition velocity N value
 */
function getRepetitionN(velocity: SmartFiltersConfig['repetitionVelocity'], customN: number): number {
  if (velocity === 'off') return 0;
  if (velocity === 'low') return 3;
  if (velocity === 'medium') return 5;
  if (velocity === 'high') return 10;
  return customN;
}

/**
 * Check if track passes content filter
 */
export function passesContentFilter(
  track: FilterableTrack,
  config: SmartFiltersConfig
): boolean {
  if (!config.noExplicit) return true;
  return !track.explicit;
}

/**
 * Check if track passes repetition velocity filter
 */
export function passesRepetitionFilter(
  track: FilterableTrack,
  playHistory: ArtistPlayHistory[],
  config: SmartFiltersConfig
): boolean {
  const n = getRepetitionN(config.repetitionVelocity, config.repetitionVelocityN);
  if (n === 0) return true; // Filter off
  
  // Check if artist was played in last N songs
  const recentArtistPlays = playHistory
    .filter(p => p.position <= n)
    .filter(p => p.artist.toLowerCase() === track.artist.toLowerCase());
  
  return recentArtistPlays.length === 0;
}

/**
 * Apply era bias multiplier to score
 */
export function applyEraBias(
  track: FilterableTrack,
  config: SmartFiltersConfig
): number {
  if (!config.eraBias || !track.releaseYear) {
    return track.score;
  }
  
  // Parse era string (e.g., "1980s", "1990-1999")
  let startYear: number;
  let endYear: number;
  
  if (config.eraBias.includes('-')) {
    // Range format: "1990-1999"
    const [start, end] = config.eraBias.split('-').map(y => parseInt(y));
    startYear = start;
    endYear = end;
  } else if (config.eraBias.endsWith('s')) {
    // Decade format: "1990s"
    const decade = parseInt(config.eraBias);
    startYear = decade;
    endYear = decade + 9;
  } else {
    // Single year
    startYear = parseInt(config.eraBias);
    endYear = startYear;
  }
  
  // Check if track is in era
  if (track.releaseYear >= startYear && track.releaseYear <= endYear) {
    return track.score * config.eraBiasMultiplier;
  }
  
  return track.score;
}

/**
 * Check if track passes audio feature filters
 */
export function passesAudioFeatureFilters(
  track: FilterableTrack,
  config: SmartFiltersConfig
): boolean {
  const features = track.audioFeatures;
  if (!features) return true; // No features = pass by default
  
  // Energy min/max
  if (config.energyMin !== null && features.energy < config.energyMin) {
    return false;
  }
  if (config.energyMax !== null && features.energy > config.energyMax) {
    return false;
  }
  
  // Danceability min
  if (config.danceabilityMin !== null && features.danceability < config.danceabilityMin) {
    return false;
  }
  
  // Valence min/max
  if (config.valenceMin !== null && features.valence < config.valenceMin) {
    return false;
  }
  if (config.valenceMax !== null && features.valence > config.valenceMax) {
    return false;
  }
  
  // Vocal emphasis (low instrumentalness)
  if (config.vocalEmphasis && features.instrumentalness > config.instrumentalnessMax) {
    return false;
  }
  
  return true;
}

/**
 * Apply all smart filters to a track list
 */
export function applySmartFilters<T extends FilterableTrack>(
  tracks: T[],
  playHistory: ArtistPlayHistory[],
  config: SmartFiltersConfig
): T[] {
  console.log(`🎛️ Applying smart filters to ${tracks.length} tracks...`);
  
  let filtered = tracks;
  const initialCount = tracks.length;
  
  // Step 1: Content filter
  if (config.noExplicit) {
    filtered = filtered.filter(t => passesContentFilter(t, config));
    console.log(`   📵 Content filter: ${initialCount - filtered.length} explicit tracks removed`);
  }
  
  // Step 2: Repetition velocity
  if (config.repetitionVelocity !== 'off') {
    const beforeCount = filtered.length;
    filtered = filtered.filter(t => passesRepetitionFilter(t, playHistory, config));
    console.log(`   🔄 Repetition filter: ${beforeCount - filtered.length} tracks removed (velocity: ${config.repetitionVelocity})`);
  }
  
  // Step 3: Audio feature filters
  const beforeAudioCount = filtered.length;
  filtered = filtered.filter(t => passesAudioFeatureFilters(t, config));
  if (beforeAudioCount - filtered.length > 0) {
    console.log(`   🎚️ Audio filters: ${beforeAudioCount - filtered.length} tracks removed`);
  }
  
  // Step 4: Apply era bias (modulates score, doesn't filter)
  if (config.eraBias) {
    let biasedCount = 0;
    filtered = filtered.map(track => {
      const newScore = applyEraBias(track, config);
      if (newScore !== track.score) biasedCount++;
      return { ...track, score: newScore };
    });
    console.log(`   📅 Era bias: ${biasedCount} tracks boosted for ${config.eraBias}`);
  }
  
  // Re-sort by (possibly modified) score
  filtered.sort((a, b) => b.score - a.score);
  
  console.log(`✅ Smart filters applied: ${filtered.length}/${initialCount} tracks passed`);
  
  return filtered;
}

/**
 * Get active filter count for UI badge
 */
export function getActiveFilterCount(config: SmartFiltersConfig): number {
  let count = 0;
  
  if (config.noExplicit) count++;
  if (config.repetitionVelocity !== 'off') count++;
  if (config.eraBias) count++;
  if (config.energyMin !== null) count++;
  if (config.energyMax !== null) count++;
  if (config.danceabilityMin !== null) count++;
  if (config.valenceMin !== null) count++;
  if (config.valenceMax !== null) count++;
  if (config.vocalEmphasis) count++;
  
  return count;
}

/**
 * Get filter summary for UI display
 */
export function getFilterSummary(config: SmartFiltersConfig): string[] {
  const summary: string[] = [];
  
  if (config.noExplicit) {
    summary.push('No explicit content');
  }
  
  if (config.repetitionVelocity !== 'off') {
    const n = getRepetitionN(config.repetitionVelocity, config.repetitionVelocityN);
    summary.push(`Artist variety: ${config.repetitionVelocity} (${n} songs)`);
  }
  
  if (config.eraBias) {
    summary.push(`Era boost: ${config.eraBias}`);
  }
  
  if (config.energyMin !== null || config.energyMax !== null) {
    const min = config.energyMin !== null ? (config.energyMin * 100).toFixed(0) : '0';
    const max = config.energyMax !== null ? (config.energyMax * 100).toFixed(0) : '100';
    summary.push(`Energy: ${min}%-${max}%`);
  }
  
  if (config.danceabilityMin !== null) {
    summary.push(`Danceability: >${(config.danceabilityMin * 100).toFixed(0)}%`);
  }
  
  if (config.valenceMin !== null || config.valenceMax !== null) {
    const min = config.valenceMin !== null ? (config.valenceMin * 100).toFixed(0) : '0';
    const max = config.valenceMax !== null ? (config.valenceMax * 100).toFixed(0) : '100';
    summary.push(`Mood: ${min}%-${max}%`);
  }
  
  if (config.vocalEmphasis) {
    summary.push('Vocal showcase');
  }
  
  return summary;
}

/**
 * Example/test function
 */
export function testSmartFilters() {
  console.log('🧪 Testing Smart Filters...\n');
  
  // Mock tracks
  const tracks: FilterableTrack[] = [
    {
      trackId: '1',
      name: 'Explicit Banger',
      artist: 'Artist A',
      explicit: true,
      releaseYear: 2020,
      audioFeatures: {
        bpm: 128,
        key: 5,
        mode: 0,
        danceability: 0.9,
        energy: 0.95,
        valence: 0.8,
        loudness: -5,
        acousticness: 0.1,
        instrumentalness: 0.05,
        speechiness: 0.2
      },
      score: 10.0
    },
    {
      trackId: '2',
      name: '80s Classic',
      artist: 'Artist B',
      explicit: false,
      releaseYear: 1985,
      audioFeatures: {
        bpm: 120,
        key: 0,
        mode: 1,
        danceability: 0.75,
        energy: 0.8,
        valence: 0.9,
        loudness: -8,
        acousticness: 0.2,
        instrumentalness: 0.1,
        speechiness: 0.05
      },
      score: 8.5
    },
    {
      trackId: '3',
      name: 'Instrumental Chill',
      artist: 'Artist C',
      explicit: false,
      releaseYear: 2022,
      audioFeatures: {
        bpm: 90,
        key: 2,
        mode: 0,
        danceability: 0.4,
        energy: 0.3,
        valence: 0.4,
        loudness: -12,
        acousticness: 0.7,
        instrumentalness: 0.9,
        speechiness: 0.01
      },
      score: 7.0
    }
  ];
  
  const playHistory: ArtistPlayHistory[] = [];
  
  // Test 1: Family Friendly
  console.log('Test 1: Family Friendly Preset');
  const familyConfig = QUICK_PRESETS.find(p => p.id === 'family-friendly')!.config;
  const familyFiltered = applySmartFilters(tracks, playHistory, familyConfig);
  console.log(`Result: ${familyFiltered.length} tracks\n`);
  
  // Test 2: High-Energy Throwback
  console.log('Test 2: High-Energy Throwback Preset');
  const throwbackConfig = QUICK_PRESETS.find(p => p.id === 'high-energy-throwback')!.config;
  const throwbackFiltered = applySmartFilters(tracks, playHistory, throwbackConfig);
  console.log(`Result: ${throwbackFiltered.length} tracks`);
  throwbackFiltered.forEach(t => {
    console.log(`  - ${t.name}: Score ${t.score.toFixed(2)} (original: ${tracks.find(x => x.trackId === t.trackId)?.score})`);
  });
  console.log();
  
  // Test 3: Vocal Showcase
  console.log('Test 3: Vocal Showcase Preset');
  const vocalConfig = QUICK_PRESETS.find(p => p.id === 'vocal-showcase')!.config;
  const vocalFiltered = applySmartFilters(tracks, playHistory, vocalConfig);
  console.log(`Result: ${vocalFiltered.length} tracks\n`);
  
  // Test 4: Cool Down
  console.log('Test 4: Cool Down Preset');
  const coolDownConfig = QUICK_PRESETS.find(p => p.id === 'cool-down')!.config;
  const coolDownFiltered = applySmartFilters(tracks, playHistory, coolDownConfig);
  console.log(`Result: ${coolDownFiltered.length} tracks\n`);
}
