// API utilities for QRATE
// Integrates with backend from synergy-main
// Supports both local server and Vercel/Supabase deployments

import { log } from './logger';
import { STORAGE_KEYS, SPOTIFY_OAUTH_VERSION } from './constants';
import type { 
  ApiResponse, 
  SpotifyUserData, 
  GuestPreferences, 
  DiscoveryQueueResponse,
  TrackInput,
  VibeProfile,
  PTSResult
} from './types';

// API Configuration
// In development, use the local server proxy
// In production, this should be set via environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/make-server-6d46752d'
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Backend availability check
let backendAvailable = false
let backendCheckPerformed = false

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Check backend availability once on first API call
async function checkBackendAvailability(): Promise<boolean> {
  if (backendCheckPerformed) {
    return backendAvailable
  }
  
  try {
    log.debug('Checking backend availability...', undefined, 'API');
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(publicAnonKey && { 'Authorization': `Bearer ${publicAnonKey}` })
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    backendAvailable = response.ok
    backendCheckPerformed = true
    
    log.backendStatus(backendAvailable, response.ok ? undefined : `HTTP ${response.status}`);
    
    return backendAvailable
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.backendStatus(false, errorMessage);
    backendAvailable = false
    backendCheckPerformed = true
    return false
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make an API call with retry logic
 */
export async function apiCall<T = unknown>(
  endpoint: string, 
  options: RequestInit = {},
  retryCount = 0
): Promise<ApiResponse<T>> {
  // Check backend availability first
  const isBackendAvailable = await checkBackendAvailability()
  
  if (!isBackendAvailable) {
    log.warn(`Backend unavailable - skipping API call for ${endpoint}`, undefined, 'API');
    return { 
      success: false, 
      error: 'Backend unavailable - using localStorage mode' 
    }
  }
  
  const method = options.method || 'GET';
  log.apiCall(method, endpoint);
  
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    // Ensure we always have the authorization header if key is available
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(publicAnonKey && { 'Authorization': `Bearer ${publicAnonKey}` }),
      ...options.headers,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type')
    let data: unknown
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      // Handle non-JSON responses (like HTML error pages)
      const text = await response.text()
      log.error(`Non-JSON response for ${endpoint}`, text.substring(0, 200), 'API');
      data = { 
        error: `Server returned non-JSON response: ${response.status} ${response.statusText}`,
        responseText: text.substring(0, 200)
      }
    }
    
    if (!response.ok) {
      // Special handling for 404 errors (expected for demo/local-only events)
      if (response.status === 404) {
        log.info(`API 404 for ${endpoint} - Event may only exist in localStorage`, undefined, 'API');
        return { success: false, error: (data as { error?: string }).error || 'Event not found' }
      }
      
      // Retry on 5xx errors
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        log.warn(`Server error ${response.status}, retrying... (${retryCount + 1}/${MAX_RETRIES})`, undefined, 'API');
        await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        return apiCall<T>(endpoint, options, retryCount + 1);
      }
      
      log.apiError(method, endpoint, data, 'API');
      
      // Special handling for 401 errors
      if (response.status === 401) {
        log.error('Authorization failed - check if publicAnonKey is valid', undefined, 'API');
        return { 
          success: false, 
          error: `Authorization failed: ${(data as { message?: string }).message || 'Invalid or missing authorization'}` 
        }
      }
      
      return { 
        success: false, 
        error: (data as { error?: string }).error || `HTTP ${response.status}: API request failed` 
      }
    }

    log.apiSuccess(method, endpoint);
    return { success: true, data: data as T }
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES && (
      errorObj.name === 'AbortError' || 
      (errorObj instanceof TypeError && errorObj.message.includes('fetch'))
    )) {
      log.warn(`Network error, retrying... (${retryCount + 1}/${MAX_RETRIES})`, errorObj, 'API');
      await sleep(RETRY_DELAY * (retryCount + 1));
      return apiCall<T>(endpoint, options, retryCount + 1);
    }
    
    log.apiError(method, endpoint, errorObj, 'API');
    
    // Mark backend as unavailable on persistent errors
    if (errorObj instanceof TypeError && errorObj.message.includes('fetch')) {
      backendAvailable = false
      log.backendStatus(false, 'Network error detected');
    }
    
    if (errorObj.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Please try again.' }
    }
    if (errorObj instanceof TypeError && errorObj.message.includes('fetch')) {
      return { success: false, error: 'Backend unavailable - using localStorage mode' }
    }
    return { success: false, error: `Network error: ${errorObj.message}` }
  }
}

