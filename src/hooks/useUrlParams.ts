import { useEffect } from 'react';
import { utils, spotifyApi } from '@/utils/api';
import { STORAGE_KEYS, SPOTIFY_OAUTH_VERSION } from '@/utils/constants';

interface UrlParamsHandler {
  onSpotifyAuth: (params: Record<string, string>) => void;
  onSpotifyError: (error: string) => void;
  onEventJoin: (identifier: string) => void;
  onDJBooth: () => void;
  onAdmin?: () => void;
  onSpotifyCode?: (code: string) => Promise<void>;
}

export function useUrlParams(handlers: UrlParamsHandler, currentEvent: any) {
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlParams.entries());
      
      if (Object.keys(params).length === 0 && !window.location.hash) return;
      
      console.log('🔗 Processing URL parameters:', params);
      
      // Handle Spotify OAuth success
      if (params.spotify_access_token) {
        utils.storage.set(STORAGE_KEYS.SPOTIFY_ACCESS_TOKEN, params.spotify_access_token);
        if (params.spotify_refresh_token) {
          utils.storage.set(STORAGE_KEYS.SPOTIFY_REFRESH_TOKEN, params.spotify_refresh_token);
        }
        if (params.spotify_expires_in) {
          const expiresAt = Date.now() + (parseInt(params.spotify_expires_in) * 1000);
          utils.storage.set(STORAGE_KEYS.SPOTIFY_EXPIRES_AT, expiresAt);
        }
        // Update OAuth version to match current scopes
        utils.storage.set(STORAGE_KEYS.SPOTIFY_OAUTH_VERSION, SPOTIFY_OAUTH_VERSION);
        
        window.history.replaceState({}, document.title, window.location.pathname);
        handlers.onSpotifyAuth(params);
        return;
      }
      
      // Handle Spotify OAuth error
      if (params.spotify_error) {
        window.history.replaceState({}, document.title, window.location.pathname);
        handlers.onSpotifyError(params.spotify_error);
        return;
      }
      
      // Handle Spotify OAuth callback with code parameter
      if (params.code && params.state && !params.spotify_access_token) {
        // Try to decode and parse state as base64-encoded JSON (for event joining)
        // First check if it looks like base64 (contains only base64 chars and is reasonable length)
        const isBase64Like = /^[A-Za-z0-9+/=]+$/.test(params.state) && params.state.length > 4;
        
        if (isBase64Like) {
          try {
            const decoded = atob(params.state);
            const state = JSON.parse(decoded);
            if (state.eventCode) {
              window.history.replaceState({}, document.title, window.location.pathname);
              handlers.onEventJoin(state.eventCode);
              return;
            }
          } catch (parseError) {
            // State is not base64-encoded JSON, likely just a plain OAuth state string
            // This is normal for Spotify OAuth callbacks
            console.log('State parameter is not base64-encoded JSON (normal for OAuth callbacks)');
          }
        }
        
        // Handle Spotify OAuth code exchange asynchronously
        (async () => {
          try {
            // If we have a custom handler for Spotify code exchange, use it
            if (handlers.onSpotifyCode) {
              console.log('🎵 Exchanging Spotify OAuth code via custom handler...');
              try {
                await handlers.onSpotifyCode(params.code);
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
              } catch (error) {
                console.error('❌ Error in Spotify code exchange handler:', error);
                handlers.onSpotifyError(error instanceof Error ? error.message : 'Failed to exchange code');
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
              }
            }
            
            // Determine which OAuth flow based on pathname
            // DJ callbacks go to /dj/spotify/callback, guest callbacks go to /guest
            const pathname = window.location.pathname;
            const isDJCallback = pathname.includes('/dj/spotify/callback') || 
                                pathname.includes('/dj-booth');
            const isGuestCallback = pathname.includes('/guest') || 
                                   pathname === '/' ||
                                   pathname === '';
            
            // Only proceed if we can identify the flow or code looks like Spotify OAuth
            if (isDJCallback || isGuestCallback || params.code.length > 50) {
              // Prefer DJ if explicitly detected, otherwise default to Guest
              const useDJ = isDJCallback && !isGuestCallback;
              const flowType = useDJ ? 'DJ' : 'Guest';
              console.log(`🎵 Attempting to exchange Spotify OAuth code for ${flowType} tokens...`);
              console.log(`   Pathname: ${pathname}, isDJ: ${isDJCallback}, isGuest: ${isGuestCallback}`);
              
              try {
                // Use appropriate endpoint based on detected flow
                const response = useDJ
                  ? await spotifyApi.exchangeDJCode(params.code)
                  : await spotifyApi.exchangeGuestCode(params.code);
                
                if (response.success && response.data) {
                  const { access_token, refresh_token, expires_in } = response.data;
                  
                  if (access_token) {
                    console.log(`✅ Successfully exchanged Spotify code for ${flowType} access token`);
                    
                    // Store tokens
                    utils.storage.set(STORAGE_KEYS.SPOTIFY_ACCESS_TOKEN, access_token);
                    if (refresh_token) {
                      utils.storage.set(STORAGE_KEYS.SPOTIFY_REFRESH_TOKEN, refresh_token);
                    }
                    if (expires_in) {
                      const expiresAt = Date.now() + (parseInt(expires_in) * 1000);
                      utils.storage.set(STORAGE_KEYS.SPOTIFY_EXPIRES_AT, expiresAt);
                    }
                    // Update OAuth version to match current scopes
                    utils.storage.set(STORAGE_KEYS.SPOTIFY_OAUTH_VERSION, SPOTIFY_OAUTH_VERSION);
                    
                    // Clean URL and notify handler
                    window.history.replaceState({}, document.title, window.location.pathname);
                    handlers.onSpotifyAuth({
                      spotify_access_token: access_token,
                      ...(refresh_token && { spotify_refresh_token: refresh_token }),
                      ...(expires_in && { spotify_expires_in: expires_in })
                    });
                    return;
                  }
                } else {
                  throw new Error(response.error || 'Failed to exchange code for token');
                }
              } catch (error) {
                console.error(`❌ Error exchanging Spotify code for ${flowType}:`, error);
                handlers.onSpotifyError(error instanceof Error ? error.message : 'Failed to exchange code');
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
              }
            }
            
            // Clean up URL if we couldn't handle it
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            // Fallback error handling
            console.warn('Error processing Spotify callback:', error);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })();
        return;
      }
      
      // Handle direct event joining
      if ((params.eventID || params.code) && !params.spotify_access_token && !params.spotify_error) {
        const identifier = params.eventID || params.code;
        window.history.replaceState({}, document.title, window.location.pathname);
        handlers.onEventJoin(identifier);
        return;
      }
      
      // Handle hash navigation
      if (window.location.hash === '#dj-booth' && currentEvent) {
        window.history.replaceState({}, document.title, window.location.pathname);
        handlers.onDJBooth();
      } else if (window.location.hash === '#admin' && handlers.onAdmin) {
        window.history.replaceState({}, document.title, window.location.pathname);
        handlers.onAdmin();
      }
    } catch (error) {
      console.error('URL processing error:', error);
    }
  }, [currentEvent, handlers]);
}
