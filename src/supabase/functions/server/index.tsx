// @ts-nocheck
// Deno runtime file - type checking handled by Deno
// This file is meant to run in Deno runtime, not Node.js
// Deno provides its own type checking and module resolution

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import * as kv from './kv_store.tsx'
import { query, queryOne, execute, initDatabase, getDatabase } from '../../../../database/connection.ts'

const app = new Hono()

const DEFAULT_PREVIEW_DURATION_MS = 20000
const DEFAULT_CHORUS_OFFSET_MS = 30000
const MIN_PREVIEW_START_MS = 15000

function estimateChorusOffset(durationMs?: number | null, previewDurationMs: number = DEFAULT_PREVIEW_DURATION_MS) {
  if (!durationMs || durationMs <= 0) {
    return DEFAULT_CHORUS_OFFSET_MS
  }
  const heuristicStart = Math.round(durationMs * 0.4)
  const maxStart = Math.max(0, durationMs - previewDurationMs)
  return Math.max(MIN_PREVIEW_START_MS, Math.min(heuristicStart, maxStart))
}

// Initialize database on startup
try {
  await initDatabase()
} catch (error) {
  console.log('Database initialization warning:', error)
  console.log('Will use KV store as fallback')
}

// Add CORS and logging
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))
app.use('*', logger(console.log))

// Generate a random event code
function generateEventCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Helper function to create/update session using SQLite
async function upsertSession(eventCode: string, sessionType: 'host' | 'dj' | 'guest', userId: string = 'anonymous') {
  try {
    const now = new Date().toISOString()
    execute(
      `INSERT INTO event_sessions (event_code, session_type, user_id, is_active, last_activity, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)
       ON CONFLICT(event_code, user_id, session_type) 
       DO UPDATE SET is_active = 1, last_activity = ?, updated_at = ?`,
      [eventCode, sessionType, userId, now, now, now, now]
    )
  } catch (error) {
    console.log(`Session tracking error (non-critical): ${error}`)
  }
}

// Create a new event
app.post('/make-server-6d46752d/events', async (c) => {
  try {
    const { name, theme, description, date, time, endTime, location, code, vibes, genre, imageUrl, vibeProfile, hostId } = await c.req.json()
    console.log(`Creating event: ${name}, theme: ${theme}, hostId: ${hostId}`)
    
    if (!name || !theme) {
      return c.json({ error: 'Event name and theme are required' }, 400)
    }

    // Generate unique event code
    let eventCode = (code ? String(code).toUpperCase() : generateEventCode())
    let attempts = 0
    const maxAttempts = 10
    
    // Ensure code is unique - try SQLite first
    try {
      while (attempts < maxAttempts) {
        const existing = queryOne('SELECT code FROM events WHERE code = ?', [eventCode])
        if (!existing) break
        if (code) {
          // If caller requested a specific code that exists, return existing event
          const existingEvent = queryOne('SELECT * FROM events WHERE code = ?', [eventCode])
          if (existingEvent) {
            return c.json({ success: true, event: {
              ...existingEvent,
              createdAt: existingEvent.created_at,
              isActive: existingEvent.is_active === 1
            } })
          }
        }
        eventCode = generateEventCode()
        attempts++
      }
    } catch (dbError) {
      console.log(`Database check error, will use KV store: ${dbError}`)
    }
    
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`
    const now = new Date().toISOString()
    
    const eventData = {
      id: eventId,
      name: name.trim(),
      theme,
      description: description?.trim() || '',
      code: eventCode,
      date: date || new Date().toISOString().split('T')[0],
      time: time || new Date().toTimeString().slice(0, 5),
      endTime: endTime || null,
      location: location?.trim() || null,
      hostId: hostId || null,
      vibes: vibes || [],
      genre: genre || null,
      imageUrl: imageUrl || null,
      vibeProfile: vibeProfile ? JSON.stringify(vibeProfile) : null,
      is_active: 1,
      created_at: now,
      updated_at: now
    }

    console.log(`Storing event with code: ${eventCode}`)
    
    // Try to save to SQLite first
    try {
      execute(
        `INSERT INTO events (id, name, theme, description, code, date, time, end_time, location, host_id, vibes, genre, image_url, vibe_profile, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventData.id, eventData.name, eventData.theme, eventData.description, eventData.code,
         eventData.date, eventData.time, eventData.endTime, eventData.location, eventData.hostId,
         JSON.stringify(eventData.vibes), eventData.genre, eventData.imageUrl, eventData.vibeProfile,
         eventData.is_active, eventData.created_at, eventData.updated_at]
      )
      
      console.log(`Successfully stored event in SQLite: ${eventCode}`)
      
      // Also store in KV as backup
      const kvEvent = {
        ...eventData,
        vibeProfile: vibeProfile || null,
        createdAt: eventData.created_at,
        isActive: eventData.is_active === 1
      }
      await kv.set(`event:${eventCode}`, kvEvent)
      
      return c.json({ 
        success: true, 
        event: {
          ...eventData,
          vibeProfile: vibeProfile || null,
          createdAt: eventData.created_at,
          isActive: eventData.is_active === 1
        }
      })
    } catch (dbError) {
      console.log(`SQLite error, using KV store: ${dbError}`)
    }
    
    // Fallback to KV store (works without database)
    console.log(`Storing event in KV store: ${eventCode}`)
    const event = {
      ...eventData,
      vibeProfile: vibeProfile || null,
      createdAt: now,
      isActive: true
    }
    
    await kv.set(`event:${eventCode}`, event)
    await kv.set(`event:id:${eventId}`, event)
    
    return c.json({ success: true, event })
  } catch (error) {
    console.log(`Error creating event: ${error}`)
    return c.json({ error: 'Failed to create event' }, 500)
  }
})

// Get or update DJ queue order for an event (KV-backed)
app.get('/make-server-6d46752d/events/:code/queue', async (c) => {
  try {
    const code = c.req.param('code')?.toUpperCase()
    if (!code) {
      return c.json({ error: 'Missing event code' }, 400)
    }
    const data = await kv.get(`event:queue:${code}`)
    return c.json({ success: true, queue: (data && data.queue) ? data.queue : [] })
  } catch (error) {
    console.log(`Error fetching queue for event: ${error}`)
    return c.json({ error: 'Failed to fetch queue' }, 500)
  }
})

app.put('/make-server-6d46752d/events/:code/queue', async (c) => {
  try {
    const code = c.req.param('code')?.toUpperCase()
    if (!code) {
      return c.json({ error: 'Missing event code' }, 400)
    }
    const { track_ids } = await c.req.json()
    if (!Array.isArray(track_ids)) {
      return c.json({ error: 'track_ids must be an array' }, 400)
    }
    const now = new Date().toISOString()
    const payload = { queue: track_ids, updated_at: now }
    await kv.set(`event:queue:${code}`, payload)
    return c.json({ success: true })
  } catch (error) {
    console.log(`Error updating queue for event: ${error}`)
    return c.json({ error: 'Failed to update queue' }, 500)
  }
})

// Upsert event by a provided code (used by local demo flows)
app.post('/make-server-6d46752d/events/upsert', async (c) => {
  try {
    const { code, name, theme, description, date, time, location } = await c.req.json()
    if (!code || !name || !theme) {
      return c.json({ error: 'code, name and theme are required' }, 400)
    }

    const now = new Date().toISOString()
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`

    // Try to find existing
    let existing: any = null
    try {
      existing = queryOne('SELECT * FROM events WHERE code = ?', [code.toUpperCase()])
    } catch (dbError) {
      console.log('SQLite lookup failed, checking KV:', dbError)
    }
    if (!existing) {
      const kvEvent = await kv.get(`event:${code.toUpperCase()}`)
      if (kvEvent) existing = kvEvent
    }

    if (existing) {
      return c.json({ success: true, event: existing })
    }

    // Insert new event (SQLite preferred)
    try {
      execute(
        `INSERT INTO events (id, name, theme, description, code, date, time, location, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, name.trim(), theme, (description || '').trim(), code.toUpperCase(),
         date || new Date().toISOString().split('T')[0], time || new Date().toTimeString().slice(0,5),
         location || null, 1, now, now]
      )
      await kv.set(`event:${code.toUpperCase()}`, {
        id: eventId,
        name: name.trim(),
        theme,
        description: (description || '').trim(),
        code: code.toUpperCase(),
        date: date || new Date().toISOString().split('T')[0],
        time: time || new Date().toTimeString().slice(0,5),
        location: location || null,
        is_active: true,
        createdAt: now
      })
      return c.json({ success: true, event: { id: eventId, name, theme, description, code: code.toUpperCase(), date, time, location, isActive: true } })
    } catch (dbError) {
      console.log('SQLite insert failed, storing in KV:', dbError)
      await kv.set(`event:${code.toUpperCase()}`, {
        id: eventId,
        name: name.trim(),
        theme,
        description: (description || '').trim(),
        code: code.toUpperCase(),
        date: date || new Date().toISOString().split('T')[0],
        time: time || new Date().toTimeString().slice(0,5),
        location: location || null,
        is_active: true,
        createdAt: now
      })
      return c.json({ success: true, event: { id: eventId, name, theme, description, code: code.toUpperCase(), date, time, location, isActive: true } })
    }
  } catch (error) {
    console.log('Upsert event error:', error)
    return c.json({ error: 'Failed to upsert event' }, 500)
  }
})

// Get event by code
app.get('/make-server-6d46752d/events/:code', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const sessionType = (c.req.query('session_type') as 'host' | 'dj' | 'guest' | null) || 'guest'
    const userId = c.req.query('user_id') || 'anonymous'
    
    console.log(`Looking up event with code: ${code}`)
    
    // Track session
    await upsertSession(code, sessionType, userId)
    
    // Try to get from SQLite first
    let event = null
    try {
      const eventData = queryOne('SELECT * FROM events WHERE code = ?', [code])
      if (eventData) {
        event = {
          ...eventData,
          vibeProfile: eventData.vibe_profile ? JSON.parse(eventData.vibe_profile) : null,
          createdAt: eventData.created_at,
          isActive: eventData.is_active === 1
        }
        console.log(`Found event in SQLite: ${code}`)
      }
    } catch (dbError) {
      console.log(`SQLite lookup error, using KV: ${dbError}`)
    }
    
    // Fallback to KV store
    if (!event) {
      event = await kv.get(`event:${code}`)
      // Parse vibeProfile if it's a string
      if (event && event.vibeProfile && typeof event.vibeProfile === 'string') {
        try {
          event.vibeProfile = JSON.parse(event.vibeProfile)
        } catch (parseError) {
          console.log(`Error parsing vibeProfile: ${parseError}`)
        }
      }
      console.log(`Found event in KV:`, event ? 'yes' : 'no')
    }
    
    if (!event) {
      console.log(`Event not found for code: ${code}`)
      return c.json({ error: 'Event not found' }, 404)
    }

    // Get all preferences for this event
    let preferences = []
    
    // Try SQLite first
    try {
      const prefData = query('SELECT * FROM guest_preferences WHERE event_code = ?', [code])
      if (prefData) {
        preferences = prefData.map((p: any) => ({
          userId: p.guest_id,
          artists: JSON.parse(p.artists || '[]'),
          genres: JSON.parse(p.genres || '[]'),
          recentTracks: JSON.parse(p.recent_tracks || '[]'),
          spotifyPlaylists: JSON.parse(p.spotify_playlists || '[]'),
          tracksData: JSON.parse(p.tracks_data || '[]'),
          stats: JSON.parse(p.stats || '{}'),
          source: p.source || 'manual',
          submittedAt: p.submitted_at
        }))
        console.log(`Found ${preferences.length} preferences in SQLite`)
      }
    } catch (prefError) {
      console.log(`SQLite preferences lookup error: ${prefError}`)
    }
    
    // Fallback to KV if no preferences found
    if (preferences.length === 0) {
      const kvPrefs = await kv.getByPrefix(`preferences:${code}:`)
      if (kvPrefs) {
        preferences = kvPrefs
        console.log(`Found ${preferences.length} preferences in KV`)
      }
    }
    
    return c.json({ 
      success: true, 
      event: {
        ...event,
        preferences: preferences || []
      }
    })
  } catch (error) {
    console.log(`Error fetching event: ${error}`)
    return c.json({ error: 'Failed to fetch event' }, 500)
  }
})

// Get events for a host
app.get('/make-server-6d46752d/hosts/:hostId/events', async (c) => {
  try {
    const hostId = c.req.param('hostId')
    console.log(`Getting events for host: ${hostId}`)
    
    let events: any[] = []
    
    // Try SQLite first
    try {
      const eventData = query('SELECT * FROM events WHERE host_id = ? ORDER BY created_at DESC', [hostId])
      if (eventData && eventData.length > 0) {
        events = eventData.map((e: any) => ({
          ...e,
          vibeProfile: e.vibe_profile ? JSON.parse(e.vibe_profile) : null,
          createdAt: e.created_at,
          isActive: e.is_active === 1,
          guestCount: 0 // Will be calculated from preferences
        }))
        console.log(`Found ${events.length} events in SQLite for host ${hostId}`)
      }
    } catch (dbError) {
      console.log(`SQLite lookup error, using KV: ${dbError}`)
    }
    
    // Fallback to KV store - get all events and filter by host
    if (events.length === 0) {
      try {
        // Get all events from KV (this is a limitation - KV doesn't support querying by host_id)
        // For now, we'll return empty array and let the client use localStorage
        console.log(`KV store doesn't support host-based queries, returning empty array`)
        events = []
      } catch (kvError) {
        console.log(`KV lookup error: ${kvError}`)
      }
    }
    
    // Get guest counts for each event
    for (const event of events) {
      try {
        const prefData = query('SELECT COUNT(DISTINCT guest_id) as count FROM guest_preferences WHERE event_code = ?', [event.code])
        if (prefData && prefData.length > 0) {
          event.guestCount = prefData[0].count || 0
        }
      } catch (prefError) {
        console.log(`Error getting guest count for event ${event.code}: ${prefError}`)
        event.guestCount = 0
      }
    }
    
    return c.json({
      success: true,
      events: events
    })
  } catch (error) {
    console.log(`Error fetching host events: ${error}`)
    return c.json({ error: 'Failed to fetch host events' }, 500)
  }
})

