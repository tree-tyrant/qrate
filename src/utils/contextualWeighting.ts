/**
 * Context-aware Dynamic Recency Weighting System
 * Adapts to event timing, guest arrival, and presence
 */

export type EventPhase = 'pre_party' | 'live';
export type GuestPresence = 'present' | 'absent' | 'unknown';

export interface GuestArrival {
  userId: string;
  arrivalTime: Date;
  cohortIndex: number; // 0 = pre-party or hour 0, 1 = hour 1, etc.
  presenceStatus: GuestPresence;
  lastLocationUpdate?: Date;
  coordinates?: { lat: number; lon: number };
}

export interface EventConfig {
  eventId: string;
  startTime: Date;
  eventSize: 'small' | 'large'; // <20 = small, >=20 = large
  geoFenceEnabled: boolean;
  geoFenceCenter?: { lat: number; lon: number };
  geoFenceRadius?: number; // meters
}

export interface DecayConfig {
  presentDecayRate: number; // e.g., 0.90 (10% decay per hour)
  absentDecayRate: number; // e.g., 0.40 (60% decay per hour)
  useGentleDecayForAll: boolean; // For small events
}

/**
 * Default decay configurations
 */
export const DEFAULT_DECAY_CONFIG: DecayConfig = {
  presentDecayRate: 0.90, // 10% decay per hour for present guests
  absentDecayRate: 0.40,  // 60% decay per hour for absent guests
  useGentleDecayForAll: false
};

export const SMALL_EVENT_DECAY_CONFIG: DecayConfig = {
  presentDecayRate: 0.90,
  absentDecayRate: 0.90, // Use gentle decay for everyone
  useGentleDecayForAll: true
};

/**
 * Calculate which cohort a guest belongs to
 * Cohort 0: Pre-party or arrived at event start
 * Cohort 1: Arrived in hour 1
 * Cohort 2: Arrived in hour 2, etc.
 */
export function calculateArrivalCohort(arrivalTime: Date, eventStartTime: Date): number {
  const timeDiff = arrivalTime.getTime() - eventStartTime.getTime();
  
  // Pre-party or arrived before/at start
  if (timeDiff <= 0) {
    return 0;
  }
  
  // Calculate hour cohort (1-indexed for arrivals after start)
  const hoursSinceStart = Math.floor(timeDiff / (1000 * 60 * 60));
  return hoursSinceStart;
}

/**
 * Calculate hours since arrival for a guest
 */
export function calculateHoursSinceArrival(
  arrivalTime: Date,
  currentTime: Date = new Date()
): number {
  const timeDiff = currentTime.getTime() - arrivalTime.getTime();
  return Math.max(0, timeDiff / (1000 * 60 * 60));
}

/**
 * Determine guest presence status based on location and event config
 */
