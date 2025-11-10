/**
 * DJ Workflow Utilities
 * Tap-to-Cue system and Intelligent Search fallback
 */

import { AggregatedTrack, calculateFlowScore, AudioFeatures } from './recommendationEngines';
import { SynergyTrack } from './discoveryEngine';

/**
 * Now Playing track
 */
export interface NowPlayingTrack {
  trackId: string;
  name: string;
  artist: string;
  album?: string;
  audioFeatures?: AudioFeatures;
  startedAt: Date;
  source: 'qrate' | 'off-book';
  qrateRank?: number; // Original rank in recommendations
}

/**
 * Track in DJ queue
 */
export interface QueuedTrack {
  trackId: string;
  name: string;
  artist: string;
  album?: string;
  audioFeatures?: AudioFeatures;
  queuePosition: number;
  addedAt: Date;
  source: 'qrate' | 'off-book';
}

/**
 * Search result from music API
 */
export interface TrackSearchResult {
  trackId: string;
  name: string;
  artist: string;
  album: string;
  albumArt?: string;
  duration?: number;
  releaseYear?: number;
  explicit?: boolean;
}

/**
 * DJ Dashboard state
 */
export interface DJDashboardState {
  nowPlaying: NowPlayingTrack | null;
  queue: QueuedTrack[];
  playHistory: Array<{
    trackId: string;
    name: string;
    artist: string;
    playedAt: Date;
    source: 'qrate' | 'off-book';
  }>;
}

/**
 * Initialize DJ dashboard state
 */
export function initializeDJState(): DJDashboardState {
  return {
    nowPlaying: null,
    queue: [],
    playHistory: []
  };
}

/**
 * Tap-to-Cue: Set track as now playing
 */
export function tapToCue(
  track: AggregatedTrack | SynergyTrack | TrackSearchResult,
  state: DJDashboardState,
  rank?: number
): {
  newState: DJDashboardState;
  shouldRecalculateFlow: boolean;
} {
  console.log(`🎵 Tap-to-Cue: ${track.name} - ${track.artist}`);
  
  const newNowPlaying: NowPlayingTrack = {
    trackId: track.trackId,
    name: track.name,
    artist: track.artist,
    album: 'album' in track ? track.album : undefined,
    audioFeatures: 'audioFeatures' in track ? track.audioFeatures : undefined,
    startedAt: new Date(),
    source: rank !== undefined ? 'qrate' : 'off-book',
    qrateRank: rank
  };
  
  // Add previous now playing to history
  const newHistory = state.nowPlaying 
    ? [{
        trackId: state.nowPlaying.trackId,
        name: state.nowPlaying.name,
        artist: state.nowPlaying.artist,
        playedAt: state.nowPlaying.startedAt,
        source: state.nowPlaying.source
      }, ...state.playHistory]
    : state.playHistory;
  
  const newState: DJDashboardState = {
    nowPlaying: newNowPlaying,
    queue: state.queue,
    playHistory: newHistory
  };
  
  return {
    newState,
    shouldRecalculateFlow: true // Always recalculate flow when track changes
  };
}

/**
 * Add track to queue
 */
export function addToQueue(
  track: AggregatedTrack | SynergyTrack | TrackSearchResult,
  state: DJDashboardState,
  position?: number
): DJDashboardState {
  const queuedTrack: QueuedTrack = {
    trackId: track.trackId,
    name: track.name,
    artist: track.artist,
    album: 'album' in track ? track.album : undefined,
    audioFeatures: 'audioFeatures' in track ? track.audioFeatures : undefined,
    queuePosition: position !== undefined ? position : state.queue.length + 1,
    addedAt: new Date(),
    source: 'qrate'
  };
  
  const newQueue = [...state.queue];
  if (position !== undefined) {
    newQueue.splice(position - 1, 0, queuedTrack);
    // Renumber queue positions
    newQueue.forEach((t, i) => t.queuePosition = i + 1);
  } else {
    newQueue.push(queuedTrack);
  }
  
  return {
    ...state,
    queue: newQueue
  };
}

/**
 * Remove track from queue
 */
export function removeFromQueue(
  trackId: string,
  state: DJDashboardState
): DJDashboardState {
  const newQueue = state.queue
    .filter(t => t.trackId !== trackId)
    .map((t, i) => ({ ...t, queuePosition: i + 1 }));
  
  return {
    ...state,
    queue: newQueue
  };
}

/**
 * Reorder queue
 */