// Submit guest preferences
app.post('/make-server-6d46752d/events/:code/preferences', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const preferences = await c.req.json()
    const guestId = preferences.guestId || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`
    
    console.log(`Submitting preferences for event: ${code}`)
    
    // Track guest session
    await upsertSession(code, 'guest', guestId)
    
    // Verify event exists - try SQLite first
    try {
      const event = queryOne('SELECT code FROM events WHERE code = ?', [code])
      if (!event) {
        const kvEvent = await kv.get(`event:${code}`)
        if (!kvEvent) {
          console.log(`Event not found for code: ${code}`)
          return c.json({ error: 'Event not found' }, 404)
        }
      }
    } catch (dbError) {
      // Check KV store if SQLite not available
      const kvEvent = await kv.get(`event:${code}`)
      if (!kvEvent) {
        console.log(`Event not found for code: ${code}`)
        return c.json({ error: 'Event not found' }, 404)
      }
    }
    
    // Process Spotify playlist data if provided
    const tracksData = preferences.tracksData || preferences.tracks || []
    const stats = preferences.stats || {}
    const now = new Date().toISOString()
    
    const guestPreferences = {
      event_code: code,
      guest_id: guestId,
      artists: JSON.stringify(preferences.artists || []),
      genres: JSON.stringify(preferences.genres || []),
      recent_tracks: JSON.stringify(preferences.recentTracks || []),
      spotify_playlists: JSON.stringify(preferences.spotifyPlaylists || []),
      spotify_analyzed: (preferences.spotifyAnalyzed || preferences.source === 'spotify') ? 1 : 0,
      source: preferences.source || 'manual',
      tracks_data: JSON.stringify(tracksData),
      stats: JSON.stringify(stats),
      submitted_at: now
    }

    let previousTracks: any[] = []
    try {
      const existingRecord = queryOne(
        'SELECT tracks_data FROM guest_preferences WHERE event_code = ? AND guest_id = ?',
        [code, guestId]
      )

      if (existingRecord?.tracks_data) {
        const parsed = JSON.parse(existingRecord.tracks_data || '[]')
        if (Array.isArray(parsed)) {
          previousTracks = parsed
        }
      }
    } catch (lookupError) {
      console.log(`Guest preferences lookup warning for ${code}/${guestId}: ${lookupError}`)
    }
    
    // Try to save to SQLite first
    try {
      execute(
        `INSERT INTO guest_preferences (event_code, guest_id, artists, genres, recent_tracks, spotify_playlists, spotify_analyzed, source, tracks_data, stats, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(event_code, guest_id) 
         DO UPDATE SET 
           artists = excluded.artists,
           genres = excluded.genres,
           recent_tracks = excluded.recent_tracks,
           spotify_playlists = excluded.spotify_playlists,
           spotify_analyzed = excluded.spotify_analyzed,
           source = excluded.source,
           tracks_data = excluded.tracks_data,
           stats = excluded.stats,
           submitted_at = excluded.submitted_at`,
        [guestPreferences.event_code, guestPreferences.guest_id, guestPreferences.artists,
         guestPreferences.genres, guestPreferences.recent_tracks, guestPreferences.spotify_playlists,
         guestPreferences.spotify_analyzed, guestPreferences.source, guestPreferences.tracks_data,
         guestPreferences.stats, guestPreferences.submitted_at]
      )
      
      console.log(`Stored preferences in SQLite for event ${code}, guest ${guestId}`)
      
      if (previousTracks.length > 0) {
        for (const track of previousTracks) {
          const trackId = track?.id
          const trackName = track?.name || track?.trackName
          const artistName = Array.isArray(track?.artists)
            ? track.artists[0]?.name || track.artists[0]
            : (track?.artist || track?.artistName || 'Unknown Artist')

          if (!trackId || !trackName || !artistName) continue

          execute(
            `UPDATE event_songs
             SET frequency = CASE WHEN frequency > 0 THEN frequency - 1 ELSE 0 END
             WHERE event_code = ? AND spotify_track_id = ? AND track_name = ? AND artist_name = ?`,
            [code, trackId, trackName, artistName]
          )

          execute(
            'DELETE FROM event_songs WHERE event_code = ? AND spotify_track_id = ? AND track_name = ? AND artist_name = ? AND frequency <= 0',
            [code, trackId, trackName, artistName]
          )
        }
      }
      
      // Store tracks in event_songs table for aggregation
      if (tracksData && tracksData.length > 0) {
        for (const track of tracksData) {
          const trackId = track.id
          const trackName = track.name
          const artistName = Array.isArray(track.artists) ? track.artists[0]?.name || track.artists[0] : (track.artists || 'Unknown Artist')
          const albumName = track.album?.name || track.album || null
          const popularity = track.popularity || 0
          
          // Check if song already exists
          const existingSong = queryOne(
            'SELECT frequency FROM event_songs WHERE event_code = ? AND spotify_track_id = ? AND track_name = ? AND artist_name = ?',
            [code, trackId, trackName, artistName]
          )
          
          if (existingSong) {
            // Increment frequency
            execute(
              'UPDATE event_songs SET frequency = frequency + 1 WHERE event_code = ? AND spotify_track_id = ? AND track_name = ? AND artist_name = ?',
              [code, trackId, trackName, artistName]
            )
          } else {
            // Insert new song
            execute(
              'INSERT INTO event_songs (event_code, spotify_track_id, track_name, artist_name, album_name, popularity, frequency) VALUES (?, ?, ?, ?, ?, ?, 1)',
              [code, trackId, trackName, artistName, albumName, popularity]
            )
          }
        }
      }
      
      // Also store in KV as backup
      await kv.set(`preferences:${code}:${guestId}`, {
        ...guestPreferences,
        guestId,
        eventCode: code,
        submittedAt: now
      })
      
      return c.json({ success: true, guestId })
    } catch (dbError) {
      console.log(`SQLite error, using KV: ${dbError}`)
    }
    
    // Fallback to KV store (works without database)
    console.log(`Storing preferences in KV for event ${code}, guest ${guestId}`)
    await kv.set(`preferences:${code}:${guestId}`, {
      event_code: code,
      guest_id: guestId,
      artists: preferences.artists || [],
      genres: preferences.genres || [],
      recentTracks: preferences.recentTracks || [],
      spotifyPlaylists: preferences.spotifyPlaylists || [],
      tracksData: tracksData,
      stats: stats,
      source: preferences.source || 'manual',
      guestId,
      eventCode: code,
      submittedAt: now
    })
    
    return c.json({ success: true, guestId })
  } catch (error) {
    console.log(`Error submitting preferences: ${error}`)
    return c.json({ error: 'Failed to submit preferences' }, 500)
  }
})

// Get crowd insights for an event
app.get('/make-server-6d46752d/events/:code/insights', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    console.log(`Getting insights for event: ${code}`)
    
    // Get event to retrieve vibeProfile
    let event: any = null
    try {
      const eventData = queryOne('SELECT * FROM events WHERE code = ?', [code])
      if (eventData) {
        event = {
          ...eventData,
          vibeProfile: eventData.vibe_profile ? JSON.parse(eventData.vibe_profile) : null
        }
      } else {
        // Try KV store
        const kvEvent = await kv.get(`event:${code}`)
        if (kvEvent) {
          event = kvEvent
          // Parse vibeProfile if it's a string
          if (event.vibeProfile && typeof event.vibeProfile === 'string') {
            event.vibeProfile = JSON.parse(event.vibeProfile)
          }
        }
      }
    } catch (eventError) {
      console.log(`Error fetching event: ${eventError}`)
    }
    
    // Get all preferences for this event
    let preferences = []
    
    // Try SQLite first
    try {
      const prefData = query('SELECT * FROM guest_preferences WHERE event_code = ? AND source = ?', [code, 'spotify'])
      if (prefData) {
        preferences = prefData.map((p: any) => ({
          userId: p.guest_id,
          artists: JSON.parse(p.artists || '[]'),
          genres: JSON.parse(p.genres || '[]'),
          recentTracks: JSON.parse(p.recent_tracks || '[]'),
          spotifyPlaylists: JSON.parse(p.spotify_playlists || '[]'),
          tracksData: JSON.parse(p.tracks_data || '[]'),
          stats: JSON.parse(p.stats || '{}'),
          source: p.source || 'spotify',
          submittedAt: p.submitted_at
        }))
      }
    } catch (prefError) {
      console.log(`SQLite preferences lookup error: ${prefError}`)
    }
    
    // Fallback to KV if needed
    if (preferences.length === 0) {
      const kvPrefs = await kv.getByPrefix(`preferences:${code}:`)
      if (kvPrefs) {
        // Only include Spotify-sourced preferences
        preferences = kvPrefs.filter((p: any) => 
          p.source === 'spotify' || p.spotifyAnalyzed === true
        )
      }
    }
    
    console.log(`Found ${preferences?.length || 0} preferences for event ${code}`)
    
    if (!preferences || preferences.length === 0) {
      return c.json({
        success: true,
        insights: {
          totalGuests: 0,
          topGenres: [],
          topArtists: [],
          recommendations: []
        }
      })
    }

    // Analyze preferences
    const genreCounts: Record<string, number> = {}
    const artistCounts: Record<string, number> = {}
    
    preferences.forEach((pref: any) => {
      // Count genres
      if (pref.genres) {
        pref.genres.forEach((genre: string) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1
        })
      }
      
      // Count artists
      if (pref.artists) {
        pref.artists.forEach((artist: string) => {
          artistCounts[artist] = (artistCounts[artist] || 0) + 1
        })
      }
    })

    // Sort and get top items
    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({
        name: genre,
        count,
        percentage: Math.round((count / preferences.length) * 100)
      }))

    const topArtists = Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([artist, count]) => ({ name: artist, count }))

    // Generate recommendations based on crowd data
    // Use top songs from guest preferences if available
    let recommendations = []
    
    // Try to get top songs from real Spotify data first - SQLite
    try {
      const songs = query(
        'SELECT * FROM event_songs WHERE event_code = ? ORDER BY frequency DESC LIMIT 15',
        [code]
      )
      
      if (songs && songs.length > 0) {
        recommendations = songs.map((song: any, index: number) => {
          const durationMs = song.duration_ms || song.duration || 0
          const previewDurationMs = song.preview_duration_ms || DEFAULT_PREVIEW_DURATION_MS
          const chorusOffsetMs = estimateChorusOffset(durationMs, previewDurationMs)

          return {
            id: song.spotify_track_id,
            title: song.track_name,
            artist: song.artist_name,
            album: song.album_name || '',
            duration: '0:00',
            duration_ms: durationMs,
            matchScore: Math.min(song.frequency * 10, 100),
            match_score: Math.min(song.frequency * 10, 100),
            reasons: [
              `Appeared ${song.frequency} time${song.frequency > 1 ? 's' : ''} in guest playlists`,
              'Top crowd favorite',
              song.popularity > 70 ? 'High popularity track' : 'Crowd-selected'
            ],
            energy: song.popularity || 75,
            danceability: 75,
            source: 'spotify',
            spotify_track_id: song.spotify_track_id,
            preview_url: song.preview_url || null,
            preview_duration_ms: previewDurationMs,
            chorus_offset_ms: chorusOffsetMs
          }
        })
      }
    } catch (dbError) {
      console.log(`SQLite top songs lookup error: ${dbError}`)
    }
    
    // Fallback: aggregate from preferences stored in KV
    if (recommendations.length === 0) {
      const allTracks: Record<string, { track: any; count: number }> = {}
      
      preferences.forEach((pref: any) => {
        const tracks = pref.tracksData || pref.tracks || []
        tracks.forEach((track: any) => {
          const trackKey = `${track.id || track.name}-${track.artists?.[0] || track.artist || 'Unknown'}`
          if (!allTracks[trackKey]) {
            allTracks[trackKey] = {
              track: {
                id: track.id || '',
                name: track.name || track.title || '',
                artists: track.artists || [track.artist] || ['Unknown Artist'],
                album: track.album || '',
                popularity: track.popularity || 0,
                preview_url: track.preview_url || null
              },
              count: 0
            }
          }
          allTracks[trackKey].count++
        })
      })
      
      // Sort by frequency and get top 15
      recommendations = Object.values(allTracks)
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)
        .map((item, index) => {
          const durationMs = item.track.duration_ms || item.track.duration || 0
          const previewDurationMs = item.track.preview_duration_ms || DEFAULT_PREVIEW_DURATION_MS
          const chorusOffsetMs = estimateChorusOffset(durationMs, previewDurationMs)

          return {
            id: item.track.id || `rec-${index}`,
            title: item.track.name,
            artist: Array.isArray(item.track.artists) ? item.track.artists[0] : item.track.artists,
            album: item.track.album || '',
            duration: '0:00',
            duration_ms: durationMs,
            matchScore: Math.min(item.count * 10, 100),
            match_score: Math.min(item.count * 10, 100),
            reasons: [
              `Appeared ${item.count} time${item.count > 1 ? 's' : ''} in guest playlists`,
              'Top crowd favorite'
            ],
            energy: item.track.popularity || 75,
            danceability: 75,
            source: 'spotify',
            spotify_track_id: item.track.id,
            preview_url: item.track.preview_url || null,
            preview_duration_ms: previewDurationMs,
            chorus_offset_ms: chorusOffsetMs
          }
        })
    }
    
    // If still no recommendations, return empty array
    if (recommendations.length === 0) {
      recommendations = []
    }

    // Filter recommendations using vibeProfile if available
    // Strictness controls adjacency: strict = exact only, loose = adjacent, open = loosely related
    if (event?.vibeProfile && recommendations.length > 0) {
      const vibeProfile = event.vibeProfile
      const strictness = vibeProfile.strictness || 'loose'
      
      // Define genre adjacency relationships
      const genreAdjacency: Record<string, string[]> = {
        'r&b': ['soul', 'neo-soul', 'contemporary r&b', 'hip-hop', 'rap', 'funk'],
        'rnb': ['r&b', 'soul', 'neo-soul', 'contemporary r&b', 'hip-hop', 'rap'],
        'hip-hop': ['rap', 'trap', 'r&b', 'soul', 'funk', 'jazz'],
        'rap': ['hip-hop', 'trap', 'drill', 'r&b', 'soul'],
        'pop': ['dance pop', 'electropop', 'indie pop', 'synth-pop', 'r&b'],
        'electronic': ['edm', 'house', 'techno', 'trance', 'dubstep', 'dance'],
        'edm': ['electronic', 'house', 'techno', 'trance', 'dubstep', 'dance'],
        'house': ['electronic', 'edm', 'techno', 'deep house', 'dance'],
        'rock': ['alternative rock', 'indie rock', 'hard rock', 'punk rock', 'pop rock'],
        'jazz': ['smooth jazz', 'jazz fusion', 'bebop', 'soul', 'r&b'],
        'soul': ['r&b', 'neo-soul', 'funk', 'gospel', 'jazz'],
        'funk': ['soul', 'r&b', 'disco', 'jazz'],
        'country': ['country rock', 'bluegrass', 'folk', 'pop'],
        'latin': ['reggaeton', 'salsa', 'bachata', 'latin pop', 'dance'],
        'reggaeton': ['latin', 'dance', 'hip-hop', 'pop'],
        'dance': ['house', 'disco', 'pop', 'electronic', 'edm'],
        'disco': ['funk', 'dance', 'house', 'pop']
      }
      
      // Normalize genre name for lookup
      const normalizeGenre = (genre: string): string => {
        return genre.toLowerCase().trim()
      }
      
      // Check if genres are related (exact match or adjacent)
      const isGenreRelated = (trackGenre: string, allowedGenre: string, strictnessLevel: string): boolean => {
        const normalizedTrack = normalizeGenre(trackGenre)
        const normalizedAllowed = normalizeGenre(allowedGenre)
        
        // Exact match always works
        if (normalizedTrack === normalizedAllowed || 
            normalizedTrack.includes(normalizedAllowed) || 
            normalizedAllowed.includes(normalizedTrack)) {
          return true
        }
        
        // For strict mode, only exact matches
        if (strictnessLevel === 'strict') {
          return false
        }
        
        // For loose mode, check direct adjacency
        if (strictnessLevel === 'loose') {
          const adjacents = genreAdjacency[normalizedAllowed] || []
          return adjacents.some(adj => 
            normalizedTrack.includes(adj) || adj.includes(normalizedTrack)
          )
        }
        
        // For open mode, check if they share any common words or are in same family
        if (strictnessLevel === 'open') {
          const adjacents = genreAdjacency[normalizedAllowed] || []
          const hasAdjacent = adjacents.some(adj => 
            normalizedTrack.includes(adj) || adj.includes(normalizedTrack)
          )
          
          // Also check for loosely related genres (broader connections)
          const genreFamilies: Record<string, string[]> = {
            'urban': ['r&b', 'rnb', 'hip-hop', 'rap', 'soul', 'funk', 'trap'],
            'electronic': ['edm', 'house', 'techno', 'trance', 'dubstep', 'dance', 'disco'],
            'pop': ['pop', 'dance pop', 'electropop', 'indie pop', 'synth-pop', 'r&b', 'dance'],
            'rock': ['rock', 'alternative rock', 'indie rock', 'hard rock', 'punk rock', 'pop rock'],
            'soulful': ['soul', 'r&b', 'rnb', 'neo-soul', 'gospel', 'jazz', 'funk']
          }
          
          // Check if both genres are in the same family
          for (const [family, genres] of Object.entries(genreFamilies)) {
            if (genres.some(g => normalizeGenre(g) === normalizedAllowed) &&
                genres.some(g => normalizeGenre(g) === normalizedTrack)) {
              return true
            }
          }
          
          return hasAdjacent
        }
        
        return false
      }
      
      // Check if year is within allowed range based on strictness
      const isYearAllowed = (trackYear: number, yearRange: { min?: number; max?: number }, strictnessLevel: string): { allowed: boolean; penalty: number } => {
        if (!yearRange || !trackYear) {
          return { allowed: true, penalty: 0 }
        }
        
        const { min, max } = yearRange
        const inRange = (!min || trackYear >= min) && (!max || trackYear <= max)
        
        if (inRange) {
          return { allowed: true, penalty: 0 }
        }
        
        // Strict: only exact era
        if (strictnessLevel === 'strict') {
          return { allowed: false, penalty: 0 }
        }
        
        // Loose: allow adjacent decade (within 10 years)
        if (strictnessLevel === 'loose') {
          const minDecade = min ? Math.floor(min / 10) * 10 : null
          const maxDecade = max ? Math.floor(max / 10) * 10 : null
          const trackDecade = Math.floor(trackYear / 10) * 10
          
          const withinAdjacentDecade = 
            (minDecade && trackDecade >= minDecade - 10 && trackDecade <= maxDecade + 10) ||
            (!minDecade && maxDecade && trackDecade <= maxDecade + 10) ||
            (minDecade && !maxDecade && trackDecade >= minDecade - 10)
          
          if (withinAdjacentDecade) {
            return { allowed: true, penalty: 10 } // Small penalty for adjacent decade
          }
          return { allowed: false, penalty: 0 }
        }
        
        // Open: allow broader range (within 20 years)
        if (strictnessLevel === 'open') {
          const minDecade = min ? Math.floor(min / 10) * 10 : null
          const maxDecade = max ? Math.floor(max / 10) * 10 : null
          const trackDecade = Math.floor(trackYear / 10) * 10
          
          const withinBroaderRange = 
            (minDecade && trackDecade >= minDecade - 20 && trackDecade <= maxDecade + 20) ||
            (!minDecade && maxDecade && trackDecade <= maxDecade + 20) ||
            (minDecade && !maxDecade && trackDecade >= minDecade - 20)
          
          if (withinBroaderRange) {
            return { allowed: true, penalty: 20 } // Larger penalty for broader range
          }
          return { allowed: false, penalty: 0 }
        }
        
        return { allowed: false, penalty: 0 }
      }
      
      // DEBUG: Genre/theme filtering disabled for debugging
      // try {
      //   recommendations = recommendations.map((rec: any) => {
      //     let vibeScore = 100 // Start with perfect score
      //     const reasons: string[] = []
      //     let shouldExclude = false
      //     
      //     // 1. EXPLICIT CONTENT CHECK (Hard block regardless of strictness)
      //     if (!vibeProfile.allowExplicit && rec.explicit) {
      //       return { ...rec, vibeScore: 0, vibePassed: false, vibeReasons: ['Explicit content not allowed'] }
      //     }
      //     
      //     // 2. BLOCKED KEYWORDS (Hard block)
      //     if (vibeProfile.excludeKeywords && vibeProfile.excludeKeywords.length > 0) {
      //       const trackText = `${rec.title || ''} ${rec.artist || ''} ${rec.album || ''}`.toLowerCase()
      //       const hasExcludedKeyword = vibeProfile.excludeKeywords.some((keyword: string) =>
      //         trackText.includes(keyword.toLowerCase())
      //       )
      //       if (hasExcludedKeyword) {
      //         return { ...rec, vibeScore: 0, vibePassed: false, vibeReasons: ['Contains blocked keywords'] }
      //       }
      //     }
      //     
      //     // 3. GENRE VALIDATION (with adjacency based on strictness)
      //     if (vibeProfile.allowedGenres && vibeProfile.allowedGenres.length > 0) {
      //       const trackGenres = rec.genres || []
      //       let genreMatch = false
      //       let genreMatchType = ''
      //       
      //       for (const allowedGenre of vibeProfile.allowedGenres) {
      //         const matched = trackGenres.some((trackGenre: string) => {
      //           const isExact = normalizeGenre(trackGenre) === normalizeGenre(allowedGenre) ||
      //                            normalizeGenre(trackGenre).includes(normalizeGenre(allowedGenre)) ||
      //                            normalizeGenre(allowedGenre).includes(normalizeGenre(trackGenre))
      //           
      //           if (isExact) {
      //             genreMatchType = 'exact'
      //             return true
      //           }
      //           
      //           if (strictness === 'strict') {
      //             return false // Strict: only exact matches
      //           }
      //           
      //           const isAdjacent = isGenreRelated(trackGenre, allowedGenre, strictness)
      //           if (isAdjacent) {
      //             genreMatchType = strictness === 'loose' ? 'adjacent' : 'related'
      //             return true
      //           }
      //           
      //           return false
      //         })
      //         
      //         if (matched) {
      //           genreMatch = true
      //           break
      //         }
      //       }
      //       
      //       if (!genreMatch) {
      //         // Strict mode: hard block if no genre match
      //         if (strictness === 'strict') {
      //           shouldExclude = true
      //           reasons.push(`Genre mismatch (strict mode requires exact match)`)
      //         } else {
      //           vibeScore -= 40
      //           reasons.push(`Genre mismatch`)
      //         }
      //       } else {
      //         if (genreMatchType === 'exact') {
      //           reasons.push('✓ Genre match (exact)')
      //         } else if (genreMatchType === 'adjacent') {
      //           vibeScore -= 10 // Small penalty for adjacent genre
      //           reasons.push('✓ Genre match (adjacent)')
      //         } else {
      //           vibeScore -= 20 // Larger penalty for loosely related
      //           reasons.push('✓ Genre match (related)')
      //         }
      //       }
      //     }
      //     
      //     // 4. BLOCKED GENRES (Hard block for strict mode, penalty for others)
      //     if (vibeProfile.blockedGenres && vibeProfile.blockedGenres.length > 0) {
      //       const trackGenres = rec.genres || []
      //       const hasBlockedGenre = vibeProfile.blockedGenres.some((blockedGenre: string) =>
      //         trackGenres.some((genre: string) => 
      //           normalizeGenre(genre) === normalizeGenre(blockedGenre) ||
      //           normalizeGenre(genre).includes(normalizeGenre(blockedGenre)) ||
      //           normalizeGenre(blockedGenre).includes(normalizeGenre(genre))
      //         )
      //       )
      //       if (hasBlockedGenre) {
      //         if (strictness === 'strict') {
      //           return { ...rec, vibeScore: 0, vibePassed: false, vibeReasons: ['Contains blocked genre'] }
      //         } else {
      //           vibeScore -= 30
      //           reasons.push('Contains discouraged genre')
      //         }
      //       }
      //     }
      //     
      //     // 5. YEAR RANGE VALIDATION (with adjacency based on strictness)
      //     if (vibeProfile.yearRange && rec.year) {
      //       const yearCheck = isYearAllowed(rec.year, vibeProfile.yearRange, strictness)
      //       if (!yearCheck.allowed) {
      //         if (strictness === 'strict') {
      //           shouldExclude = true
      //           reasons.push(`Year out of range (strict mode: ${vibeProfile.yearRange.min}-${vibeProfile.yearRange.max} only)`)
      //         } else {
      //           vibeScore -= 20
      //           reasons.push(`Year out of range`)
      //         }
      //       } else {
      //         if (yearCheck.penalty > 0) {
      //           vibeScore -= yearCheck.penalty
      //           reasons.push(`✓ Year match (adjacent era, -${yearCheck.penalty}pts)`)
      //         } else {
      //           reasons.push(`✓ Year match`)
      //         }
      //       }
      //     }
      //     
      //     // 6. ENERGY VALIDATION (Weight: 10 points)
      //     if (vibeProfile.energy) {
      //       const energy = (rec.energy || 75) / 100 // Convert 0-100 to 0-1
      //       if ((vibeProfile.energy.min !== undefined && energy < vibeProfile.energy.min) ||
      //           (vibeProfile.energy.max !== undefined && energy > vibeProfile.energy.max)) {
      //         vibeScore -= 10
      //         reasons.push(`Energy out of range`)
      //       } else {
      //         reasons.push('✓ Energy match')
      //       }
      //     }
      //     
      //     // 7. DANCEABILITY VALIDATION (Weight: 10 points)
      //     if (vibeProfile.danceability) {
      //       const danceability = (rec.danceability || 75) / 100 // Convert 0-100 to 0-1
      //       if ((vibeProfile.danceability.min !== undefined && danceability < vibeProfile.danceability.min) ||
      //           (vibeProfile.danceability.max !== undefined && danceability > vibeProfile.danceability.max)) {
      //         vibeScore -= 10
      //         reasons.push(`Danceability out of range`)
      //       } else {
      //         reasons.push('✓ Danceability match')
      //       }
      //     }
      //     
      //     // 8. DESIRED KEYWORDS (Weight: 10 points bonus)
      //     if (vibeProfile.keywords && vibeProfile.keywords.length > 0) {
      //       const trackText = `${rec.title || ''} ${rec.artist || ''} ${rec.album || ''}`.toLowerCase()
      //       const hasDesiredKeyword = vibeProfile.keywords.some((keyword: string) =>
      //         trackText.includes(keyword.toLowerCase())
      //       )
      //       if (hasDesiredKeyword) {
      //         vibeScore = Math.min(vibeScore + 10, 100) // Cap at 100
      //         reasons.push('✓ Contains desired keywords')
      //       }
      //     }
      //     
      //     // In strict mode, exclude if genre or year doesn't match exactly
      //     if (shouldExclude) {
      //       return { ...rec, vibeScore: 0, vibePassed: false, vibeReasons: reasons }
      //     }
      //     
      //     // Adjust matchScore based on vibe score
      //     // Blend vibe score with original matchScore (70% original, 30% vibe)
      //     const blendedScore = Math.round((rec.matchScore || 75) * 0.7 + vibeScore * 0.3)
      //     
      //     return {
      //       ...rec,
      //       vibeScore,
      //       vibePassed: true,
      //       vibeReasons: reasons,
      //       matchScore: blendedScore
      //     }
      //   })
      //   
      //   // Filter out tracks that failed in strict mode
      //   recommendations = recommendations.filter((rec: any) => rec.vibePassed !== false)
      //   
      //   // Re-sort by matchScore after filtering
      //   recommendations.sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0))
      //   
      //   console.log(`🎛️ Filtered ${recommendations.length} recommendations using vibeProfile (strictness: ${strictness} - ${strictness === 'strict' ? 'exact matches only' : strictness === 'loose' ? 'exact + adjacent' : 'exact + adjacent + related'})`)
      // } catch (filterError) {
      //   console.log(`Error filtering recommendations with vibeProfile: ${filterError}`)
      // }
    }

    return c.json({
      success: true,
      insights: {
        totalGuests: preferences.length,
        topGenres,
        topArtists,
        recommendations
      }
    })
  } catch (error) {
    console.log(`Error generating insights: ${error}`)
    return c.json({ error: 'Failed to generate insights' }, 500)
  }
})

// Get discovery queue (hidden anthems) for an event
app.get('/make-server-6d46752d/events/:code/discovery-queue', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const queueTrackIdsParam = c.req.query('queue_track_ids')
    const accessToken = c.req.query('access_token') // DJ's Spotify token
    
    console.log(`Getting discovery queue for event: ${code}`)
    
    // If no queue tracks provided, return empty
    if (!queueTrackIdsParam || queueTrackIdsParam.trim() === '') {
      return c.json({
        success: true,
        anthems: []
      })
    }
    
    const queueTrackIds = queueTrackIdsParam.split(',').filter(id => id.trim().length > 0)
    
    if (queueTrackIds.length === 0) {
      return c.json({
        success: true,
        anthems: []
      })
    }
    
    // Get event information
    let event: any = null
    try {
      const eventData = queryOne('SELECT * FROM events WHERE code = ?', [code])
      if (eventData) {
        event = {
          name: eventData.name,
          theme: eventData.theme,
          description: eventData.description
        }
      }
    } catch (dbError) {
      console.log(`SQLite event lookup error: ${dbError}`)
      const kvEvent = await kv.get(`event:${code}`)
      if (kvEvent) {
        event = {
          name: kvEvent.name,
          theme: kvEvent.theme,
          description: kvEvent.description
        }
      }
    }
    
    // Get top genres from guest preferences
    let topGenres: string[] = []
    try {
      const prefData = query('SELECT genres FROM guest_preferences WHERE event_code = ? AND source = ?', [code, 'spotify'])
      if (prefData) {
        const genreCounts: Record<string, number> = {}
        prefData.forEach((p: any) => {
          const genres = JSON.parse(p.genres || '[]')
          genres.forEach((genre: string) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1
          })
        })
        topGenres = Object.entries(genreCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([genre]) => genre)
      }
    } catch (prefError) {
      console.log(`Error getting top genres: ${prefError}`)
    }
    
    // If no access token, return empty (can't call Spotify API)
    if (!accessToken) {
      console.log('No access token provided for discovery queue')
      return c.json({
        success: true,
        anthems: []
      })
    }
    
    // Step 1: Get Spotify Recommendations
    const seedTracks = queueTrackIds.slice(0, 5) // Spotify limit: max 5 seed tracks
    const seedGenres = topGenres.slice(0, 5) // Spotify limit: max 5 seed genres
    
    const recommendationsParams = new URLSearchParams({
      seed_tracks: seedTracks.join(','),
      limit: '50',
      target_popularity: '40', // Target medium popularity (20-60 range)
      min_popularity: '20',
      max_popularity: '60'
    })
    
    if (seedGenres.length > 0) {
      recommendationsParams.append('seed_genres', seedGenres.join(','))
    }
    
    const recommendationsUrl = `https://api.spotify.com/v1/recommendations?${recommendationsParams.toString()}`
    
    let candidateTracks: any[] = []
    try {
      const recResponse = await fetch(recommendationsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (recResponse.ok) {
        const recData = await recResponse.json()
        candidateTracks = recData.tracks || []
      } else {
        console.log(`Spotify recommendations failed: ${recResponse.status}`)
      }
    } catch (error) {
      console.log(`Error fetching Spotify recommendations: ${error}`)
    }
    
    if (candidateTracks.length === 0) {
      return c.json({
        success: true,
        anthems: []
      })
    }
    
    // Step 2: Get audio features for queue tracks and candidates
    const allTrackIds = [...queueTrackIds, ...candidateTracks.map((t: any) => t.id)]
    const audioFeaturesMap = new Map<string, any>()
    
    // Spotify API allows up to 100 IDs per request
    for (let i = 0; i < allTrackIds.length; i += 100) {
      const batch = allTrackIds.slice(i, i + 100)
      try {
        const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${batch.join(',')}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        if (featuresResponse.ok) {
          const featuresData = await featuresResponse.json()
          if (featuresData.audio_features) {
            featuresData.audio_features.forEach((features: any, index: number) => {
              if (features) {
                audioFeaturesMap.set(batch[index], features)
              }
            })
          }
        }
      } catch (error) {
        console.log(`Error fetching audio features batch: ${error}`)
      }
    }
    
    // Step 3: Use discovery engine to filter and rank
    // Convert queue tracks to SeedTrack format
    const seedTracksWithFeatures: any[] = []
    for (let i = 0; i < queueTrackIds.length; i++) {
      const trackId = queueTrackIds[i]
      const features = audioFeaturesMap.get(trackId)
      if (features) {
        seedTracksWithFeatures.push({
          trackId,
          audioFeatures: {
            bpm: features.tempo || 120,
            key: features.key || 0,
            mode: features.mode || 0,
            danceability: features.danceability || 0.5,
            energy: features.energy || 0.5,
            valence: features.valence || 0.5,
            loudness: features.loudness || -10,
            acousticness: features.acousticness || 0,
            instrumentalness: features.instrumentalness || 0,
            speechiness: features.speechiness || 0
          },
          queuePosition: i + 1
        })
      }
    }
    
    if (seedTracksWithFeatures.length === 0) {
      return c.json({
        success: true,
        anthems: []
      })
    }
    
    // Calculate average fingerprint
    const avgFingerprint = {
      bpm: seedTracksWithFeatures.reduce((sum, t) => sum + t.audioFeatures.bpm, 0) / seedTracksWithFeatures.length,
      key: Math.round(seedTracksWithFeatures.reduce((sum, t) => sum + t.audioFeatures.key, 0) / seedTracksWithFeatures.length),
      mode: Math.round(seedTracksWithFeatures.reduce((sum, t) => sum + t.audioFeatures.mode, 0) / seedTracksWithFeatures.length),
      danceability: seedTracksWithFeatures.reduce((sum, t) => sum + t.audioFeatures.danceability, 0) / seedTracksWithFeatures.length,
      energy: seedTracksWithFeatures.reduce((sum, t) => sum + t.audioFeatures.energy, 0) / seedTracksWithFeatures.length,
      valence: seedTracksWithFeatures.reduce((sum, t) => sum + t.audioFeatures.valence, 0) / seedTracksWithFeatures.length,
      loudness: seedTracksWithFeatures.reduce((sum, t) => sum + t.audioFeatures.loudness, 0) / seedTracksWithFeatures.length,
      acousticness: seedTracksWithFeatures.reduce((sum, t) => sum + t.audioFeatures.acousticness, 0) / seedTracksWithFeatures.length,
      instrumentalness: seedTracksWithFeatures.reduce((sum, t) => sum + t.audioFeatures.instrumentalness, 0) / seedTracksWithFeatures.length,
      speechiness: seedTracksWithFeatures.reduce((sum, t) => sum + t.audioFeatures.speechiness, 0) / seedTracksWithFeatures.length
    }
    
    // Calculate synergy scores for candidates
    const candidateTracksWithScores = candidateTracks
      .filter((track: any) => !queueTrackIds.includes(track.id)) // Exclude queue tracks
      .map((track: any) => {
        const features = audioFeaturesMap.get(track.id)
        if (!features) return null
        
        const candidateFingerprint = {
          bpm: features.tempo || 120,
          key: features.key || 0,
          mode: features.mode || 0,
          danceability: features.danceability || 0.5,
          energy: features.energy || 0.5,
          valence: features.valence || 0.5,
          loudness: features.loudness || -10,
          acousticness: features.acousticness || 0,
          instrumentalness: features.instrumentalness || 0,
          speechiness: features.speechiness || 0
        }
        
        // Calculate synergy score (simplified version of discovery engine)
        const bpmDiff = Math.abs(candidateFingerprint.bpm - avgFingerprint.bpm)
        const bpmCompatibility = bpmDiff <= 5 ? 1.0 : bpmDiff <= 10 ? 0.8 : bpmDiff <= 20 ? 0.6 : bpmDiff <= 30 ? 0.4 : 0.2
        
        const keyDist = Math.min(
          Math.abs(candidateFingerprint.key - avgFingerprint.key),
          12 - Math.abs(candidateFingerprint.key - avgFingerprint.key)
        )
        const keyCompatibility = 1 - (keyDist / 6)
        
        const energyDiff = Math.abs(candidateFingerprint.energy - avgFingerprint.energy)
        const valenceDiff = Math.abs(candidateFingerprint.valence - avgFingerprint.valence)
        const moodCompatibility = 1 - ((energyDiff + valenceDiff) / 2)
        
        // Cosine similarity approximation
        const vectorA = [
          candidateFingerprint.bpm / 200,
          candidateFingerprint.key / 11,
          candidateFingerprint.mode,
          candidateFingerprint.danceability,
          candidateFingerprint.energy,
          candidateFingerprint.valence,
          (candidateFingerprint.loudness + 60) / 60,
          candidateFingerprint.acousticness,
          candidateFingerprint.instrumentalness,
          candidateFingerprint.speechiness
        ]
        const vectorB = [
          avgFingerprint.bpm / 200,
          avgFingerprint.key / 11,
          avgFingerprint.mode,
          avgFingerprint.danceability,
          avgFingerprint.energy,
          avgFingerprint.valence,
          (avgFingerprint.loudness + 60) / 60,
          avgFingerprint.acousticness,
          avgFingerprint.instrumentalness,
          avgFingerprint.speechiness
        ]
        
        let dotProduct = 0
        let magnitudeA = 0
        let magnitudeB = 0
        for (let i = 0; i < vectorA.length; i++) {
          dotProduct += vectorA[i] * vectorB[i]
          magnitudeA += vectorA[i] * vectorA[i]
          magnitudeB += vectorB[i] * vectorB[i]
        }
        magnitudeA = Math.sqrt(magnitudeA)
        magnitudeB = Math.sqrt(magnitudeB)
        const cosineSim = (magnitudeA === 0 || magnitudeB === 0) ? 0 : dotProduct / (magnitudeA * magnitudeB)
        
        const synergyScore = (cosineSim * 0.6) + (bpmCompatibility * 0.2) + (keyCompatibility * 0.1) + (moodCompatibility * 0.1)
        
        // Calculate theme match
        let themeMatch = 70 // Default
        if (event) {
          const trackInfo = {
            name: track.name,
            artist: track.artists?.[0]?.name || '',
            album: track.album?.name || '',
            genres: [] // Would need to fetch from artist/genre endpoint
          }
          
          // Simple keyword matching
          const eventText = `${event.name || ''} ${event.theme || ''} ${event.description || ''}`.toLowerCase()
          const trackText = `${track.name} ${track.artists?.[0]?.name || ''} ${track.album?.name || ''}`.toLowerCase()
          
          const eventWords = eventText.split(/\s+/).filter(w => w.length >= 3)
          let matches = 0
          eventWords.forEach(word => {
            if (trackText.includes(word)) matches++
          })
          
          themeMatch = eventWords.length > 0 ? Math.min(100, (matches / eventWords.length) * 100 + 50) : 70
        }
        
        return {
          track,
          features: candidateFingerprint,
          synergyScore,
          themeMatch,
          popularity: track.popularity || 50
        }
      })
      .filter((item: any) => item !== null)
      .filter((item: any) => item.synergyScore >= 0.5) // Min synergy threshold
      .filter((item: any) => item.popularity >= 20 && item.popularity <= 60) // Hidden anthems popularity range
      // DEBUG: Theme filtering disabled
      // .filter((item: any) => item.themeMatch >= 70) // Min theme match
      .sort((a: any, b: any) => {
        // Sort by combined score: (synergy * 0.6) + (theme match / 100 * 0.4)
        const scoreA = (a.synergyScore * 0.6) + ((a.themeMatch / 100) * 0.4)
        const scoreB = (b.synergyScore * 0.6) + ((b.themeMatch / 100) * 0.4)
        return scoreB - scoreA
      })
      .slice(0, 15) // Top 15
    
    // Format response
    const anthems = candidateTracksWithScores.map((item: any) => {
      const track = item.track
      const durationMs = track.duration_ms || 0
      const minutes = Math.floor(durationMs / 60000)
      const seconds = Math.floor((durationMs % 60000) / 1000)
      const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`
      
      // Generate passion description
      let passionDescription = ''
      if (item.themeMatch >= 90) {
        passionDescription = 'Perfect theme match'
      } else if (item.themeMatch >= 80) {
        passionDescription = 'Excellent theme fit'
      } else {
        passionDescription = 'Strong theme match'
      }
      
      if (item.synergyScore >= 0.8) {
        passionDescription += '. Musically compatible'
      } else if (item.synergyScore >= 0.6) {
        passionDescription += '. Good musical flow'
      }
      
      if (item.popularity <= 40) {
        passionDescription += '. Hidden gem'
      } else {
        passionDescription += '. Under the radar'
      }
      
      return {
        id: track.id,
        title: track.name,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        artists: track.artists?.map((a: any) => ({ name: a.name })) || [{ name: 'Unknown Artist' }],
        album: track.album?.name || '',
        duration,
        duration_ms: durationMs,
        matchScore: Math.round(item.synergyScore * 100),
        themeMatch: Math.round(item.themeMatch),
        energy: Math.round(item.features.energy * 100),
        danceability: Math.round(item.features.danceability * 100),
        popularity: item.popularity,
        passionDescription,
        preview_url: track.preview_url,
        preview_duration_ms: track.preview_duration_ms || DEFAULT_PREVIEW_DURATION_MS,
        chorus_offset_ms: estimateChorusOffset(durationMs, track.preview_duration_ms || DEFAULT_PREVIEW_DURATION_MS),
        source: 'hidden-anthems' as const,
        audioFeatures: {
          bpm: Math.round(item.features.bpm),
          key: item.features.key,
          energy: item.features.energy,
          danceability: item.features.danceability,
          valence: item.features.valence,
          tempo: item.features.bpm
        }
      }
    })
    
    return c.json({
      success: true,
      anthems
    })
  } catch (error) {
    console.log(`Error generating discovery queue: ${error}`)
    return c.json({ error: 'Failed to generate discovery queue' }, 500)
  }
})

// Debug route to list all events
app.get('/make-server-6d46752d/debug/events', async (c) => {
  try {
    const events = await kv.getByPrefix('event:')
    console.log('All events:', events)
    return c.json({ 
      success: true, 
      events: events || [],
      count: events?.length || 0
    })
  } catch (error) {
    console.log(`Error listing events: ${error}`)
    return c.json({ error: 'Failed to list events' }, 500)
  }
})

// Spotify authentication route (GUEST)
app.get('/make-server-6d46752d/spotify/auth', async (c) => {
  try {
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
    if (!clientId) {
      console.log('Spotify client ID not configured')
      return c.json({ error: 'Spotify integration not configured' }, 500)
    }

    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-follow-read',
      'user-top-read',
      'user-library-read'
    ].join(' ')
    const envGuestRedirect = Deno.env.get('SPOTIFY_GUEST_REDIRECT_URI')
    const origin = new URL(c.req.url).origin
    const redirectUri = envGuestRedirect || `${origin}/guest`
    
    const state = Math.random().toString(36).substring(7)
    
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `show_dialog=true`

    console.log('🎵 Generated Spotify auth URL for GUEST')
    console.log(`   Redirect URI: ${redirectUri}`)
    console.log(`   ⚠️  Make sure this EXACT URI is in your Spotify app settings!`)
    console.log(`   Dashboard: https://developer.spotify.com/dashboard`)
    return c.json({ success: true, auth_url: authUrl })
  } catch (error) {
    console.log(`Error generating Spotify auth URL: ${error}`)
    return c.json({ error: 'Failed to generate auth URL' }, 500)
  }
})

// Spotify callback route (GUEST)
app.post('/make-server-6d46752d/spotify/callback', async (c) => {
  try {
    const { code } = await c.req.json()
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
    
    if (!clientId || !clientSecret) {
      console.log('Spotify credentials not configured')
      return c.json({ error: 'Spotify integration not configured' }, 500)
    }

    const envGuestRedirect = Deno.env.get('SPOTIFY_GUEST_REDIRECT_URI')
    const origin = new URL(c.req.url).origin
    const redirectUri = envGuestRedirect || `${origin}/guest`
    
    console.log('🎵 Processing Spotify callback for GUEST')
    console.log(`   Redirect URI: ${redirectUri}`)
    console.log(`   ⚠️  This MUST match the URI used in the auth request!`)
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.log(`❌ Spotify token exchange failed:`)
      console.log(`   Error: ${error}`)
      console.log(`   Redirect URI used: ${redirectUri}`)
      console.log(`   ⚠️  Check that this EXACT URI is registered in Spotify Dashboard`)
      return c.json({ error: 'Failed to exchange code for token', details: error }, 400)
    }

    const tokenData = await tokenResponse.json()
    console.log('Successfully exchanged code for Spotify access token')
    console.log(`   Granted scopes: ${tokenData.scope || '(none provided)'}`)
    
    return c.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    })
  } catch (error) {
    console.log(`Error in Spotify callback: ${error}`)
    return c.json({ error: 'Failed to process Spotify callback' }, 500)
  }
})

