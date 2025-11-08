import { VibeProfile, TrackValidationResult, VibeStrictness } from './types';

/**
 * Vibe Gate Algorithm
 * Pre-filters tracks based on thematic profile to prevent dilution
 */

// Common genre mappings and aliases
const GENRE_ALIASES: Record<string, string[]> = {
  'r&b': ['r&b', 'rnb', 'rhythm and blues', 'contemporary r&b', 'soul'],
  'hip-hop': ['hip-hop', 'hip hop', 'rap', 'trap', 'drill'],
  'electronic': ['electronic', 'edm', 'house', 'techno', 'trance', 'dubstep'],
  'rock': ['rock', 'alternative rock', 'indie rock', 'hard rock', 'punk rock'],
  'pop': ['pop', 'synth-pop', 'electropop', 'indie pop'],
  'jazz': ['jazz', 'smooth jazz', 'jazz fusion', 'bebop'],
  'country': ['country', 'country rock', 'bluegrass'],
  'latin': ['latin', 'reggaeton', 'salsa', 'bachata', 'latin pop'],
  'dance': ['dance', 'dance pop', 'club', 'disco'],
  'funk': ['funk', 'funk rock', 'p-funk']
};

/**
 * Calculate contribution sizing based on number of users
 * Formula: max(10, min(100, round(500/numUsers)))
 */
export function calculateTracksPerPerson(numUsers: number): number {
  if (numUsers <= 0) return 50; // Default fallback
  const calculated = Math.round(500 / numUsers);
  return Math.max(10, Math.min(100, calculated));
}

/**
 * Normalize genre string for comparison
 */
function normalizeGenre(genre: string): string {
  return genre.toLowerCase().trim();
}

/**
 * Check if a genre matches any of the allowed genres (including aliases)
 */
