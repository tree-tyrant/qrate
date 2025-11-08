import { useState, useEffect, useCallback } from 'react';
import { utils } from '../utils/api';
import { STORAGE_KEYS, DEFAULT_USER_ACCOUNTS, TIMEOUTS, getLivePoolPartyDateTime } from '../utils/constants';
import { UserAccount, Event } from '../utils/types';

export function useUserAccounts() {
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);

  // Initialize user accounts from localStorage
  useEffect(() => {
    console.log('💾 Initializing user accounts from localStorage...');
    const savedAccounts = utils.storage.get(STORAGE_KEYS.USER_ACCOUNTS);
    
    if (savedAccounts && Array.isArray(savedAccounts)) {
      console.log(`✅ Found ${savedAccounts.length} saved accounts`);
      
      // Merge saved accounts with default accounts to ensure all default events exist
      const validatedAccounts = savedAccounts.map(savedAcc => {
        const defaultAcc = DEFAULT_USER_ACCOUNTS.find(def => def.username === savedAcc.username);
        
        if (defaultAcc) {
          // For demo account, keep it clean - no auto-merging of default events
          // For tester and other accounts, merge in any missing default events
          const existingEventCodes = new Set((savedAcc.events || []).map((e: any) => e.code));
          const missingEvents = savedAcc.username === 'demo' ? [] : defaultAcc.events.filter(defEvent => !existingEventCodes.has(defEvent.code));
          
          if (missingEvents.length > 0) {
            console.log(`🔄 Adding ${missingEvents.length} missing events to ${savedAcc.username}:`, missingEvents.map(e => e.code));
          }
          
          // Update Pool Party time to always be 1 hour ago (for tester account)
          // Also recalculate status for all events based on their date/time
          const now = new Date();
          const updatedEvents = [...(savedAcc.events || []), ...missingEvents].map((event: any) => {
            if (event.code === 'POOL') {
              const poolTime = getLivePoolPartyDateTime();
              return {
                ...event,
                date: poolTime.date,
                time: poolTime.time,
                status: 'live'
              };
            }
            
            // Recalculate status for other events
            const eventDateTime = new Date(`${event.date}T${event.time}`);
            const eventEndTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000)); // 4 hours
            
            let newStatus = event.status;
            if (now > eventEndTime) {
              newStatus = 'past';
            } else if (now >= eventDateTime && now <= eventEndTime) {
              newStatus = 'live';
            } else if (now < eventDateTime) {
              newStatus = 'upcoming';
            }
            
            if (newStatus !== event.status) {
              console.log(`📅 Event "${event.eventName}" status initialized: ${event.status} → ${newStatus}`);
            }
            
            return { ...event, status: newStatus };
          });
          
          return {
            ...savedAcc,
            events: updatedEvents,
            trashedEvents: Array.isArray(savedAcc.trashedEvents) ? savedAcc.trashedEvents : []
          };
        }
        
        return {
          ...savedAcc,
          events: Array.isArray(savedAcc.events) ? savedAcc.events : [],
          trashedEvents: Array.isArray(savedAcc.trashedEvents) ? savedAcc.trashedEvents : []
        };
      });
      
      setUserAccounts(validatedAccounts);
      utils.storage.set(STORAGE_KEYS.USER_ACCOUNTS, validatedAccounts);
    } else {
      console.log('🔧 No saved accounts found, creating defaults...');
      const defaultAccounts = DEFAULT_USER_ACCOUNTS.map(acc => ({ ...acc }));
      setUserAccounts(defaultAccounts);
      utils.storage.set(STORAGE_KEYS.USER_ACCOUNTS, defaultAccounts);
    }
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (userAccounts.length === 0) return;
    
    const saveTimeout = setTimeout(() => {
      utils.storage.set(STORAGE_KEYS.USER_ACCOUNTS, userAccounts);
      console.log('💾 User accounts auto-saved');
    }, TIMEOUTS.SAVE_DEBOUNCE);

    return () => clearTimeout(saveTimeout);
  }, [userAccounts]);

  // Optimized save function
  const saveUserData = useCallback((accounts: UserAccount[]) => {
    const hasChanged = JSON.stringify(accounts) !== JSON.stringify(userAccounts);
    if (hasChanged) {
      setUserAccounts(accounts);
      utils.storage.set(STORAGE_KEYS.USER_ACCOUNTS, accounts);
      console.log('✅ User data saved');
    }
  }, [userAccounts]);

  // Update specific user's events
  const updateUserEvents = useCallback((username: string, events: Event[]) => {
    setUserAccounts(prev => prev.map(acc => 
      acc.username === username ? { ...acc, events } : acc
    ));
  }, []);

  // Update specific user's trashed events
  const updateUserTrashedEvents = useCallback((username: string, trashedEvents: Event[]) => {
    setUserAccounts(prev => prev.map(acc => 
      acc.username === username ? { ...acc, trashedEvents } : acc
    ));
  }, []);

  // Move event to trash
  const trashEvent = useCallback((username: string, eventId: string) => {
    setUserAccounts(prev => prev.map(acc => {
      if (acc.username !== username) return acc;
      
      const event = acc.events?.find(e => e.id === eventId);
      if (!event) return acc;
      
      const trashedEvent = { ...event, trashedAt: new Date().toISOString() };
      return {
        ...acc,
        events: (acc.events || []).filter(e => e.id !== eventId),
        trashedEvents: [...(acc.trashedEvents || []), trashedEvent]
      };
    }));
  }, []);

  // Restore event from trash
  const restoreEvent = useCallback((username: string, eventId: string) => {
    setUserAccounts(prev => prev.map(acc => {
      if (acc.username !== username) return acc;
      
      const event = acc.trashedEvents?.find(e => e.id === eventId);
      if (!event) return acc;
      
      const { trashedAt, ...restoredEvent } = event as any;
      return {
        ...acc,
        events: [...(acc.events || []), restoredEvent],
        trashedEvents: (acc.trashedEvents || []).filter(e => e.id !== eventId)
      };
    }));
  }, []);

  // Update single event
  const updateEvent = useCallback((username: string, eventId: string, eventData: Partial<Event>) => {
    setUserAccounts(prev => prev.map(acc => {
      if (acc.username !== username) return acc;
      return {
        ...acc,
        events: (acc.events || []).map(e => 
          e.id === eventId ? { ...e, ...eventData } : e
        )
      };
    }));
  }, []);

  // Permanently delete event from trash
  const permanentlyDeleteEvent = useCallback((username: string, eventId: string) => {
    setUserAccounts(prev => prev.map(acc => {
      if (acc.username !== username) return acc;
      return {
        ...acc,
        trashedEvents: (acc.trashedEvents || []).filter(e => e.id !== eventId)
      };
    }));
    console.log(`🗑️ Permanently deleted event ${eventId}`);
  }, []);

  // Get user account
  const getUserAccount = useCallback((username: string) => {
    return userAccounts.find(acc => acc.username === username);
  }, [userAccounts]);

  // Update event statuses based on current date/time
  const updateEventStatuses = useCallback((username: string) => {
    const now = new Date();
    
    setUserAccounts(prev => prev.map(acc => {
      if (acc.username !== username) return acc;
      
      const updatedEvents = (acc.events || []).map(event => {
        // Don't auto-update Pool Party status - it's always kept live for demo
        if (event.code === 'POOL') {
          return event;
        }
        
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const eventEndTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000)); // Assume 4 hour duration
        
        let newStatus = event.status;
        
        // Determine status based on time
        if (now > eventEndTime) {
          newStatus = 'past';
        } else if (now >= eventDateTime && now <= eventEndTime) {
          newStatus = 'live';
        } else if (now < eventDateTime) {
          newStatus = 'upcoming';
        }
        
        // Only update if status changed
        if (newStatus !== event.status) {
          console.log(`📅 Event "${event.eventName}" status: ${event.status} → ${newStatus}`);
          return { ...event, status: newStatus };
        }
        
        return event;
      });
      
      return {
        ...acc,
        events: updatedEvents
      };
    }));
  }, []);

  return {
    userAccounts,
    saveUserData,
    updateUserEvents,
    updateUserTrashedEvents,
    trashEvent,
    restoreEvent,
    updateEvent,
    permanentlyDeleteEvent,
    getUserAccount,
    updateEventStatuses
  };
}
