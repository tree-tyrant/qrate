import { useState, useCallback, useRef } from 'react';
import { eventApi, utils } from '@/utils/api';
import { TIMEOUTS, STORAGE_KEYS } from '@/utils/constants';
import { Event } from '@/utils/types';

export function useEventManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use ref to track loading state per event identifier to prevent infinite loops
  const loadingEventsRef = useRef<Set<string>>(new Set());

  // Load event from backend or user accounts
  const loadEvent = useCallback(async (identifier: string): Promise<Event | null> => {
    const normalizedId = identifier.toUpperCase();
    
    // Check if already loading this specific event
    if (loadingEventsRef.current.has(normalizedId)) {
      console.log(`⏳ Already loading event ${normalizedId}, skipping duplicate request`);
      return null;
    }

    loadingEventsRef.current.add(normalizedId);
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Loading event: ${identifier}`);
      
      // Check user accounts in localStorage first (for events created locally)
      const userAccounts = utils.storage.get(STORAGE_KEYS.USER_ACCOUNTS) || [];
      for (const account of userAccounts) {
        const event = account.events?.find((e: Event) => e.code === identifier);
        if (event) {
          console.log(`✅ Event loaded from localStorage: ${event.eventName}`);
          return event;
        }
      }
      
      // Try backend
      const response = await eventApi.get(identifier);
      if (response.success && response.data?.event) {
        const backendEvent = response.data.event;
        
        // Transform backend event to Event type
        const now = new Date();
        let calculatedStatus: 'past' | 'live' | 'upcoming' = 'upcoming';
        
        if (backendEvent.date && backendEvent.time) {
          const eventDateTime = new Date(`${backendEvent.date}T${backendEvent.time}`);
          const eventEndTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000)); // 4 hours
          
          if (now > eventEndTime) {
            calculatedStatus = 'past';
          } else if (now >= eventDateTime && now <= eventEndTime) {
            calculatedStatus = 'live';
          } else {
            calculatedStatus = 'upcoming';
          }
        }
        
        const event: Event = {
          id: backendEvent.id,
          eventName: backendEvent.name || backendEvent.eventName || 'Untitled Event',
          eventTheme: backendEvent.theme || backendEvent.eventTheme || '',
          eventDescription: backendEvent.description || backendEvent.eventDescription,
          code: backendEvent.code,
          date: backendEvent.date,
          time: backendEvent.time,
          location: backendEvent.location,
          eventImage: backendEvent.imageUrl || backendEvent.eventImage,
          guestCount: backendEvent.guestCount || 0,
          preferences: backendEvent.preferences || [],
          status: backendEvent.status || calculatedStatus,
          vibeProfile: backendEvent.vibeProfile,
          guestContributions: backendEvent.guestContributions,
          weightingConfig: backendEvent.weightingConfig,
          connectedPlaylist: backendEvent.connectedPlaylist,
          finalQueue: backendEvent.finalQueue,
          insights: backendEvent.insights,
          shareLink: backendEvent.shareLink,
          qrCodeData: backendEvent.qrCodeData
        };
        
        console.log(`✅ Event loaded from backend: ${event.eventName}`);
        return event;
      }
      
      setError(`Event "${identifier}" not found`);
      return null;
    } catch (error) {
      console.error('❌ Error loading event:', error);
      setError('Failed to load event');
      return null;
    } finally {
      loadingEventsRef.current.delete(normalizedId);
      setLoading(loadingEventsRef.current.size > 0);
    }
  }, []);

  // Refresh user events from backend
  const refreshUserEvents = useCallback(async (username: string): Promise<Event[]> => {
    try {
      console.log(`🔄 Refreshing events for: ${username}`);
      
      const response = await Promise.race([
        eventApi.getHostEvents(username),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), TIMEOUTS.EVENT_LOAD)
        )
      ]) as any;
      
      if (response.success && response.data?.events) {
        // Transform backend events to Event type
        const transformedEvents: Event[] = response.data.events.map((backendEvent: any) => {
          const now = new Date();
          let calculatedStatus: 'past' | 'live' | 'upcoming' = 'upcoming';
          
          if (backendEvent.date && backendEvent.time) {
            const eventDateTime = new Date(`${backendEvent.date}T${backendEvent.time}`);
            const eventEndTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000)); // 4 hours
            
            if (now > eventEndTime) {
              calculatedStatus = 'past';
            } else if (now >= eventDateTime && now <= eventEndTime) {
              calculatedStatus = 'live';
            } else {
              calculatedStatus = 'upcoming';
            }
          }
          
          return {
            id: backendEvent.id,
            eventName: backendEvent.name || backendEvent.eventName || 'Untitled Event',
            eventTheme: backendEvent.theme || backendEvent.eventTheme || '',
            eventDescription: backendEvent.description || backendEvent.eventDescription,
            code: backendEvent.code,
            date: backendEvent.date,
            time: backendEvent.time,
            location: backendEvent.location,
            eventImage: backendEvent.imageUrl || backendEvent.eventImage,
            guestCount: backendEvent.guestCount || 0,
            preferences: backendEvent.preferences || [],
            status: backendEvent.status || calculatedStatus,
            vibeProfile: backendEvent.vibeProfile,
            guestContributions: backendEvent.guestContributions,
            weightingConfig: backendEvent.weightingConfig,
            connectedPlaylist: backendEvent.connectedPlaylist,
            finalQueue: backendEvent.finalQueue,
            insights: backendEvent.insights,
            shareLink: backendEvent.shareLink,
            qrCodeData: backendEvent.qrCodeData
          } as Event;
        });
        
        console.log(`✅ Refreshed ${transformedEvents.length} events for ${username}`);
        return transformedEvents;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error refreshing events:', error);
      return [];
    }
  }, []);

  // Sync event with backend
  const syncEventWithBackend = useCallback(async (event: Event, hostId: string) => {
    try {
      console.log(`🔄 Syncing event: ${event.eventName}`);
      
      const response = await eventApi.update(event.id, {
        name: event.eventName,
        theme: event.eventTheme,
        description: event.eventDescription,
        date: event.date,
        time: event.time,
        location: event.location,
        imageUrl: event.eventImage,
        status: event.status,
        hostId: hostId
      });
      
      if (response.success) {
        console.log(`✅ Event synced: ${event.eventName}`);
        return response.data.event;
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
    }
    return null;
  }, []);

  // Clear error after timeout
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    loadEvent,
    refreshUserEvents,
    syncEventWithBackend,
    clearError,
    setError
  };
}