function genreMatches(trackGenre: string, allowedGenres: string[]): boolean {
  const normalizedTrack = normalizeGenre(trackGenre);
  
  for (const allowed of allowedGenres) {
    const normalizedAllowed = normalizeGenre(allowed);
    
    // Direct match
    if (normalizedTrack.includes(normalizedAllowed) || normalizedAllowed.includes(normalizedTrack)) {
      return true;
    }
    
    // Check aliases
    const aliases = GENRE_ALIASES[normalizedAllowed] || [normalizedAllowed];
    for (const alias of aliases) {
      if (normalizedTrack.includes(alias) || alias.includes(normalizedTrack)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if track contains blocked keywords
 */
function containsBlockedKeywords(track: any, keywords: string[]): boolean {
  const searchText = `${track.name} ${track.artist} ${track.album || ''}`.toLowerCase();
  return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
}

/**
 * Check if track contains desired keywords
 */
function containsDesiredKeywords(track: any, keywords: string[]): boolean {
  if (keywords.length === 0) return true; // No requirement
  const searchText = `${track.name} ${track.artist} ${track.album || ''}`.toLowerCase();
  return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
}

/**
 * Extract release year from track
 */
function getTrackYear(track: any): number | null {
  if (track.releaseDate) {
    const year = new Date(track.releaseDate).getFullYear();
    return isNaN(year) ? null : year;
  }
  if (track.album?.release_date) {
    const year = new Date(track.album.release_date).getFullYear();
    return isNaN(year) ? null : year;
  }
  return null;
}

/**
 * Main Vibe Gate validation function
 * Validates a track against the vibe profile
 */
export function validateTrackAgainstVibe(
  track: any,
  vibeProfile: VibeProfile
): TrackValidationResult {
  const reasons: string[] = [];
  let score = 100; // Start with perfect score
  
  // Extract track metadata
  const trackGenres = track.genres || track.artist_genres || [];
  const trackYear = getTrackYear(track);
  const trackTempo = track.tempo || track.audio_features?.tempo;
  const trackEnergy = track.energy ?? track.audio_features?.energy;
  const trackDanceability = track.danceability ?? track.audio_features?.danceability;
  const isExplicit = track.explicit || false;

  // Strictness determines how many criteria must pass
  const strictnessThresholds: Record<VibeStrictness, number> = {
    strict: 90,  // Must score 90%+
    loose: 60,   // Must score 60%+
    open: 30     // Must score 30%+
  };

  // 1. EXPLICIT CONTENT CHECK (Hard block regardless of strictness)
  if (!vibeProfile.allowExplicit && isExplicit) {
    reasons.push('Explicit content not allowed');
    return { passed: false, track, score: 0, reasons };
  }

  // 2. BLOCKED KEYWORDS (Hard block)
  if (vibeProfile.excludeKeywords.length > 0) {
    if (containsBlockedKeywords(track, vibeProfile.excludeKeywords)) {
      reasons.push('Contains blocked keywords');
      return { passed: false, track, score: 0, reasons };
    }
  }

  // 3. GENRE VALIDATION (Weight: 40 points)
  if (vibeProfile.allowedGenres.length > 0) {
    const genreMatched = trackGenres.some((genre: string) => 
      genreMatches(genre, vibeProfile.allowedGenres)
    );
    
    if (!genreMatched) {
      score -= 40;
      reasons.push(`Genre mismatch (expected: ${vibeProfile.allowedGenres.join(', ')})`);
    } else {
      reasons.push('✓ Genre match');
    }
  }

  // 4. BLOCKED GENRES (Hard block for strict mode)
  if (vibeProfile.blockedGenres.length > 0) {
    const hasBlockedGenre = trackGenres.some((genre: string) => 
      genreMatches(genre, vibeProfile.blockedGenres)
    );
    
    if (hasBlockedGenre) {
      if (vibeProfile.strictness === 'strict') {
        reasons.push('Contains blocked genre');
        return { passed: false, track, score: 0, reasons };
      } else {
        score -= 30;
        reasons.push('Contains discouraged genre');
      }
    }
  }

  // 5. YEAR RANGE VALIDATION (Weight: 20 points)
  if (vibeProfile.yearRange && trackYear) {
    const { min, max } = vibeProfile.yearRange;
    if ((min && trackYear < min) || (max && trackYear > max)) {
      score -= 20;
      reasons.push(`Year out of range (${trackYear}, expected: ${min}-${max})`);
    } else {
      reasons.push(`✓ Year match (${trackYear})`);
    }
  }

  // 6. TEMPO VALIDATION (Weight: 10 points)
  if (vibeProfile.tempoRange && trackTempo) {
    const { min, max } = vibeProfile.tempoRange;
    if ((min && trackTempo < min) || (max && trackTempo > max)) {
      score -= 10;
      reasons.push(`Tempo out of range (${trackTempo} BPM)`);
    } else {
      reasons.push('✓ Tempo match');
    }
  }

  // 7. ENERGY VALIDATION (Weight: 10 points)
  if (vibeProfile.energy && trackEnergy !== undefined) {
    const { min, max } = vibeProfile.energy;
    if ((min && trackEnergy < min) || (max && trackEnergy > max)) {
      score -= 10;
      reasons.push(`Energy out of range (${(trackEnergy * 100).toFixed(0)}%)`);
    } else {
      reasons.push('✓ Energy match');
    }
  }

  // 8. DANCEABILITY VALIDATION (Weight: 10 points)
  if (vibeProfile.danceability && trackDanceability !== undefined) {
    const { min, max } = vibeProfile.danceability;
    if ((min && trackDanceability < min) || (max && trackDanceability > max)) {
      score -= 10;
      reasons.push(`Danceability out of range (${(trackDanceability * 100).toFixed(0)}%)`);
    } else {
      reasons.push('✓ Danceability match');
    }
  }

  // 9. DESIRED KEYWORDS (Weight: 10 points bonus)
  if (vibeProfile.keywords.length > 0) {
    if (containsDesiredKeywords(track, vibeProfile.keywords)) {
      score += 10;
      reasons.push('✓ Contains desired keywords');
    }
  }

  // Determine pass/fail based on strictness
  const threshold = strictnessThresholds[vibeProfile.strictness];
  const passed = score >= threshold;

  if (!passed) {
    reasons.push(`Score ${score}% below threshold ${threshold}% for ${vibeProfile.strictness} mode`);
  }

  return { passed, track, score, reasons };
}

/**
 * Filter a batch of tracks through the Vibe Gate
 */
export function filterTracksThroughVibeGate(
  tracks: any[],
  vibeProfile: VibeProfile
): {
  passed: any[];
  failed: any[];
  stats: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  };
} {
  const results = tracks.map(track => validateTrackAgainstVibe(track, vibeProfile));
  
  const passed = results.filter(r => r.passed).map(r => r.track);
  const failed = results.filter(r => !r.passed).map(r => r.track);
  
  return {
    passed,
    failed,
    stats: {
      total: tracks.length,
      passed: passed.length,
      failed: failed.length,
      passRate: tracks.length > 0 ? (passed.length / tracks.length) * 100 : 0
    }
  };
}

/**
 * Create a default vibe profile from event theme
 */
export function createVibeProfileFromTheme(theme: string, eventName: string): VibeProfile {
  const normalizedTheme = theme.toLowerCase();
  const normalizedName = eventName.toLowerCase();
  
  // Detect common themes and generate appropriate profiles
  const profile: VibeProfile = {
    strictness: 'loose',
    allowedGenres: [],
    blockedGenres: [],
    keywords: [],
    excludeKeywords: [],
    allowExplicit: true
  };

  // 90s R&B example
  if (normalizedTheme.includes('90s') || normalizedTheme.includes('1990s')) {
    profile.yearRange = { min: 1990, max: 1999 };
    profile.strictness = 'strict';
  }

  // R&B detection
  if (normalizedTheme.includes('r&b') || normalizedTheme.includes('rnb')) {
    profile.allowedGenres.push('r&b', 'soul');
  }

  // Hip-Hop detection
  if (normalizedTheme.includes('hip-hop') || normalizedTheme.includes('rap')) {
    profile.allowedGenres.push('hip-hop', 'rap');
  }

  // Electronic/EDM detection
  if (normalizedTheme.includes('electronic') || normalizedTheme.includes('edm') || 
      normalizedTheme.includes('house') || normalizedTheme.includes('techno')) {
    profile.allowedGenres.push('electronic', 'house', 'techno');
    profile.energy = { min: 0.6, max: 1.0 };
  }

  // Chill/Relax detection
  if (normalizedTheme.includes('chill') || normalizedTheme.includes('relax') || 
      normalizedTheme.includes('lounge')) {
    profile.energy = { min: 0.0, max: 0.6 };
    profile.tempoRange = { min: 60, max: 120 };
  }

  // Party/Dance detection
  if (normalizedTheme.includes('party') || normalizedTheme.includes('dance')) {
    profile.energy = { min: 0.6, max: 1.0 };
    profile.danceability = { min: 0.6, max: 1.0 };
  }

  // Workout detection
  if (normalizedTheme.includes('workout') || normalizedTheme.includes('gym')) {
    profile.energy = { min: 0.7, max: 1.0 };
    profile.tempoRange = { min: 120, max: 180 };
  }

  return profile;
}

/**
 * Get human-readable description of vibe profile
 */
export function getVibeProfileDescription(profile: VibeProfile): string {
  const parts: string[] = [];

  if (profile.allowedGenres.length > 0) {
    parts.push(`Genres: ${profile.allowedGenres.join(', ')}`);
  }

  if (profile.yearRange) {
    const { min, max } = profile.yearRange;
    if (min && max) {
      parts.push(`Years: ${min}-${max}`);
    } else if (min) {
      parts.push(`After ${min}`);
    } else if (max) {
      parts.push(`Before ${max}`);
    }
  }

  if (profile.energy) {
    const { min, max } = profile.energy;
    parts.push(`Energy: ${((min || 0) * 100).toFixed(0)}%-${((max || 1) * 100).toFixed(0)}%`);
  }

  if (profile.tempoRange) {
    const { min, max } = profile.tempoRange;
    parts.push(`Tempo: ${min || 0}-${max || 200} BPM`);
  }

  parts.push(`Mode: ${profile.strictness}`);

  return parts.join(' • ');
}
