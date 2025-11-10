/**
 * Spotify + PTS Integration
 * Connects Spotify OAuth data with Personal Taste Score system
 */

import { calculatePTS, calculateBatchPTS, type TrackWithMetadata, type PTSResult } from './personalTasteScore';
import { filterTracksThroughVibeGate, calculateTracksPerPerson } from './vibeGate';
import { VibeProfile, GuestContribution } from './types';

/**
 * Transform Spotify API response into PTS-compatible format
 * Combines tracks from all timeframes with proper ranking
 */
export function transformSpotifyDataForPTS(spotifyUserData: any): TrackWithMetadata[] {
  const allTracks: TrackWithMetadata[] = [];
  const savedTrackIds = new Set(
    (spotifyUserData.saved_tracks || []).map((t: any) => t.id)
  );
  const followedArtistIds = new Set(
    (spotifyUserData.followed_artists || []).map((artist: any) => artist.id)
  );
  const userId = spotifyUserData.profile?.id || 'anonymous';
  const seenTrackIds = new Set<string>();
  
  let currentRank = 1;

  const normalizeAudioFeatures = (features: any | undefined) => {
    if (!features) return undefined;
    return {
      tempo: features.tempo ?? null,
      energy: features.energy ?? null,
      danceability: features.danceability ?? null,
      acousticness: features.acousticness ?? null,
      instrumentalness: features.instrumentalness ?? null,
      liveness: features.liveness ?? null,
      loudness: features.loudness ?? null,
      speechiness: features.speechiness ?? null,
      valence: features.valence ?? null,
      key: features.key ?? null,
      mode: features.mode ?? null,
      timeSignature: features.time_signature ?? features.timeSignature ?? null,
      durationMs: features.duration_ms ?? features.durationMs ?? null
    };
  };

  const collectGenres = (track: any): string[] => {
    const direct = Array.isArray(track?.genres) ? track.genres : [];
    const artistGenres = (track?.artists || [])
      .flatMap((artist: any) => artist?.genres || [])
      .filter(Boolean);
    return Array.from(new Set([...direct, ...artistGenres]));
  };

  const addTrack = (track: any, timeframe: 'short_term' | 'medium_term' | 'long_term') => {
    if (!track || !track.id || seenTrackIds.has(track.id)) {
      return;
    }

    const rawAudioFeatures = track.audioFeatures || track.audio_features;
    const audioFeatures = normalizeAudioFeatures(rawAudioFeatures);
    const genres = collectGenres(track);
    const releaseDate = track.release_date || track.album?.release_date;
    const explicit = Boolean(track.explicit);
    const isFollowedArtist = (track.artists || []).some(
      (artist: any) => artist?.id && followedArtistIds.has(artist.id)
    );

    const metadata: TrackWithMetadata = {
      id: track.id,
      name: track.name,
      artist: track.artists?.[0]?.name || 'Unknown Artist',
      rank: currentRank++,
      timeframe,
      isSaved: savedTrackIds.has(track.id),
      isFollowedArtist,
      userId,
      album: track.album?.name,
      genres,
      audioFeatures,
      explicit,
      releaseDate,
      popularity: track.popularity,
      tempo: audioFeatures?.tempo ?? undefined,
      energy: audioFeatures?.energy ?? undefined,
      danceability: audioFeatures?.danceability ?? undefined
    };

    if (rawAudioFeatures) {
      metadata.audio_features = rawAudioFeatures;
    }

    seenTrackIds.add(track.id);
    allTracks.push(metadata);
  };
  
  // Priority 1: Short-term tracks (last 4 weeks) - Ranks 1-50
  const shortTermTracks = spotifyUserData.top_tracks?.short_term || [];
  shortTermTracks.slice(0, 50).forEach((track: any) => addTrack(track, 'short_term'));
  
  // Priority 2: Medium-term tracks (last 6 months) - Fill remaining slots
  const mediumTermTracks = spotifyUserData.top_tracks?.medium_term || [];
  for (const track of mediumTermTracks) {
    if (allTracks.length >= 100) break;
    addTrack(track, 'medium_term');
  }
  
  // Priority 3: Long-term tracks (all-time) - Fill remaining slots
  const longTermTracks = spotifyUserData.top_tracks?.long_term || [];
  for (const track of longTermTracks) {
    if (allTracks.length >= 100) break;
    addTrack(track, 'long_term');
  }
  
  return allTracks;
}

/**
 * Process guest's Spotify data through complete PTS pipeline
 * Returns ready-to-submit guest contribution
 */
