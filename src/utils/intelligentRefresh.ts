/**
 * Intelligent Refresh System
 * Batch-update protocol to prevent information overload on DJ dashboard
 * Updates only when significant changes occur and DJ explicitly requests refresh
 */

import { AggregatedTrack } from './recommendationEngines';
import { SynergyTrack } from './discoveryEngine';

/**
 * Configuration for refresh system
 */
export interface RefreshConfig {
  // Initialization threshold
  minimumGuestsForRecommendations: number; // e.g., 5
  
  // Change detection thresholds
  rankVolatilityThreshold: number; // % of Top 10 that changed (e.g., 0.3 = 30%)
  minimumGuestBatchSize: number; // e.g., 5 new guests
  
  // Polling interval for background processing
  backgroundProcessingInterval: number; // milliseconds (e.g., 30000 = 30s)
}

/**
 * Refresh notification data
 */
export interface RefreshNotification {
  shouldNotify: boolean;
  reason: 'rank_volatility' | 'top_rank_change' | 'guest_batch' | 'multiple' | null;
  details: {
    newGuestsCount?: number;
    topRankChanged?: boolean;
    rankVolatilityPercent?: number;
    previousTop10?: string[];
    currentTop10?: string[];
  };
}

/**
 * Refresh system state
 */
export interface RefreshSystemState {
  isInitialized: boolean;
  lastRefreshTime: Date;
  lastGuestCount: number;
  lastDisplayedList: Array<{ trackId: string; rank: number }>;
  pendingUpdate: boolean;
  backgroundList: Array<{ trackId: string; rank: number }> | null;
}

/**
 * Default configuration
 */
export const DEFAULT_REFRESH_CONFIG: RefreshConfig = {
  minimumGuestsForRecommendations: 5,
  rankVolatilityThreshold: 0.3, // 30%
  minimumGuestBatchSize: 5,
  backgroundProcessingInterval: 30000 // 30 seconds
};

/**
 * Initialize refresh system state
 */
export function initializeRefreshSystem(): RefreshSystemState {
  return {
    isInitialized: false,
    lastRefreshTime: new Date(),
    lastGuestCount: 0,
    lastDisplayedList: [],
    pendingUpdate: false,
    backgroundList: null
  };
}

/**
 * Check if system should be initialized (minimum guest threshold met)
 */
export function shouldInitializeRecommendations(
  guestCount: number,
  config: RefreshConfig = DEFAULT_REFRESH_CONFIG
): boolean {
  return guestCount >= config.minimumGuestsForRecommendations;
}

/**
 * Extract top 10 track IDs from recommendation list
 */
function getTop10TrackIds(
  tracks: Array<AggregatedTrack | SynergyTrack | { trackId: string }>
): string[] {
  return tracks.slice(0, 10).map(t => t.trackId);
}

/**
 * Calculate rank volatility (how many tracks in top 10 changed)
 */
function calculateRankVolatility(
  previousTop10: string[],
  currentTop10: string[]
): number {
  if (previousTop10.length === 0) return 0;
  
  const changedCount = currentTop10.filter(
    trackId => !previousTop10.includes(trackId)
  ).length;
  
  return changedCount / Math.max(previousTop10.length, currentTop10.length);
}

/**
 * Check if #1 ranked song changed
 */
function topRankChanged(
  previousTop10: string[],
  currentTop10: string[]
): boolean {
  if (previousTop10.length === 0 || currentTop10.length === 0) return false;
  return previousTop10[0] !== currentTop10[0];
}

/**
 * Determine if a refresh notification should be shown
 */
