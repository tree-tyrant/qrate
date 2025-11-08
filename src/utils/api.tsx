// BACKEND DISABLED - localStorage-only mode
const API_BASE_URL = ''
const publicAnonKey = ''

// Backend availability check - set to false to use localStorage-only mode
// DISABLED: Set to false to prevent deployment errors and use localStorage-only mode
let backendAvailable = false
let backendCheckPerformed = true

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Check backend availability once on first API call
async function checkBackendAvailability(): Promise<boolean> {
  if (backendCheckPerformed) {
    return backendAvailable
  }
  
  try {
    console.log('🔍 Checking backend availability...')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    backendAvailable = response.ok
    backendCheckPerformed = true
    
    if (backendAvailable) {
      console.log('✅ Backend is available - using server API')
    } else {
      console.log('⚠️ Backend returned error - using localStorage-only mode')
    }
    
    return backendAvailable
  } catch (error) {
    console.log('⚠️ Backend not available - using localStorage-only mode')
    backendAvailable = false
    backendCheckPerformed = true
    return false
  }
}

async function apiCall<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Check backend availability first
  const isBackendAvailable = await checkBackendAvailability()
  
  if (!isBackendAvailable) {
    console.log(`⚠️ Backend unavailable - skipping API call for ${endpoint}`)
    return { 
      success: false, 
      error: 'Backend unavailable - using localStorage mode' 
    }
  }
  
  try {
    console.log(`🔄 API Call: ${options.method || 'GET'} ${endpoint}`)
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Ensure we always have the authorization header
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    })

    clearTimeout(timeoutId);

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type')
    let data
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      // Handle non-JSON responses (like HTML error pages)
      const text = await response.text()
      console.error(`❌ Non-JSON response for ${endpoint}:`, text.substring(0, 200))
      data = { 
        error: `Server returned non-JSON response: ${response.status} ${response.statusText}`,
        responseText: text.substring(0, 200)
      }
    }
    
    if (!response.ok) {
      // Special handling for 404 errors (expected for demo/local-only events)
      if (response.status === 404) {
        console.log(`ℹ️ API 404 for ${endpoint} - Event may only exist in localStorage`)
        return { success: false, error: data.error || 'Event not found' }
      }
      
      console.error(`❌ API Error (${response.status}) for ${endpoint}:`, data)
      
      // Special handling for 401 errors
      if (response.status === 401) {
        console.error('🔒 Authorization failed - check if publicAnonKey is valid')
        return { 
          success: false, 
          error: `Authorization failed: ${data.message || 'Invalid or missing authorization'}` 
        }
      }
      
      return { success: false, error: data.error || `HTTP ${response.status}: API request failed` }
    }

    console.log(`✅ API Success: ${options.method || 'GET'} ${endpoint}`)
    return { success: true, data }
  } catch (error: any) {
    console.error(`❌ API call failed for ${endpoint}:`, error)
    
    // Mark backend as unavailable on persistent errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      backendAvailable = false
      console.log('⚠️ Backend marked as unavailable - switching to localStorage-only mode')
    }
    
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Please try again.' }
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Backend unavailable - using localStorage mode' }
    }
    return { success: false, error: `Network error: ${error.message}` }
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
    location?: string
    hostId?: string
    vibes?: string[]
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

  // Submit guest preferences
  async submitPreferences(eventCode: string, preferences: {
    spotifyUserData?: any
    additionalPreferences?: any
  }) {
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

  // Create Spotify playlist
  async createSpotifyPlaylist(eventCode: string, playlistData: {
    access_token: string
    playlist_name?: string
    playlist_description?: string
    is_public?: boolean
  }) {
    return apiCall(`/events/${eventCode}/create-playlist`, {
      method: 'POST',
      body: JSON.stringify(playlistData)
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
  // Get Spotify auth URL
  async getAuthUrl(eventCode?: string) {
    const params = eventCode ? `?eventCode=${eventCode}` : ''
    return apiCall(`/spotify/auth${params}`)
  },

  // Get comprehensive user data (top tracks, artists, playlists, etc.)
  async getUserData(accessToken: string) {
    return apiCall('/spotify/user-data', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken })
    })
  },

  // Test Spotify configuration (bypasses auth)
  async testSpotify() {
    try {
      const response = await fetch(`${API_BASE_URL}/test/spotify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Note: No Authorization header needed for test endpoints
        }
      })
      const data = await response.json()
      return { success: response.ok, data, status: response.status }
    } catch (error) {
      return { success: false, error: error.message }
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
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
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
    set(key: string, value: any) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn('Failed to save to localStorage:', error)
      }
    },

    get(key: string) {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      } catch (error) {
        console.warn('Failed to read from localStorage:', error)
        return null
      }
    },

    remove(key: string) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error)
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
        console.error('Error converting time:', error);
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
      console.log(`🔧 Backend manually set to: ${available ? 'available' : 'unavailable'}`)
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
  async testHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      return { success: response.ok, data, status: response.status }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // Test Spotify credentials (bypasses auth)
  async testSpotify() {
    try {
      const response = await fetch(`${API_BASE_URL}/test/spotify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Note: No Authorization header needed for test endpoints
        }
      })
      const data = await response.json()
      return { success: response.ok, data, status: response.status }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // Test events list (bypasses auth)
  async testEvents() {
    try {
      const response = await fetch(`${API_BASE_URL}/test/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      return { success: response.ok, data, status: response.status }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

// Algorithm API calls (PTS + Vibe Gate)
export const algorithmApi = {
  // Calculate Personal Taste Score for a single track
  async calculatePTS(track: any) {
    return apiCall('/algorithm/pts/calculate', {
      method: 'POST',
      body: JSON.stringify({ track })
    })
  },

  // Calculate PTS for multiple tracks
  async calculateBatchPTS(tracks: any[]) {
    return apiCall('/algorithm/pts/batch', {
      method: 'POST',
      body: JSON.stringify({ tracks })
    })
  },

  // Aggregate PTS scores for same tracks from multiple users
  async aggregatePTS(ptsResults: any[]) {
    return apiCall('/algorithm/pts/aggregate', {
      method: 'POST',
      body: JSON.stringify({ ptsResults })
    })
  },

  // Get top N tracks by aggregated PTS
  async getTopTracks(ptsResults: any[], limit = 50) {
    return apiCall('/algorithm/pts/top-tracks', {
      method: 'POST',
      body: JSON.stringify({ ptsResults, limit })
    })
  },

  // Get expected PTS score ranges
  async getPTSScoreRanges() {
    return apiCall('/algorithm/pts/score-ranges')
  },

  // Validate a single track against vibe profile
  async validateVibe(track: any, vibeProfile: any) {
    return apiCall('/algorithm/vibe/validate', {
      method: 'POST',
      body: JSON.stringify({ track, vibeProfile })
    })
  },

  // Filter multiple tracks through vibe gate
  async filterVibe(tracks: any[], vibeProfile: any) {
    return apiCall('/algorithm/vibe/filter', {
      method: 'POST',
      body: JSON.stringify({ tracks, vibeProfile })
    })
  },

  // Create vibe profile from event theme
  async createVibeFromTheme(theme: string, eventName: string) {
    return apiCall('/algorithm/vibe/create-from-theme', {
      method: 'POST',
      body: JSON.stringify({ theme, eventName })
    })
  },

  // Calculate contribution sizing
  async calculateTracksPerPerson(numUsers: number) {
    return apiCall('/algorithm/vibe/calculate-tracks-per-person', {
      method: 'POST',
      body: JSON.stringify({ numUsers })
    })
  },

  // Get vibe profile description
  async getVibeDescription(profile: any) {
    return apiCall('/algorithm/vibe/description', {
      method: 'POST',
      body: JSON.stringify({ profile })
    })
  },

  // Generate recommendations using PTS + Vibe Gate
  async generateRecommendations(guestPreferences: any[], vibeProfile?: any, limit = 50) {
    return apiCall('/algorithm/recommend', {
      method: 'POST',
      body: JSON.stringify({ guestPreferences, vibeProfile, limit })
    })
  },

  // Algorithm service health check
  async healthCheck() {
    return apiCall('/algorithm/health')
  }
}