// Get Spotify playlists
app.post('/make-server-6d46752d/spotify/playlists', async (c) => {
  try {
    const { access_token } = await c.req.json()
    
    if (!access_token) {
      return c.json({ error: 'Access token required' }, 400)
    }

    // Get user's playlists
    const playlistsResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })

    if (!playlistsResponse.ok) {
      const error = await playlistsResponse.text()
      console.log(`Spotify playlists fetch failed: ${error}`)
      return c.json({ error: 'Failed to fetch playlists' }, 400)
    }

    const playlistsData = await playlistsResponse.json()
    console.log(`Fetched ${playlistsData.items?.length || 0} Spotify playlists`)

    // Filter and format playlists
    const playlists = playlistsData.items?.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.name,
      tracks: { total: playlist.tracks.total },
      images: playlist.images || [],
      description: playlist.description
    })) || []

    return c.json({ success: true, playlists })
  } catch (error) {
    console.log(`Error fetching Spotify playlists: ${error}`)
    return c.json({ error: 'Failed to fetch playlists' }, 500)
  }
})

// Get tracks from Spotify playlists (for preference analysis)
app.post('/make-server-6d46752d/spotify/playlist-tracks', async (c) => {
  try {
    const { access_token, playlist_ids } = await c.req.json()
    
    if (!access_token || !playlist_ids || !Array.isArray(playlist_ids)) {
      return c.json({ error: 'Access token and playlist IDs required' }, 400)
    }

    const allTracks: any[] = []
    const allArtists = new Set<string>()

    for (const playlistId of playlist_ids) {
      try {
        // Get playlist tracks
        const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        })

        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json()
          
          for (const item of tracksData.items || []) {
            if (item.track && item.track.artists) {
              allTracks.push({
                id: item.track.id,
                name: item.track.name,
                artists: item.track.artists.map((artist: any) => ({ name: artist.name })),
                album: {
                  name: item.track.album?.name || '',
                  images: item.track.album?.images || []
                },
                popularity: item.track.popularity,
                preview_url: item.track.preview_url,
                explicit: item.track.explicit,
                duration_ms: item.track.duration_ms
              })

              // Collect artist names
              item.track.artists.forEach((artist: any) => {
                allArtists.add(artist.name)
              })
            }
          }
        }
      } catch (error) {
        console.log(`Error fetching tracks for playlist ${playlistId}: ${error}`)
        // Continue with other playlists
      }
    }

    console.log(`Analyzed ${allTracks.length} tracks from ${playlist_ids.length} playlists`)

    return c.json({ 
      success: true, 
      tracks: allTracks,
      artists: Array.from(allArtists),
      genres: [] // Would need Spotify API audio features for real genres
    })
  } catch (error) {
    console.log(`Error analyzing playlist tracks: ${error}`)
    return c.json({ error: 'Failed to analyze playlist tracks' }, 500)
  }
})

