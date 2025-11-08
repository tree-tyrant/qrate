import { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import { Toaster } from 'sonner@2.0.3';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ComponentLoader } from './components/ComponentLoader';
import { useUserAccounts } from './hooks/useUserAccounts';
import { useEventManager } from './hooks/useEventManager';
import { useUrlParams } from './hooks/useUrlParams';
import { useComponentPreloader } from './hooks/useComponentPreloader';
import { eventApi, utils } from './utils/api';
import { TIMEOUTS, STORAGE_KEYS } from './utils/constants';
import { AppMode, Event, EventFormData } from './utils/types';

// Lazy load all page components
const LandingPage = lazy(() => import('./components/LandingPage'));
const RoleSelection = lazy(() => import('./components/RoleSelection'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const SignupPage = lazy(() => import('./components/SignupPage'));
const DJLogin = lazy(() => import('./components/DJLogin'));
const DJSignupLogin = lazy(() => import('./components/DJSignupLogin'));
const HostDashboard = lazy(() => import('./components/HostDashboard'));
const EventCreation = lazy(() => import('./components/EventCreation'));
const EventEditor = lazy(() => import('./components/EventEditor'));
const GuestEventCodeEntry = lazy(() => import('./components/GuestEventCodeEntry'));
const GuestFlow = lazy(() => import('./components/GuestFlow'));
const DJDashboard = lazy(() => import('./components/DJDashboard'));
const QRCodeDisplay = lazy(() => import('./components/QRCodeDisplay'));
const PlaylistConnection = lazy(() => import('./components/PlaylistConnection'));
const DJGreeting = lazy(() => import('./components/DJGreeting'));
const HostGreeting = lazy(() => import('./components/HostGreeting'));
const SpotifyConnectionTest = lazy(() => import('./components/SpotifyConnectionTest'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

// Import PhoneMockup wrapper
import { PhoneMockup } from './components/PhoneMockup';

export default function App() {
  const [mode, setMode] = useState<AppMode>('landing');
  const [previousMode, setPreviousMode] = useState<AppMode>('landing');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  // Custom hooks for state management
  const {
    userAccounts,
    updateUserEvents,
    trashEvent: trashEventInStorage,
    restoreEvent: restoreEventInStorage,
    updateEvent: updateEventInStorage,
    permanentlyDeleteEvent: permanentlyDeleteEventInStorage,
    getUserAccount,
    updateEventStatuses
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

  // Initialize dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    console.log('✅ QRate initialized');
  }, []);

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

  // Navigation helpers
  const navigateToMode = useCallback((newMode: AppMode) => {
    setPreviousMode(mode);
    setMode(newMode);
  }, [mode]);

  const handleLogoClick = useCallback(() => {
    setCurrentUser(null);
    setCurrentEvent(null);
    clearError();
    setMode('landing');
  }, [clearError]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCurrentEvent(null);
    clearError();
    setMode('landing');
    utils.storage.remove(STORAGE_KEYS.SPOTIFY_ACCESS_TOKEN);
    utils.storage.remove(STORAGE_KEYS.SPOTIFY_REFRESH_TOKEN);
  }, [clearError]);

  // Authentication handlers
  const handleHostLogin = useCallback(async (username: string, password: string): Promise<boolean> => {
    const account = userAccounts.find(acc => 
      acc.username.toLowerCase() === username.toLowerCase() && 
      acc.password === password
    );
    
    if (!account) return false;

    setCurrentUser(account.username);
    
    // Load events from backend in background
    refreshUserEvents(account.username).then(events => {
      if (events.length > 0) {
        updateUserEvents(account.username, events);
      }
    }).catch(console.error);
    
    setMode('host-dashboard');
    return true;
  }, [userAccounts, refreshUserEvents, updateUserEvents]);

  const handleHostSignup = useCallback((username: string, password: string, email: string): boolean => {
    if (userAccounts.find(acc => acc.username.toLowerCase() === username.toLowerCase())) {
      return false;
    }
    
    const newAccount = { username, password, email, events: [], trashedEvents: [] };
    utils.storage.set(STORAGE_KEYS.USER_ACCOUNTS, [...userAccounts, newAccount]);
    
    setCurrentUser(username);
    setMode('create-event');
    return true;
  }, [userAccounts]);

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
      
      if (response.success && response.data?.event) {
        const event = response.data.event;
        setCurrentEvent(event);
        
        if (currentUser) {
          updateEventInStorage(currentUser, event.id, event);
          // Background sync
          setTimeout(() => syncEventWithBackend(event, currentUser), 3000);
        }
        
        setMode('host-greeting');
      } else {
        setError('Failed to create event');
      }
    } catch (error: any) {
      setError(error.message === 'Timeout' ? 'Event creation timed out' : 'Failed to create event');
    }
  }, [loading, currentUser, updateEventInStorage, syncEventWithBackend, setError]);

  const handleEventUpdated = useCallback(async (eventData: EventFormData) => {
    if (!currentEvent || !currentUser) return;
    
    // Calculate new status based on updated date/time
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
    
    const updatedEvent = {
      ...currentEvent,
      eventName: eventData.name,
      eventTheme: eventData.theme,
      eventDescription: eventData.description,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      eventImage: eventData.imageUrl || currentEvent.eventImage,
      status: newStatus
    };
    
    updateEventInStorage(currentUser, currentEvent.id, updatedEvent);
    setCurrentEvent(updatedEvent);
    
    // Background sync
    eventApi.update(currentEvent.id, {
      ...eventData,
      status: newStatus,
      imageUrl: eventData.imageUrl,
      hostId: currentUser
    }).catch(console.error);
    
    setMode('host-dashboard');
  }, [currentEvent, currentUser, updateEventInStorage]);

  const handleViewEvent = useCallback(async (event: Event) => {
    const updatedEvent = await loadEvent(event.code);
    setCurrentEvent(updatedEvent || event);
    navigateToMode('qr-display');
  }, [loadEvent, navigateToMode]);

  const handleEnterDJBooth = useCallback(async (event: Event) => {
    const updatedEvent = await loadEvent(event.code);
    setCurrentEvent(updatedEvent || event);
    setMode('dj-dashboard');
  }, [loadEvent]);

  const handleTrashEvent = useCallback(async (event: Event) => {
    if (!currentUser) return;
    
    trashEventInStorage(currentUser, event.id);
    setMode('host-dashboard');
    
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
  }, [currentUser, trashEventInStorage]);

  const handlePermanentlyDeleteEvent = useCallback(async (event: Event) => {
    if (!currentUser) return;
    
    permanentlyDeleteEventInStorage(currentUser, event.id);
    
    // Background sync - delete from backend
    eventApi.delete(event.id).catch(console.error);
  }, [currentUser, permanentlyDeleteEventInStorage]);

  const handleRestoreEvent = useCallback(async (event: Event) => {
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
      setMode('dj-greeting');
    }
  }, [loadEvent]);

  const handleGuestJoinEvent = useCallback(async (eventCode: string) => {
    const event = await loadEvent(eventCode.trim().toUpperCase());
    if (event) {
      setCurrentEvent(event);
      setMode('guest-flow');
    }
  }, [loadEvent]);

  const handlePreferencesSubmitted = useCallback(async (preferences: any) => {
    if (!currentEvent) return;
    
    try {
      await eventApi.submitPreferences(currentEvent.code, {
        spotifyUserData: preferences.spotifyUserData,
        additionalPreferences: preferences.additionalPreferences
      });
      
      const updatedEvent = await loadEvent(currentEvent.code);
      if (updatedEvent) {
        setCurrentEvent(updatedEvent);
      }
    } catch (error) {
      console.error('Error submitting preferences:', error);
    }
  }, [currentEvent, loadEvent]);

  // URL parameter handlers
  const urlHandlers = useMemo(() => ({
    onSpotifyAuth: async (params: Record<string, string>) => {
      if (params.event_code) {
        const event = await loadEvent(params.event_code);
        if (event) {
          setCurrentEvent(event);
          setMode('guest-flow');
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
        setMode('guest-flow');
      }
    },
    onSpotifyDebug: () => setMode('spotify-connection-test'),
    onDJBooth: () => setMode('dj-dashboard'),
    onAdmin: () => setMode('admin')
  }), [loadEvent, setError]);

  useUrlParams(urlHandlers, currentEvent);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Loading indicator */}
        {loading && (
          <div className="fixed top-4 right-4 z-50 glass-effect px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        )}

        {/* Error indicator */}
        {error && (
          <div className="fixed top-4 right-4 z-50 bg-destructive/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-destructive">
            <p className="text-sm text-destructive-foreground">{error}</p>
          </div>
        )}

        {mode === 'landing' && (
          <Suspense fallback={<ComponentLoader componentName="Landing Page" />}>
            <LandingPage
              onCreateEvent={() => setMode('role-selection')}
              onJoinEvent={handleGuestJoinEvent}
              onSpotifyDebug={() => setMode('spotify-connection-test')}
              isLoading={loading}
            />
          </Suspense>
        )}

        {mode === 'role-selection' && (
          <Suspense fallback={<ComponentLoader componentName="Role Selection" />}>
            <RoleSelection
              onSelectHost={() => setMode('host-login')}
              onSelectDJ={() => setMode('dj-signup-login')}
              onSelectGuest={() => setMode('guest-event-code-entry')}
              onBack={() => setMode('landing')}
            />
          </Suspense>
        )}

        {mode === 'host-login' && (
          <Suspense fallback={<ComponentLoader componentName="Host Login" />}>
            <LoginPage
              onLogin={handleHostLogin}
              onBack={() => setMode('landing')}
              onDJMode={() => setMode('dj-login')}
              onSignUp={() => setMode('signup')}
              onJoinEvent={handleDJJoinEvent}
              isLoading={loading}
            />
          </Suspense>
        )}

        {mode === 'signup' && (
          <Suspense fallback={<ComponentLoader componentName="Sign Up" />}>
            <SignupPage
              onSignup={handleHostSignup}
              onBack={() => setMode('landing')}
              onSignIn={() => setMode('host-login')}
              isLoading={loading}
            />
          </Suspense>
        )}

        {mode === 'dj-login' && (
          <Suspense fallback={<ComponentLoader componentName="DJ Login" />}>
            <DJLogin
              onJoinEvent={handleDJJoinEvent}
              onBack={() => setMode('host-login')}
              isLoading={loading}
            />
          </Suspense>
        )}

        {mode === 'dj-signup-login' && (
          <Suspense fallback={<ComponentLoader componentName="DJ Access" />}>
            <DJSignupLogin
              onLogin={handleHostLogin}
              onSignup={handleHostSignup}
              onJoinWithCode={handleDJJoinEvent}
              onBack={() => setMode('role-selection')}
            />
          </Suspense>
        )}

        {mode === 'host-dashboard' && currentUser && (
          <Suspense fallback={<ComponentLoader componentName="Host Dashboard" />}>
            <HostDashboard
              currentUser={currentUser}
              userEvents={userEvents}
              trashedEvents={trashedEvents}
              onLogout={handleLogout}
              onCreateEvent={() => setMode('create-event')}
              onViewEvent={handleViewEvent}
              onEnterDJBooth={handleEnterDJBooth}
              onEditEvent={(event) => {
                setCurrentEvent(event);
                setMode('edit-event');
              }}
              onTrashEvent={handleTrashEvent}
              onRestoreEvent={handleRestoreEvent}
              onPermanentlyDeleteEvent={handlePermanentlyDeleteEvent}
              onRefreshEvents={() => currentUser && refreshUserEvents(currentUser).then(events => {
                if (events.length > 0) updateUserEvents(currentUser, events);
              })}
              isLoading={loading}
            />
          </Suspense>
        )}
        
        {mode === 'create-event' && (
          <Suspense fallback={<ComponentLoader componentName="Event Creation" />}>
            <EventCreation
              onEventCreated={handleCreateEvent}
              onBack={() => setMode('host-dashboard')}
              isLoading={loading}
            />
          </Suspense>
        )}
        
        {mode === 'edit-event' && currentEvent && (
          <Suspense fallback={<ComponentLoader componentName="Event Editor" />}>
            <EventEditor
              event={currentEvent}
              onEventUpdated={handleEventUpdated}
              onEventTrashed={handleTrashEvent}
              onBack={() => setMode('host-dashboard')}
              isLoading={loading}
            />
          </Suspense>
        )}
        
        {mode === 'guest-event-code-entry' && (
          <Suspense fallback={<ComponentLoader componentName="Guest Event Code Entry" />}>
            <PhoneMockup>
              <GuestEventCodeEntry
                onJoinEvent={handleGuestJoinEvent}
                onBack={() => setMode('role-selection')}
                isLoading={loading}
              />
            </PhoneMockup>
          </Suspense>
        )}

        {mode === 'guest-flow' && currentEvent && (
          <Suspense fallback={<ComponentLoader componentName="Guest Experience" />}>
            <PhoneMockup>
              <GuestFlow
                event={currentEvent}
                onPreferencesSubmitted={handlePreferencesSubmitted}
                onBack={() => setMode('guest-event-code-entry')}
                onLogoClick={handleLogoClick}
                isLoading={loading}
              />
            </PhoneMockup>
          </Suspense>
        )}
        
        {mode === 'dj-greeting' && currentEvent && (
          <Suspense fallback={<ComponentLoader componentName="DJ Welcome" />}>
            <DJGreeting
              event={currentEvent}
              onContinue={() => setMode('dj-dashboard')}
              onBack={() => setMode(currentUser ? 'host-dashboard' : 'dj-login')}
            />
          </Suspense>
        )}

        {mode === 'host-greeting' && currentEvent && currentUser && (
          <Suspense fallback={<ComponentLoader componentName="Host Welcome" />}>
            <HostGreeting
              event={currentEvent}
              currentUser={currentUser}
              onContinue={() => setMode('dj-dashboard')}
              onBack={() => setMode('host-dashboard')}
            />
          </Suspense>
        )}

        {mode === 'dj-dashboard' && currentEvent && (
          <Suspense fallback={<ComponentLoader componentName="DJ Dashboard" />}>
            <DJDashboard
              event={currentEvent}
              onBack={() => setMode(currentUser ? 'host-dashboard' : 'dj-login')}
              onShowQRCode={() => {
                setPreviousMode('dj-dashboard');
                setMode('qr-display');
              }}
              onConnectPlaylist={() => setMode('playlist-connection')}
              onUpdateEvent={(updatedEvent) => {
                setCurrentEvent(updatedEvent);
                if (currentUser) {
                  updateEventInStorage(currentUser, updatedEvent.id, updatedEvent);
                }
              }}
              isLoading={loading}
            />
          </Suspense>
        )}

        {mode === 'playlist-connection' && currentEvent && (
          <Suspense fallback={<ComponentLoader componentName="Playlist Connection" />}>
            <PlaylistConnection
              onPlaylistSelected={(playlist) => {
                if (currentEvent) {
                  setCurrentEvent({ ...currentEvent, connectedPlaylist: playlist });
                }
                setMode('dj-dashboard');
              }}
              onBack={() => setMode('dj-dashboard')}
              isLoading={loading}
            />
          </Suspense>
        )}
        
        {mode === 'qr-display' && currentEvent && (
          <Suspense fallback={<ComponentLoader componentName="QR Code Display" />}>
            <QRCodeDisplay
              event={currentEvent}
              onBack={() => setMode(previousMode === 'host-dashboard' || currentUser ? 'host-dashboard' : 'dj-login')}
              onEnterDJBooth={() => setMode('dj-dashboard')}
              onSimulateGuest={() => setMode('guest-flow')}
              onLogoClick={handleLogoClick}
            />
          </Suspense>
        )}
        
        {mode === 'spotify-connection-test' && (
          <Suspense fallback={<ComponentLoader componentName="Spotify Connection Test" />}>
            <SpotifyConnectionTest onBack={() => setMode('landing')} />
          </Suspense>
        )}

        {mode === 'admin' && (
          <Suspense fallback={<ComponentLoader componentName="Admin Panel" />}>
            <AdminPanel />
          </Suspense>
        )}
      </div>
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  );
}
