import { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ComponentLoader } from '@/components/ComponentLoader';
import { useUserAccounts } from '@/hooks/useUserAccounts';
import { useEventManager } from '@/hooks/useEventManager';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useComponentPreloader } from '@/hooks/useComponentPreloader';
import { eventApi, utils } from '@/utils/api';
import { TIMEOUTS, STORAGE_KEYS } from '@/utils/constants';
import { AppMode, Event as QRateEvent, EventFormData, EventPlaylist, UserAccount } from '@/utils/types';
import { getSupabaseClient } from '@/supabase/client';
import {
  signInWithPassword,
  signUpWithPassword,
  signOut as supabaseSignOut,
  getActiveSession,
  isSupabaseAuthEnabled,
  buildAccountFromSupabase,
  mapSupabaseUserToLocalAccount
} from '@/services/authService';

// Lazy load all page components
const LandingPage = lazy(() => import('@/components/LandingPage'));
const RoleSelection = lazy(() => import('@/components/RoleSelection'));
const LoginPage = lazy(() => import('@/components/LoginPage'));
const SignupPage = lazy(() => import('@/components/SignupPage'));
const DJSignupLogin = lazy(() => import('@/components/DJSignupLogin'));
const HostDashboard = lazy(() => import('@/components/HostDashboard'));
const EventCreation = lazy(() => import('@/components/EventCreation'));
const EventEditor = lazy(() => import('@/components/EventEditor'));
const GuestEventCodeEntry = lazy(() => import('@/components/GuestEventCodeEntry'));
const GuestFlow = lazy(() => import('@/components/GuestFlow'));
const DJMarketplaceDashboard = lazy(() => import('@/components/DJDashboard'));
const DJGig = lazy(() => import('@/components/DJGig'));
const QRCodeDisplay = lazy(() => import('@/components/QRCodeDisplay'));
const PlaylistConnection = lazy(() => import('@/components/PlaylistConnection'));
const DJGreeting = lazy(() => import('@/components/DJGreeting'));
const HostGreeting = lazy(() => import('@/components/HostGreeting'));
const AdminPanel = lazy(() => import('@/components/AdminPanel'));

// Import PhoneMockup wrapper
import { PhoneMockup } from '@/components/PhoneMockup';

const STATIC_MODE_PATHS: Partial<Record<AppMode, string>> = {
  'landing': '/',
  'role-selection': '/role-selection',
  'host-login': '/host',
  'signup': '/signup',
  'dj-login': '/dj',
  'dj-signup-login': '/dj/access',
  'host-dashboard': '/host/dashboard',
  'create-event': '/host/create',
  'guest-event-code-entry': '/guest/entry',
  'playlist-connection': '/dj/connect',
  'dj-dashboard': '/dj/dashboard',
  'admin': '/admin'
};

function deriveModeFromPath(pathname: string): AppMode {
  if (pathname.startsWith('/host/edit/')) return 'edit-event';
  if (pathname.startsWith('/host/greeting/')) return 'host-greeting';
  if (pathname.startsWith('/dj/greeting/')) return 'dj-greeting';
  if (pathname.startsWith('/dj/gig')) return 'dj-gig';
  if (pathname.startsWith('/dj/dashboard')) return 'dj-dashboard';
  if (pathname.startsWith('/guest/') && pathname !== '/guest/entry') return 'guest-flow';
  // Handle /guest route (OAuth callback without event code in path)
  if (pathname === '/guest') {
    // Check if there's an event code in query params or we have OAuth params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('spotify_access_token') || urlParams.get('code') || urlParams.get('event_code')) {
      return 'guest-flow';
    }
  }
  if (pathname.startsWith('/qr/')) return 'qr-display';
  const staticEntry = (Object.entries(STATIC_MODE_PATHS) as Array<[AppMode, string]>).find(([, path]) => path === pathname);
  if (staticEntry) {
    return staticEntry[0];
  }
  return 'landing';
}

const getHostEditPath = (eventId: string) => `/host/edit/${eventId}`;
const getHostGreetingPath = (code: string) => `/host/greeting/${code}`;
const getDjGreetingPath = (code: string) => `/dj/greeting/${code}`;
const getDjGigPath = (code: string) => `/dj/gig/${code}`;
const getGuestFlowPath = (code: string) => `/guest/${code}`;
const getQrDisplayPath = (code: string) => `/qr/${code}`;