// Get comprehensive Spotify user data (profile, top tracks, top artists, saved tracks, playlists)
app.post('/make-server-6d46752d/spotify/user-data', async (c) => {
  try {
    const { access_token } = await c.req.json()
    
    if (!access_token) {
      return c.json({ error: 'Access token required' }, 400)
    }

    const headers = {
      'Authorization': `Bearer ${access_token}`
    }

    // Fetch all data in parallel for better performance
    const [profileRes, topTracksShortRes, topTracksMediumRes, topTracksLongRes, 
           topArtistsShortRes, topArtistsMediumRes, topArtistsLongRes, 
           savedTracksRes, playlistsRes, followedArtistsRes] = await Promise.allSettled([
      // User profile
      fetch('https://api.spotify.com/v1/me', { headers }),
      // Top tracks - short term (last 4 weeks)
      fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50', { headers }),
      // Top tracks - medium term (last 6 months)
      fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50', { headers }),
      // Top tracks - long term (all time)
      fetch('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50', { headers }),
      // Top artists - short term
      fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50', { headers }),
      // Top artists - medium term
      fetch('https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50', { headers }),
      // Top artists - long term
      fetch('https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=50', { headers }),
      // Saved tracks (limit to 50 for performance)
      fetch('https://api.spotify.com/v1/me/tracks?limit=50', { headers }),
      // Playlists (limit to 50)
      fetch('https://api.spotify.com/v1/me/playlists?limit=50', { headers }),
      // Followed artists (limit to 50)
      fetch('https://api.spotify.com/v1/me/following?type=artist&limit=50', { headers })
    ])

    const fetchAudioFeatures = async (trackIds: string[]) => {
      const audioFeaturesMap: Record<string, any> = {}
      if (trackIds.length === 0) {
        return audioFeaturesMap
      }

      for (let i = 0; i < trackIds.length; i += 100) {
        const batch = trackIds.slice(i, i + 100).join(',')
        try {
          const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${batch}`, { headers })
          if (response.ok) {
            const data = await response.json()
            data.audio_features?.forEach((feature: any) => {
              if (feature?.id) {
                audioFeaturesMap[feature.id] = feature
              }
            })
          }
        } catch (error) {
          console.log(`⚠️ Error fetching audio features batch: ${error}`)
        }
      }

      return audioFeaturesMap
    }

    const fetchArtistGenres = async (artistIds: string[]) => {
      const artistGenreMap: Record<string, string[]> = {}
      if (artistIds.length === 0) {
        return artistGenreMap
      }

      for (let i = 0; i < artistIds.length; i += 50) {
        const batch = artistIds.slice(i, i + 50).join(',')
        try {
          const response = await fetch(`https://api.spotify.com/v1/artists?ids=${batch}`, { headers })
          if (response.ok) {
            const data = await response.json()
            data.artists?.forEach((artist: any) => {
              if (artist?.id) {
                artistGenreMap[artist.id] = artist.genres || []
              }
            })
          }
        } catch (error) {
          console.log(`⚠️ Error fetching artist genres batch: ${error}`)
        }
      }

      return artistGenreMap
    }

    // Process profile
    let profile = null
    if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
      profile = await profileRes.value.json()
    }

    // Process top tracks
    const topTracks: any = {}
    if (topTracksShortRes.status === 'fulfilled' && topTracksShortRes.value.ok) {
      const data = await topTracksShortRes.value.json()
      topTracks.short_term = data.items?.map((track: any) => ({
        id: track.id,
        name: track.name,
        artists: track.artists?.map((a: any) => ({ name: a.name, id: a.id })),
        album: {
          name: track.album?.name,
          images: track.album?.images || [],
          release_date: track.album?.release_date
        },
        popularity: track.popularity,
        explicit: track.explicit,
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_urls: track.external_urls
      })) || []
    } else if (topTracksShortRes.status === 'fulfilled') {
      const errorText = await topTracksShortRes.value.text()
      console.log(`❌ Failed to fetch top tracks (short_term): ${topTracksShortRes.value.status} ${topTracksShortRes.value.statusText} - ${errorText}`)
    } else {
      console.log(`❌ Top tracks (short_term) request failed: ${topTracksShortRes.reason}`)
    }
    if (topTracksMediumRes.status === 'fulfilled' && topTracksMediumRes.value.ok) {
      const data = await topTracksMediumRes.value.json()
      topTracks.medium_term = data.items?.map((track: any) => ({
        id: track.id,
        name: track.name,
        artists: track.artists?.map((a: any) => ({ name: a.name, id: a.id })),
        album: {
          name: track.album?.name,
          images: track.album?.images || [],
          release_date: track.album?.release_date
        },
        popularity: track.popularity,
        explicit: track.explicit,
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_urls: track.external_urls
      })) || []
    } else if (topTracksMediumRes.status === 'fulfilled') {
      const errorText = await topTracksMediumRes.value.text()
      console.log(`❌ Failed to fetch top tracks (medium_term): ${topTracksMediumRes.value.status} ${topTracksMediumRes.value.statusText} - ${errorText}`)
    } else {
      console.log(`❌ Top tracks (medium_term) request failed: ${topTracksMediumRes.reason}`)
    }
    if (topTracksLongRes.status === 'fulfilled' && topTracksLongRes.value.ok) {
      const data = await topTracksLongRes.value.json()
      topTracks.long_term = data.items?.map((track: any) => ({
        id: track.id,
        name: track.name,
        artists: track.artists?.map((a: any) => ({ name: a.name, id: a.id })),
        album: {
          name: track.album?.name,
          images: track.album?.images || [],
          release_date: track.album?.release_date
        },
        popularity: track.popularity,
        explicit: track.explicit,
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_urls: track.external_urls
      })) || []
    } else if (topTracksLongRes.status === 'fulfilled') {
      const errorText = await topTracksLongRes.value.text()
      console.log(`❌ Failed to fetch top tracks (long_term): ${topTracksLongRes.value.status} ${topTracksLongRes.value.statusText} - ${errorText}`)
    } else {
      console.log(`❌ Top tracks (long_term) request failed: ${topTracksLongRes.reason}`)
    }

    // Process top artists
    const topArtists: any = {}
    if (topArtistsShortRes.status === 'fulfilled' && topArtistsShortRes.value.ok) {
      const data = await topArtistsShortRes.value.json()
      topArtists.short_term = data.items?.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres || []
      })) || []
    }
    if (topArtistsMediumRes.status === 'fulfilled' && topArtistsMediumRes.value.ok) {
      const data = await topArtistsMediumRes.value.json()
      topArtists.medium_term = data.items?.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres || []
      })) || []
    }
    if (topArtistsLongRes.status === 'fulfilled' && topArtistsLongRes.value.ok) {
      const data = await topArtistsLongRes.value.json()
      topArtists.long_term = data.items?.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres || []
      })) || []
    }

    // Process saved tracks
    let savedTracks: any[] = []
    if (savedTracksRes.status === 'fulfilled' && savedTracksRes.value.ok) {
      const data = await savedTracksRes.value.json()
      savedTracks = data.items?.map((item: any) => ({
        id: item.track?.id,
        name: item.track?.name,
        artists: item.track?.artists?.map((a: any) => ({ name: a.name, id: a.id })),
        album: {
          name: item.track?.album?.name,
          images: item.track?.album?.images || [],
          release_date: item.track?.album?.release_date
        },
        popularity: item.track?.popularity,
        explicit: item.track?.explicit,
        duration_ms: item.track?.duration_ms,
        preview_url: item.track?.preview_url,
        external_urls: item.track?.external_urls
      })).filter((t: any) => t.id) || []
    } else if (savedTracksRes.status === 'fulfilled') {
      const errorText = await savedTracksRes.value.text()
      console.log(`❌ Failed to fetch saved tracks: ${savedTracksRes.value.status} ${savedTracksRes.value.statusText} - ${errorText}`)
    } else {
      console.log(`❌ Saved tracks request failed: ${savedTracksRes.reason}`)
    }

    // Process playlists
    let playlists: any[] = []
    if (playlistsRes.status === 'fulfilled' && playlistsRes.value.ok) {
      const data = await playlistsRes.value.json()
      playlists = data.items?.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        track_count: playlist.tracks?.total || 0,
        images: playlist.images || []
      })) || []
    }

    const allTrackEntries: any[] = [
      ...(topTracks.short_term || []),
      ...(topTracks.medium_term || []),
      ...(topTracks.long_term || []),
      ...savedTracks
    ]

    const uniqueTrackIds = Array.from(new Set(allTrackEntries.map((track: any) => track?.id).filter(Boolean)))
    const uniqueArtistIds = Array.from(new Set(allTrackEntries.flatMap((track: any) =>
      (track?.artists || [])
        .map((artist: any) => artist?.id)
        .filter(Boolean)
    )))

    const [audioFeaturesMap, artistGenresMap] = await Promise.all([
      fetchAudioFeatures(uniqueTrackIds),
      fetchArtistGenres(uniqueArtistIds)
    ])

    const enrichTrack = (track: any) => {
      if (!track || !track.id) return

      const features = audioFeaturesMap[track.id]
      if (features) {
        track.audio_features = features
        track.audioFeatures = {
          tempo: features.tempo,
          energy: features.energy,
          danceability: features.danceability,
          acousticness: features.acousticness,
          instrumentalness: features.instrumentalness,
          liveness: features.liveness,
          loudness: features.loudness,
          speechiness: features.speechiness,
          valence: features.valence,
          key: features.key,
          mode: features.mode,
          timeSignature: features.time_signature,
          durationMs: features.duration_ms
        }
      }

      if (!track.release_date && track.album?.release_date) {
        track.release_date = track.album.release_date
      }

      const genreSet = new Set(track.genres || [])
      ;(track.artists || []).forEach((artist: any) => {
        if (!artist?.id) return
        const artistGenres = artistGenresMap[artist.id] || []
        if (artistGenres.length > 0) {
          artist.genres = artistGenres
          artistGenres.forEach((genre: string) => genre && genreSet.add(genre))
        }
      })
      if (genreSet.size > 0) {
        track.genres = Array.from(genreSet)
      }
    }

    allTrackEntries.forEach(enrichTrack)

    // Process followed artists
    let followedArtists: any[] = []
    if (followedArtistsRes.status === 'fulfilled' && followedArtistsRes.value.ok) {
      const data = await followedArtistsRes.value.json()
      const artists = data?.artists?.items || []
      followedArtists = artists.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres || [],
        popularity: artist.popularity,
        images: artist.images || []
      })).filter((artist: any) => artist.id)
    }

    console.log(`✅ Fetched comprehensive Spotify user data for user: ${profile?.id || 'unknown'}`)
    console.log(`   Top tracks: ${Object.keys(topTracks).length} timeframes`)
    console.log(`   Top artists: ${Object.keys(topArtists).length} timeframes`)
    console.log(`   Saved tracks: ${savedTracks.length}`)
    console.log(`   Playlists: ${playlists.length}`)
    console.log(`   Followed artists: ${followedArtists.length}`)

    return c.json({
      success: true,
      profile: profile ? {
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email,
        images: profile.images || []
      } : undefined,
      top_tracks: Object.keys(topTracks).length > 0 ? topTracks : undefined,
      top_artists: Object.keys(topArtists).length > 0 ? topArtists : undefined,
      saved_tracks: savedTracks.length > 0 ? savedTracks : undefined,
      playlists: playlists.length > 0 ? playlists : undefined,
      followed_artists: followedArtists.length > 0 ? followedArtists : undefined
    })
  } catch (error) {
    console.log(`Error fetching Spotify user data: ${error}`)
    return c.json({ error: 'Failed to fetch user data', details: String(error) }, 500)
  }
})

