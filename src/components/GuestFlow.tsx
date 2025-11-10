import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Music, Check, Sparkles, Loader2, Apple, Plus, X, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { spotifyApi, utils } from '../utils/api';
import { validateSpotifyData, processGuestSpotifyData } from '../utils/spotifyPTSIntegration';
import { STORAGE_KEYS, SPOTIFY_OAUTH_VERSION } from '../utils/constants';
import { VibeQuiz } from './VibeQuiz';
import { ImageWithFallback } from './figma/ImageWithFallback';
import GuestTipJar from './GuestTipJar';
import logoImage from '../assets/qrate_title.png';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import type { Event as QRateEvent } from '@/utils/types';

type GuestFlowEvent = QRateEvent & {
  shareLink?: string;
  qrCodeData?: string;
  connectedGuests?: Array<{ imageUrl?: string; name?: string; display_name?: string }>;
  name?: string;
  theme?: string;
};

type GuestFlowProps = {
  event: GuestFlowEvent;
  onPreferencesSubmitted: (preferences: any) => Promise<boolean> | boolean;
  onBack: () => void;
  onLogoClick?: () => void;
  isLoading?: boolean;
};

type ConnectedGuest = {
  imageUrl: string;
  name?: string;
};

const DEMO_SPOTIFY_PROFILE_ID = '31dx4ozgupviiotfollaj7ppfsia';

const genres = [
  'Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Country',
  'Jazz', 'Classical', 'Reggae', 'Folk', 'Blues', 'Funk',
  'House', 'Techno', 'Disco', 'Soul', 'Punk', 'Metal'
];

const isDemoPoolEvent = (event: GuestFlowEvent) => {
  const name = (event.eventName || '').toLowerCase();
  return event.code === 'POOL' || name.includes('pool');
};

const deriveConnectedGuests = (event: GuestFlowEvent): ConnectedGuest[] => {
  const guests: ConnectedGuest[] = [];

  if (Array.isArray(event.connectedGuests)) {
    event.connectedGuests.forEach((guest) => {
      const imageUrl = guest?.imageUrl || guest?.display_name;
      if (typeof guest?.imageUrl === 'string') {
        guests.push({ imageUrl: guest.imageUrl, name: guest?.name || guest?.display_name });
      } else if (typeof imageUrl === 'string') {
        guests.push({ imageUrl, name: guest?.name || guest?.display_name });
      }
    });
  }

  if (Array.isArray(event.preferences)) {
    event.preferences.forEach((pref: any) => {
      const profile = pref?.spotifyUserData?.profile || pref?.profile;
      const images = profile?.images;
      let imageUrl: string | undefined;
      if (Array.isArray(images) && images[0]?.url) {
        imageUrl = images[0].url;
      } else if (typeof profile?.imageUrl === 'string') {
        imageUrl = profile.imageUrl;
      } else if (typeof pref?.profileImageUrl === 'string') {
        imageUrl = pref.profileImageUrl;
      }
      if (imageUrl) {
        guests.push({ imageUrl, name: profile?.display_name || pref?.name || pref?.userId });
      }
    });
  }

  if (Array.isArray(event.finalQueue)) {
    event.finalQueue.forEach((track: any) => {
      const addedBy = track?.addedBy || track?.contributor || track?.user;
      const imageUrl = addedBy?.imageUrl || addedBy?.avatarUrl || addedBy?.profileImageUrl;
      if (typeof imageUrl === 'string') {
        guests.push({ imageUrl, name: addedBy?.name || addedBy?.display_name });
      }
    });
  }

  const seen = new Set<string>();
  return guests.filter((guest) => {
    if (seen.has(guest.imageUrl)) return false;
    seen.add(guest.imageUrl);
    return true;
  }).slice(0, 12);
};

