/**
 * Personal Taste Score (PTS) Calculation System
 * Quantifies the importance of each track to an individual user
 */

export type RecencyTimeframe = 'short_term' | 'medium_term' | 'long_term';

export interface TrackWithMetadata {
  id: string;
  name: string;
  artist: string;
  rank: number; // 1-100
  timeframe: RecencyTimeframe;
  isSaved: boolean;
  userId: string;
  album?: string;
  genres?: string[];
  audioFeatures?: any;
}

export interface PTSResult {
  trackId: string;
  userId: string;
  baseRankScore: number;
  recencyMultiplier: number;
  savedBonus: number;
  finalPTS: number;
  breakdown: {
    rank: number;
    timeframe: RecencyTimeframe;
    isSaved: boolean;
  };
}

/**
 * Base Rank Score - Exponential decay function
 * Models that a user's #1 song is significantly more important than their #50 song
 * 
 * Formula: e^(-k(r-1))
 * Where:
 *   r = rank of the song (1 to 100)
 *   k = decay constant (default 0.05)
 */
export function calculateBaseRankScore(rank: number, decayConstant: number = 0.05): number {
  if (rank < 1 || rank > 100) {
    console.warn(`Invalid rank ${rank}, clamping to 1-100`);
    rank = Math.max(1, Math.min(100, rank));
  }
  
  // e^(-k(r-1))
  const score = Math.exp(-decayConstant * (rank - 1));
  
  return score;
}

/**
 * Get Recency Multiplier based on listening timeframe
 * 
 * Short-Term (last 4 weeks): 1.5x - Most recent preferences
 * Medium-Term (last 6 months): 1.2x - Recent but established preferences
 * Long-Term (all-time): 1.0x - Historical favorites
 */
export function getRecencyMultiplier(timeframe: RecencyTimeframe): number {
  const multipliers: Record<RecencyTimeframe, number> = {
    short_term: 1.5,
    medium_term: 1.2,
    long_term: 1.0
  };
  
  return multipliers[timeframe] || 1.0;
}

/**
 * Get Saved Bonus multiplier
 * Tracks in user's "Liked Songs" or "Saved Songs" get a boost
 */
export function getSavedBonus(isSaved: boolean): number {
  return isSaved ? 1.1 : 1.0;
}

/**
 * Calculate complete Personal Taste Score for a single track
 * 
 * PTS = (BaseRankScore) × (RecencyMultiplier) × (SavedBonus)
 */
export function calculatePTS(track: TrackWithMetadata): PTSResult {
  const baseRankScore = calculateBaseRankScore(track.rank);
  const recencyMultiplier = getRecencyMultiplier(track.timeframe);
  const savedBonus = getSavedBonus(track.isSaved);
  
  const finalPTS = baseRankScore * recencyMultiplier * savedBonus;
  
  return {
    trackId: track.id,
    userId: track.userId,
    baseRankScore,
    recencyMultiplier,
    savedBonus,
    finalPTS,
    breakdown: {
      rank: track.rank,
      timeframe: track.timeframe,
      isSaved: track.isSaved
    }
  };
}

/**
 * Calculate PTS for multiple tracks
 * Returns sorted by PTS (highest first)
 */
export function calculateBatchPTS(tracks: TrackWithMetadata[]): PTSResult[] {
  const results = tracks.map(track => calculatePTS(track));
  
  // Sort by PTS descending
  return results.sort((a, b) => b.finalPTS - a.finalPTS);
}

/**
 * Aggregate PTS scores for the same track from multiple users
 * Returns combined score and contributing users
 */
export function aggregateTrackPTS(ptsResults: PTSResult[]): Map<string, {
  trackId: string;
  totalPTS: number;
  averagePTS: number;
  userCount: number;
  userContributions: { userId: string; pts: number }[];
}> {
  const trackMap = new Map<string, PTSResult[]>();
  
  // Group by track ID
  for (const result of ptsResults) {
    if (!trackMap.has(result.trackId)) {
      trackMap.set(result.trackId, []);
    }
    trackMap.get(result.trackId)!.push(result);
  }
  
  // Aggregate scores
  const aggregated = new Map();
  
  for (const [trackId, results] of trackMap.entries()) {
    const totalPTS = results.reduce((sum, r) => sum + r.finalPTS, 0);
    const averagePTS = totalPTS / results.length;
    const userContributions = results.map(r => ({
      userId: r.userId,
      pts: r.finalPTS
    }));
    
    aggregated.set(trackId, {
      trackId,
      totalPTS,
      averagePTS,
      userCount: results.length,
      userContributions
    });
  }
  
  return aggregated;
}