export function shouldNotifyRefresh(
  state: RefreshSystemState,
  currentGuestCount: number,
  newRecommendations: Array<AggregatedTrack | SynergyTrack>,
  config: RefreshConfig = DEFAULT_REFRESH_CONFIG
): RefreshNotification {
  // If not initialized yet, no notification
  if (!state.isInitialized) {
    return {
      shouldNotify: false,
      reason: null,
      details: {}
    };
  }
  
  // Extract current top 10
  const currentTop10 = getTop10TrackIds(newRecommendations);
  const previousTop10 = state.lastDisplayedList.slice(0, 10).map(t => t.trackId);
  
  // Calculate metrics
  const volatility = calculateRankVolatility(previousTop10, currentTop10);
  const topChanged = topRankChanged(previousTop10, currentTop10);
  const newGuests = currentGuestCount - state.lastGuestCount;
  
  // Check thresholds
  const hasRankVolatility = volatility >= config.rankVolatilityThreshold;
  const hasTopRankChange = topChanged;
  const hasGuestBatch = newGuests >= config.minimumGuestBatchSize;
  
  // Determine if we should notify
  const triggeredReasons: string[] = [];
  if (hasRankVolatility) triggeredReasons.push('rank_volatility');
  if (hasTopRankChange) triggeredReasons.push('top_rank_change');
  if (hasGuestBatch) triggeredReasons.push('guest_batch');
  
  const shouldNotify = triggeredReasons.length > 0;
  const reason = triggeredReasons.length > 1 ? 'multiple' : 
                 (triggeredReasons[0] as RefreshNotification['reason']) || null;
  
  return {
    shouldNotify,
    reason,
    details: {
      newGuestsCount: newGuests,
      topRankChanged: topChanged,
      rankVolatilityPercent: volatility * 100,
      previousTop10,
      currentTop10
    }
  };
}

/**
 * Update system state after displaying new recommendations
 */
export function updateRefreshState(
  state: RefreshSystemState,
  newGuestCount: number,
  displayedRecommendations: Array<AggregatedTrack | SynergyTrack>
): RefreshSystemState {
  return {
    isInitialized: true,
    lastRefreshTime: new Date(),
    lastGuestCount: newGuestCount,
    lastDisplayedList: displayedRecommendations.map((track, index) => ({
      trackId: track.trackId,
      rank: index + 1
    })),
    pendingUpdate: false,
    backgroundList: null
  };
}

/**
 * Store background-processed recommendations (hidden from DJ)
 */
export function storeBackgroundUpdate(
  state: RefreshSystemState,
  backgroundRecommendations: Array<AggregatedTrack | SynergyTrack>
): RefreshSystemState {
  return {
    ...state,
    pendingUpdate: true,
    backgroundList: backgroundRecommendations.map((track, index) => ({
      trackId: track.trackId,
      rank: index + 1
    }))
  };
}

/**
 * Format notification message for UI
 */
export function formatRefreshNotification(notification: RefreshNotification): string {
  if (!notification.shouldNotify) return '';
  
  const { newGuestsCount, topRankChanged, rankVolatilityPercent } = notification.details;
  
  if (notification.reason === 'multiple') {
    return `${newGuestsCount || 0} new guests have arrived. Top tracks have changed significantly. Tap to refresh.`;
  }
  
  if (notification.reason === 'guest_batch') {
    return `${newGuestsCount} new guests have arrived. Tap to refresh recommendations.`;
  }
  
  if (notification.reason === 'top_rank_change') {
    return `The #1 track has changed! Tap to see updated recommendations.`;
  }
  
  if (notification.reason === 'rank_volatility') {
    return `${rankVolatilityPercent?.toFixed(0)}% of top tracks have changed. Tap to refresh.`;
  }
  
  return 'New recommendations available. Tap to refresh.';
}

/**
 * Get refresh button badge text (shows number of new guests)
 */
export function getRefreshBadgeText(notification: RefreshNotification): string | null {
  if (!notification.shouldNotify) return null;
  
  const { newGuestsCount } = notification.details;
  if (newGuestsCount && newGuestsCount > 0) {
    return `+${newGuestsCount}`;
  }
  
  return '!';
}

/**
 * Calculate time since last refresh (for UI display)
 */
export function getTimeSinceRefresh(state: RefreshSystemState): string {
  const now = new Date();
  const diffMs = now.getTime() - state.lastRefreshTime.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  return `${diffHours} hours ago`;
}