export function reorderQueue(
  trackId: string,
  newPosition: number,
  state: DJDashboardState
): DJDashboardState {
  const oldIndex = state.queue.findIndex(t => t.trackId === trackId);
  if (oldIndex === -1) return state;
  
  const newQueue = [...state.queue];
  const [movedTrack] = newQueue.splice(oldIndex, 1);
  newQueue.splice(newPosition - 1, 0, movedTrack);
  
  // Renumber
  newQueue.forEach((t, i) => t.queuePosition = i + 1);
  
  return {
    ...state,
    queue: newQueue
  };
}

/**
 * Recalculate flow scores for all recommendations based on now playing
 */
export function recalculateFlowScores<T extends AggregatedTrack | SynergyTrack>(
  recommendations: T[],
  nowPlaying: NowPlayingTrack | null
): T[] {
  if (!nowPlaying || !nowPlaying.audioFeatures) {
    console.log('⚠️ Cannot recalculate flow: No audio features for now playing');
    return recommendations;
  }
  
  console.log(`🔄 Recalculating flow scores based on: ${nowPlaying.name}`);
  
  return recommendations.map(track => {
    if ('audioFeatures' in track && track.audioFeatures) {
      const flow = calculateFlowScore(track.audioFeatures, nowPlaying.audioFeatures!);
      
      return {
        ...track,
        flowScore: flow.flowScore,
        bpmDiff: flow.breakdown.bpmDiff,
        keyCompatibility: flow.harmonicCompatibility > 0.8 ? 'Perfect' :
                         flow.harmonicCompatibility > 0.6 ? 'Good' :
                         flow.harmonicCompatibility > 0.4 ? 'OK' : 'Difficult'
      } as T;
    }
    return track;
  });
}

/**
 * Mock track database for demo mode
 */