const withSuspense = (componentName: string, element: JSX.Element) => (
  <Suspense fallback={<ComponentLoader componentName={componentName} />}>
    {element}
  </Suspense>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<QRateEvent | null>(null);
  const [qrReturnPath, setQrReturnPath] = useState<string | null>(null);
  const [djGuestMode, setDjGuestMode] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const mode = useMemo(() => deriveModeFromPath(location.pathname), [location.pathname]);

  // Custom hooks for state management
  const {
    userAccounts,
    updateUserEvents,
    trashEvent: trashEventInStorage,
    restoreEvent: restoreEventInStorage,
    updateEvent: updateEventInStorage,
    permanentlyDeleteEvent: permanentlyDeleteEventInStorage,
    getUserAccount,
    updateEventStatuses,
    upsertAccount
  } = useUserAccounts();

  const {
    loading,
    error,
    loadEvent,
    refreshUserEvents,
    syncEventWithBackend,
    clearError,
    setError
  } = useEventManager();

  // Preload components based on current mode
  useComponentPreloader(mode);

  const supabaseEnabled = isSupabaseAuthEnabled();

  // Force re-authentication for all users (including demo) when OAuth scopes change
  useEffect(() => {
    utils.spotify.checkAndClearIfNeeded();
  }, []);

  useEffect(() => {
    if (!supabaseEnabled) return;

    let isMounted = true;

    getActiveSession().then(result => {
      if (!isMounted || !result.account) {
        return;
      }

      const localAccount = buildAccountFromSupabase(result.account);
      upsertAccount(localAccount);
      setCurrentUser(prev => prev ?? localAccount.id);
      setDjGuestMode(false);
    }).catch(console.error);

    const client = getSupabaseClient();
    if (!client) return;

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setCurrentUser(null);
        setDjGuestMode(false);
        return;
      }

      const localAccount = mapSupabaseUserToLocalAccount(session.user, 'host');
      if (!localAccount) {
        return;
      }

      upsertAccount(localAccount);
      setCurrentUser(localAccount.id);
      setDjGuestMode(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [supabaseEnabled, upsertAccount]);

  // Initialize dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    console.log('✅ QRate initialized');
  }, []);

  useEffect(() => {
    if (mode !== 'host-greeting' || currentUser) {
      return;
    }
    setError('Please sign in to continue to your host greeting.');
    navigate('/host');
  }, [mode, currentUser, navigate, setError]);

  useEffect(() => {
    let eventCode: string | null = null;

    if (mode === 'host-greeting') {
      const match = location.pathname.match(/^\/host\/greeting\/([^/]+)/i);
      eventCode = match?.[1] ?? null;
    } else if (mode === 'dj-greeting') {
      const match = location.pathname.match(/^\/dj\/greeting\/([^/]+)/i);
      eventCode = match?.[1] ?? null;
    } else if (mode === 'dj-gig') {
      const match = location.pathname.match(/^\/dj\/gig\/([^/]+)/i);
      eventCode = match?.[1] ?? null;
    } else if (mode === 'qr-display') {
      const match = location.pathname.match(/^\/qr\/([^/]+)/i);
      eventCode = match?.[1] ?? null;
    }

    if (!eventCode) {
      return;
    }

    const codeToLoad = eventCode.trim().toUpperCase();
    
    // Check if event is already loaded and matches the code
    if (currentEvent && currentEvent.code === codeToLoad) {
      return;
    }

    loadEvent(codeToLoad)
      .then(event => {
        if (event) {
          setCurrentEvent(event);
        } else {
          setError(`Event "${codeToLoad}" not found. Please check the code and try again.`);
        }
      })
      .catch(error => {
        console.error('Failed to load event for route:', error);
        setError('Unable to load event. Please try again.');
      });
  }, [mode, currentEvent, location.pathname, loadEvent, setError]);

  // Update event statuses periodically (every minute)
  useEffect(() => {
    if (!currentUser) return;
    
    // Update immediately on mount
    updateEventStatuses(currentUser);
    
    // Then update every minute
    const interval = setInterval(() => {
      updateEventStatuses(currentUser);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [currentUser, updateEventStatuses]);

  // Clear currentEvent when navigating away from guest-flow mode
  useEffect(() => {
    if (mode !== 'guest-flow' && currentEvent) {
      // Check if we're navigating to guest-event-code-entry or another non-guest mode
      if (mode === 'guest-event-code-entry' || !location.pathname.startsWith('/guest')) {
        setCurrentEvent(null);
      }
    }
  }, [mode, location.pathname, currentEvent]);

  // Ensure guest routes load their event when accessed directly
  useEffect(() => {
    if (mode !== 'guest-flow' || currentEvent) {
      return;
    }

    // Try to get event code from URL path first
    const [, routeSegment, eventCode] = location.pathname.split('/');
    let codeToLoad: string | null = eventCode || null;
    
    // If no event code in path (e.g., /guest OAuth callback), try query params or storage
    if (routeSegment === 'guest' && !codeToLoad) {
      const urlParams = new URLSearchParams(location.search);
      codeToLoad = urlParams.get('event_code') || urlParams.get('eventCode') || null;
      
      // If still no code, try to get from storage (stored before OAuth redirect)
      if (!codeToLoad) {
        codeToLoad = utils.storage.get('qrate_oauth_event_code') as string | null;
      }
    }
    
    if (routeSegment !== 'guest' || !codeToLoad) {
      return;
    }

    const finalCode = codeToLoad.trim().toUpperCase();
    loadEvent(finalCode)
      .then(event => {
        if (event) {
          setCurrentEvent(event);
          // If we loaded from storage and we're at /guest, navigate to proper path
          if (location.pathname === '/guest' && event.code) {
            navigate(getGuestFlowPath(event.code));
          }
        } else {
          setError(`Event "${finalCode}" not found. Please check the code and try again.`);
        }
      })
      .catch(error => {
        console.error('Failed to load guest event:', error);
        setError('Unable to load event. Please try again.');
      });
  }, [mode, currentEvent, location.pathname, location.search, loadEvent, setError, navigate]);

  // Refresh live events data periodically (every 30 seconds)
  useEffect(() => {
    if (!currentUser || mode !== 'host-dashboard') return;
    
    const refreshInterval = setInterval(async () => {
      const userAccount = getUserAccount(currentUser);
      if (!userAccount) return;
      
      // Check all live events for updates
      const liveEvents = userAccount.events?.filter(e => e.status === 'live') || [];
      
      for (const event of liveEvents) {
        try {
          // Try to load updated event data from backend
          const updatedEvent = await loadEvent(event.code);
          if (updatedEvent) {
            // Only update if guest count changed
            if (updatedEvent.guestCount !== event.guestCount) {
              console.log(`🔄 Event ${event.code} updated: ${event.guestCount} → ${updatedEvent.guestCount} guests`);
              // Merge backend data with local data to preserve imageUrl and other local fields
              const mergedEvent = {
                ...event, // Keep local data (imageUrl, etc)
                guestCount: updatedEvent.guestCount, // Update guest count
                preferences: updatedEvent.preferences || event.preferences, // Update preferences if available
                finalQueue: updatedEvent.finalQueue || event.finalQueue, // Update queue if available
                eventImage: updatedEvent.eventImage || event.eventImage, // Preserve local image if backend doesn't have one
                id: event.id // Always keep original ID
              };
              updateEventInStorage(currentUser, event.id, mergedEvent);
            }
          }
        } catch (error) {
          // Silently fail - event might be local only
          console.log(`⚠️ Could not refresh event ${event.code}, keeping local data`);
        }
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [currentUser, mode, getUserAccount, loadEvent, updateEventInStorage]);

  // Auto-clear errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, TIMEOUTS.ERROR_DISPLAY);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Memoized current user data
  const currentUserAccount = useMemo(() => 
    currentUser ? getUserAccount(currentUser) : null,
    [currentUser, getUserAccount]
  );

  const userEvents = useMemo(() => 
    currentUserAccount?.events || [],
    [currentUserAccount]
  );

  const trashedEvents = useMemo(() => 
    currentUserAccount?.trashedEvents || [],
    [currentUserAccount]
  );

  const currentUserDisplay = useMemo(() =>
    currentUserAccount?.displayName ??
    currentUserAccount?.username ??
    currentUserAccount?.email ??
    'Host',
    [currentUserAccount]
  );

  const currentUserPersona = useMemo(() =>
    currentUserAccount?.username ??
    currentUserAccount?.displayName ??
    currentUserAccount?.email ??
    'host',
    [currentUserAccount]
  );

  // Navigation helpers
  const navigateToMode = useCallback((newMode: AppMode) => {
    switch (newMode) {
      case 'dj-gig': {
        const code = currentEvent?.code;
        navigate(code ? getDjGigPath(code) : '/dj/gig');
        break;
      }
      case 'guest-flow': {
        const code = currentEvent?.code;
        navigate(code ? getGuestFlowPath(code) : '/guest/entry');
        break;
      }
      case 'qr-display': {
        const code = currentEvent?.code;
        if (code) {
          setQrReturnPath(location.pathname);
          navigate(getQrDisplayPath(code));
        }
        break;
      }
      case 'edit-event': {
        if (currentEvent?.id) {
          navigate(getHostEditPath(currentEvent.id));
        }
        break;
      }
      default: {
        const path = STATIC_MODE_PATHS[newMode];
        if (path) {
          navigate(path);
        } else {
          console.warn(`No static route mapping for mode: ${newMode}`);
        }
      }
    }
  }, [navigate, currentEvent, location.pathname, setQrReturnPath]);

  const handleLogoClick = useCallback(() => {
    setCurrentUser(null);
    setCurrentEvent(null);
    setDjGuestMode(false);
    clearError();
    navigate('/');
  }, [clearError, navigate]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCurrentEvent(null);
    setDjGuestMode(false);
    clearError();
    navigate('/');
    utils.storage.remove(STORAGE_KEYS.SPOTIFY_ACCESS_TOKEN);
    utils.storage.remove(STORAGE_KEYS.SPOTIFY_REFRESH_TOKEN);
    if (supabaseEnabled) {
      supabaseSignOut().catch(console.error);
    }
  }, [clearError, supabaseEnabled, navigate]);

  // Authentication handlers
  const handleHostLogin = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    const trimmedIdentifier = identifier.trim();

    if (supabaseEnabled) {
      const result = await signInWithPassword({ identifier: trimmedIdentifier, password });
      if (result.fromSupabase) {
        if (result.account) {
          const localAccount = buildAccountFromSupabase(result.account);
          upsertAccount(localAccount);
          setCurrentUser(localAccount.id);
          setDjGuestMode(false);

          const hostIdentifier = localAccount.username ?? localAccount.id;
          refreshUserEvents(hostIdentifier).then(events => {
            if (events.length > 0) {
              updateUserEvents(localAccount.id, events);
            }
          }).catch(console.error);

          navigateToMode('host-dashboard');
          return true;
        }

        if (trimmedIdentifier.includes('@')) {
          return false;
        }
      }
    }

    const normalized = trimmedIdentifier.toLowerCase();
    const account = userAccounts.find(acc => {
      const usernameMatch = acc.username ? acc.username.toLowerCase() === normalized : false;
      const emailMatch = acc.email.toLowerCase() === normalized;
      return (usernameMatch || emailMatch) && acc.legacyPassword === password;
    });

    if (!account) return false;

    setCurrentUser(account.id);
    setDjGuestMode(false);

    const hostIdentifier = account.username ?? account.id;
    refreshUserEvents(hostIdentifier).then(events => {
      if (events.length > 0) {
        updateUserEvents(account.id, events);
      }
    }).catch(console.error);

    navigateToMode('host-dashboard');
    return true;
  }, [userAccounts, refreshUserEvents, updateUserEvents, upsertAccount, supabaseEnabled, navigateToMode]);

  const handleHostSignup = useCallback(async (username: string, password: string, email: string): Promise<boolean> => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (supabaseEnabled) {
      const result = await signUpWithPassword({
        email: trimmedEmail,
        password,
        role: 'host',
        username: trimmedUsername || undefined,
        displayName: trimmedUsername || undefined
      });

      if (result.fromSupabase) {
        if (!result.account) {
          return false;
        }

        const localAccount = buildAccountFromSupabase(result.account);
        upsertAccount(localAccount);
        setCurrentUser(localAccount.id);
        setDjGuestMode(false);
        navigateToMode('host-dashboard');
        return true;
      }
    }

    const normalizedUsername = trimmedUsername.toLowerCase();
    const exists = userAccounts.some(acc => {
      const usernameMatch = acc.username ? acc.username.toLowerCase() === normalizedUsername : false;
      const emailMatch = acc.email.toLowerCase() === trimmedEmail;
      return usernameMatch || emailMatch;
    });

    if (exists) {
      return false;
    }

    const fallbackId = `local_${normalizedUsername || Math.random().toString(36).slice(2, 10)}`;
    const newAccount: UserAccount = {
      id: fallbackId,
      role: 'host',
      email: trimmedEmail || `${fallbackId}@local.qrate.app`,
      username: trimmedUsername ? trimmedUsername : null,
      displayName: trimmedUsername || trimmedEmail || fallbackId,
      avatarUrl: null,
      legacyPassword: password,
      events: [],
      trashedEvents: []
    };

    upsertAccount(newAccount);
    setCurrentUser(newAccount.id);
    setDjGuestMode(false);
    navigateToMode('host-dashboard');
    return true;
  }, [supabaseEnabled, userAccounts, upsertAccount, navigateToMode]);

  // DJ Authentication handlers (redirect to marketplace dashboard)
  const handleDJLogin = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    const trimmedIdentifier = identifier.trim();

    if (supabaseEnabled) {
      const result = await signInWithPassword({ identifier: trimmedIdentifier, password });
      if (result.fromSupabase) {
        if (!result.account) return false;
        const localAccount = buildAccountFromSupabase(result.account);
        upsertAccount(localAccount);
        setCurrentUser(localAccount.id);
        setDjGuestMode(false);
        navigate('/dj/dashboard');
        return true;
      }
    }

    // Local fallback for demo testers
    const normalized = trimmedIdentifier.toLowerCase();
    const account = userAccounts.find(acc => {
      const usernameMatch = acc.username ? acc.username.toLowerCase() === normalized : false;
      const emailMatch = acc.email.toLowerCase() === normalized;
      return (usernameMatch || emailMatch) && acc.legacyPassword === password;
    });
    if (!account) return false;
    setCurrentUser(account.id);
    setDjGuestMode(false);
    navigate('/dj/dashboard');
    return true;
  }, [supabaseEnabled, userAccounts, upsertAccount, navigate]);

  const handleDJSignup = useCallback(async (username: string, password: string, email: string): Promise<boolean> => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (supabaseEnabled) {
      const result = await signUpWithPassword({
        email: trimmedEmail,
        password,
        role: 'dj',
        username: trimmedUsername || undefined,
        displayName: trimmedUsername || undefined
      });
      if (!result.account) return false;
      const localAccount = buildAccountFromSupabase(result.account);
      upsertAccount(localAccount);
      setCurrentUser(localAccount.id);
      setDjGuestMode(false);
      navigate('/dj/dashboard');
      return true;
    }

    const normalizedUsername = trimmedUsername.toLowerCase();
    const exists = userAccounts.some(acc => {
      const usernameMatch = acc.username ? acc.username.toLowerCase() === normalizedUsername : false;
      const emailMatch = acc.email.toLowerCase() === trimmedEmail;
      return usernameMatch || emailMatch;
    });
    if (exists) return false;

    const fallbackId = `local_${normalizedUsername || Math.random().toString(36).slice(2, 10)}`;
    const newAccount: UserAccount = {
      id: fallbackId,
      role: 'dj',
      email: trimmedEmail || `${fallbackId}@local.qrate.app`,
      username: trimmedUsername ? trimmedUsername : null,
      displayName: trimmedUsername || trimmedEmail || fallbackId,
      avatarUrl: null,
      legacyPassword: password,
      events: [],
      trashedEvents: []
    };
    upsertAccount(newAccount);
    setCurrentUser(newAccount.id);
    setDjGuestMode(false);
    navigate('/dj/dashboard');
    return true;
  }, [supabaseEnabled, userAccounts, upsertAccount, navigate]);

  // Event handlers
  const handleCreateEvent = useCallback(async (eventData: EventFormData) => {
    if (loading) return;

    try {
      const response = await Promise.race([
        eventApi.create({ ...eventData, hostId: currentUser || 'anonymous' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), TIMEOUTS.EVENT_CREATE)
        )
      ]) as any;
      
      let event: QRateEvent;
      
      if (response.success && response.data?.event) {
        const backendEvent = response.data.event;
        
        // Transform backend event to Event type
        event = {
          id: backendEvent.id,
          eventName: backendEvent.name || backendEvent.eventName || eventData.name,
          eventTheme: backendEvent.theme || backendEvent.eventTheme || eventData.theme,
          eventDescription: backendEvent.description || backendEvent.eventDescription || eventData.description,
          code: backendEvent.code,
          date: backendEvent.date || eventData.date,
          time: backendEvent.time || eventData.time,
          location: backendEvent.location || eventData.location,
          eventImage: backendEvent.imageUrl || eventData.imageUrl || backendEvent.eventImage,
          guestCount: backendEvent.guestCount || 0,
          preferences: backendEvent.preferences || [],
          status: backendEvent.status || 'upcoming',
          vibeProfile: eventData.vibeProfile || backendEvent.vibeProfile,
          // Calculate status if date/time provided
          ...(backendEvent.date && backendEvent.time ? (() => {
            const now = new Date();
            const eventDateTime = new Date(`${backendEvent.date}T${backendEvent.time}`);
            const eventEndTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000)); // 4 hours
            let calculatedStatus: 'past' | 'live' | 'upcoming';
            if (now > eventEndTime) {
              calculatedStatus = 'past';
            } else if (now >= eventDateTime && now <= eventEndTime) {
              calculatedStatus = 'live';
            } else {
              calculatedStatus = 'upcoming';
            }
            return { status: calculatedStatus };
          })() : {})
        };
      } else {
        // Fallback: create event locally if backend fails
        console.warn('⚠️ Backend event creation failed, creating locally...');
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const eventCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const now = new Date();
        const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);
        const eventEndTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000)); // 4 hours
        
        let calculatedStatus: 'past' | 'live' | 'upcoming';
        if (now > eventEndTime) {
          calculatedStatus = 'past';
        } else if (now >= eventDateTime && now <= eventEndTime) {
          calculatedStatus = 'live';
        } else {
          calculatedStatus = 'upcoming';
        }
        
        event = {
          id: eventId,
          eventName: eventData.name,
          eventTheme: eventData.theme,
          eventDescription: eventData.description,
          code: eventCode,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          eventImage: eventData.imageUrl,
          guestCount: 0,
          preferences: [],
          status: calculatedStatus,
          vibeProfile: eventData.vibeProfile
        };
      }
      
      setCurrentEvent(event);
      
      if (currentUser) {
        updateEventInStorage(currentUser, event.id, event);
        console.log(`💾 Event saved to ${currentUser}'s account: ${event.eventName} (${event.code})`);
        // Background sync (only if backend was successful)
        if (response && response.success) {
          setTimeout(() => syncEventWithBackend(event, currentUser), 3000);
        } else {
          // Try to sync later if backend becomes available
          setTimeout(() => {
            eventApi.create({ 
              name: event.eventName,
              theme: event.eventTheme,
              description: event.eventDescription,
              date: event.date,
              time: event.time,
              location: event.location,
              hostId: currentUser,
              code: event.code
            }).then((syncResponse: any) => {
              if (syncResponse.success && syncResponse.data?.event) {
                const syncedEvent = syncResponse.data.event;
                updateEventInStorage(currentUser, event.id, {
                  ...event,
                  id: syncedEvent.id,
                  code: syncedEvent.code
                });
                console.log(`✅ Event synced to backend: ${event.eventName}`);
              }
            }).catch(console.error);
          }, 5000);
        }
      }
      
      navigate(getHostGreetingPath(event.code));
      return;
    } catch (error: any) {
      // Even on error, try to save locally as fallback
      if (currentUser) {
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const eventCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const now = new Date();
        const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);
        const eventEndTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000));
        
        let calculatedStatus: 'past' | 'live' | 'upcoming';
        if (now > eventEndTime) {
          calculatedStatus = 'past';
        } else if (now >= eventDateTime && now <= eventEndTime) {
          calculatedStatus = 'live';
        } else {
          calculatedStatus = 'upcoming';
        }
        
        const fallbackEvent: QRateEvent = {
          id: eventId,
          eventName: eventData.name,
          eventTheme: eventData.theme,
          eventDescription: eventData.description,
          code: eventCode,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          eventImage: eventData.imageUrl,
          guestCount: 0,
          preferences: [],
          status: calculatedStatus,
          vibeProfile: eventData.vibeProfile
        };
        
        updateEventInStorage(currentUser, fallbackEvent.id, fallbackEvent);
        setCurrentEvent(fallbackEvent);
        console.log(`💾 Event saved locally (backend unavailable): ${fallbackEvent.eventName} (${fallbackEvent.code})`);
        navigateToMode('host-greeting');
      } else {
        setError(error.message === 'Timeout' ? 'Event creation timed out' : 'Failed to create event');
      }
    }
  }, [loading, currentUser, updateEventInStorage, syncEventWithBackend, setError, navigateToMode]);

  const handleEventUpdated = useCallback(async (eventData: EventFormData) => {
    if (!currentEvent || !currentUser) return;
    
    // Update event in storage - updateEvent will automatically recalculate status if date/time changed
    const updatedEvent = {
      ...currentEvent,
      eventName: eventData.name,
      eventTheme: eventData.theme,
      eventDescription: eventData.description,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      eventImage: eventData.imageUrl || currentEvent.eventImage
    };
    
    updateEventInStorage(currentUser, currentEvent.id, updatedEvent);
    
    // Recalculate status for backend sync (using same logic as updateEvent)
    const now = new Date();
    const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);
    const eventEndTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000)); // 4 hours
    
    let newStatus: 'upcoming' | 'live' | 'past';
    if (now > eventEndTime) {
      newStatus = 'past';
    } else if (now >= eventDateTime && now <= eventEndTime) {
      newStatus = 'live';
    } else {
      newStatus = 'upcoming';
    }
    
    console.log(`📅 Event date/time updated: status ${currentEvent.status} → ${newStatus}`);
    
    // Background sync
    eventApi.update(currentEvent.id, {
      ...eventData,
      status: newStatus,
      imageUrl: eventData.imageUrl,
      hostId: currentUser
    }).catch(console.error);
    
    // Refresh event statuses to ensure dashboard shows correct status
    updateEventStatuses(currentUser);
    
    // Clear currentEvent before navigating to avoid rendering issues
    setCurrentEvent(null);
    
    // Use navigateToMode for consistent navigation
    navigateToMode('host-dashboard');
  }, [currentEvent, currentUser, updateEventInStorage, updateEventStatuses, navigateToMode]);

  const handleViewEvent = useCallback((event: QRateEvent) => {
    (async () => {
      const updatedEvent = await loadEvent(event.code);
      setCurrentEvent(updatedEvent || event);
      setQrReturnPath(location.pathname);
      navigate(getQrDisplayPath(event.code));
    })().catch(console.error);
  }, [loadEvent, navigate, setQrReturnPath, location.pathname]);

  const handleEnterDJBooth = useCallback(async (event: QRateEvent) => {
    const updatedEvent = await loadEvent(event.code);
    setCurrentEvent(updatedEvent || event);
    setDjGuestMode(false);
    navigate(getDjGigPath(event.code));
  }, [loadEvent, navigate]);

  const handleTrashEvent = useCallback((event: QRateEvent) => {
    if (!currentUser) return;
    
    trashEventInStorage(currentUser, event.id);
    navigate('/host/dashboard');
    
    // Background sync
    eventApi.update(event.id, {
      name: event.eventName,
      theme: event.eventTheme,
      description: event.eventDescription,
      date: event.date,
      time: event.time,
      location: event.location,
      imageUrl: event.eventImage,
      status: 'trashed',
      trashedAt: new Date().toISOString(),
      hostId: currentUser
    }).catch(console.error);
  }, [currentUser, trashEventInStorage, navigate]);

  const handlePermanentlyDeleteEvent = useCallback((event: QRateEvent) => {
    if (!currentUser) return;
    
    permanentlyDeleteEventInStorage(currentUser, event.id);
    
    // Background sync - delete from backend
    eventApi.delete(event.id).catch(console.error);
  }, [currentUser, permanentlyDeleteEventInStorage]);

  const handleRestoreEvent = useCallback((event: QRateEvent) => {
    if (!currentUser) return;
    
    restoreEventInStorage(currentUser, event.id);
    
    // Background sync
    eventApi.update(event.id, {
      name: event.eventName,
      theme: event.eventTheme,
      description: event.eventDescription,
      date: event.date,
      time: event.time,
      location: event.location,
      imageUrl: event.eventImage,
      status: event.status,
      hostId: currentUser
    }).catch(console.error);
  }, [currentUser, restoreEventInStorage]);

  const handleDJJoinEvent = useCallback(async (eventCode: string) => {
    const event = await loadEvent(eventCode.trim().toUpperCase());
    if (event) {
      setCurrentEvent(event);
      setDjGuestMode(!currentUser);
      navigate(getDjGreetingPath(event.code));
    } else {
      // Event not found - show error and stay on current page
      setError(`Event "${eventCode.trim().toUpperCase()}" not found. Please check the code and try again.`);
    }
  }, [loadEvent, setError, navigate, currentUser]);

  const handleGuestJoinEvent = useCallback(async (eventCode: string) => {
    const event = await loadEvent(eventCode.trim().toUpperCase());
    if (event) {
      setCurrentEvent(event);
      navigate(getGuestFlowPath(event.code));
    } else {
      // Event not found - show error and stay on current page
      setError(`Event "${eventCode.trim().toUpperCase()}" not found. Please check the code and try again.`);
    }
  }, [loadEvent, setError, navigate]);

  const handlePreferencesSubmitted = useCallback(async (preferences: any) => {
    if (!currentEvent) return false;
    
    try {
      // Pass all preference data including guestId, guestContribution, and stats
      await eventApi.submitPreferences(currentEvent.code, {
        guestId: preferences.guestId,
        spotifyUserData: preferences.spotifyUserData,
        guestContribution: preferences.guestContribution,
        stats: preferences.stats,
        source: preferences.source,
        additionalPreferences: preferences.additionalPreferences
      });
      
      const updatedEvent = await loadEvent(currentEvent.code);
      if (updatedEvent) {
        setCurrentEvent(updatedEvent);
      }
      return true; // Return success
    } catch (error) {
      console.error('Error submitting preferences:', error);
      return false; // Return failure
    }
  }, [currentEvent, loadEvent]);

  // URL parameter handlers
  const urlHandlers = useMemo(() => ({
    onSpotifyAuth: async (params: Record<string, string>) => {
      // If we're already in guest-flow mode with an event, don't redirect
      // Let GuestFlow component handle the OAuth callback
      if (mode === 'guest-flow' && currentEvent) {
        return;
      }
      
      // Try to get event code from params or extract from URL path
      let eventCode: string | null = params.event_code || null;
      if (!eventCode && location.pathname.startsWith('/guest/')) {
        const match = location.pathname.match(/^\/guest\/([^/?]+)/i);
        eventCode = match?.[1] ?? null;
      }
      
      if (eventCode) {
        const event = await loadEvent(eventCode);
        if (event) {
          setCurrentEvent(event);
          navigate(getGuestFlowPath(event.code));
        }
      }
    },
    onSpotifyError: (error: string) => {
      setError(`Spotify authentication failed: ${error}`);
    },
    onEventJoin: async (identifier: string) => {
      const event = await loadEvent(identifier);
      if (event) {
        setCurrentEvent(event);
        navigate(getGuestFlowPath(event.code));
      }
    },
    onDJBooth: () => navigate('/dj'),
    onAdmin: () => navigate('/admin')
  }), [loadEvent, setError, navigate, mode, currentEvent, location.pathname]);

  useUrlParams(urlHandlers, currentEvent);
  

  return (
    <ErrorBoundary>
      <div className="bg-background min-h-screen">
        {/* Loading indicator */}
        {loading && (
          <div className="top-4 right-4 z-50 fixed px-4 py-2 rounded-lg glass-effect">
            <div className="flex items-center gap-2">
              <div className="border-2 border-primary border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        )}

        {/* Error indicator */}
        {error && (
          <div className="top-4 right-4 z-50 fixed bg-destructive/90 backdrop-blur-sm px-4 py-2 border border-destructive rounded-lg">
            <p className="text-destructive-foreground text-sm">{error}</p>
          </div>
        )}

        {mode === 'landing' && (
          withSuspense("Landing Page", <LandingPage
            onCreateEvent={() => navigateToMode('role-selection')}
            onJoinEvent={handleGuestJoinEvent}
            isLoading={loading}
          />)
        )}

        {mode === 'role-selection' && (
          withSuspense("Role Selection", <RoleSelection
            onSelectHost={() => navigateToMode('host-login')}
            onSelectDJ={() => navigateToMode('dj-signup-login')}
            onSelectGuest={() => navigateToMode('guest-event-code-entry')}
            onBack={() => navigateToMode('landing')}
          />)
        )}

        {mode === 'host-login' && (
          withSuspense("Host Login", <LoginPage
            onLogin={handleHostLogin}
            onBack={() => navigateToMode('landing')}
            onDJMode={() => navigateToMode('dj-login')}
            onSignUp={() => navigateToMode('signup')}
            onJoinEvent={handleDJJoinEvent}
          />)
        )}

        {mode === 'signup' && (
          withSuspense("Sign Up", <SignupPage
            onSignup={handleHostSignup}
            onBack={() => navigateToMode('landing')}
            onSignIn={() => navigateToMode('host-login')}
          />)
        )}

        {mode === 'dj-login' && (
          withSuspense("DJ Access", <DJSignupLogin
            onLogin={handleDJLogin}
            onSignup={handleDJSignup}
            onJoinWithCode={handleDJJoinEvent}
            onBack={() => navigateToMode('host-login')}
          />)
        )}

        {mode === 'dj-signup-login' && (
          withSuspense("DJ Access", <DJSignupLogin
            onLogin={handleDJLogin}
            onSignup={handleDJSignup}
            onJoinWithCode={handleDJJoinEvent}
            onBack={() => navigateToMode('role-selection')}
          />)
        )}

        {mode === 'host-dashboard' && currentUser && (
          withSuspense("Host Dashboard", <HostDashboard
            currentUser={currentUserPersona}
            userEvents={userEvents}
            trashedEvents={trashedEvents}
            onLogout={handleLogout}
            onCreateEvent={() => navigateToMode('create-event')}
            onViewEvent={handleViewEvent}
            onEnterDJBooth={handleEnterDJBooth}
            onEditEvent={(event) => {
              setCurrentEvent(event);
              navigateToMode('edit-event');
            }}
            onTrashEvent={handleTrashEvent}
            onRestoreEvent={handleRestoreEvent}
            onPermanentlyDeleteEvent={handlePermanentlyDeleteEvent}
            onRefreshEvents={() => currentUser && refreshUserEvents(currentUser).then(events => {
              if (events.length > 0) updateUserEvents(currentUser, events);
            })}
            isLoading={loading}
          />)
        )}
        
        {mode === 'create-event' && (
          withSuspense("Event Creation", <EventCreation
            onEventCreated={handleCreateEvent}
            onBack={() => navigateToMode('host-dashboard')}
            isLoading={loading}
          />)
        )}
        
        {mode === 'edit-event' && currentEvent && (
          withSuspense("Event Editor", <EventEditor
            event={currentEvent}
            onEventUpdated={handleEventUpdated}
            onEventTrashed={handleTrashEvent}
            onBack={() => navigateToMode('host-dashboard')}
            isLoading={loading}
          />)
        )}
        
        {mode === 'guest-event-code-entry' && (
          withSuspense("Guest Event Code Entry", <PhoneMockup showQRCodeInfo={true}>
            <GuestEventCodeEntry
              onJoinEvent={handleGuestJoinEvent}
              onBack={() => navigateToMode('role-selection')}
              isLoading={loading}
              errorMessage={error || null}
            />
          </PhoneMockup>)
        )}

        {mode === 'guest-flow' && currentEvent && (
          withSuspense("Guest Experience", <PhoneMockup>
            <GuestFlow
              event={currentEvent}
              onPreferencesSubmitted={handlePreferencesSubmitted}
              onBack={() => navigateToMode('guest-event-code-entry')}
              onLogoClick={handleLogoClick}
              isLoading={loading}
            />
          </PhoneMockup>)
        )}
        
        {mode === 'dj-greeting' && currentEvent && (
          withSuspense("DJ Welcome", <DJGreeting
            event={currentEvent}
            onContinue={() => navigateToMode('dj-gig')}
            onBack={() => navigateToMode(currentUser ? 'host-dashboard' : 'dj-login')}
          />)
        )}

        {mode === 'host-greeting' && currentEvent && currentUser && (
          withSuspense("Host Welcome", <HostGreeting
            event={currentEvent}
            currentUser={currentUserDisplay}
            onContinue={() => navigateToMode('dj-gig')}
            onBack={() => navigateToMode('host-dashboard')}
          />)
        )}

        {mode === 'dj-dashboard' && (
          withSuspense("DJ Marketplace Dashboard", <DJMarketplaceDashboard
            djId={currentUser ?? currentUserAccount?.id ?? null}
          />)
        )}

        {mode === 'dj-gig' && currentEvent && (
          withSuspense("DJ Gig Console", <DJGig
            event={currentEvent}
            onBack={() => navigateToMode(currentUser ? 'host-dashboard' : 'dj-login')}
            onShowQRCode={() => navigateToMode('qr-display')}
            onConnectPlaylist={() => navigateToMode('playlist-connection')}
            onUpdateEvent={(updatedEvent) => {
              setCurrentEvent(updatedEvent);
              if (currentUser) {
                updateEventInStorage(currentUser, updatedEvent.id, updatedEvent);
              }
            }}
            isLoading={loading}
            isGuestAccess={djGuestMode && !currentUser}
            onRequestAuth={() => navigate('/dj/access?from=gig')}
          />)
        )}

        {mode === 'playlist-connection' && currentEvent && (
          withSuspense("Playlist Connection", <PlaylistConnection
            onPlaylistSelected={(playlist) => {
              if (currentEvent) {
                setCurrentEvent({ ...currentEvent, connectedPlaylist: playlist as EventPlaylist });
              }
              navigateToMode('dj-gig');
            }}
            onBack={() => navigateToMode('dj-gig')}
            isLoading={loading}
          />)
        )}
        
        {mode === 'qr-display' && currentEvent && (
          withSuspense("QR Code Display", <QRCodeDisplay
            event={currentEvent}
            onBack={() => {
              if (qrReturnPath) {
                navigate(qrReturnPath);
                setQrReturnPath(null);
              } else {
                navigateToMode(currentUser ? 'host-dashboard' : 'dj-login');
              }
            }}
            onEnterDJBooth={() => navigateToMode('dj-gig')}
            onSimulateGuest={() => navigateToMode('guest-flow')}
            onLogoClick={handleLogoClick}
          />)
        )}

        {mode === 'admin' && (
          withSuspense("Admin Panel", <AdminPanel />)
        )}
      </div>
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  );
}