export function determinePresenceStatus(
  guest: GuestArrival,
  eventConfig: EventConfig,
  currentTime: Date = new Date()
): GuestPresence {
  // Small events: assume everyone is present
  if (eventConfig.eventSize === 'small') {
    return 'present';
  }
  
  // Geo-fencing disabled: status is unknown
  if (!eventConfig.geoFenceEnabled) {
    return 'unknown';
  }
  
  // No coordinates provided: assume absent/unknown
  if (!guest.coordinates || !eventConfig.geoFenceCenter) {
    return 'unknown';
  }
  
  // Check if location update is recent (within last 15 minutes)
  const locationUpdateAge = guest.lastLocationUpdate 
    ? (currentTime.getTime() - guest.lastLocationUpdate.getTime()) / 1000 / 60
    : Infinity;
  
  if (locationUpdateAge > 15) {
    return 'unknown'; // Stale location data
  }
  
  // Calculate distance from event center
  const distance = calculateDistance(
    guest.coordinates,
    eventConfig.geoFenceCenter
  );
  
  // Within geo-fence radius
  if (distance <= (eventConfig.geoFenceRadius || 100)) {
    return 'present';
  }
  
  return 'absent';
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
function calculateDistance(
  coord1: { lat: number; lon: number },
  coord2: { lat: number; lon: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lon - coord1.lon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate time decay multiplier for a guest
 * 
 * TimeDecayMultiplier_present = (D_present)^h
 * TimeDecayMultiplier_absent = (D_absent)^h
 * 
 * Where:
 *   D_present = 0.90 (gentle decay, 10% per hour)
 *   D_absent = 0.40 (rapid decay, 60% per hour)
 *   h = hours since arrival
 */
export function calculateTimeDecayMultiplier(
  guest: GuestArrival,
  eventConfig: EventConfig,
  decayConfig: DecayConfig = DEFAULT_DECAY_CONFIG,
  currentTime: Date = new Date()
): {
  multiplier: number;
  presenceStatus: GuestPresence;
  hoursSinceArrival: number;
  decayRate: number;
} {
  const hoursSinceArrival = calculateHoursSinceArrival(guest.arrivalTime, currentTime);
  const presenceStatus = determinePresenceStatus(guest, eventConfig, currentTime);
  
  // Small events or gentle decay for all
  if (decayConfig.useGentleDecayForAll || eventConfig.eventSize === 'small') {
    const multiplier = Math.pow(decayConfig.presentDecayRate, hoursSinceArrival);
    return {
      multiplier,
      presenceStatus: 'present', // Treated as present
      hoursSinceArrival,
      decayRate: decayConfig.presentDecayRate
    };
  }
  
  // Large events with presence-based decay
  let decayRate: number;
  
  if (presenceStatus === 'present') {
    decayRate = decayConfig.presentDecayRate;
  } else if (presenceStatus === 'absent') {
    decayRate = decayConfig.absentDecayRate;
  } else {
    // Unknown status: use average of both rates
    decayRate = (decayConfig.presentDecayRate + decayConfig.absentDecayRate) / 2;
  }
  
  const multiplier = Math.pow(decayRate, hoursSinceArrival);
  
  return {
    multiplier,
    presenceStatus,
    hoursSinceArrival,
    decayRate
  };
}

/**
 * Apply contextual weighting to PTS scores
 * Combines Personal Taste Score with time decay
 */
export function applyContextualWeighting(
  basePTS: number,
  guest: GuestArrival,
  eventConfig: EventConfig,
  decayConfig?: DecayConfig,
  currentTime?: Date
): {
  basePTS: number;
  timeDecayMultiplier: number;
  weightedPTS: number;
  metadata: {
    cohort: number;
    presenceStatus: GuestPresence;
    hoursSinceArrival: number;
    decayRate: number;
  };
} {
  const decay = calculateTimeDecayMultiplier(
    guest,
    eventConfig,
    decayConfig,
    currentTime
  );
  
  const weightedPTS = basePTS * decay.multiplier;
  
  return {
    basePTS,
    timeDecayMultiplier: decay.multiplier,
    weightedPTS,
    metadata: {
      cohort: guest.cohortIndex,
      presenceStatus: decay.presenceStatus,
      hoursSinceArrival: decay.hoursSinceArrival,
      decayRate: decay.decayRate
    }
  };
}

/**
 * Get decay projection for UI display
 * Shows how influence decays over time
 */
export function getDecayProjection(
  decayRate: number,
  hours: number = 5
): Array<{ hour: number; multiplier: number; percentage: number }> {
  const projection = [];
  
  for (let h = 0; h <= hours; h++) {
    const multiplier = Math.pow(decayRate, h);
    const percentage = multiplier * 100;
    projection.push({ hour: h, multiplier, percentage });
  }
  
  return projection;
}

/**
 * Group guests by arrival cohort
 */
export function groupGuestsByCohort(guests: GuestArrival[]): Map<number, GuestArrival[]> {
  const cohorts = new Map<number, GuestArrival[]>();
  
  for (const guest of guests) {
    if (!cohorts.has(guest.cohortIndex)) {
      cohorts.set(guest.cohortIndex, []);
    }
    cohorts.get(guest.cohortIndex)!.push(guest);
  }
  
  return cohorts;
}

/**
 * Calculate event phase based on start time
 */
export function getEventPhase(eventStartTime: Date, currentTime: Date = new Date()): EventPhase {
  return currentTime >= eventStartTime ? 'live' : 'pre_party';
}

/**
 * Example usage and visualizations
 */
export function visualizeDecayRates() {
  console.log('📊 Decay Rate Visualization\n');
  
  console.log('Present Guest (D = 0.90):');
  const presentDecay = getDecayProjection(0.90);
  presentDecay.forEach(({ hour, percentage }) => {
    const bar = '█'.repeat(Math.floor(percentage / 5));
    console.log(`Hour ${hour}: ${percentage.toFixed(1)}% ${bar}`);
  });
  
  console.log('\nAbsent Guest (D = 0.40):');
  const absentDecay = getDecayProjection(0.40);
  absentDecay.forEach(({ hour, percentage }) => {
    const bar = '█'.repeat(Math.floor(percentage / 5));
    console.log(`Hour ${hour}: ${percentage.toFixed(1)}% ${bar}`);
  });
  
  console.log('\n📉 Key Observations:');
  console.log('• Present guests maintain ~59% influence after 5 hours');
  console.log('• Absent guests drop to ~1% influence after 5 hours');
  console.log('• After 2 hours, absent guest influence is only 16%');
}

/**
 * Test scenarios
 */
export function testContextualWeighting() {
  console.log('🧪 Testing Contextual Weighting...\n');
  
  const eventStart = new Date('2024-01-20T20:00:00');
  const currentTime = new Date('2024-01-20T22:00:00'); // 2 hours into event
  
  const eventConfig: EventConfig = {
    eventId: 'test_event',
    startTime: eventStart,
    eventSize: 'large',
    geoFenceEnabled: true,
    geoFenceCenter: { lat: 40.7128, lon: -74.0060 },
    geoFenceRadius: 100
  };
  
  // Guest 1: Present at event
  const presentGuest: GuestArrival = {
    userId: 'user_1',
    arrivalTime: eventStart,
    cohortIndex: 0,
    presenceStatus: 'present',
    coordinates: { lat: 40.7128, lon: -74.0060 },
    lastLocationUpdate: currentTime
  };
  
  // Guest 2: Left event
  const absentGuest: GuestArrival = {
    userId: 'user_2',
    arrivalTime: eventStart,
    cohortIndex: 0,
    presenceStatus: 'absent',
    coordinates: { lat: 40.7500, lon: -74.0500 },
    lastLocationUpdate: currentTime
  };
  
  const basePTS = 1.0;
  
  const presentWeighted = applyContextualWeighting(basePTS, presentGuest, eventConfig, undefined, currentTime);
  const absentWeighted = applyContextualWeighting(basePTS, absentGuest, eventConfig, undefined, currentTime);
  
  console.log('Present Guest:');
  console.log(`  Base PTS: ${presentWeighted.basePTS}`);
  console.log(`  Decay Multiplier: ${presentWeighted.timeDecayMultiplier.toFixed(4)}`);
  console.log(`  Weighted PTS: ${presentWeighted.weightedPTS.toFixed(4)}`);
  console.log(`  Hours since arrival: ${presentWeighted.metadata.hoursSinceArrival.toFixed(1)}`);
  console.log(`  Status: ${presentWeighted.metadata.presenceStatus}`);
  console.log('');
  
  console.log('Absent Guest:');
  console.log(`  Base PTS: ${absentWeighted.basePTS}`);
  console.log(`  Decay Multiplier: ${absentWeighted.timeDecayMultiplier.toFixed(4)}`);
  console.log(`  Weighted PTS: ${absentWeighted.weightedPTS.toFixed(4)}`);
  console.log(`  Hours since arrival: ${absentWeighted.metadata.hoursSinceArrival.toFixed(1)}`);
  console.log(`  Status: ${absentWeighted.metadata.presenceStatus}`);
}