const MOCK_TRACK_DATABASE: TrackSearchResult[] = [
  { trackId: 'mock_1', name: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', releaseYear: 2020, explicit: false },
  { trackId: 'mock_2', name: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', releaseYear: 2020, explicit: false },
  { trackId: 'mock_3', name: 'Don\'t Start Now', artist: 'Dua Lipa', album: 'Future Nostalgia', releaseYear: 2019, explicit: false },
  { trackId: 'mock_4', name: 'Starboy', artist: 'The Weeknd', album: 'Starboy', releaseYear: 2016, explicit: true },
  { trackId: 'mock_5', name: 'One More Time', artist: 'Daft Punk', album: 'Discovery', releaseYear: 2000, explicit: false },
  { trackId: 'mock_6', name: 'Get Lucky', artist: 'Daft Punk', album: 'Random Access Memories', releaseYear: 2013, explicit: false },
  { trackId: 'mock_7', name: 'Uptown Funk', artist: 'Mark Ronson, Bruno Mars', album: 'Uptown Special', releaseYear: 2014, explicit: false },
  { trackId: 'mock_8', name: 'September', artist: 'Earth, Wind & Fire', album: 'The Best of Earth, Wind & Fire Vol. 1', releaseYear: 1978, explicit: false },
  { trackId: 'mock_9', name: 'Mr. Brightside', artist: 'The Killers', album: 'Hot Fuss', releaseYear: 2003, explicit: false },
  { trackId: 'mock_10', name: 'Sweet Caroline', artist: 'Neil Diamond', album: 'Sweet Caroline', releaseYear: 1969, explicit: false },
  { trackId: 'mock_11', name: 'Dancing Queen', artist: 'ABBA', album: 'Arrival', releaseYear: 1976, explicit: false },
  { trackId: 'mock_12', name: 'I Wanna Dance with Somebody', artist: 'Whitney Houston', album: 'Whitney', releaseYear: 1987, explicit: false },
  { trackId: 'mock_13', name: 'Stayin\' Alive', artist: 'Bee Gees', album: 'Saturday Night Fever', releaseYear: 1977, explicit: false },
  { trackId: 'mock_14', name: 'Closer', artist: 'The Chainsmokers', album: 'Collage', releaseYear: 2016, explicit: false },
  { trackId: 'mock_15', name: 'Shape of You', artist: 'Ed Sheeran', album: '÷', releaseYear: 2017, explicit: false },
  { trackId: 'mock_16', name: 'Bad Guy', artist: 'Billie Eilish', album: 'When We All Fall Asleep, Where Do We Go?', releaseYear: 2019, explicit: false },
  { trackId: 'mock_17', name: 'Watermelon Sugar', artist: 'Harry Styles', album: 'Fine Line', releaseYear: 2019, explicit: false },
  { trackId: 'mock_18', name: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', releaseYear: 2022, explicit: false },
  { trackId: 'mock_19', name: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland', releaseYear: 2020, explicit: false },
  { trackId: 'mock_20', name: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', releaseYear: 2023, explicit: false },
  { trackId: 'mock_21', name: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', releaseYear: 2022, explicit: false },
  { trackId: 'mock_22', name: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', releaseYear: 2019, explicit: false },
  { trackId: 'mock_23', name: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR', releaseYear: 2021, explicit: false },
  { trackId: 'mock_24', name: 'drivers license', artist: 'Olivia Rodrigo', album: 'SOUR', releaseYear: 2021, explicit: false },
  { trackId: 'mock_25', name: 'Peaches', artist: 'Justin Bieber', album: 'Justice', releaseYear: 2021, explicit: false },
  { trackId: 'mock_26', name: 'Stay', artist: 'The Kid LAROI, Justin Bieber', album: 'F*ck Love 3', releaseYear: 2021, explicit: true },
  { trackId: 'mock_27', name: 'Shivers', artist: 'Ed Sheeran', album: '=', releaseYear: 2021, explicit: false },
  { trackId: 'mock_28', name: 'Circles', artist: 'Post Malone', album: 'Hollywood\'s Bleeding', releaseYear: 2019, explicit: false },
  { trackId: 'mock_29', name: 'Sunflower', artist: 'Post Malone, Swae Lee', album: 'Spider-Man: Into the Spider-Verse', releaseYear: 2018, explicit: false },
  { trackId: 'mock_30', name: 'God\'s Plan', artist: 'Drake', album: 'Scorpion', releaseYear: 2018, explicit: true },
];

/**
 * Search for tracks using Spotify API via backend endpoint
 * Falls back to mock data in demo mode or if backend/token unavailable
 */
export async function searchTracks(
  query: string,
  limit: number = 10
): Promise<TrackSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  try {
    console.log(`🔍 Searching for: "${query}"`);
    
    // Get DJ Spotify access token from storage
    const accessToken = localStorage.getItem('dj_spotify_access_token');
    if (!accessToken) {
      console.log('💡 Using mock search (no DJ Spotify token available)');
      return getMockSearchResults(query, limit);
    }
    
    // Import apiCall dynamically to avoid circular dependencies
    const { apiCall } = await import('./api');
    
    // Call backend Spotify Search API endpoint
    const response = await apiCall<{ success: boolean; tracks?: any[] }>('/spotify/search', {
      method: 'POST',
      body: JSON.stringify({
        query: query.trim(),
        access_token: accessToken,
        limit: limit
      })
    });
    
    if (!response.success || !response.data?.tracks) {
      console.log('⚠️ Backend search unavailable, falling back to mock data');
      return getMockSearchResults(query, limit);
    }
    
    // Map backend response format to TrackSearchResult format
    const results: TrackSearchResult[] = response.data.tracks.map((track: any) => ({
      trackId: track.id || track.spotifyTrackId,
      name: track.trackName || track.name,
      artist: track.artistName || track.artist || 'Unknown Artist',
      album: track.albumName || track.album || '',
      albumArt: track.albumArt,
      duration: track.durationMs || track.duration,
      releaseYear: track.releaseYear,
      explicit: track.explicit || false
    }));
    
    console.log(`✅ Found ${results.length} results from Spotify`);
    return results;
    
  } catch (error) {
    console.error('Error searching tracks:', error);
    console.log('💡 Falling back to mock search results');
    return getMockSearchResults(query, limit);
  }
}

/**
 * Get mock search results for demo/fallback mode
 */
function getMockSearchResults(query: string, limit: number): TrackSearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  const results = MOCK_TRACK_DATABASE.filter(track => 
    track.name.toLowerCase().includes(normalizedQuery) ||
    track.artist.toLowerCase().includes(normalizedQuery) ||
    track.album.toLowerCase().includes(normalizedQuery)
  ).slice(0, limit);
  
  console.log(`✅ Found ${results.length} mock results`);
  return results;
}

/**
 * Get time elapsed for now playing track
 */
export function getNowPlayingElapsed(nowPlaying: NowPlayingTrack | null): string {
  if (!nowPlaying) return '';
  
  const elapsedMs = Date.now() - nowPlaying.startedAt.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
  
  return `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`;
}

/**
 * Get recommendation source label
 */
export function getSourceLabel(source: 'qrate' | 'off-book', rank?: number): string {
  if (source === 'qrate' && rank !== undefined) {
    return `QRate #${rank}`;
  }
  if (source === 'off-book') {
    return 'Off-Book';
  }
  return 'QRate';
}

/**
 * Format play history for display
 */
export function formatPlayHistory(
  playHistory: DJDashboardState['playHistory'],
  limit: number = 10
): Array<{
  trackId: string;
  name: string;
  artist: string;
  playedAt: string;
  source: string;
}> {
  return playHistory.slice(0, limit).map(track => ({
    trackId: track.trackId,
    name: track.name,
    artist: track.artist,
    playedAt: formatPlayedTime(track.playedAt),
    source: getSourceLabel(track.source)
  }));
}

/**
 * Format played time as "X min ago"
 */
function formatPlayedTime(playedAt: Date): string {
  const diffMs = Date.now() - playedAt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  return `${diffHours} hours ago`;
}

/**
 * Check if track is in queue
 */
export function isTrackInQueue(trackId: string, state: DJDashboardState): boolean {
  return state.queue.some(t => t.trackId === trackId);
}

/**
 * Check if track was recently played
 */
export function wasRecentlyPlayed(
  trackId: string,
  state: DJDashboardState,
  windowMinutes: number = 180 // 3 hours
): boolean {
  const windowMs = windowMinutes * 60 * 1000;
  const cutoff = Date.now() - windowMs;
  
  return state.playHistory.some(
    track => track.trackId === trackId && track.playedAt.getTime() > cutoff
  );
}

/**
 * Get next suggested track from queue
 */
export function getNextSuggestion(state: DJDashboardState): QueuedTrack | null {
  return state.queue.length > 0 ? state.queue[0] : null;
}

/**
 * Export state for persistence
 */
export function serializeDJState(state: DJDashboardState): string {
  return JSON.stringify({
    nowPlaying: state.nowPlaying ? {
      ...state.nowPlaying,
      startedAt: state.nowPlaying.startedAt.toISOString()
    } : null,
    queue: state.queue.map(t => ({
      ...t,
      addedAt: t.addedAt.toISOString()
    })),
    playHistory: state.playHistory.map(t => ({
      ...t,
      playedAt: t.playedAt.toISOString()
    }))
  });
}

/**
 * Import state from persistence
 */
export function deserializeDJState(serialized: string): DJDashboardState {
  const data = JSON.parse(serialized);
  
  return {
    nowPlaying: data.nowPlaying ? {
      ...data.nowPlaying,
      startedAt: new Date(data.nowPlaying.startedAt)
    } : null,
    queue: data.queue.map((t: any) => ({
      ...t,
      addedAt: new Date(t.addedAt)
    })),
    playHistory: data.playHistory.map((t: any) => ({
      ...t,
      playedAt: new Date(t.playedAt)
    }))
  };
}

/**
 * Example/test function
 */
export function testDJWorkflow() {
  console.log('🧪 Testing DJ Workflow...\n');
  
  let state = initializeDJState();
  
  // Test 1: Tap-to-Cue
  console.log('Test 1: Tap-to-Cue');
  const track1: TrackSearchResult = {
    trackId: 'track_1',
    name: 'Test Track 1',
    artist: 'Artist A',
    album: 'Album 1'
  };
  
  const { newState: state1 } = tapToCue(track1, state, 1);
  console.log(`Now Playing: ${state1.nowPlaying?.name}`);
  console.log(`Source: ${getSourceLabel(state1.nowPlaying!.source, state1.nowPlaying!.qrateRank)}\n`);
  
  // Test 2: Add to queue
  console.log('Test 2: Add to queue');
  const track2: TrackSearchResult = {
    trackId: 'track_2',
    name: 'Test Track 2',
    artist: 'Artist B',
    album: 'Album 2'
  };
  
  const state2 = addToQueue(track2, state1);
  console.log(`Queue length: ${state2.queue.length}`);
  console.log(`Next: ${state2.queue[0]?.name}\n`);
  
  // Test 3: Play history
  console.log('Test 3: Play another track (creates history)');
  const { newState: state3 } = tapToCue(track2, state2, 2);
  console.log(`Now Playing: ${state3.nowPlaying?.name}`);
  console.log(`History length: ${state3.playHistory.length}`);
  console.log(`Last played: ${state3.playHistory[0]?.name}\n`);
  
  // Test 4: Off-book track
  console.log('Test 4: Search and play off-book track');
  const offBookTrack: TrackSearchResult = {
    trackId: 'track_99',
    name: 'Off-Book Surprise',
    artist: 'Surprise Artist',
    album: 'Surprise Album'
  };
  
  const { newState: state4 } = tapToCue(offBookTrack, state3);
  console.log(`Now Playing: ${state4.nowPlaying?.name}`);
  console.log(`Source: ${state4.nowPlaying?.source}`);
  console.log(`Play history:`, formatPlayHistory(state4.playHistory, 3));
}
