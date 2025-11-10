# Supabase Edge Functions Deployment Guide

This guide explains how to deploy QRATE's backend to Supabase Edge Functions for persistent storage and production use.

## Overview

QRATE now supports two deployment options:
1. **Vercel API Routes** (`src/api/[...path].ts`) - For Vercel deployments
2. **Supabase Edge Functions** (`src/supabase/functions/server/index.tsx`) - For Supabase deployments with persistent KV storage

## Prerequisites

1. Supabase account and project
2. Supabase CLI installed: `npm install -g supabase`
3. Spotify Developer credentials

## Setup Steps

### 1. Create KV Store Table

In your Supabase SQL Editor, run:

```sql
CREATE TABLE IF NOT EXISTS kv_store_6d46752d (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Create index for faster prefix searches
CREATE INDEX IF NOT EXISTS idx_kv_store_prefix ON kv_store_6d46752d(key text_pattern_ops);
```

### 2. Set Environment Variables

In Supabase Dashboard → Project Settings → Edge Functions → Secrets, set:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional, for KV store)
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_GUEST_REDIRECT_URI=https://your-app.vercel.app/guest
SPOTIFY_DJ_REDIRECT_URI=https://your-app.vercel.app/dj/spotify/callback
```

### 3. Deploy Edge Function

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy make-server-6d46752d
```

### 4. Update Frontend API Configuration

Update `src/utils/api.tsx` to point to your Supabase Edge Function:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  'https://your-project.supabase.co/functions/v1/make-server-6d46752d'
```

Or set `VITE_API_BASE_URL` in your environment variables.

## Storage Architecture

### Primary: SQLite Database
- Used when available (local development or Supabase with SQLite support)
- Stores: events, guest_preferences, event_songs, song_requests, etc.
- Location: `database/synergy.db` (local) or Supabase database

### Fallback: KV Store
- Persistent key-value storage in Supabase
- Used when SQLite is unavailable
- Survives server restarts
- Stores events and preferences with prefix keys:
  - `event:{code}` - Event data
  - `preferences:{code}:{guestId}` - Guest preferences

## Features

The Supabase Edge Function includes:

✅ Event creation and management  
✅ Guest preference submission  
✅ Spotify OAuth (Guest & DJ)  
✅ Playlist connection and track fetching  
✅ Top songs aggregation  
✅ Song request system  
✅ Request voting  
✅ Analytics and insights  
✅ Session pool generation  

## API Endpoints

All endpoints are prefixed with `/make-server-6d46752d`:

- `POST /events` - Create event
- `GET /events/:code` - Get event by code
- `POST /events/:code/preferences` - Submit guest preferences
- `GET /events/:code/insights` - Get crowd insights
- `GET /events/:code/top-songs` - Get top 15 songs
- `GET /events/:code/session-pool` - Get randomized session pool
- `GET /spotify/auth` - Get Spotify auth URL (Guest)
- `POST /spotify/callback` - Handle Spotify callback (Guest)
- `GET /spotify/dj/auth` - Get Spotify auth URL (DJ)
- `POST /spotify/dj/callback` - Handle Spotify callback (DJ)
- `POST /spotify/playlists` - Get user playlists
- `POST /spotify/playlist-tracks` - Get tracks from playlists
- `POST /spotify/search` - Search Spotify tracks
- `POST /spotify/create-playlist` - Create Spotify playlist
- `GET /events/:code/requests` - Get song requests
- `POST /events/:code/requests` - Submit song request
- `POST /events/:code/requests/:id/vote` - Vote on request
- `GET /health` - Health check

## Local Development

For local development, use the local server:

```bash
npm run dev:all
```

This starts:
- Local SQLite server on `https://localhost:3001`
- Vite dev server on `http://localhost:3000`

## Production Deployment

1. Deploy frontend to Vercel
2. Deploy Edge Function to Supabase
3. Set environment variables in both platforms
4. Update frontend API_BASE_URL to point to Supabase Edge Function

## DJ Marketplace Data Model

The DJ marketplace features (marketplace dashboard, host "Find DJs") rely on dedicated Supabase tables. Run `supabase/schema/dj_marketplace.sql` in the SQL editor or via the CLI:

```bash
supabase db push supabase/schema/dj_marketplace.sql
```

This script adds:

- `dj_profiles` – core DJ marketplace profile (location, pricing, vibe metadata)
- `dj_price_packages`, `dj_profile_media`, `dj_profile_highlights`, `dj_vibe_specializations`
- `dj_crowd_metrics` – rolling analytics written by the backend after each gig
- `dj_booking_requests`, `dj_booking_messages` – host ↔ DJ booking workflow
- `host_saved_djs` – host bookmarks
- `dj_marketplace_profiles` view – aggregated JSON structure consumed by the frontend
- RLS policies so DJs can edit their profile while hosts get read-only access

### Seed Data

The SQL includes a starter profile (`DJ Ember`) to validate the UI. Replace the seeded UUID with real `auth.users` ids when creating actual profiles. To remove seed data, delete the rows from `dj_profiles` and cascading tables.

### Frontend Usage

- TypeScript interfaces live in `src/supabase/types.ts`
- Data access helpers are in `src/services/marketplaceService.ts`
- `HostDashboard` uses mock data by default; call `fetchMarketplaceProfiles` when Supabase env vars are available

### CLI Export

To snapshot changes after edits:

```bash
supabase db diff --file supabase/schema/dj_marketplace.sql
```

## Troubleshooting

### KV Store Not Working
- Verify `kv_store_6d46752d` table exists in Supabase
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Use `SUPABASE_SERVICE_ROLE_KEY` for write operations if needed

### Database Connection Issues
- Edge Functions use Deno-compatible SQLite
- For production, prefer Supabase PostgreSQL tables
- KV store provides fallback when database unavailable

### Spotify OAuth Errors
- Verify redirect URIs match exactly in Spotify Dashboard
- Check that `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set
- Ensure redirect URIs are whitelisted in Spotify app settings

## Migration from Vercel API Routes

If migrating from Vercel to Supabase:

1. Deploy Edge Function to Supabase
2. Update `VITE_API_BASE_URL` to Supabase Edge Function URL
3. Data will automatically use KV store if Supabase database not configured
4. For full migration, set up Supabase PostgreSQL tables matching `database/init.sql` schema



