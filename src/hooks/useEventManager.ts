import { useState, useCallback } from 'react';
import { eventApi, utils } from '../utils/api';
import { TIMEOUTS, STORAGE_KEYS } from '../utils/constants';
import { Event } from '../utils/types';

export function useEventManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load event from backend or user accounts
  const loadEvent = useCallback(async (identifier: string): Promise<Event | null> => {
    if (loading) {
      console.log('⏳ Already loading, skipping duplicate request');
      return null;
    }

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
        console.log(`✅ Event loaded from backend: ${response.data.event.eventName}`);
        return response.data.event;
      }
      
      setError(`Event "${identifier}" not found`);
      return null;
    } catch (error) {
      console.error('❌ Error loading event:', error);
      setError('Failed to load event');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loading]);

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
        console.log(`✅ Refreshed ${response.data.events.length} events`);
        return response.data.events;
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