export function processGuestSpotifyData(
  spotifyUserData: any,
  options: {
    vibeProfile?: VibeProfile;
    guestCount?: number;
    coordinates?: { lat: number; lon: number };
  } = {}
): {
  contribution: GuestContribution;
  stats: {
    totalTracks: number;
    contributionSize: number;
    vibeGatePassed: number;
    vibeGatePassRate: number;
    averagePTS: number;
    topPTS: number;
  };
} {
  const { vibeProfile, guestCount = 25, coordinates } = options;
  
  console.log('🎵 Processing Spotify data for PTS system...');
  
  // Step 1: Transform Spotify data to PTS format
  const allTracks = transformSpotifyDataForPTS(spotifyUserData);
  console.log(`📊 Transformed ${allTracks.length} tracks from Spotify data`);
  
  // Step 2: Calculate contribution sizing
  const tracksPerPerson = calculateTracksPerPerson(guestCount);
  const limitedTracks = allTracks.slice(0, tracksPerPerson);
  console.log(`📏 Contribution size: ${tracksPerPerson} tracks (${guestCount} guests)`);
  
  // Step 3: Apply Vibe Gate filter (if configured)
  // DEBUG: Vibe gate filtering disabled for debugging
  let filteredTracks = limitedTracks;
  let vibeGateStats = { passed: limitedTracks.length, total: limitedTracks.length, passRate: 100 };
  
  // if (vibeProfile) {
  //   const vibeResult = filterTracksThroughVibeGate(limitedTracks, vibeProfile);
  //   filteredTracks = vibeResult.passed;
  //   vibeGateStats = vibeResult.stats;
  //   
  //   console.log(`🚪 Vibe Gate: ${vibeGateStats.passed}/${vibeGateStats.total} passed (${vibeGateStats.passRate.toFixed(1)}%)`);
  //   
  //   if (vibeGateStats.passed === 0) {
  //     console.warn('⚠️ Warning: No tracks passed Vibe Gate! Consider loosening restrictions.');
  //   }
  // }
  
  // Step 4: Calculate PTS for each track
  const ptsResults = calculateBatchPTS(filteredTracks);
  console.log(`🔢 Calculated PTS for ${ptsResults.length} tracks`);
  
  // Step 5: Calculate statistics
  const avgPTS = ptsResults.length > 0
    ? ptsResults.reduce((sum, r) => sum + r.finalPTS, 0) / ptsResults.length
    : 0;
  const topPTS = ptsResults.length > 0 ? ptsResults[0].finalPTS : 0;
  
  // Step 6: Create guest contribution
  const contribution: GuestContribution = {
    userId: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    spotifyUserId: spotifyUserData.profile?.id || 'unknown',
    displayName: spotifyUserData.profile?.display_name || 'Anonymous Guest',
    arrivalTime: new Date().toISOString(),
    cohortIndex: 0, // Will be calculated by backend based on event start time
    presenceStatus: coordinates ? 'unknown' : 'unknown', // Backend will update with geo-fence
    lastLocationUpdate: coordinates ? new Date().toISOString() : undefined,
    coordinates,
    tracks: ptsResults.map(result => ({
      id: result.trackId,
      name: filteredTracks.find(t => t.id === result.trackId)?.name || 'Unknown',
      artist: filteredTracks.find(t => t.id === result.trackId)?.artist || 'Unknown',
      rank: result.breakdown.rank,
      timeframe: result.breakdown.timeframe,
      isSaved: result.breakdown.isSaved,
      isFollowedArtist: result.breakdown.isFollowedArtist,
      pts: result.finalPTS,
      weightedPTS: result.finalPTS // Backend will apply contextual weighting
    }))
  };
  
  const stats = {
    totalTracks: allTracks.length,
    contributionSize: limitedTracks.length,
    vibeGatePassed: vibeGateStats.passed,
    vibeGatePassRate: vibeGateStats.passRate,
    averagePTS: avgPTS,
    topPTS: topPTS
  };
  
  console.log('✅ PTS processing complete:', stats);
  
  return { contribution, stats };
}

/**
 * Get summary statistics for display
 */
export function getContributionSummary(contribution: GuestContribution): {
  trackCount: number;
  avgPTS: number;
  topTrack: {
    name: string;
    artist: string;
    pts: number;
  } | null;
  timeframeBreakdown: {
    short_term: number;
    medium_term: number;
    long_term: number;
  };
  savedCount: number;
} {
  const tracks = contribution.tracks;
  
  const avgPTS = tracks.length > 0
    ? tracks.reduce((sum, t) => sum + (t.pts || 0), 0) / tracks.length
    : 0;
  
  const topTrack = tracks.length > 0 && tracks[0]
    ? {
        name: tracks[0].name,
        artist: tracks[0].artist,
        pts: tracks[0].pts || 0
      }
    : null;
  
  const timeframeBreakdown = {
    short_term: tracks.filter(t => t.timeframe === 'short_term').length,
    medium_term: tracks.filter(t => t.timeframe === 'medium_term').length,
    long_term: tracks.filter(t => t.timeframe === 'long_term').length
  };
  
  const savedCount = tracks.filter(t => t.isSaved).length;
  
  return {
    trackCount: tracks.length,
    avgPTS,
    topTrack,
    timeframeBreakdown,
    savedCount
  };
}

