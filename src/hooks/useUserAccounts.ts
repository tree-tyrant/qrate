import { useState, useEffect, useCallback } from 'react';
import { utils } from '@/utils/api';
import { STORAGE_KEYS, DEFAULT_USER_ACCOUNTS, TIMEOUTS, getLivePoolPartyDateTime } from '@/utils/constants';
import type { UserAccount, Event } from '@/utils/types';

const LOCAL_EMAIL_SUFFIX = '@local.qrate.app';
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/**
 * Calculate event status based on current time and event date/time
 * @param event - Event object with date and time
 * @param currentTime - Optional current time (defaults to now)
 * @returns Calculated status: 'past' | 'live' | 'upcoming'
 */
function calculateEventStatus(
  event: { date?: string; time?: string; code?: string },
  currentTime: Date = new Date()
): 'past' | 'live' | 'upcoming' {
  // Special case for POOL party
  if (event.code === 'POOL') {
    return 'live';
  }

  // Skip status calculation if date or time is missing
  if (!event.date || !event.time) {
    return 'upcoming'; // Default to upcoming if date/time missing
  }

  // Parse date and time more robustly
  // Handle both "HH:MM" and "HH:MM:SS" formats
  const timeStr = event.time.length === 5 ? `${event.time}:00` : event.time;
  const dateTimeStr = `${event.date}T${timeStr}`;
  const eventDateTime = new Date(dateTimeStr);
  
  if (Number.isNaN(eventDateTime.getTime())) {
    console.warn(`⚠️ Event "${(event as any).eventName || event.code}" invalid date/time: ${dateTimeStr}, defaulting to upcoming`);
    return 'upcoming';
  }
  
  const eventEndTime = new Date(eventDateTime.getTime() + FOUR_HOURS_MS);

  // Compare with current time
  if (currentTime > eventEndTime) {
    return 'past';
  } else if (currentTime >= eventDateTime && currentTime <= eventEndTime) {
    return 'live';
  } else {
    return 'upcoming';
  }
}