// Get top 15 songs from guest preferences
app.get('/make-server-6d46752d/events/:code/top-songs', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    console.log(`Getting top songs for event: ${code}`)
    
    // Try to get from SQLite first
    try {
      const songs = query(
        'SELECT * FROM event_songs WHERE event_code = ? ORDER BY frequency DESC LIMIT 15',
        [code]
      )
      
      if (songs && songs.length > 0) {
        const topSongs = songs.map((song: any) => ({
          id: song.spotify_track_id,
          title: song.track_name,
          artist: song.artist_name,
          album: song.album_name || '',
          frequency: song.frequency,
          popularity: song.popularity || 0,
          spotifyTrackId: song.spotify_track_id,
          preview_url: null // SQLite doesn't store preview URLs
        }))
        
        console.log(`Found ${topSongs.length} top songs from SQLite`)
        return c.json({ success: true, songs: topSongs })
      }
    } catch (dbError) {
      console.log(`SQLite top songs lookup error, using fallback: ${dbError}`)
    }
    
    // Fallback: aggregate from preferences (KV store)
    let preferences: any[] = []
    
    // Try SQLite first
    try {
      const prefData = query(
        'SELECT tracks_data FROM guest_preferences WHERE event_code = ? AND source = ? AND tracks_data IS NOT NULL',
        [code, 'spotify']
      )
      if (prefData) {
        preferences = prefData.filter((p: any) => {
          try {
            const tracks = JSON.parse(p.tracks_data || '[]')
            return Array.isArray(tracks) && tracks.length > 0
          } catch {
            return false
          }
        })
      }
    } catch (prefError) {
      console.log(`SQLite preferences lookup error: ${prefError}`)
    }
    
    // Fallback to KV if needed
    if (preferences.length === 0) {
      const kvPrefs = await kv.getByPrefix(`preferences:${code}:`)
      if (kvPrefs) {
        // Only include Spotify-sourced preferences
        preferences = kvPrefs.filter((p: any) => 
          (p.tracksData || p.tracks) && 
          (p.source === 'spotify' || p.spotifyAnalyzed === true)
        )
      }
    }
    
    // Aggregate tracks from all preferences
    const trackCounts: Record<string, { track: any; count: number }> = {}
    
    preferences.forEach((pref: any) => {
      let tracks: any[] = []
      if (pref.tracks_data) {
        // From SQLite - parse JSON string
        try {
          tracks = JSON.parse(pref.tracks_data)
        } catch {
          tracks = []
        }
      } else {
        // From KV store - already parsed
        tracks = pref.tracksData || pref.tracks || []
      }
      
      tracks.forEach((track: any) => {
        const trackKey = `${track.id || track.name}-${Array.isArray(track.artists) ? track.artists[0]?.name || track.artists[0] : (track.artist || 'Unknown')}`
        if (!trackCounts[trackKey]) {
          trackCounts[trackKey] = {
            track: {
              id: track.id || '',
              name: track.name || track.title || '',
              artists: track.artists || [track.artist] || ['Unknown Artist'],
              album: track.album || '',
              popularity: track.popularity || 0,
              preview_url: track.preview_url || null
            },
            count: 0
          }
        }
        trackCounts[trackKey].count++
      })
    })
    
    // Sort by frequency and get top 15
    const topSongs = Object.values(trackCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((item) => ({
        id: item.track.id,
        title: item.track.name,
        artist: Array.isArray(item.track.artists) ? item.track.artists[0]?.name || item.track.artists[0] : item.track.artists,
        album: item.track.album || '',
        frequency: item.count,
        popularity: item.track.popularity || 0,
        spotifyTrackId: item.track.id,
        preview_url: item.track.preview_url || null
      }))
    
    console.log(`Aggregated ${topSongs.length} top songs from preferences`)
    return c.json({ success: true, songs: topSongs })
  } catch (error) {
    console.log(`Error getting top songs: ${error}`)
    return c.json({ error: 'Failed to get top songs' }, 500)
  }
})

