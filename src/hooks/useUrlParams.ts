import { useEffect } from 'react';
import { utils } from '../utils/api';
import { STORAGE_KEYS } from '../utils/constants';

interface UrlParamsHandler {
  onSpotifyAuth: (params: Record<string, string>) => void;
  onSpotifyError: (error: string) => void;
  onEventJoin: (identifier: string) => void;
  onSpotifyDebug: () => void;
  onDJBooth: () => void;
  onAdmin?: () => void;
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
      
      // Handle legacy Spotify callback
      if (params.code && params.state && !params.spotify_access_token) {
        try {
          const state = JSON.parse(atob(params.state));
          if (state.eventCode) {
            window.history.replaceState({}, document.title, window.location.pathname);
            handlers.onEventJoin(state.eventCode);
          }
        } catch (error) {
          console.error('Error parsing state:', error);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
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
      if (window.location.hash === '#spotify-debug') {
        window.history.replaceState({}, document.title, window.location.pathname);
        handlers.onSpotifyDebug();
      } else if (window.location.hash === '#dj-booth' && currentEvent) {
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