function generateLocalId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local_${crypto.randomUUID()}`;
  }
  return `local_${Math.random().toString(36).slice(2, 11)}`;
}

function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function sanitizeIdentifier(value: string | undefined | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUserAccount(raw: any): UserAccount {
  const username = sanitizeIdentifier(raw?.username);
  const existingId = sanitizeIdentifier(raw?.id);
  const baseId = existingId ?? username ?? generateLocalId();
  const normalizedEmail = sanitizeIdentifier(raw?.email)?.toLowerCase() ?? `${baseId.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'user'}${LOCAL_EMAIL_SUFFIX}`;
  const displayName = sanitizeIdentifier(raw?.displayName) ?? username ?? normalizedEmail;
  const legacyPassword = sanitizeIdentifier(raw?.legacyPassword) ?? sanitizeIdentifier(raw?.password);

  return {
    id: baseId,
    role: raw?.role === 'dj' ? 'dj' : 'host',
    email: normalizedEmail,
    username: username,
    displayName,
    avatarUrl: sanitizeIdentifier(raw?.avatarUrl),
    legacyPassword,
    events: ensureArray<Event>(raw?.events),
    trashedEvents: ensureArray<Event>(raw?.trashedEvents),
    metadata: typeof raw?.metadata === 'object' && raw.metadata !== null ? raw.metadata : undefined
  };
}

function mergeWithDefaults(account: UserAccount): UserAccount {
  const defaultAcc = DEFAULT_USER_ACCOUNTS.find(defaultAccount => {
    if (defaultAccount.id === account.id) return true;
    if (defaultAccount.username && account.username) {
      return defaultAccount.username === account.username;
    }
    return false;
  });

  const now = new Date();
  let events = ensureArray(account.events).map(event => ({ ...event }));

  if (defaultAcc) {
    const existingCodes = new Set(events.map(event => event.code));
    const defaultEvents = ensureArray(defaultAcc.events);
    const missingEvents = account.username === 'demo'
      ? []
      : defaultEvents.filter(event => !existingCodes.has(event.code));

    if (missingEvents.length > 0) {
      console.log(`🔄 Adding ${missingEvents.length} missing events to ${account.username ?? account.id}:`, missingEvents.map(event => event.code));
    }

    events = [...events, ...missingEvents.map(event => ({ ...event }))];
  }

  events = events.map(event => {
    if (event.code === 'POOL') {
      const poolTime = getLivePoolPartyDateTime();
      return {
        ...event,
        date: poolTime.date,
        time: poolTime.time,
        status: 'live'
      };
    }

    // Skip status calculation if date or time is missing
    if (!event.date || !event.time) {
      console.warn(`⚠️ Event "${event.eventName || event.code}" missing date or time, keeping status: ${event.status}`);
      return event;
    }

    const newStatus = calculateEventStatus(event, now);

    if (newStatus !== event.status) {
      console.log(`📅 Event "${event.eventName || event.code}" status updated: ${event.status} → ${newStatus} (date: ${event.date}, time: ${event.time})`);
    }

    return {
      ...event,
      status: newStatus
    };
  });

  return {
    ...account,
    events,
    trashedEvents: ensureArray(account.trashedEvents)
  };
}

export function useUserAccounts() {
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);

  useEffect(() => {
    console.log('💾 Initializing user accounts from storage...');
    const savedAccounts = utils.storage.get(STORAGE_KEYS.USER_ACCOUNTS);

    if (Array.isArray(savedAccounts) && savedAccounts.length > 0) {
      const normalized = savedAccounts.map(normalizeUserAccount).map(mergeWithDefaults);
      setUserAccounts(normalized);
      utils.storage.set(STORAGE_KEYS.USER_ACCOUNTS, normalized);
      console.log(`✅ Loaded ${normalized.length} stored accounts`);
    } else {
      console.log('🔧 No saved accounts found, creating defaults...');
      const defaults = DEFAULT_USER_ACCOUNTS.map(account => ({ ...account, events: ensureArray(account.events), trashedEvents: ensureArray(account.trashedEvents) }));
      setUserAccounts(defaults);
      utils.storage.set(STORAGE_KEYS.USER_ACCOUNTS, defaults);
    }
  }, []);

  useEffect(() => {
    if (userAccounts.length === 0) return;

    const saveTimeout = setTimeout(() => {
      utils.storage.set(STORAGE_KEYS.USER_ACCOUNTS, userAccounts);
      console.log('💾 User accounts auto-saved');
    }, TIMEOUTS.SAVE_DEBOUNCE);

    return () => clearTimeout(saveTimeout);
  }, [userAccounts]);

  const matchesAccount = useCallback((account: UserAccount, identifier: string) => {
    if (!identifier) return false;
    const normalized = identifier.toLowerCase();
    return account.id === identifier ||
      (account.username && account.username.toLowerCase() === normalized) ||
      account.email.toLowerCase() === normalized;
  }, []);

  const saveUserData = useCallback((accounts: UserAccount[]) => {
    const hasChanged = accounts.length !== userAccounts.length ||
      JSON.stringify(accounts) !== JSON.stringify(userAccounts);

    if (hasChanged) {
      setUserAccounts(accounts);
      utils.storage.set(STORAGE_KEYS.USER_ACCOUNTS, accounts);
      console.log(`✅ User data saved (${accounts.length} accounts)`);
    }
  }, [userAccounts]);

  const updateUserEvents = useCallback((identifier: string, events: Event[]) => {
    setUserAccounts(prev => prev.map(acc => {
      if (!matchesAccount(acc, identifier)) return acc;

      const eventMap = new Map<string, Event>();
      ensureArray(acc.events).forEach(event => eventMap.set(event.id, event));
      events.forEach(event => eventMap.set(event.id, event));

      console.log(`🔄 Merged events for ${acc.username ?? acc.id}: ${eventMap.size} total (${events.length} from backend, ${ensureArray(acc.events).length} from localStorage)`);

      return {
        ...acc,
        events: Array.from(eventMap.values())
      };
    }));
  }, [matchesAccount]);

  const updateUserTrashedEvents = useCallback((identifier: string, trashedEvents: Event[]) => {
    setUserAccounts(prev => prev.map(acc =>
      matchesAccount(acc, identifier)
        ? { ...acc, trashedEvents: [...trashedEvents] }
        : acc
    ));
  }, [matchesAccount]);

  const trashEvent = useCallback((identifier: string, eventId: string) => {
    setUserAccounts(prev => prev.map(acc => {
      if (!matchesAccount(acc, identifier)) return acc;

      const events = ensureArray(acc.events);
      const targetEvent = events.find(event => event.id === eventId);
      if (!targetEvent) return acc;

      const trashedEvent = { ...targetEvent, trashedAt: new Date().toISOString() };
      return {
        ...acc,
        events: events.filter(event => event.id !== eventId),
        trashedEvents: [...ensureArray(acc.trashedEvents), trashedEvent]
      };
    }));
  }, [matchesAccount]);

  const restoreEvent = useCallback((identifier: string, eventId: string) => {
    setUserAccounts(prev => prev.map(acc => {
      if (!matchesAccount(acc, identifier)) return acc;

      const trashedEvents = ensureArray(acc.trashedEvents);
      const targetEvent = trashedEvents.find(event => event.id === eventId);
      if (!targetEvent) return acc;

      const { trashedAt, ...restoredEvent } = targetEvent as Event & { trashedAt?: string };
      return {
        ...acc,
        events: [...ensureArray(acc.events), restoredEvent],
        trashedEvents: trashedEvents.filter(event => event.id !== eventId)
      };
    }));
  }, [matchesAccount]);

  const updateEvent = useCallback((identifier: string, eventId: string, eventData: Partial<Event> | Event) => {
    setUserAccounts(prev => prev.map(acc => {
      if (!matchesAccount(acc, identifier)) return acc;

      const events = ensureArray(acc.events);
      const existingEventIndex = events.findIndex(event => event.id === eventId);

      if (existingEventIndex >= 0) {
        // Update existing event
        const existingEvent = events[existingEventIndex];
        const updatedEvent = { ...existingEvent, ...eventData };
        
        // Recalculate status if date or time changed
        const dateChanged = eventData.date !== undefined && eventData.date !== existingEvent.date;
        const timeChanged = eventData.time !== undefined && eventData.time !== existingEvent.time;
        
        if (dateChanged || timeChanged) {
          // Use the shared status calculation function
          updatedEvent.status = calculateEventStatus(updatedEvent);
          console.log(`📅 Event "${updatedEvent.eventName || updatedEvent.code}" status recalculated: ${updatedEvent.status} (date/time changed)`);
        }
        
        return {
          ...acc,
          events: events.map(event =>
            event.id === eventId ? updatedEvent : event
          )
        };
      }

      // Create new event
      const newEvent: Event = {
        id: eventId,
        guestCount: 0,
        preferences: [],
        status: 'upcoming',
        ...(eventData as Event)
      };

      // Calculate status for new event using shared function
      if (newEvent.date && newEvent.time) {
        newEvent.status = calculateEventStatus(newEvent);
      }

      console.log(`✅ Adding new event to ${acc.username ?? acc.id}: ${newEvent.eventName || (eventData as any)?.name || eventId}`);
      return {
        ...acc,
        events: [...events, newEvent]
      };
    }));
  }, [matchesAccount]);

  const permanentlyDeleteEvent = useCallback((identifier: string, eventId: string) => {
    setUserAccounts(prev => prev.map(acc => {
      if (!matchesAccount(acc, identifier)) return acc;
      return {
        ...acc,
        trashedEvents: ensureArray(acc.trashedEvents).filter(event => event.id !== eventId)
      };
    }));
    console.log(`🗑️ Permanently deleted event ${eventId}`);
  }, [matchesAccount]);

  const getUserAccount = useCallback((identifier: string) => {
    return userAccounts.find(acc => matchesAccount(acc, identifier));
  }, [userAccounts, matchesAccount]);

  const updateEventStatuses = useCallback((identifier: string) => {
    const now = new Date();

    setUserAccounts(prev => prev.map(acc => {
      if (!matchesAccount(acc, identifier)) return acc;

      const updatedEvents = ensureArray(acc.events).map(event => {
        if (event.code === 'POOL') {
          return event;
        }

        // Skip status calculation if date or time is missing
        if (!event.date || !event.time) {
          return event;
        }

        const newStatus = calculateEventStatus(event, now);

        if (newStatus !== event.status) {
          console.log(`📅 Event "${event.eventName || event.code}" status: ${event.status} → ${newStatus} (date: ${event.date}, time: ${event.time})`);
          return { ...event, status: newStatus };
        }

        return event;
      });

      return {
        ...acc,
        events: updatedEvents
      };
    }));
  }, [matchesAccount]);

  const upsertAccount = useCallback((account: UserAccount) => {
    setUserAccounts(prev => {
      const normalized = mergeWithDefaults({
        ...account,
        events: ensureArray(account.events),
        trashedEvents: ensureArray(account.trashedEvents)
      });

      const existingIndex = prev.findIndex(existing => existing.id === normalized.id);
      let updatedAccounts: UserAccount[];

      if (existingIndex >= 0) {
        updatedAccounts = prev.map(existing =>
          existing.id === normalized.id
            ? { ...existing, ...normalized }
            : existing
        );
      } else {
        updatedAccounts = [...prev, normalized];
      }

      utils.storage.set(STORAGE_KEYS.USER_ACCOUNTS, updatedAccounts);
      return updatedAccounts;
    });
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
    updateEventStatuses,
    upsertAccount
  };
}