// Get randomized session pool: random 10 from top 50 (ranked by frequency desc, then popularity desc)
app.get('/make-server-6d46752d/events/:code/session-pool', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    console.log(`Getting session pool for event: ${code}`)

    // Try SQLite first for ranked list
    let ranked: any[] = []
    try {
      const songs = query(
        'SELECT spotify_track_id, track_name, artist_name, album_name, popularity, frequency FROM event_songs WHERE event_code = ? ORDER BY frequency DESC, popularity DESC LIMIT 50',
        [code]
      )
      if (songs && songs.length > 0) {
        ranked = songs.map((song: any) => ({
          id: song.spotify_track_id,
          title: song.track_name,
          artist: song.artist_name,
          album: song.album_name || '',
          frequency: song.frequency,
          popularity: song.popularity || 0,
          preview_url: null // SQLite doesn't store preview URLs
        }))
      }
    } catch (dbError) {
      console.log(`SQLite session pool lookup error, using aggregation fallback: ${dbError}`)
    }

    // Fallback: aggregate from guest preferences similar to top-songs
    if (ranked.length === 0) {
      let preferences: any[] = []
      try {
        const prefData = query(
          'SELECT tracks_data FROM guest_preferences WHERE event_code = ? AND source = ? AND tracks_data IS NOT NULL',
          [code, 'spotify']
        )
        if (prefData) {
          preferences = prefData.filter((p: any) => {
            try {
              const tracks = JSON.parse(p.tracks_data || '[]')
              return Array.isArray(tracks) && tracks.length > 0
            } catch {
              return false
            }
          })
        }
      } catch (prefError) {
        console.log(`SQLite preferences lookup error (fallback): ${prefError}`)
      }
      if (preferences.length === 0) {
        const kvPrefs = await kv.getByPrefix(`preferences:${code}:`)
        if (kvPrefs) {
          preferences = kvPrefs.filter((p: any) => (p.tracksData || p.tracks) && (p.source === 'spotify' || p.spotifyAnalyzed === true))
        }
      }

      const trackCounts: Record<string, { track: any; count: number }> = {}
      preferences.forEach((pref: any) => {
        let tracks: any[] = []
        if (pref.tracks_data) {
          try { tracks = JSON.parse(pref.tracks_data) } catch { tracks = [] }
        } else {
          tracks = pref.tracksData || pref.tracks || []
        }
        tracks.forEach((track: any) => {
          const key = `${track.id || track.name}-${Array.isArray(track.artists) ? track.artists[0]?.name || track.artists[0] : (track.artist || 'Unknown')}`
          if (!trackCounts[key]) {
            trackCounts[key] = {
              track: {
                id: track.id || '',
                name: track.name || track.title || '',
                artists: track.artists || [track.artist] || ['Unknown Artist'],
                album: track.album || '',
                popularity: track.popularity || 0,
                preview_url: track.preview_url || null,
              },
              count: 0,
            }
          }
          trackCounts[key].count++
        })
      })

      ranked = Object.values(trackCounts)
        .sort((a, b) => (b.count - a.count) || ((b.track.popularity || 0) - (a.track.popularity || 0)))
        .slice(0, 50)
        .map((item) => ({
          id: item.track.id,
          title: item.track.name,
          artist: Array.isArray(item.track.artists) ? item.track.artists[0]?.name || item.track.artists[0] : item.track.artists,
          album: item.track.album || '',
          frequency: item.count,
          popularity: item.track.popularity || 0,
          preview_url: item.track.preview_url || null,
        }))
    }

    // Randomly sample up to 10 unique items from ranked (top 50 at most)
    const top50 = ranked.slice(0, 50)
    const sampled: any[] = []
    const seen = new Set<string>()
    while (sampled.length < Math.min(10, top50.length)) {
      const pick = top50[Math.floor(Math.random() * top50.length)]
      const key = `${pick.id}-${pick.artist}`
      if (!seen.has(key)) {
        sampled.push(pick)
        seen.add(key)
      }
      if (seen.size >= top50.length) break
    }

    return c.json({ success: true, songs: sampled })
  } catch (error) {
    console.log(`Error getting session pool: ${error}`)
    return c.json({ error: 'Failed to get session pool' }, 500)
  }
})

// DJ Spotify authentication route
app.get('/make-server-6d46752d/spotify/dj/auth', async (c) => {
  try {
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
    if (!clientId) {
      console.log('Spotify client ID not configured')
      return c.json({ error: 'Spotify integration not configured' }, 500)
    }

    const scopes = 'user-read-private playlist-modify-public playlist-modify-private'
    const envRedirectUri = Deno.env.get('SPOTIFY_DJ_REDIRECT_URI')
    const origin = new URL(c.req.url).origin
    const redirectUri = envRedirectUri || `${origin}/dj/spotify/callback`
    
    const state = Math.random().toString(36).substring(7)
    
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `show_dialog=true`

    console.log('🎵 Generated Spotify auth URL for DJ')
    console.log(`   Redirect URI: ${redirectUri}`)
    console.log(`   ⚠️  Make sure this EXACT URI is in your Spotify app settings!`)
    console.log(`   Dashboard: https://developer.spotify.com/dashboard`)
    return c.json({ success: true, auth_url: authUrl })
  } catch (error) {
    console.log(`Error generating DJ Spotify auth URL: ${error}`)
    return c.json({ error: 'Failed to generate auth URL' }, 500)
  }
})

// DJ Spotify callback route
app.post('/make-server-6d46752d/spotify/dj/callback', async (c) => {
  try {
    const { code } = await c.req.json()
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
    
    if (!clientId || !clientSecret) {
      console.log('Spotify credentials not configured')
      return c.json({ error: 'Spotify integration not configured' }, 500)
    }

    const envRedirectUri = Deno.env.get('SPOTIFY_DJ_REDIRECT_URI')
    const origin = new URL(c.req.url).origin
    const redirectUri = envRedirectUri || `${origin}/dj/spotify/callback`
    
    console.log('🎵 Processing Spotify callback for DJ')
    console.log(`   Redirect URI: ${redirectUri}`)
    console.log(`   ⚠️  This MUST match the URI used in the auth request!`)
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.log(`❌ Spotify token exchange failed:`)
      console.log(`   Error: ${error}`)
      console.log(`   Redirect URI used: ${redirectUri}`)
      console.log(`   ⚠️  Check that this EXACT URI is registered in Spotify Dashboard`)
      return c.json({ error: 'Failed to exchange code for token', details: error }, 400)
    }

    const tokenData = await tokenResponse.json()
    console.log('Successfully exchanged code for DJ Spotify access token')
    console.log(`   Granted scopes: ${tokenData.scope || '(none provided)'}`)
    
    return c.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    })
  } catch (error) {
    console.log(`Error in DJ Spotify callback: ${error}`)
    return c.json({ error: 'Failed to process Spotify callback' }, 500)
  }
})