// Event API calls
export const eventApi = {
  // Create a new event
  async create(eventData: {
    name: string
    theme: string
    description?: string
    date?: string
    time?: string
    endTime?: string
    location?: string
    hostId?: string
    vibes?: string[]
    genre?: string
    imageUrl?: string
    vibeProfile?: VibeProfile
    code?: string
  }) {
    return apiCall('/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    })
  },

  // Get event by code or ID
  async get(identifier: string) {
    return apiCall(`/events/${identifier}`)
  },

  // Get events for a host
  async getHostEvents(hostId: string) {
    return apiCall(`/hosts/${hostId}/events`)
  },

  // Get event insights and recommendations
  async getInsights(eventCode: string) {
    return apiCall(`/events/${eventCode}/insights`)
  },

  // Get discovery queue (hidden anthems)
  async getDiscoveryQueue(eventCode: string, queueTrackIds?: string[], accessToken?: string): Promise<ApiResponse<DiscoveryQueueResponse>> {
    if (!queueTrackIds || queueTrackIds.length === 0) {
      return { success: true, data: { anthems: [] } };
    }
    const params = new URLSearchParams({
      queue_track_ids: queueTrackIds.join(',')
    });
    if (accessToken) {
      params.append('access_token', accessToken);
    }
    const response = await apiCall<DiscoveryQueueResponse>(`/events/${eventCode}/discovery-queue?${params.toString()}`);
    // apiCall wraps response in { success, data }, so response.data contains { success: true, anthems }
    // Return in consistent format
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          anthems: response.data.anthems || []
        }
      };
    }
    return { success: false, data: { anthems: [] }, error: response.error };
  },

  // Submit guest preferences
  async submitPreferences(eventCode: string, preferences: GuestPreferences) {
    return apiCall(`/events/${eventCode}/preferences`, {
      method: 'POST',
      body: JSON.stringify(preferences)
    })
  },

  // Update existing event
  async update(eventId: string, eventData: {
    name: string
    theme: string
    description?: string
    date?: string
    time?: string
    location?: string
    hostId?: string
    vibes?: string[]
    status?: string
    trashedAt?: string
    imageUrl?: string
  }) {
    return apiCall(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    })
  },

  // Permanently delete event
  async delete(eventId: string) {
    return apiCall(`/events/${eventId}`, {
      method: 'DELETE'
    })
  },

  // Remove song from queue (DJ function)
  async removeSongFromQueue(eventCode: string, songId: string) {
    return apiCall(`/events/${eventCode}/queue/${songId}`, {
      method: 'DELETE'
    })
  },
  
  // Update queue order (DJ function)
  async updateQueueOrder(eventCode: string, trackIds: string[]) {
    return apiCall(`/events/${eventCode}/queue`, {
      method: 'PUT',
      body: JSON.stringify({ track_ids: trackIds })
    })
  },

  // Create Spotify playlist
  async createSpotifyPlaylist(eventCode: string, playlistData: {
    access_token: string
    playlist_name?: string
    playlist_description?: string
    is_public?: boolean
    playlist_id?: string
    track_ids?: string[]
  }) {
    return apiCall('/spotify/create-playlist', {
      method: 'POST',
      body: JSON.stringify({
        event_code: eventCode,
        ...playlistData
      })
    })
  },

  // Update smart filters
  async updateSmartFilters(eventCode: string, filters: {
    noExplicit?: boolean
    noRepeats?: boolean
    throwbackHour?: boolean
    highEnergyOnly?: boolean
    vocalFocus?: boolean
  }) {
    return apiCall(`/events/${eventCode}/filters`, {
      method: 'PUT',
      body: JSON.stringify(filters)
    })
  },

  // Submit guest song suggestion
  async submitSongSuggestion(eventCode: string, suggestion: {
    songTitle: string
    guestId?: string
    guestName?: string
  }) {
    return apiCall(`/events/${eventCode}/guest-suggestions`, {
      method: 'POST',
      body: JSON.stringify(suggestion)
    })
  },

  // Get guest song suggestions
  async getGuestSuggestions(eventCode: string) {
    return apiCall(`/events/${eventCode}/guest-suggestions`)
  }
}