function GuestFlow({ event, onPreferencesSubmitted, onBack, onLogoClick }: GuestFlowProps) {
  const [step, setStep] = useState<'welcome' | 'spotify-auth' | 'apple-auth' | 'manual' | 'quiz' | 'success' | 'tip-jar'>('welcome');
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([]);
  const [newArtist, setNewArtist] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [spotifyData, setSpotifyData] = useState<any>(null);
  const [ptsStats, setPtsStats] = useState<any>(null);
  const [guestId, setGuestId] = useState<string>('');
  const [spotifyStatus, setSpotifyStatus] = useState<string | null>(null);
  const [hasStoredSpotifyToken, setHasStoredSpotifyToken] = useState(false);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [spotifyErrorMessage, setSpotifyErrorMessage] = useState<string | null>(null);
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);

  const clearSpotifyTokens = useCallback((statusMessage?: string) => {
    utils.storage.remove('spotify_access_token');
    utils.storage.remove('spotify_refresh_token');
    utils.storage.remove('spotify_expires_at');
    setHasStoredSpotifyToken(false);
    if (statusMessage) {
      setSpotifyStatus(statusMessage);
    }
  }, []);

  const fetchSpotifyUserData = useCallback(async (accessToken: string) => {
    console.log('📡 Fetching Spotify user data...');
    setSpotifyLoading(true);
    setSpotifyStatus('Syncing your Spotify data...');
    
    // Check if preferences were already submitted BEFORE fetching data
    // If already submitted, we can skip strict validation and go to success
    const submissionStorageKey = `qrate_last_spotify_submission:${event.code}:${guestId}`;
    const previousFingerprint = utils.storage.get(submissionStorageKey) as string | null;
    const alreadySubmitted = !!previousFingerprint;
    
    try {
      const response = await spotifyApi.getUserData(accessToken);
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch user data');
      }

      const userData = response.data;
      console.log('✅ Spotify data received:', {
        hasTopTracks: !!userData.top_tracks,
        hasPlaylists: !!userData.playlists,
        hasSavedTracks: !!userData.saved_tracks,
        topTracksCount: userData.top_tracks ? Object.values(userData.top_tracks).flat().length : 0
      });
      const profileId = userData.profile?.id || null;
      if (profileId) {
        utils.storage.set('spotify_profile_id', profileId);
      }

      const validation = validateSpotifyData(userData);
      if (!validation.valid) {
        const missingTopData = validation.errors.some((error) => error.toLowerCase().includes('top track'));
        
        // If already submitted, allow proceeding even with missing data
        if (alreadySubmitted) {
          console.log('⚠️ Validation failed but preferences already submitted, proceeding to success');
          setStep('success');
          setSpotifyData(userData); // Store what we have
          setPtsStats({ totalTracks: 0, vibeGatePassed: 0, vibeGatePassRate: 0 });
          return;
        }
        
        if (missingTopData) {
          // Check if user has playlists - if so, allow manual entry or proceed
          const hasPlaylists = Array.isArray(userData.playlists) && userData.playlists.length > 0;
          if (hasPlaylists) {
            setSpotifyStatus('No top tracks found, but you have playlists. You can continue with manual entry.');
            setSpotifyData(userData);
            setPtsStats({ totalTracks: 0, vibeGatePassed: 0, vibeGatePassRate: 0 });
            // Don't return - allow them to proceed manually
          } else {
            clearSpotifyTokens('We couldn\'t access your Spotify top tracks. Please reconnect to Spotify.');
            utils.storage.remove('spotify_profile_id');
            setSpotifyData(null);
            setPtsStats(null);
            return;
          }
        } else {
          setSpotifyStatus('Spotify data was incomplete. You can reconnect or continue manually.');
          setSpotifyData(userData);
          setPtsStats({ totalTracks: 0, vibeGatePassed: 0, vibeGatePassRate: 0 });
        }
      }

      const { contribution, stats } = processGuestSpotifyData(userData, {
        vibeProfile: (event as any).vibeProfile,
        guestCount: event.guestCount || 25,
      });

      const updatedSpotifyData = {
        ...userData,
        ptsContribution: contribution,
      };

      setSpotifyData(updatedSpotifyData);
      setPtsStats(stats);

      const totalTracks =
        typeof stats?.totalTracks === 'number'
          ? stats.totalTracks
          : Array.isArray(contribution?.tracks)
            ? contribution.tracks.length
            : 0;

      const isDemoProfile = profileId && profileId === DEMO_SPOTIFY_PROFILE_ID;

      if (isDemoProfile) {
        setHasStoredSpotifyToken(true);
      } else {
        clearSpotifyTokens();
        utils.storage.remove('spotify_profile_id');
      }

      if (totalTracks === 0) {
        console.log('⚠️ No tracks found, checking if we should return to welcome');
        setSpotifyStatus(
          "We didn't get any tracks from Spotify. Want to try connecting again, enter your favorites manually, or take the vibe quiz instead?"
        );
        // Only return to welcome if OAuth is not in progress and preferences not already submitted
        if (!alreadySubmitted && !isOAuthInProgress) {
          setStep('welcome');
        } else {
          // If OAuth in progress or already submitted, go to success to avoid redirect loop
          setStep('success');
        }
        return;
      }

      console.log(`✅ Successfully processed ${totalTracks} tracks, navigating to ${alreadySubmitted ? 'success' : 'quiz'}`);
      setSpotifyStatus(null);

      // Explicitly set step transition after successful data fetch
      // Check if preferences were already submitted for this event/guest
      // Use a simpler check - just see if there's any submission record
      if (alreadySubmitted) {
        // Already submitted, go to success
        console.log('📊 Preferences already submitted, navigating to success page');
        setStep('success');
      } else {
        // New submission, go to quiz
        console.log('📊 New submission, navigating to quiz');
        setStep('quiz');
      }
      
      // Ensure we're not stuck on spotify-auth step
      if (step === 'spotify-auth') {
        // If we're still on spotify-auth, force transition
        setTimeout(() => {
          if (alreadySubmitted) {
            setStep('success');
          } else {
            setStep('quiz');
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching/processing Spotify data:', error);
      setSpotifyStatus("We couldn't load Spotify data. Please reconnect or continue manually.");
      setSpotifyData(null);
      setPtsStats(null);
      
      // On error, only return to welcome if OAuth is not in progress
      // This prevents redirect loops during OAuth flow
      if (!isOAuthInProgress) {
        // Only reset to welcome if we're not in the middle of OAuth
        // Otherwise stay on current step to avoid redirect loop
        if (step === 'spotify-auth') {
          setStep('welcome');
        }
      }
    } finally {
      setSpotifyLoading(false);
      setIsOAuthInProgress(false);
    }
  }, [clearSpotifyTokens, event, guestId, isOAuthInProgress, step]);

  useEffect(() => {
    let storedGuestId = utils.storage.get('qrate_guest_id') as string | null;
    if (!storedGuestId || typeof storedGuestId !== 'string') {
      storedGuestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      utils.storage.set('qrate_guest_id', storedGuestId);
    }
    setGuestId(storedGuestId);
  }, []);

  // Check if preferences were already submitted when guestId and event are available
  useEffect(() => {
    if (!guestId || !event.code) return;
    // Don't interfere if OAuth is in progress
    if (isOAuthInProgress) return;
    
    const submissionStorageKey = `qrate_last_spotify_submission:${event.code}:${guestId}`;
    const previousFingerprint = utils.storage.get(submissionStorageKey) as string | null;
    if (previousFingerprint && step === 'welcome') {
      // Preferences were already submitted, go directly to success
      // Also try to load Spotify data if we have a token
      const accessToken = utils.storage.get('spotify_access_token') as string | null;
      const expiresAt = utils.storage.get('spotify_expires_at') as number | null;
      if (accessToken && typeof accessToken === 'string' && expiresAt && typeof expiresAt === 'number' && Date.now() < expiresAt) {
        fetchSpotifyUserData(accessToken);
      }
      setStep('success');
    }
  }, [guestId, event.code, step, fetchSpotifyUserData, isOAuthInProgress]);

  useEffect(() => {
    // Intentionally avoid auto-fetching Spotify data on initial load even if a token exists.
    // We now wait for explicit user action (Connect with Spotify or OAuth callback) to prevent surprise redirects/UI jumps.
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyToken = urlParams.get('spotify_access_token');
    const spotifyCode = urlParams.get('code');
    const spotifyError = urlParams.get('spotify_error');

    if (spotifyToken) {
      utils.storage.set('spotify_access_token', spotifyToken);
      const refreshToken = urlParams.get('spotify_refresh_token');
      const expiresIn = urlParams.get('spotify_expires_in');

      if (refreshToken) {
        utils.storage.set('spotify_refresh_token', refreshToken);
      }

      if (expiresIn) {
        const expiresAt = Date.now() + parseInt(expiresIn, 10) * 1000;
        utils.storage.set('spotify_expires_at', expiresAt);
      }
      
      // Update OAuth version to match current scopes
      utils.storage.set(STORAGE_KEYS.SPOTIFY_OAUTH_VERSION, SPOTIFY_OAUTH_VERSION);

      window.history.replaceState({}, document.title, window.location.pathname);
      setSpotifyErrorMessage(null);
      fetchSpotifyUserData(spotifyToken);
    } else if (spotifyCode) {
      // OAuth callback with code - useUrlParams will exchange it
      // Wait a bit for the exchange to complete, then check for stored token
      console.log('🎵 OAuth callback detected, waiting for token exchange...');
      setIsOAuthInProgress(true);
      setStep('spotify-auth'); // Show loading screen
      setSpotifyLoading(true);
      setSpotifyStatus('Completing Spotify connection...');
      
      let attempts = 0;
      const maxAttempts = 50; // 50 attempts * 200ms = 10 seconds max
      let tokenFound = false;
      let pollingTimeout: NodeJS.Timeout | null = null;
      let storageListener: ((e: StorageEvent) => void) | null = null;
      
      const handleTokenFound = (accessToken: string) => {
        if (tokenFound) return; // Prevent duplicate calls
        tokenFound = true;
        
        // Clean up listeners
        if (pollingTimeout) {
          clearTimeout(pollingTimeout);
        }
        if (storageListener) {
          window.removeEventListener('storage', storageListener);
        }
        
        console.log('✅ Token found, fetching Spotify data...');
        window.history.replaceState({}, document.title, window.location.pathname);
        setSpotifyErrorMessage(null);
        fetchSpotifyUserData(accessToken);
      };
      
      const checkForToken = () => {
        attempts++;
        const accessToken = utils.storage.get('spotify_access_token') as string | null;
        const expiresAt = utils.storage.get('spotify_expires_at') as number | null;
        
        if (accessToken && typeof accessToken === 'string' && expiresAt && typeof expiresAt === 'number' && Date.now() < expiresAt) {
          handleTokenFound(accessToken);
        } else if (attempts < maxAttempts) {
          // Token not ready yet, check again in a moment
          pollingTimeout = setTimeout(checkForToken, 200);
        } else {
          // Timeout - token exchange may have failed
          console.error('❌ Token exchange timeout after 10 seconds');
          setIsOAuthInProgress(false);
          setStep('welcome'); // Go back to welcome screen
          setSpotifyLoading(false);
          setSpotifyStatus(null);
          setSpotifyErrorMessage('Spotify connection timed out. Please try connecting again.');
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Clean up listener
          if (storageListener) {
            window.removeEventListener('storage', storageListener);
          }
        }
      };
      
      // Add storage event listener as backup mechanism
      storageListener = (e: StorageEvent) => {
        // Only handle our storage key
        if (e.key === 'spotify_access_token' && e.newValue && !tokenFound) {
          const accessToken = e.newValue;
          const expiresAt = utils.storage.get('spotify_expires_at') as number | null;
          
          if (expiresAt && Date.now() < expiresAt) {
            console.log('✅ Token detected via storage event listener');
            handleTokenFound(accessToken);
          }
        }
      };
      
      window.addEventListener('storage', storageListener);
      
      // Also check localStorage directly (for same-tab updates)
      // Since storage events only fire for cross-tab changes, we need polling for same-tab
      // Start checking after a short delay to allow useUrlParams to process
      pollingTimeout = setTimeout(checkForToken, 500);
      
      // Cleanup function to remove listeners if component unmounts or effect re-runs
      return () => {
        if (pollingTimeout) {
          clearTimeout(pollingTimeout);
        }
        if (storageListener) {
          window.removeEventListener('storage', storageListener);
        }
        // Reset OAuth flag if cleanup happens before token is found
        if (!tokenFound) {
          setIsOAuthInProgress(false);
        }
      };
    } else if (spotifyError) {
      console.error('Spotify OAuth error:', spotifyError);
      setIsOAuthInProgress(false);
      setSpotifyLoading(false);
      setSpotifyStatus(null);
      setSpotifyErrorMessage('Spotify authentication failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchSpotifyUserData]);

  useEffect(() => {
    if (step !== 'success') return;
    successHeadingRef.current?.focus();
    let cancelled = false;
    (async () => {
      try {
        // @ts-ignore - optional dependency without type definitions
        const mod: any = await import('canvas-confetti');
        if (cancelled) return;
        const confetti = mod.default || mod;
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
          if (!cancelled) {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          }
        }, 400);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step]);

  const guestName = useMemo(() => (spotifyData?.profile?.display_name as string) || 'Friend', [spotifyData]);

  const contributedTracks = useMemo(() => {
    const pass = typeof ptsStats?.vibeGatePassed === 'number' ? ptsStats.vibeGatePassed : 0;
    const total = typeof ptsStats?.totalTracks === 'number' ? ptsStats.totalTracks : 0;
    const rate = total > 0 ? Math.round((pass / total) * 1000) / 10 : 0;
    return { pass, total, rate };
  }, [ptsStats]);

  const topPreviewTracks = useMemo(() => {
    const tracks = Array.isArray(spotifyData?.ptsContribution?.tracks) ? spotifyData.ptsContribution.tracks : [];
    const sorted = [...tracks].sort((a: any, b: any) => (b.pts ?? b.score ?? 0) - (a.pts ?? a.score ?? 0));
    return sorted.slice(0, 10);
  }, [spotifyData]);

  const topPreviewArtists = useMemo(() => {
    const artists = (spotifyData?.topArtists?.items || spotifyData?.profile?.topArtists || [])
      .map((artist: any) => artist?.name)
      .filter(Boolean);
    if (artists.length > 0) return artists.slice(0, 5);

    if (Array.isArray(spotifyData?.ptsContribution?.tracks)) {
      const counts: Record<string, number> = {};
      spotifyData.ptsContribution.tracks.forEach((track: any) => {
        const name = track?.artist || track?.artists?.[0]?.name;
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)
        .slice(0, 5);
    }
    return [];
  }, [spotifyData]);

  const topPreviewGenres = useMemo(() => {
    const artists = (spotifyData?.topArtists?.items || []).filter(Boolean);
    const genreCounts: Record<string, number> = {};
    artists.forEach((artist: any) => {
      (artist.genres || []).forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    const fromArtists = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);
    if (fromArtists.length > 0) return fromArtists.slice(0, 5);

    const trackGenres: Record<string, number> = {};
    (spotifyData?.ptsContribution?.tracks || []).forEach((track: any) => {
      (track.genres || []).forEach((genre: string) => {
        trackGenres[genre] = (trackGenres[genre] || 0) + 1;
      });
    });
    return Object.entries(trackGenres)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 5);
  }, [spotifyData]);

  const topPreview = {
    tracks: topPreviewTracks,
    artists: topPreviewArtists,
    genres: topPreviewGenres,
  };

  const topPreviewMemo = topPreview;

  const topPreviewTracksMemo = topPreviewMemo.tracks;
  const topPreviewArtistsMemo = topPreviewMemo.artists;
  const topPreviewGenresMemo = topPreviewMemo.genres;

  const handleShare = useCallback(async () => {
    const shareUrl = event.shareLink || window.location.href;
    const text = `I just set my vibe for ${event.eventName}!`;
    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ title: event.eventName, text, url: shareUrl });
        toast.success('Shared successfully');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard');
      } catch (err) {
        console.error('Failed to copy share link', err);
        toast.error('Unable to share right now');
      }
    }
  }, [event]);

  const openQr = useCallback(async () => {
    setIsQrOpen(true);
    if (event.qrCodeData) {
      setQrDataUrl(event.qrCodeData);
      return;
    }
    try {
      // @ts-ignore - optional dependency without type definitions
      const mod: any = await import('qrcode');
      const QRCode = mod.default || mod;
      // Use URL format that bypasses code entry and goes directly to event page
      const url = `${window.location.origin}?code=${event.code}`;
      const dataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        scale: 6,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR', error);
      setQrDataUrl(null);
    }
  }, [event]);

  const hasPlaylistWriteScope = useMemo(() => {
    const scopes: string[] = Array.isArray(spotifyData?.scopes) ? spotifyData.scopes : [];
    return scopes.includes('playlist-modify-public') || scopes.includes('playlist-modify-private');
  }, [spotifyData]);

  const handleSaveToSpotify = useCallback(async () => {
    if (!hasPlaylistWriteScope) {
      toast.info('Reconnect with playlist write permission to save.');
      return;
    }
    try {
      toast.info('Saving playlist to your Spotify... (stub)');
    } catch (error) {
      console.error('Failed to save playlist', error);
      toast.error('Could not save playlist. Please try again later.');
    }
  }, [hasPlaylistWriteScope]);

  const connectWithSpotify = useCallback(async () => {
    setSpotifyStatus(null);
    setSpotifyErrorMessage(null);

    const accessToken = utils.storage.get('spotify_access_token') as string | null;
    const expiresAt = utils.storage.get('spotify_expires_at') as number | null;
    const storedProfileId = utils.storage.get('spotify_profile_id') as string | null;

    if (typeof accessToken === 'string' && typeof expiresAt === 'number' && Date.now() < expiresAt) {
      if (storedProfileId === DEMO_SPOTIFY_PROFILE_ID) {
        setSpotifyLoading(true);
        setSpotifyStatus('Refreshing your Spotify data...');
        await fetchSpotifyUserData(accessToken);
        return;
      }
      clearSpotifyTokens();
      utils.storage.remove('spotify_profile_id');
    } else {
      clearSpotifyTokens();
      utils.storage.remove('spotify_profile_id');
    }

    // Store event code before redirecting so we can restore it after OAuth callback
    utils.storage.set('qrate_oauth_event_code', event.code);

    setSpotifyLoading(true);
    try {
      setSpotifyStatus('Redirecting to Spotify...');
      const response = await spotifyApi.getAuthUrl(event.code);
      if (response.success && response.data && typeof response.data === 'object' && 'auth_url' in response.data) {
        const authUrl = (response.data as { auth_url: string }).auth_url;
        window.location.href = authUrl;
      } else {
        console.error('Failed to get Spotify auth URL:', response.error);
        setSpotifyStatus('Unable to start Spotify connect. Please try again.');
        setSpotifyLoading(false);
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      setSpotifyStatus('Unable to start Spotify connect. Please try again.');
      setSpotifyLoading(false);
    }
  }, [clearSpotifyTokens, event, fetchSpotifyUserData]);

  const connectWithApple = useCallback(() => {
    setAppleLoading(true);
    setTimeout(() => {
      toast.info('Apple Music coming soon. Use Spotify or manual entry for now.');
      setAppleLoading(false);
    }, 1500);
  }, []);

  const addArtist = useCallback(() => {
    const trimmed = newArtist.trim();
    if (trimmed && !favoriteArtists.includes(trimmed)) {
      setFavoriteArtists([...favoriteArtists, trimmed]);
      setNewArtist('');
    }
  }, [favoriteArtists, newArtist]);

  const removeArtist = useCallback((artist: string) => {
    setFavoriteArtists((prev) => prev.filter((a) => a !== artist));
  }, []);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }, []);

  const submitManualPreferences = useCallback(async () => {
    if (favoriteArtists.length === 0 && selectedGenres.length === 0) {
      toast.error('Add at least one artist or select a genre');
      return;
    }

    setIsSubmitting(true);
    try {
      const preferences = {
        spotifyUserData: null,
        additionalPreferences: {
          manualArtists: favoriteArtists,
          manualGenres: selectedGenres,
          source: 'manual',
          timestamp: new Date().toISOString(),
          guestId,
        },
      };
      await onPreferencesSubmitted(preferences);
      setStep('success');
    } catch (error) {
      console.error('Error submitting manual preferences:', error);
      toast.error('Failed to submit preferences. Please try again');
    } finally {
      setIsSubmitting(false);
    }
  }, [favoriteArtists, guestId, onPreferencesSubmitted, selectedGenres]);

  const submitSpotifyPreferences = useCallback(async (vibeAnswers: any) => {
    setIsSubmitting(true);

    try {
      const rawTracks = Array.isArray(spotifyData?.ptsContribution?.tracks)
        ? (spotifyData?.ptsContribution?.tracks as Array<{ id?: string }>)
        : [];
      const spotifyTrackIds = rawTracks
        .map((track) => track.id)
        .filter((id): id is string => Boolean(id))
        .sort();

      const submissionFingerprint = JSON.stringify({
        eventCode: event.code,
        guestId,
        profileId: spotifyData?.profile?.id || null,
        trackIds: spotifyTrackIds,
      });
      const submissionStorageKey = `qrate_last_spotify_submission:${event.code}:${guestId}`;
      const previousFingerprint = utils.storage.get(submissionStorageKey) as string | null;

      if (previousFingerprint && previousFingerprint === submissionFingerprint) {
        setSpotifyStatus('You already shared your Spotify vibe. All set!');
        setIsSubmitting(false);
        setStep('success');
        return;
      }

      const preferences = {
        guestId,
        spotifyUserData: spotifyData,
        guestContribution: spotifyData?.ptsContribution,
        stats: ptsStats,
        source: 'spotify',
        additionalPreferences: {
          vibeQuizAnswers: vibeAnswers,
          source: 'spotify',
          timestamp: new Date().toISOString(),
          guestId,
        },
      };

      await onPreferencesSubmitted(preferences);
      utils.storage.set(submissionStorageKey, submissionFingerprint);
      setStep('success');
    } catch (error) {
      console.error('Error submitting Spotify preferences:', error);
      toast.error('Failed to submit preferences. Please try again');
    } finally {
      setIsSubmitting(false);
    }
  }, [event.code, guestId, onPreferencesSubmitted, ptsStats, spotifyData]);

  const connectedGuests = useMemo(() => deriveConnectedGuests(event), [event]);

  if (step === 'spotify-auth') {
    return (
      <div className="flex justify-center items-center bg-background w-full h-full" style={{ maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div className="space-y-4 px-4 text-center">
          <div className="mx-auto border-4 border-primary border-t-transparent rounded-full w-16 h-16 animate-spin" />
          <h2 className="font-semibold text-foreground text-xl">Connecting to Spotify...</h2>
          <p className="text-muted-foreground text-sm">Please wait while we authenticate your account</p>
        </div>
      </div>
    );
  }

  if (step === 'apple-auth') {
    return (
      <div className="flex justify-center items-center bg-background w-full h-full" style={{ maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div className="space-y-4 px-4 text-center">
          <div className="mx-auto border-4 border-primary border-t-transparent rounded-full w-16 h-16 animate-spin" />
          <h2 className="font-semibold text-foreground text-xl">Connecting to Apple Music...</h2>
          <p className="text-muted-foreground text-sm">Please wait while we authenticate your account</p>
        </div>
      </div>
    );
  }

  if (step === 'welcome') {
    const useMockData = isDemoPoolEvent(event) || connectedGuests.length === 0;
    const mockGuestCount = event.guestCount || 347;
    const displayGuestCount = useMockData ? Math.max(mockGuestCount, 12) : connectedGuests.length;

    return (
      <div className="relative bg-background w-full h-full overflow-hidden" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
        <div className="top-0 left-0 absolute w-32 h-32 pointer-events-none">
          <svg className="opacity-10 w-full h-full" viewBox="0 0 200 200">
            <path d="M 20,20 L 100,60 L 60,120 Z" fill="none" stroke="url(#grad1)" strokeWidth="1.5" />
            <path d="M 40,40 L 120,80 L 80,140 Z" fill="none" stroke="url(#grad2)" strokeWidth="1" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'var(--neon-purple)', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: 'var(--neon-cyan)', stopOpacity: 0.4 }} />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'var(--neon-pink)', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: 'var(--neon-cyan)', stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="top-0 right-0 absolute w-32 h-32 rotate-180 pointer-events-none">
          <svg className="opacity-10 w-full h-full" viewBox="0 0 200 200">
            <path d="M 20,20 L 100,60 L 60,120 Z" fill="none" stroke="url(#grad3)" strokeWidth="1.5" />
            <path d="M 40,40 L 120,80 L 80,140 Z" fill="none" stroke="url(#grad4)" strokeWidth="1" />
            <defs>
              <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'var(--neon-cyan)', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: 'var(--neon-purple)', stopOpacity: 0.4 }} />
              </linearGradient>
              <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'var(--neon-cyan)', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: 'var(--neon-pink)', stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="z-10 relative flex flex-col px-3 py-3 h-full">
          {spotifyLoading && (
            <div className="z-40 fixed inset-0 flex justify-center items-center bg-black/60">
              <div className="space-y-3 px-5 py-4 border border-white/10 rounded-xl glass-effect">
                <div className="mx-auto border-4 border-primary border-t-transparent rounded-full w-12 h-12 animate-spin" />
                <div className="text-center">
                  <div className="font-semibold text-white">Connecting to Spotify…</div>
                  <div className="text-white/70 text-sm" role="status" aria-live="polite">{spotifyStatus || 'Redirecting…'}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-1 mb-2">
            <button
              onClick={onLogoClick || onBack}
              className="group hover:scale-105 transition-all duration-300 cursor-pointer"
              aria-label="Return to home"
            >
              <ImageWithFallback
                src={logoImage}
                alt="QRate"
                className="group-hover:drop-shadow-[0_0_16px_rgba(255,0,110,0.6)] w-auto h-24 object-contain transition-all duration-300"
              />
            </button>
          </div>

          <div className="flex flex-col flex-1 space-y-2.5">
            <div className="origin-top" style={{ transform: 'scale(0.85)' }}>
              <div className="space-y-1 text-center">
                <h1 className="font-bold text-white text-xl leading-tight">
                  Welcome to {event.eventName}!
                </h1>
                <p className="font-semibold text-xs gradient-text">Your music, your party</p>
                <p className="px-2 text-[11px] text-white/80 leading-snug">
                  Connect Spotify to add your favorite tracks to the party.
                </p>
              </div>

              <div className="space-y-1.5 px-2">
                <Button
                  onClick={connectWithSpotify}
                  disabled={spotifyLoading}
                  className="hover:opacity-90 shadow-lg rounded-full w-full h-9 font-semibold text-sm transition-all duration-300"
                  style={{
                    background: '#1DB954',
                    color: 'white',
                  }}
                >
                  {spotifyLoading ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Music className="mr-2 w-4 h-4" />
                      {hasStoredSpotifyToken ? 'Load Spotify Data' : 'Connect with Spotify'}
                    </>
                  )}
                </Button>
                {spotifyStatus && (
                  <p className="text-[11px] text-white/70 text-center" role="status" aria-live="polite">{spotifyStatus}</p>
                )}
                {spotifyErrorMessage && (
                  <div className="bg-destructive/15 p-2.5 border border-destructive/40 rounded-lg text-center">
                    <p className="mb-2 text-destructive text-xs">{spotifyErrorMessage}</p>
                    <Button onClick={connectWithSpotify} className="h-8 text-sm">Retry Spotify Connect</Button>
                  </div>
                )}

                <Button
                  onClick={connectWithApple}
                  disabled={appleLoading}
                  className="hover:opacity-90 shadow-lg rounded-full w-full h-9 font-semibold text-sm transition-all duration-300"
                  style={{
                    background: '#FC3C44',
                    color: 'white',
                  }}
                >
                  {appleLoading ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Apple className="mr-2 w-4 h-4" />
                      Connect with Apple Music
                    </>
                  )}
                </Button>
              </div>

              {(useMockData || connectedGuests.length > 0) && (
                <div className="space-y-2 p-2.5 border border-white/10 rounded-2xl glass-effect">
                  <div className="flex justify-between items-start gap-1.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm leading-tight">{event.eventName}</h3>
                      <p className="mt-0.5 text-[11px] text-white/60 line-clamp-2 leading-snug">
                        {event.eventDescription || `Join the vibe at ${event.eventName}!`}
                      </p>
                    </div>
                  </div>

                  <div className="gap-1 grid grid-cols-4">
                    {useMockData
                      ? [
                          'https://images.unsplash.com/photo-1724435811349-32d27f4d5806?w=100&h=100&fit=crop',
                          'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=100&h=100&fit=crop',
                          'https://images.unsplash.com/photo-1633037543479-a70452ea1e12?w=100&h=100&fit=crop',
                          'https://images.unsplash.com/photo-1690444963408-9573a17a8058?w=100&h=100&fit=crop',
                          'https://images.unsplash.com/photo-1610913041987-697d55b11998?w=100&h=100&fit=crop',
                          'https://images.unsplash.com/photo-1614436086835-d18683eb24f8?w=100&h=100&fit=crop',
                        ].map((img, index) => (
                          <div
                            key={index}
                            className="border rounded-full aspect-square overflow-hidden"
                            style={{
                              borderColor:
                                index % 3 === 0
                                  ? 'var(--neon-pink)'
                                  : index % 3 === 1
                                  ? 'var(--neon-cyan)'
                                  : 'var(--neon-purple)',
                            }}
                          >
                            <ImageWithFallback
                              src={img}
                              alt={`Guest ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))
                      : connectedGuests.map((guest, index) => (
                          <Avatar
                            key={`${guest.imageUrl}-${index}`}
                            className="border-2"
                            style={{
                              borderColor:
                                index % 3 === 0
                                  ? 'var(--neon-pink)'
                                  : index % 3 === 1
                                  ? 'var(--neon-cyan)'
                                  : 'var(--neon-purple)',
                            }}
                          >
                            <AvatarImage src={guest.imageUrl} alt={guest.name || `Guest ${index + 1}`} />
                            <AvatarFallback>{(guest.name || '?').slice(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                    {/* Connected count badge as avatar */}
                    <div
                      className="relative flex justify-center items-center border-2 rounded-full aspect-square overflow-hidden"
                      style={{
                        borderColor: 'var(--neon-cyan)',
                        background: 'linear-gradient(135deg, var(--neon-cyan) 0%, var(--neon-purple) 100%)',
                      }}
                    >
                      <div className="absolute inset-[2px] flex flex-col justify-center items-center bg-background rounded-full">
                        <div className="font-bold text-white text-xs leading-tight">{displayGuestCount}</div>
                        <div className="text-[7px] text-white/70 leading-none">Connected</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 mt-auto pb-3 text-center">
              <button
                onClick={() => {
                  setSpotifyData({ isQuizOnly: true });
                  setStep('quiz');
                }}
                className="block w-full text-white/70 hover:text-white text-xs underline transition-colors"
              >
                or take a quick vibe quiz
              </button>
              <button
                onClick={() => setStep('manual')}
                className="block w-full text-[11px] text-white/60 hover:text-white/90 underline transition-colors"
              >
                enter preferences manually
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'manual') {
    return (
      <div className="bg-background w-full h-full overflow-x-hidden overflow-y-auto" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
        <div className="px-4 py-6">
          <Button variant="ghost" onClick={() => setStep('welcome')} className="hover:bg-white/10 mb-6 text-white/80 hover:text-white">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-bold text-white text-2xl">Tell Us Your Music Taste</h2>
              <p className="mt-2 text-white/80">Add your favorite artists and genres</p>
            </div>

            <Card className="border-white/20 glass-effect">
              <CardHeader>
                <CardTitle className="text-white">Favorite Artists</CardTitle>
                <CardDescription className="text-white/70">
                  Add artists you love listening to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newArtist}
                    onChange={(event) => setNewArtist(event.target.value)}
                    placeholder="Enter artist name..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addArtist();
                      }
                    }}
                  />
                  <Button onClick={addArtist} disabled={!newArtist.trim()} size="sm" className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {favoriteArtists.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {favoriteArtists.map((artist) => (
                      <Badge key={artist} className="bg-primary/20 px-3 py-1 border border-primary/40 text-white">
                        {artist}
                        <button onClick={() => removeArtist(artist)} className="ml-2 text-white/80 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/20 glass-effect">
              <CardHeader>
                <CardTitle className="text-white">Favorite Genres</CardTitle>
                <CardDescription className="text-white/70">
                  Select genres you enjoy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="gap-3 grid grid-cols-2">
                  {genres.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`p-3 border-2 rounded-lg transition-all duration-200 text-left ${
                          isSelected
                            ? 'border-primary bg-primary/20 text-white'
                            : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center w-4 h-4 border-2 rounded ${
                            isSelected ? 'border-primary bg-primary' : 'border-white/40'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="font-medium text-sm">{genre}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={submitManualPreferences}
              disabled={isSubmitting || (favoriteArtists.length === 0 && selectedGenres.length === 0)}
              className="w-full h-12 font-semibold text-white qrate-gradient"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Preferences
                  <Sparkles className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'quiz') {
    return (
      <VibeQuiz
        spotifyData={spotifyData}
        onComplete={submitSpotifyPreferences}
        onBack={() => setStep('welcome')}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (step === 'success') {
    return (
      <div className="flex justify-center items-center bg-background p-4 w-full h-full overflow-y-auto" style={{ maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <div className="space-y-5 w-full">
          <div className="text-center">
            <div className="flex justify-center items-center bg-gradient-to-r from-primary to-accent mx-auto rounded-full w-20 h-20">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-1 mt-3">
              <h2 ref={successHeadingRef} tabIndex={-1} className="font-bold text-3xl gradient-text">
                You’re all set, {guestName}!
              </h2>
              <p className="text-muted-foreground">
                Your music preferences were added. The DJ will use your taste to shape the vibe.
              </p>
              <div className="sr-only" aria-live="polite">
                Your preferences were added successfully. Celebration triggered.
              </div>
              <div className="inline-flex items-center gap-2 bg-primary/15 mt-2 px-3 py-1 border border-primary/30 rounded-full">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-white text-sm">Vibe contribution complete</span>
              </div>
            </div>
          </div>

          <div className="gap-3 grid grid-cols-2">
            <Card className="border-white/10 glass-effect">
              <CardContent className="flex flex-col justify-center items-center gap-1 p-4">
                <Music className="w-6 h-6 text-accent" />
                <div className="font-bold text-white text-xl">{contributedTracks.pass}</div>
                <div className="text-white/70 text-xs">Tracks added</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 glass-effect">
              <CardContent className="flex flex-col justify-center items-center gap-1 p-4">
                <Check className="w-6 h-6 text-accent" />
                <div className="font-bold text-white text-xl">{contributedTracks.rate}%</div>
                <div className="text-white/70 text-xs">Vibe-gate pass</div>
              </CardContent>
            </Card>
          </div>

          {Array.isArray((event as any).finalQueue) && (event as any).finalQueue.length >= 3 && (
            <Card className="border-primary/30 glass-effect">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-accent" />
                  <div className="font-semibold text-white">Coming up in the mix</div>
                </div>
                <div className="space-y-2">
                  {((event as any).finalQueue as any[]).slice(0, 7).map((track: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-white/90 truncate">{track?.title || track?.name || 'Unknown Track'}</span>
                      <span className="ml-2 text-white/60 truncate">{track?.artist || track?.artists?.[0]?.name || 'Unknown Artist'}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-primary/30 glass-effect">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-accent" />
                <div className="text-left">
                  <div className="font-bold text-white text-lg">Enjoying the set?</div>
                  <div className="text-muted-foreground text-sm">Send a thank you tip to the DJ</div>
                </div>
              </div>
              <p className="text-white/80 text-xs">Include your song and shoutout requests with your tip.</p>
            </CardContent>
          </Card>

          <div className="gap-3 grid grid-cols-1 md:grid-cols-2">
            <Button onClick={() => setStep('tip-jar')} className="bg-[rgb(255,20,122)] h-12 font-semibold text-white qrate-gradient">
              <PartyPopper className="mr-2 w-4 h-4" />
              Send a Tip to the DJ
            </Button>
            <div className="gap-3 grid grid-cols-2">
              <Button onClick={() => setIsPreviewOpen(true)} variant="outline" className="hover:bg-white/10 border-white/20 h-12 text-white">
                Preview your vibe
              </Button>
              <Button onClick={handleShare} variant="outline" className="hover:bg-white/10 border-white/20 h-12 text-white">
                Share
              </Button>
            </div>
            <Button onClick={openQr} variant="outline" className="md:col-span-2 hover:bg-white/10 border-white/20 h-12 text-white">
              Get Event QR
            </Button>
            <Button onClick={onBack} variant="outline" className="md:col-span-2 hover:bg-white/10 border-white/20 h-12 text-white">
              Done
            </Button>
          </div>

          {isPreviewOpen && (
            <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/60">
              <div className="bg-background border border-white/10 rounded-xl w-[92vw] max-w-2xl max-h-[85vh] overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-white/10 border-b">
                  <div className="font-semibold text-white">Your Vibe Preview</div>
                  <button onClick={() => setIsPreviewOpen(false)} className="text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="gap-4 grid grid-cols-1 md:grid-cols-3 p-4 overflow-y-auto">
                  <div className="md:col-span-2">
                    <div className="mb-2 font-medium text-white">Top 10 Songs</div>
                    <div className="space-y-2">
                      {topPreviewTracksMemo.length > 0 ? (
                        topPreviewTracksMemo.map((track: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-white/90 truncate">{track?.title || track?.name || 'Unknown Track'}</span>
                            <span className="ml-2 text-white/60 truncate">{track?.artist || track?.artists?.[0]?.name || 'Unknown Artist'}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-white/60 text-sm">No songs available.</div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSaveToSpotify} disabled={!hasPlaylistWriteScope} className="h-10">
                        Save as Spotify playlist
                      </Button>
                      {!hasPlaylistWriteScope && (
                        <span className="self-center text-white/60 text-xs">Reconnect with playlist write permission</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 font-medium text-white">Top Artists</div>
                      <div className="flex flex-wrap gap-2">
                        {topPreviewArtistsMemo.length > 0 ? (
                          topPreviewArtistsMemo.map((artist: string, index: number) => (
                            <Badge key={`${artist}-${index}`} className="bg-white/10 border-white/20 text-white">
                              {artist}
                            </Badge>
                          ))
                        ) : (
                          <div className="text-white/60 text-sm">No artists available.</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 font-medium text-white">Top Genres</div>
                      <div className="flex flex-wrap gap-2">
                        {topPreviewGenresMemo.length > 0 ? (
                          topPreviewGenresMemo.map((genre: string, index: number) => (
                            <Badge key={`${genre}-${index}`} className="bg-white/10 border-white/20 text-white">
                              {genre}
                            </Badge>
                          ))
                        ) : (
                          <div className="text-white/60 text-sm">No genres available.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isQrOpen && (
            <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/60">
              <div className="bg-background border border-white/10 rounded-xl w-[92vw] max-w-md overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-white/10 border-b">
                  <div className="font-semibold text-white">Event QR</div>
                  <button onClick={() => setIsQrOpen(false)} className="text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-col items-center p-6">
                  {qrDataUrl ? (
                    <>
                      <img src={qrDataUrl} alt="Event QR code" className="bg-white rounded-md w-56 h-56" />
                      <a href={qrDataUrl} download={`qrate-${event.code}-qr.png`} className="mt-4 text-white/90 hover:text-white text-sm underline">
                        Download PNG
                      </a>
                    </>
                  ) : (
                    <div className="text-white/70 text-sm">QR not available. Share the event link instead.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'tip-jar') {
    return <GuestTipJar eventId={event.id} onBack={() => setStep('success')} />;
  }

  return null;
}

export default GuestFlow; 