// Create Spotify playlist with top songs (or provided track_ids) or add to existing playlist
app.post('/make-server-6d46752d/spotify/create-playlist', async (c) => {
  try {
    const { access_token, event_code, playlist_name, playlist_id, track_ids } = await c.req.json()
    
    if (!access_token || !event_code) {
      return c.json({ error: 'Access token and event code required' }, 400)
    }

    // Determine tracks to add
    let topSongs: any[] = []
    
    // If client provided track_ids (e.g., queue, AI recs), use those
    if (Array.isArray(track_ids) && track_ids.length > 0) {
      topSongs = track_ids.filter((id: string) => !!id)
    } else {
      // Try SQLite first
      try {
        const songs = query(
          'SELECT spotify_track_id FROM event_songs WHERE event_code = ? ORDER BY frequency DESC LIMIT 15',
          [event_code.toUpperCase()]
        )
        
        if (songs && songs.length > 0) {
          topSongs = songs.map(s => s.spotify_track_id).filter(Boolean)
        }
      } catch (dbError) {
        console.log(`Error fetching top songs from SQLite: ${dbError}`)
      }
      
      // Fallback: Get from API endpoint if still empty
      if (topSongs.length === 0) {
        try {
          const baseUrl = c.req.url.replace('/spotify/create-playlist', '')
          const topSongsResponse = await fetch(`${baseUrl}/events/${event_code}/top-songs`, {
            headers: {
              'Authorization': c.req.header('Authorization') || ''
            }
          })
          if (topSongsResponse.ok) {
            const data = await topSongsResponse.json()
            if (data.success && data.songs) {
              topSongs = data.songs.map((s: any) => s.spotifyTrackId || s.id).filter(Boolean)
            }
          }
        } catch (apiError) {
          console.log(`Error fetching top songs from API: ${apiError}`)
        }
      }
    }

    if (topSongs.length === 0) {
      return c.json({ error: 'No songs found for this event' }, 400)
    }

    let playlistId: string
    let playlistData: any
    let playlistName: string

    // If playlist_id is provided, use existing playlist
    if (playlist_id) {
      playlistId = playlist_id
      
      // Get playlist info
      const getPlaylistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })

      if (!getPlaylistResponse.ok) {
        const error = await getPlaylistResponse.text()
        console.log(`Failed to get playlist: ${error}`)
        return c.json({ error: 'Failed to get playlist' }, 400)
      }

      playlistData = await getPlaylistResponse.json()
      playlistName = playlistData.name
    } else {
      // Create new playlist
      // Get user's Spotify ID
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })

      if (!userResponse.ok) {
        return c.json({ error: 'Failed to get Spotify user info' }, 400)
      }

      const userData = await userResponse.json()
      const userId = userData.id

      playlistName = playlist_name || `QRate Event ${event_code} - Queue`
      const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: playlistName,
          description: `Queue from ${event_code} event`,
          public: true
        })
      })

      if (!createPlaylistResponse.ok) {
        const error = await createPlaylistResponse.text()
        console.log(`Failed to create playlist: ${error}`)
        return c.json({ error: 'Failed to create playlist' }, 400)
      }

      playlistData = await createPlaylistResponse.json()
      playlistId = playlistData.id
    }

    // Add tracks to playlist (Spotify accepts up to 100 tracks per request)
    const trackUris = topSongs.map(id => `spotify:track:${id}`)
    
    // Split into chunks of 100
    for (let i = 0; i < trackUris.length; i += 100) {
      const chunk = trackUris.slice(i, i + 100)
      const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: chunk
        })
      })

      if (!addTracksResponse.ok) {
        const error = await addTracksResponse.text()
        console.log(`Failed to add tracks to playlist: ${error}`)
        // Continue with other chunks even if one fails
      }
    }

    console.log(`${playlist_id ? 'Added tracks to' : 'Created'} playlist ${playlistId} with ${topSongs.length} tracks`)
    
    return c.json({ 
      success: true, 
      playlist: {
        id: playlistId,
        name: playlistName,
        url: playlistData.external_urls?.spotify,
        trackCount: topSongs.length
      }
    })
  } catch (error) {
    console.log(`Error creating/updating Spotify playlist: ${error}`)
    return c.json({ error: 'Failed to create/update playlist' }, 500)
  }
})

// ===== SONG REQUEST SYSTEM ENDPOINTS =====

// Get or create request settings for an event
app.get('/make-server-6d46752d/events/:code/request-settings', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    
    // Try SQLite first
    try {
      const settings = queryOne('SELECT * FROM request_settings WHERE event_code = ?', [code])
      if (settings) {
        return c.json({
          success: true,
          settings: {
            eventCode: settings.event_code,
            requestsEnabled: settings.requests_enabled === 1,
            votingEnabled: settings.voting_enabled === 1,
            paidRequestsEnabled: settings.paid_requests_enabled === 1,
            genreRestrictions: JSON.parse(settings.genre_restrictions || '[]'),
            artistRestrictions: JSON.parse(settings.artist_restrictions || '[]'),
            openTime: settings.open_time,
            closeTime: settings.close_time,
            minVoteThreshold: settings.min_vote_threshold || 0,
            maxRequestsPerGuest: settings.max_requests_per_guest || 10,
            autoAcceptThreshold: settings.auto_accept_threshold || 5,
            createdAt: settings.created_at,
            updatedAt: settings.updated_at
          }
        })
      }
    } catch (dbError) {
      console.log(`Database lookup error: ${dbError}`)
    }
    
    // Return defaults if not found
    return c.json({
      success: true,
      settings: {
        eventCode: code,
        requestsEnabled: true,
        votingEnabled: true,
        paidRequestsEnabled: false,
        genreRestrictions: [],
        artistRestrictions: [],
        openTime: null,
        closeTime: null,
        minVoteThreshold: 0,
        maxRequestsPerGuest: 10,
        autoAcceptThreshold: 5
      }
    })
  } catch (error) {
    console.log(`Error fetching request settings: ${error}`)
    return c.json({ error: 'Failed to fetch request settings' }, 500)
  }
})

// Update request settings for an event
app.put('/make-server-6d46752d/events/:code/request-settings', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const updates = await c.req.json()
    
    const now = new Date().toISOString()
    
    try {
      const existing = queryOne('SELECT event_code FROM request_settings WHERE event_code = ?', [code])
      
      if (existing) {
        execute(
          `UPDATE request_settings SET
            requests_enabled = ?,
            voting_enabled = ?,
            paid_requests_enabled = ?,
            genre_restrictions = ?,
            artist_restrictions = ?,
            open_time = ?,
            close_time = ?,
            min_vote_threshold = ?,
            max_requests_per_guest = ?,
            auto_accept_threshold = ?,
            updated_at = ?
           WHERE event_code = ?`,
          [
            updates.requestsEnabled !== undefined ? (updates.requestsEnabled ? 1 : 0) : 1,
            updates.votingEnabled !== undefined ? (updates.votingEnabled ? 1 : 0) : 1,
            updates.paidRequestsEnabled !== undefined ? (updates.paidRequestsEnabled ? 1 : 0) : 0,
            JSON.stringify(updates.genreRestrictions || []),
            JSON.stringify(updates.artistRestrictions || []),
            updates.openTime || null,
            updates.closeTime || null,
            updates.minVoteThreshold || 0,
            updates.maxRequestsPerGuest || 10,
            updates.autoAcceptThreshold || 5,
            now,
            code
          ]
        )
      } else {
        execute(
          `INSERT INTO request_settings (
            event_code, requests_enabled, voting_enabled, paid_requests_enabled,
            genre_restrictions, artist_restrictions, open_time, close_time,
            min_vote_threshold, max_requests_per_guest, auto_accept_threshold,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            code,
            updates.requestsEnabled !== undefined ? (updates.requestsEnabled ? 1 : 0) : 1,
            updates.votingEnabled !== undefined ? (updates.votingEnabled ? 1 : 0) : 1,
            updates.paidRequestsEnabled !== undefined ? (updates.paidRequestsEnabled ? 1 : 0) : 0,
            JSON.stringify(updates.genreRestrictions || []),
            JSON.stringify(updates.artistRestrictions || []),
            updates.openTime || null,
            updates.closeTime || null,
            updates.minVoteThreshold || 0,
            updates.maxRequestsPerGuest || 10,
            updates.autoAcceptThreshold || 5,
            now,
            now
          ]
        )
      }
      
      return c.json({ success: true })
    } catch (dbError) {
      console.log(`Database update error: ${dbError}`)
      return c.json({ error: 'Failed to update request settings' }, 500)
    }
  } catch (error) {
    console.log(`Error updating request settings: ${error}`)
    return c.json({ error: 'Failed to update request settings' }, 500)
  }
})

// Submit a song request
app.post('/make-server-6d46752d/events/:code/requests', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const requestData = await c.req.json()
    
    const {
      guestId,
      spotifyTrackId,
      trackName,
      artistName,
      albumName,
      previewUrl,
      durationMs,
      requesterName,
      metadata
    } = requestData
    
    if (!trackName || !artistName || !guestId) {
      return c.json({ error: 'Track name, artist name, and guest ID are required' }, 400)
    }
    
    // Check if requests are enabled
    try {
      const settings = queryOne('SELECT * FROM request_settings WHERE event_code = ?', [code])
      if (settings && settings.requests_enabled === 0) {
        return c.json({ error: 'Requests are disabled for this event' }, 403)
      }
      
      // Check max requests per guest
      if (settings) {
        const guestRequestCount = query(
          'SELECT COUNT(*) as count FROM song_requests WHERE event_code = ? AND guest_id = ?',
          [code, guestId]
        )
        const count = guestRequestCount[0]?.count || 0
        if (count >= (settings.max_requests_per_guest || 10)) {
          return c.json({ error: `Maximum ${settings.max_requests_per_guest || 10} requests per guest` }, 400)
        }
      }
    } catch (checkError) {
      console.log(`Settings check error: ${checkError}`)
    }
    
    // Check for duplicate (same track by same guest)
    try {
      const existing = queryOne(
        'SELECT id FROM song_requests WHERE event_code = ? AND guest_id = ? AND LOWER(track_name) = LOWER(?) AND LOWER(artist_name) = LOWER(?)',
        [code, guestId, trackName, artistName]
      )
      if (existing) {
        return c.json({ error: 'You have already requested this song' }, 400)
      }
    } catch (dupError) {
      console.log(`Duplicate check error: ${dupError}`)
    }
    
    // Mock AI track analysis
    const hashString = (str: string): number => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash)
    }
    
    const hash = hashString(`${trackName}${artistName}`)
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const genres = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'R&B', 'Country', 'Jazz', 'Latin', 'Reggae', 'Blues']
    
    // Generate mock analysis
    const bpm = 60 + (hash % 120) + (hash % 20)
    const normalizedBPM = Math.min(180, Math.max(60, bpm))
    const key = keys[hash % keys.length]
    const baseEnergy = Math.min(100, 30 + (normalizedBPM - 60) / 2 + (hash % 30))
    const energy = Math.min(100, Math.max(0, baseEnergy))
    const danceability = Math.min(100, Math.max(0, energy * 0.8 + (hash % 20)))
    const selectedGenres = [genres[hash % genres.length]]
    if (hash % 3 === 0 && genres[(hash + 7) % genres.length] !== selectedGenres[0]) {
      selectedGenres.push(genres[(hash + 7) % genres.length])
    }
    
    const trackMetadata = {
      bpm: Math.round(normalizedBPM),
      key,
      energy: Math.round(energy),
      danceability: Math.round(danceability),
      genre: selectedGenres,
      ...(metadata || {})
    }
    
    const now = new Date().toISOString()
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    try {
      execute(
        `INSERT INTO song_requests (
          id, event_code, guest_id, spotify_track_id, track_name, artist_name,
          album_name, preview_url, duration_ms, status, vote_count, downvote_count,
          tip_amount, requester_name, submitted_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          requestId,
          code,
          guestId,
          spotifyTrackId || null,
          trackName,
          artistName,
          albumName || null,
          previewUrl || null,
          durationMs || null,
          'pending',
          0,
          0,
          0,
          requesterName || null,
          now,
          JSON.stringify(trackMetadata)
        ]
      )
      
      // Track analytics
      try {
        execute(
          'INSERT INTO request_analytics (event_code, metric_name, metric_value, metadata) VALUES (?, ?, ?, ?)',
          [code, 'request_submitted', 1, JSON.stringify({ guestId, trackName, artistName })]
        )
      } catch (analyticsError) {
        console.log(`Analytics tracking error: ${analyticsError}`)
      }
      
      return c.json({
        success: true,
        request: {
          id: requestId,
          eventCode: code,
          guestId,
          spotifyTrackId,
          trackName,
          artistName,
          albumName,
          previewUrl,
          durationMs,
          status: 'pending',
          voteCount: 0,
          downvoteCount: 0,
          tipAmount: 0,
          requesterName,
          submittedAt: now,
          metadata: trackMetadata
        }
      })
    } catch (dbError) {
      console.log(`Database insert error: ${dbError}`)
      return c.json({ error: 'Failed to submit request' }, 500)
    }
  } catch (error) {
    console.log(`Error submitting request: ${error}`)
    return c.json({ error: 'Failed to submit request' }, 500)
  }
})

// Get all requests for an event
app.get('/make-server-6d46752d/events/:code/requests', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const status = c.req.query('status') // Optional filter
    const guestId = c.req.query('guestId') // Optional filter for guest's own requests
    
    let sql = 'SELECT * FROM song_requests WHERE event_code = ?'
    const params: any[] = [code]
    
    if (status && ['pending', 'accepted', 'rejected', 'played', 'queued'].includes(status)) {
      sql += ' AND status = ?'
      params.push(status)
    }
    
    if (guestId) {
      sql += ' AND guest_id = ?'
      params.push(guestId)
    }
    
    sql += ' ORDER BY vote_count DESC, downvote_count ASC, submitted_at ASC'
    
    try {
      const requests = query(sql, params)
      
      const formattedRequests = requests.map((r: any) => ({
        id: r.id,
        eventCode: r.event_code,
        guestId: r.guest_id,
        spotifyTrackId: r.spotify_track_id,
        trackName: r.track_name,
        artistName: r.artist_name,
        albumName: r.album_name,
        previewUrl: r.preview_url,
        durationMs: r.duration_ms,
        status: r.status,
        voteCount: r.vote_count || 0,
        downvoteCount: r.downvote_count || 0,
        tipAmount: r.tip_amount || 0,
        requesterName: r.requester_name,
        submittedAt: r.submitted_at,
        playedAt: r.played_at,
        metadata: JSON.parse(r.metadata || '{}')
      }))
      
      return c.json({ success: true, requests: formattedRequests })
    } catch (dbError) {
      console.log(`Database query error: ${dbError}`)
      return c.json({ success: true, requests: [] })
    }
  } catch (error) {
    console.log(`Error fetching requests: ${error}`)
    return c.json({ error: 'Failed to fetch requests' }, 500)
  }
})