/**
 * Validate Spotify user data before processing
 */
export function validateSpotifyData(spotifyUserData: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!spotifyUserData) {
    errors.push('No Spotify data provided');
    return { valid: false, errors };
  }
  
  if (!spotifyUserData.profile) {
    errors.push('Missing user profile');
  }
  
  if (!spotifyUserData.top_tracks) {
    errors.push('Missing top tracks data');
  } else {
    const totalTracks = 
      (spotifyUserData.top_tracks.short_term?.length || 0) +
      (spotifyUserData.top_tracks.medium_term?.length || 0) +
      (spotifyUserData.top_tracks.long_term?.length || 0);
    
    if (totalTracks === 0) {
      errors.push('No top tracks found - user may need to listen to more music on Spotify');
    }
  }
  
  if (!Array.isArray(spotifyUserData.saved_tracks)) {
    // Not a fatal error, just a warning
    console.warn('⚠️ No saved tracks data - SavedBonus will not apply');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Example usage for testing
 */
export function testSpotifyPTSIntegration() {
  console.log('🧪 Testing Spotify + PTS Integration...\n');
  
  // Mock Spotify data
  const mockSpotifyData = {
    profile: {
      id: 'user_12345',
      display_name: 'Test User',
      email: 'test@example.com'
    },
    top_tracks: {
      short_term: Array(50).fill(null).map((_, i) => ({
        id: `track_short_${i}`,
        name: `Short Term Track ${i + 1}`,
        artists: [{ name: `Artist ${i + 1}`, genres: ['pop', 'rock'] }],
        album: { name: `Album ${i + 1}`, release_date: '2024-01-01' },
        explicit: false,
        popularity: 80 - i
      })),
      medium_term: Array(50).fill(null).map((_, i) => ({
        id: `track_medium_${i}`,
        name: `Medium Term Track ${i + 1}`,
        artists: [{ name: `Artist ${i + 1}`, genres: ['pop', 'rock'] }],
        album: { name: `Album ${i + 1}`, release_date: '2023-06-01' },
        explicit: false,
        popularity: 70 - i
      })),
      long_term: Array(50).fill(null).map((_, i) => ({
        id: `track_long_${i}`,
        name: `Long Term Track ${i + 1}`,
        artists: [{ name: `Artist ${i + 1}`, genres: ['pop', 'rock'] }],
        album: { name: `Album ${i + 1}`, release_date: '2022-01-01' },
        explicit: false,
        popularity: 60 - i
      }))
    },
    saved_tracks: [
      { id: 'track_short_0' },
      { id: 'track_short_1' },
      { id: 'track_short_2' }
    ]
  };
  
  // Validate data
  const validation = validateSpotifyData(mockSpotifyData);
  console.log('Validation:', validation);
  
  if (!validation.valid) {
    console.error('❌ Invalid Spotify data:', validation.errors);
    return;
  }
  
  // Process through PTS
  const result = processGuestSpotifyData(mockSpotifyData, {
    guestCount: 25
  });
  
  console.log('\n📊 Processing Results:');
  console.log('Total tracks from Spotify:', result.stats.totalTracks);
  console.log('Contribution size (limited):', result.stats.contributionSize);
  console.log('Average PTS:', result.stats.averagePTS.toFixed(4));
  console.log('Top PTS:', result.stats.topPTS.toFixed(4));
  
  console.log('\n🎵 Top 5 Tracks:');
  result.contribution.tracks.slice(0, 5).forEach((track, i) => {
    console.log(`${i + 1}. ${track.name} - ${track.artist}`);
    console.log(`   Rank: #${track.rank}, PTS: ${track.pts?.toFixed(4)}, Timeframe: ${track.timeframe}, Saved: ${track.isSaved ? 'Yes' : 'No'}`);
  });
  
  // Get summary
  const summary = getContributionSummary(result.contribution);
  console.log('\n📈 Summary:');
  console.log('Track count:', summary.trackCount);
  console.log('Average PTS:', summary.avgPTS.toFixed(4));
  console.log('Timeframe breakdown:', summary.timeframeBreakdown);
  console.log('Saved tracks:', summary.savedCount);
}