/**
 * Get top N tracks by aggregated PTS
 */
export function getTopTracksByPTS(
  ptsResults: PTSResult[],
  limit: number = 50
): Array<{
  trackId: string;
  totalPTS: number;
  averagePTS: number;
  userCount: number;
}> {
  const aggregated = aggregateTrackPTS(ptsResults);
  
  return Array.from(aggregated.values())
    .sort((a, b) => b.totalPTS - a.totalPTS)
    .slice(0, limit);
}

/**
 * Visual representation of PTS breakdown
 * Useful for debugging and UI display
 */
export function formatPTSBreakdown(pts: PTSResult): string {
  const lines = [
    `Track: ${pts.trackId}`,
    `User: ${pts.userId}`,
    `─────────────────────`,
    `Rank: #${pts.breakdown.rank}`,
    `Base Score: ${pts.baseRankScore.toFixed(4)}`,
    `Timeframe: ${pts.breakdown.timeframe} (${pts.recencyMultiplier}x)`,
    `Saved: ${pts.breakdown.isSaved ? 'Yes' : 'No'} (${pts.savedBonus}x)`,
    `─────────────────────`,
    `Final PTS: ${pts.finalPTS.toFixed(4)}`
  ];
  
  return lines.join('\n');
}

/**
 * Calculate expected score range for different scenarios
 * Useful for UI feedback and validation
 */
export function getPTSScoreRanges() {
  return {
    // Rank 1, short-term, saved
    best: calculatePTS({
      id: 'test',
      name: 'Test',
      artist: 'Test',
      rank: 1,
      timeframe: 'short_term',
      isSaved: true,
      userId: 'test'
    }).finalPTS, // ~1.65
    
    // Rank 50, medium-term, not saved
    average: calculatePTS({
      id: 'test',
      name: 'Test',
      artist: 'Test',
      rank: 50,
      timeframe: 'medium_term',
      isSaved: false,
      userId: 'test'
    }).finalPTS, // ~0.097
    
    // Rank 100, long-term, not saved
    worst: calculatePTS({
      id: 'test',
      name: 'Test',
      artist: 'Test',
      rank: 100,
      timeframe: 'long_term',
      isSaved: false,
      userId: 'test'
    }).finalPTS // ~0.0067
  };
}

/**
 * Example usage and test cases
 */
export function testPTSCalculations() {
  console.log('🧪 Testing PTS Calculations...\n');
  
  // Test Case 1: Top track, recent, saved
  const topTrack: TrackWithMetadata = {
    id: 'track_1',
    name: 'Favorite Song',
    artist: 'Artist A',
    rank: 1,
    timeframe: 'short_term',
    isSaved: true,
    userId: 'user_123'
  };
  
  const topPTS = calculatePTS(topTrack);
  console.log('Test 1: Top Track');
  console.log(formatPTSBreakdown(topPTS));
  console.log('\n');
  
  // Test Case 2: Mid-ranked track
  const midTrack: TrackWithMetadata = {
    id: 'track_2',
    name: 'Regular Song',
    artist: 'Artist B',
    rank: 25,
    timeframe: 'medium_term',
    isSaved: false,
    userId: 'user_123'
  };
  
  const midPTS = calculatePTS(midTrack);
  console.log('Test 2: Mid-Ranked Track');
  console.log(formatPTSBreakdown(midPTS));
  console.log('\n');
  
  // Test Case 3: Low-ranked track
  const lowTrack: TrackWithMetadata = {
    id: 'track_3',
    name: 'Occasional Song',
    artist: 'Artist C',
    rank: 75,
    timeframe: 'long_term',
    isSaved: false,
    userId: 'user_123'
  };
  
  const lowPTS = calculatePTS(lowTrack);
  console.log('Test 3: Low-Ranked Track');
  console.log(formatPTSBreakdown(lowPTS));
  console.log('\n');
  
  // Show score ranges
  const ranges = getPTSScoreRanges();
  console.log('📊 PTS Score Ranges:');
  console.log(`Best possible: ${ranges.best.toFixed(4)}`);
  console.log(`Average: ${ranges.average.toFixed(4)}`);
  console.log(`Worst: ${ranges.worst.toFixed(4)}`);
}