// Update request status
app.put('/make-server-6d46752d/events/:code/requests/:id', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const requestId = c.req.param('id')
    const { status, metadata, tipAmount } = await c.req.json()
    
    try {
      const now = new Date().toISOString()
      const updateFields: string[] = []
      const updateParams: any[] = []
      
      if (status && ['pending', 'accepted', 'rejected', 'played', 'queued'].includes(status)) {
        updateFields.push('status = ?')
        updateParams.push(status)
        
        if (status === 'played' && !c.req.query('played_at')) {
          updateFields.push('played_at = ?')
          updateParams.push(now)
        }
      }
      
      if (metadata) {
        updateFields.push('metadata = ?')
        updateParams.push(JSON.stringify(metadata))
      }
      
      if (tipAmount !== undefined) {
        updateFields.push('tip_amount = ?')
        updateParams.push(tipAmount)
      }
      
      if (updateFields.length === 0) {
        return c.json({ error: 'No fields to update' }, 400)
      }
      
      updateParams.push(requestId, code)
      
      execute(
        `UPDATE song_requests SET ${updateFields.join(', ')} WHERE id = ? AND event_code = ?`,
        updateParams
      )
      
      // Track analytics
      try {
        execute(
          'INSERT INTO request_analytics (event_code, metric_name, metric_value, metadata) VALUES (?, ?, ?, ?)',
          [code, `request_${status}`, 1, JSON.stringify({ requestId })]
        )
      } catch (analyticsError) {
        console.log(`Analytics tracking error: ${analyticsError}`)
      }
      
      return c.json({ success: true })
    } catch (dbError) {
      console.log(`Database update error: ${dbError}`)
      return c.json({ error: 'Failed to update request' }, 500)
    }
  } catch (error) {
    console.log(`Error updating request: ${error}`)
    return c.json({ error: 'Failed to update request' }, 500)
  }
})

// Vote on a request
app.post('/make-server-6d46752d/events/:code/requests/:id/vote', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const requestId = c.req.param('id')
    const { guestId, voteType } = await c.req.json()
    
    if (!guestId || !voteType || !['upvote', 'downvote'].includes(voteType)) {
      return c.json({ error: 'Guest ID and vote type (upvote/downvote) are required' }, 400)
    }
    
    // Check if voting is enabled
    try {
      const settings = queryOne('SELECT voting_enabled FROM request_settings WHERE event_code = ?', [code])
      if (settings && settings.voting_enabled === 0) {
        return c.json({ error: 'Voting is disabled for this event' }, 403)
      }
    } catch (checkError) {
      console.log(`Settings check error: ${checkError}`)
    }
    
    try {
      // Check if vote already exists
      const existingVote = queryOne(
        'SELECT * FROM request_votes WHERE request_id = ? AND guest_id = ?',
        [requestId, guestId]
      )
      
      const now = new Date().toISOString()
      
      if (existingVote) {
        // Update existing vote if different type
        if (existingVote.vote_type !== voteType) {
          execute(
            'UPDATE request_votes SET vote_type = ? WHERE id = ?',
            [voteType, existingVote.id]
          )
          
          // Update vote counts on request
          const currentRequest = queryOne('SELECT vote_count, downvote_count FROM song_requests WHERE id = ?', [requestId])
          if (currentRequest) {
            let newVoteCount = currentRequest.vote_count || 0
            let newDownvoteCount = currentRequest.downvote_count || 0
            
            if (existingVote.vote_type === 'upvote' && voteType === 'downvote') {
              newVoteCount = Math.max(0, newVoteCount - 1)
              newDownvoteCount += 1
            } else if (existingVote.vote_type === 'downvote' && voteType === 'upvote') {
              newDownvoteCount = Math.max(0, newDownvoteCount - 1)
              newVoteCount += 1
            }
            
            execute(
              'UPDATE song_requests SET vote_count = ?, downvote_count = ? WHERE id = ?',
              [newVoteCount, newDownvoteCount, requestId]
            )
          }
        }
        // If same type, do nothing (vote already exists)
      } else {
        // Create new vote
        const voteId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        execute(
          'INSERT INTO request_votes (id, request_id, guest_id, vote_type, created_at) VALUES (?, ?, ?, ?, ?)',
          [voteId, requestId, guestId, voteType, now]
        )
        
        // Update vote counts on request
        const currentRequest = queryOne('SELECT vote_count, downvote_count FROM song_requests WHERE id = ?', [requestId])
        if (currentRequest) {
          let newVoteCount = currentRequest.vote_count || 0
          let newDownvoteCount = currentRequest.downvote_count || 0
          
          if (voteType === 'upvote') {
            newVoteCount += 1
          } else {
            newDownvoteCount += 1
          }
          
          execute(
            'UPDATE song_requests SET vote_count = ?, downvote_count = ? WHERE id = ?',
            [newVoteCount, newDownvoteCount, requestId]
          )
        }
      }
      
      // Get updated request
      const updatedRequest = queryOne('SELECT * FROM song_requests WHERE id = ?', [requestId])
      
      return c.json({
        success: true,
        request: updatedRequest ? {
          id: updatedRequest.id,
          voteCount: updatedRequest.vote_count || 0,
          downvoteCount: updatedRequest.downvote_count || 0
        } : null
      })
    } catch (dbError) {
      console.log(`Database vote error: ${dbError}`)
      return c.json({ error: 'Failed to process vote' }, 500)
    }
  } catch (error) {
    console.log(`Error processing vote: ${error}`)
    return c.json({ error: 'Failed to process vote' }, 500)
  }
})

// Get best next track recommendation from request pool
app.get('/make-server-6d46752d/events/:code/requests/best-next', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const currentTrackId = c.req.query('current_track_id')
    
    // Get pending/accepted requests
    const requests = query(
      'SELECT * FROM song_requests WHERE event_code = ? AND status IN (?, ?) ORDER BY vote_count DESC',
      [code, 'pending', 'accepted']
    )
    
    if (requests.length === 0) {
      return c.json({ success: true, recommendation: null })
    }
    
    // If current track provided, analyze compatibility
    let currentAnalysis = null
    if (currentTrackId) {
      const current = queryOne(
        'SELECT track_name, artist_name, metadata FROM song_requests WHERE id = ?',
        [currentTrackId]
      )
      if (current && current.metadata) {
        try {
          currentAnalysis = JSON.parse(current.metadata)
        } catch {}
      }
    }
    
    // Mock analysis function
    const analyzeTrack = (trackName: string, artistName: string) => {
      const hash = Math.abs((trackName + artistName).split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0))
      const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
      const bpm = 60 + (hash % 120)
      const energy = Math.min(100, 30 + (bpm - 60) / 2 + (hash % 30))
      return {
        bpm: Math.min(180, Math.max(60, bpm)),
        key: keys[hash % keys.length],
        energy: Math.min(100, Math.max(0, energy)),
        danceability: Math.min(100, Math.max(0, energy * 0.8 + (hash % 20)))
      }
    }
    
    // Calculate compatibility scores
    const scored = requests.map((r: any) => {
      const requestMetadata = JSON.parse(r.metadata || '{}')
      const reqAnalysis = analyzeTrack(r.track_name, r.artist_name)
      
      let compatibilityScore = 100
      if (currentAnalysis) {
        const bpmDiff = Math.abs((currentAnalysis.bpm || 120) - reqAnalysis.bpm)
        const energyDiff = Math.abs((currentAnalysis.energy || 75) - reqAnalysis.energy)
        compatibilityScore = 100 - (bpmDiff * 0.5) - (energyDiff * 0.3)
        if (compatibilityScore < 0) compatibilityScore = 0
      }
      
      const popularityBonus = Math.min(r.vote_count * 5, 20)
      const totalScore = compatibilityScore + popularityBonus
      
      return {
        requestId: r.id,
        trackName: r.track_name,
        artistName: r.artist_name,
        compatibilityScore: Math.round(compatibilityScore),
        totalScore: Math.round(totalScore),
        voteCount: r.vote_count || 0,
        analysis: reqAnalysis
      }
    })
    
    // Sort by total score
    scored.sort((a, b) => b.totalScore - a.totalScore)
    const best = scored[0]
    
    const reasons = []
    if (best.compatibilityScore >= 80) reasons.push('Perfect musical match')
    if (best.voteCount > 0) reasons.push(`${best.voteCount} crowd votes`)
    if (currentAnalysis) {
      const bpmDiff = Math.abs((currentAnalysis.bpm || 120) - best.analysis.bpm)
      if (bpmDiff <= 5) reasons.push('Similar tempo')
    }
    
    return c.json({
      success: true,
      recommendation: {
        requestId: best.requestId,
        trackName: best.trackName,
        artistName: best.artistName,
        compatibilityScore: best.compatibilityScore,
        reason: reasons.join(', ') || 'Good fit for current vibe',
        analysis: best.analysis
      }
    })
  } catch (error) {
    console.log(`Error getting best next track: ${error}`)
    return c.json({ error: 'Failed to get recommendation' }, 500)
  }
})

// Get request analytics for an event
app.get('/make-server-6d46752d/events/:code/request-analytics', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    
    try {
      // Get total requests
      const totalRequests = query('SELECT COUNT(*) as count FROM song_requests WHERE event_code = ?', [code])
      const requestCount = totalRequests[0]?.count || 0
      
      // Get requests by status
      const statusCounts = query(
        'SELECT status, COUNT(*) as count FROM song_requests WHERE event_code = ? GROUP BY status',
        [code]
      )
      
      // Get total votes
      const voteData = query(
        `SELECT 
          SUM(vote_count) as total_upvotes,
          SUM(downvote_count) as total_downvotes
         FROM song_requests WHERE event_code = ?`,
        [code]
      )
      
      // Get most requested tracks
      const topRequests = query(
        `SELECT track_name, artist_name, COUNT(*) as request_count, SUM(vote_count) as total_votes
         FROM song_requests WHERE event_code = ? 
         GROUP BY track_name, artist_name 
         ORDER BY request_count DESC, total_votes DESC 
         LIMIT 10`,
        [code]
      )
      
      // Get average request-to-play time (for played requests)
      const playedRequests = query(
        `SELECT submitted_at, played_at 
         FROM song_requests 
         WHERE event_code = ? AND status = 'played' AND played_at IS NOT NULL`,
        [code]
      )
      
      let avgWaitTime = 0
      if (playedRequests.length > 0) {
        const waitTimes = playedRequests.map((r: any) => {
          const submitted = new Date(r.submitted_at).getTime()
          const played = new Date(r.played_at).getTime()
          return (played - submitted) / 1000 / 60 // minutes
        })
        avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      }
      
      // Get genre distribution
      const genreDistribution: Record<string, number> = {}
      const allRequests = query('SELECT metadata FROM song_requests WHERE event_code = ?', [code])
      allRequests.forEach((r: any) => {
        try {
          const metadata = JSON.parse(r.metadata || '{}')
          if (metadata.genre && Array.isArray(metadata.genre)) {
            metadata.genre.forEach((g: string) => {
              genreDistribution[g] = (genreDistribution[g] || 0) + 1
            })
          }
        } catch {}
      })
      
      const statusBreakdown: Record<string, number> = {}
      statusCounts.forEach((s: any) => {
        statusBreakdown[s.status] = s.count || 0
      })
      
      return c.json({
        success: true,
        analytics: {
          totalRequests: requestCount,
          statusBreakdown,
          totalUpvotes: voteData[0]?.total_upvotes || 0,
          totalDownvotes: voteData[0]?.total_downvotes || 0,
          avgWaitTimeMinutes: Math.round(avgWaitTime * 10) / 10,
          topRequestedTracks: topRequests.map((r: any) => ({
            trackName: r.track_name,
            artistName: r.artist_name,
            requestCount: r.request_count,
            totalVotes: r.total_votes || 0
          })),
          genreDistribution: Object.entries(genreDistribution)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([genre, count]) => ({ genre, count }))
        }
      })
    } catch (dbError) {
      console.log(`Database analytics error: ${dbError}`)
      return c.json({ success: true, analytics: {} })
    }
  } catch (error) {
    console.log(`Error fetching analytics: ${error}`)
    return c.json({ error: 'Failed to fetch analytics' }, 500)
  }
})

// Search Spotify tracks (for request submission)
app.post('/make-server-6d46752d/spotify/search', async (c) => {
  try {
    const { query: searchQuery, access_token, limit = 20 } = await c.req.json()
    
    if (!searchQuery || !access_token) {
      return c.json({ error: 'Search query and access token are required' }, 400)
    }
    
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=${limit}`
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })
    
    if (!response.ok) {
      return c.json({ error: 'Spotify search failed' }, 400)
    }
    
    const data = await response.json()
    
    const tracks = (data.tracks?.items || []).map((track: any) => ({
      id: track.id,
      spotifyTrackId: track.id,
      trackName: track.name,
      name: track.name, // For SongCard compatibility
      artistName: track.artists[0]?.name || 'Unknown',
      artists: track.artists.map((artist: any) => ({ name: artist.name })), // For SongCard compatibility
      albumName: track.album?.name || '',
      album: { // For SongCard compatibility
        name: track.album?.name || '',
        images: track.album?.images || []
      },
      previewUrl: track.preview_url,
      durationMs: track.duration_ms,
      duration_ms: track.duration_ms, // For SongCard compatibility
      albumArt: track.album?.images?.[0]?.url,
      explicit: track.explicit,
      popularity: track.popularity,
      artistId: track.artists[0]?.id,
      albumId: track.album?.id
    }))
    
    return c.json({ success: true, tracks })
  } catch (error) {
    console.log(`Error searching Spotify: ${error}`)
    return c.json({ error: 'Failed to search Spotify' }, 500)
  }
})

// Health check
app.get('/make-server-6d46752d/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

console.log('QRate server starting...')
serve(app.fetch)