/**
 * Debug function to log refresh system state
 */
export function debugRefreshSystem(
  state: RefreshSystemState,
  notification: RefreshNotification
): void {
  console.log('🔄 Intelligent Refresh System State:');
  console.log(`  Initialized: ${state.isInitialized}`);
  console.log(`  Last Refresh: ${getTimeSinceRefresh(state)}`);
  console.log(`  Guest Count: ${state.lastGuestCount}`);
  console.log(`  Pending Update: ${state.pendingUpdate}`);
  
  if (notification.shouldNotify) {
    console.log(`\n⚠️ Refresh Notification Triggered:`);
    console.log(`  Reason: ${notification.reason}`);
    console.log(`  Message: ${formatRefreshNotification(notification)}`);
    console.log(`  Details:`, notification.details);
  } else {
    console.log(`\n✅ No refresh needed (thresholds not met)`);
  }
}

/**
 * Example/test function
 */
export function testIntelligentRefresh() {
  console.log('🧪 Testing Intelligent Refresh System...\n');
  
  let state = initializeRefreshSystem();
  const config = DEFAULT_REFRESH_CONFIG;
  
  // Test 1: Not enough guests
  console.log('Test 1: Check initialization threshold');
  console.log(`Should init with 3 guests: ${shouldInitializeRecommendations(3, config)}`);
  console.log(`Should init with 5 guests: ${shouldInitializeRecommendations(5, config)}\n`);
  
  // Test 2: Initial recommendations
  console.log('Test 2: Display initial recommendations (5 guests)');
  const initialRecs = [
    { trackId: 'track_1', name: 'Song 1', artist: 'Artist A' },
    { trackId: 'track_2', name: 'Song 2', artist: 'Artist B' },
    { trackId: 'track_3', name: 'Song 3', artist: 'Artist C' },
  ] as AggregatedTrack[];
  
  state = updateRefreshState(state, 5, initialRecs);
  console.log(`State initialized: ${state.isInitialized}\n`);
  
  // Test 3: Small change (shouldn't notify)
  console.log('Test 3: 2 new guests, no rank change');
  const newRecs1 = [...initialRecs];
  const notification1 = shouldNotifyRefresh(state, 7, newRecs1, config);
  console.log(`Should notify: ${notification1.shouldNotify}`);
  debugRefreshSystem(state, notification1);
  console.log();
  
  // Test 4: Guest batch threshold met
  console.log('Test 4: 5 new guests (batch threshold)');
  const notification2 = shouldNotifyRefresh(state, 10, newRecs1, config);
  console.log(`Should notify: ${notification2.shouldNotify}`);
  console.log(`Message: ${formatRefreshNotification(notification2)}\n`);
  
  // Test 5: Top rank changed
  console.log('Test 5: #1 song changed');
  const newRecs2 = [
    { trackId: 'track_99', name: 'New #1', artist: 'Artist Z' },
    ...initialRecs
  ] as AggregatedTrack[];
  const notification3 = shouldNotifyRefresh(state, 10, newRecs2, config);
  console.log(`Should notify: ${notification3.shouldNotify}`);
  console.log(`Message: ${formatRefreshNotification(notification3)}\n`);
  
  // Test 6: Rank volatility
  console.log('Test 6: 40% of top 10 changed (volatility)');
  const volatileRecs = [
    { trackId: 'new_1', name: 'New 1', artist: 'A' },
    { trackId: 'new_2', name: 'New 2', artist: 'B' },
    { trackId: 'new_3', name: 'New 3', artist: 'C' },
    { trackId: 'new_4', name: 'New 4', artist: 'D' },
    ...initialRecs.slice(0, 6)
  ] as AggregatedTrack[];
  const notification4 = shouldNotifyRefresh(state, 10, volatileRecs, config);
  console.log(`Should notify: ${notification4.shouldNotify}`);
  console.log(`Volatility: ${notification4.details.rankVolatilityPercent?.toFixed(0)}%`);
  console.log(`Message: ${formatRefreshNotification(notification4)}\n`);
}