// Spotify API calls
export const spotifyApi = {
  // Get Spotify auth URL (for guests)
  async getAuthUrl(eventCode?: string) {
    const params = eventCode ? `?eventCode=${eventCode}` : ''
    return apiCall(`/spotify/auth${params}`)
  },

  // Get Spotify auth URL (for DJs)
  async getDJAuthUrl() {
    return apiCall('/spotify/dj/auth')
  },

  // Exchange authorization code for access token (DJ callback)
  async exchangeDJCode(code: string) {
    return apiCall('/spotify/dj/callback', {
      method: 'POST',
      body: JSON.stringify({ code })
    })
  },

  // Exchange authorization code for access token (Guest callback)
  async exchangeGuestCode(code: string) {
    return apiCall('/spotify/callback', {
      method: 'POST',
      body: JSON.stringify({ code })
    })
  },

  // Get comprehensive user data (top tracks, artists, playlists, etc.)
  async getUserData(accessToken: string) {
    return apiCall<SpotifyUserData>('/spotify/user-data', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken })
    })
  },

  // Test Spotify configuration (bypasses auth)
  async testSpotify(): Promise<ApiResponse<unknown> & { status?: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/test/spotify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      return { success: response.ok, data, status: response.status }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage }
    }
  }
}

// Utility functions
export const utils = {
  // Parse URL parameters
  getUrlParams(): Record<string, string> {
    const params = new URLSearchParams(window.location.search)
    const result: Record<string, string> = {}
    for (const [key, value] of params.entries()) {
      result[key] = value
    }
    return result
  },

  // Generate QR code data URL
  generateQRCodeDataUrl(text: string): string {
    // Return a simple placeholder instead of trying to generate actual QR code
    // This avoids CSP and canvas issues
    return `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
  },

  // Format duration from milliseconds to MM:SS
  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  },

  // Debounce function for search/input
  debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  // Check if device is mobile
  isMobile(): boolean {
    return window.innerWidth < 768
  },

  // Storage utilities
  storage: {
    set(key: string, value: unknown) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        log.warn('Failed to save to localStorage', error, 'Storage');
      }
    },

    get(key: string): unknown {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      } catch (error) {
        log.warn('Failed to read from localStorage', error, 'Storage');
        return null
      }
    },

    remove(key: string) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        log.warn('Failed to remove from localStorage', error, 'Storage');
      }
    }
  },

  // Time formatting utilities
  time: {
    to12Hour(time24: string): string {
      try {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
      } catch (error) {
        log.error('Error converting time', error, 'TimeUtils');
        return time24;
      }
    }
  },

  // Backend availability utilities
  backend: {
    isAvailable() {
      return backendAvailable
    },
    
    async checkAvailability() {
      backendCheckPerformed = false // Force recheck
      return await checkBackendAvailability()
    },
    
    setAvailable(available: boolean) {
      backendAvailable = available
      backendCheckPerformed = true
      log.info(`Backend manually set to: ${available ? 'available' : 'unavailable'}`, undefined, 'Backend');
    }
  },

  // Spotify authentication utilities
  spotify: {
    /**
     * Clear all Spotify tokens (for both guest and DJ flows)
     * This forces users to re-authenticate with updated scopes
     */
    clearAllTokens() {
      utils.storage.remove(STORAGE_KEYS.SPOTIFY_ACCESS_TOKEN)
      utils.storage.remove(STORAGE_KEYS.SPOTIFY_REFRESH_TOKEN)
      utils.storage.remove(STORAGE_KEYS.SPOTIFY_EXPIRES_AT)
      // Also clear any legacy keys
      utils.storage.remove('spotify_access_token')
      utils.storage.remove('spotify_refresh_token')
      utils.storage.remove('spotify_expires_at')
      utils.storage.remove('dj_spotify_access_token')
      log.info('Cleared all Spotify tokens - users will need to re-authenticate', undefined, 'Spotify')
    },

    /**
     * Check if Spotify tokens need to be cleared due to OAuth scope changes
     * Returns true if tokens were cleared, false otherwise
     */
    checkAndClearIfNeeded(): boolean {
      const storedVersion = utils.storage.get(STORAGE_KEYS.SPOTIFY_OAUTH_VERSION) as string | null
      
      if (storedVersion !== SPOTIFY_OAUTH_VERSION) {
        // Version mismatch - clear all tokens and update version
        utils.spotify.clearAllTokens()
        utils.storage.set(STORAGE_KEYS.SPOTIFY_OAUTH_VERSION, SPOTIFY_OAUTH_VERSION)
        log.info(`Spotify OAuth version updated from ${storedVersion || 'none'} to ${SPOTIFY_OAUTH_VERSION} - tokens cleared`, undefined, 'Spotify')
        return true
      }
      return false
    }
  }
}

// Health check
export const healthCheck = async () => {
  return apiCall('/health')
}

// Debug utilities
export const debug = {
  // Test authorization header
  async testAuth() {
    return apiCall('/test/auth')
  },
  
  // Test server health
  async testHealth(): Promise<ApiResponse<unknown> & { status?: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      return { success: response.ok, data, status: response.status }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage }
    }
  },
  
  // Test Spotify credentials (bypasses auth)
  async testSpotify(): Promise<ApiResponse<unknown> & { status?: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/test/spotify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      return { success: response.ok, data, status: response.status }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage }
    }
  },
  
  // Test events list (bypasses auth)
  async testEvents(): Promise<ApiResponse<unknown> & { status?: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/test/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      return { success: response.ok, data, status: response.status }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage }
    }
  }
}

// Algorithm API calls (PTS + Vibe Gate)
export const algorithmApi = {
  // Calculate Personal Taste Score for a single track
  async calculatePTS(track: TrackInput) {
    return apiCall<PTSResult>('/algorithm/pts/calculate', {
      method: 'POST',
      body: JSON.stringify({ track })
    })
  },

  // Calculate PTS for multiple tracks
  async calculateBatchPTS(tracks: TrackInput[]) {
    return apiCall<PTSResult[]>('/algorithm/pts/batch', {
      method: 'POST',
      body: JSON.stringify({ tracks })
    })
  },

  // Aggregate PTS scores for same tracks from multiple users
  async aggregatePTS(ptsResults: PTSResult[]) {
    return apiCall<unknown>('/algorithm/pts/aggregate', {
      method: 'POST',
      body: JSON.stringify({ ptsResults })
    })
  },

  // Get top N tracks by aggregated PTS
  async getTopTracks(ptsResults: PTSResult[], limit = 50) {
    return apiCall<unknown>('/algorithm/pts/top-tracks', {
      method: 'POST',
      body: JSON.stringify({ ptsResults, limit })
    })
  },

  // Get expected PTS score ranges
  async getPTSScoreRanges() {
    return apiCall<unknown>('/algorithm/pts/score-ranges')
  },

  // Validate a single track against vibe profile
  async validateVibe(track: TrackInput, vibeProfile: VibeProfile) {
    return apiCall<unknown>('/algorithm/vibe/validate', {
      method: 'POST',
      body: JSON.stringify({ track, vibeProfile })
    })
  },

  // Filter multiple tracks through vibe gate
  async filterVibe(tracks: TrackInput[], vibeProfile: VibeProfile) {
    return apiCall<unknown>('/algorithm/vibe/filter', {
      method: 'POST',
      body: JSON.stringify({ tracks, vibeProfile })
    })
  },

  // Create vibe profile from event theme
  async createVibeFromTheme(theme: string, eventName: string) {
    return apiCall<VibeProfile>('/algorithm/vibe/create-from-theme', {
      method: 'POST',
      body: JSON.stringify({ theme, eventName })
    })
  },

  // Calculate contribution sizing
  async calculateTracksPerPerson(numUsers: number) {
    return apiCall<{ tracksPerPerson: number }>('/algorithm/vibe/calculate-tracks-per-person', {
      method: 'POST',
      body: JSON.stringify({ numUsers })
    })
  },

  // Get vibe profile description
  async getVibeDescription(profile: VibeProfile) {
    return apiCall<{ description: string }>('/algorithm/vibe/description', {
      method: 'POST',
      body: JSON.stringify({ profile })
    })
  },

  // Generate recommendations using PTS + Vibe Gate
  async generateRecommendations(guestPreferences: GuestPreferences[], vibeProfile?: VibeProfile, limit = 50) {
    return apiCall<unknown>('/algorithm/recommend', {
      method: 'POST',
      body: JSON.stringify({ guestPreferences, vibeProfile, limit })
    })
  },

  // Algorithm service health check
  async healthCheck() {
    return apiCall<unknown>('/algorithm/health')
  }
}

