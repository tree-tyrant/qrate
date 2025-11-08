import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Music, Check, Users, Sparkles, Loader2, Brain, Send, Star, Coins, CreditCard, Gift, Apple, Plus, X, PartyPopper } from 'lucide-react';
import { eventApi, spotifyApi, utils } from '../utils/api';
import { validateSpotifyData, processGuestSpotifyData } from '../utils/spotifyPTSIntegration';
import { VibeQuiz } from './VibeQuiz';
import { ImageWithFallback } from './figma/ImageWithFallback';
import GuestTipJar from './GuestTipJar';
import logoImage from 'figma:asset/08d0d06dd14cd5a887d78962b507773b63dedad4.png';

interface Event {
  id: string;
  eventName: string;
  eventTheme: string;
  eventDescription?: string;
  code: string;
  date: string;
  time: string;
  location?: string;
  status: 'past' | 'live' | 'upcoming';
  guestCount: number;
  preferences: Array<{
    userId: string;
    artists: string[];
    genres: string[];
    recentTracks: string[];
  }>;
  connectedPlaylist?: any;
  finalQueue?: any[];
  insights?: any;
  shareLink?: string;
  qrCodeData?: string;
}

interface GuestFlowProps {
  event: Event;
  onPreferencesSubmitted: (preferences: any) => void;
  onBack: () => void;
  onLogoClick?: () => void;
  isLoading?: boolean;
}

interface TokenData {
  tokens: number;
  totalSpent: number;
  totalEarned: number;
}

function GuestFlow({ event, onPreferencesSubmitted, onBack, onLogoClick, isLoading = false }: GuestFlowProps) {
  const [step, setStep] = useState<'welcome' | 'connect' | 'spotify-auth' | 'apple-auth' | 'manual' | 'quiz' | 'success' | 'tip-jar'>('welcome');
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([]);
  const [newArtist, setNewArtist] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [spotifyData, setSpotifyData] = useState<any>(null);
  const [ptsStats, setPtsStats] = useState<any>(null);
  const [guestId, setGuestId] = useState<string>('');
  const [tokenData, setTokenData] = useState<TokenData>({ tokens: 1, totalSpent: 0, totalEarned: 1 });

  const genres = [
    'Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Country',
    'Jazz', 'Classical', 'Reggae', 'Folk', 'Blues', 'Funk',
    'House', 'Techno', 'Disco', 'Soul', 'Punk', 'Metal'
  ];

  // Initialize guest token data
  useEffect(() => {
    const stored = utils.storage.get('qrate_guest_tokens');
    if (stored) {
      setTokenData(stored);
    } else {
      // New guest gets 1 free token
      const initialTokens = { tokens: 1, totalSpent: 0, totalEarned: 1 };
      utils.storage.set('qrate_guest_tokens', initialTokens);
      setTokenData(initialTokens);
    }

    // Generate unique guest ID
    let storedGuestId = utils.storage.get('qrate_guest_id');
    if (!storedGuestId) {
      storedGuestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      utils.storage.set('qrate_guest_id', storedGuestId);
    }
    setGuestId(storedGuestId);
  }, []);

  // Check for stored Spotify tokens on load
  useEffect(() => {
    const accessToken = utils.storage.get('spotify_access_token');
    const refreshToken = utils.storage.get('spotify_refresh_token');
    const expiresAt = utils.storage.get('spotify_expires_at');
    
    if (accessToken && expiresAt && Date.now() < expiresAt) {
      console.log('🎵 Found valid Spotify token, fetching user data...');
      fetchSpotifyUserData(accessToken);
    }
  }, []);

  // Check URL parameters for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyToken = urlParams.get('spotify_access_token');
    const spotifyError = urlParams.get('spotify_error');
    const details = urlParams.get('details');
    
    if (spotifyToken) {
      console.log('🎵 Spotify OAuth successful, processing tokens...');
      
      // Store tokens
      utils.storage.set('spotify_access_token', spotifyToken);
      const refreshToken = urlParams.get('spotify_refresh_token');
      const expiresIn = urlParams.get('spotify_expires_in');
      
      if (refreshToken) {
        utils.storage.set('spotify_refresh_token', refreshToken);
      }
      
      if (expiresIn) {
        const expiresAt = Date.now() + (parseInt(expiresIn) * 1000);
        utils.storage.set('spotify_expires_at', expiresAt);
      }
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Fetch user data
      fetchSpotifyUserData(spotifyToken);
      
    } else if (spotifyError) {
      console.error('❌ Spotify OAuth error:', spotifyError);
      setSpotifyLoading(false);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchSpotifyUserData = async (accessToken: string) => {
    setSpotifyLoading(true);
    try {
      console.log('🔍 Fetching comprehensive Spotify user data from backend...');
      
      // Use backend endpoint to get complete user data
      const response = await spotifyApi.getUserData(accessToken);
      
      if (!response.success || !response.data?.userData) {
        throw new Error('Failed to fetch user data from backend');
      }
      
      const userData = response.data.userData;
      console.log('✅ Spotify user data fetched successfully');
      
      // Validate Spotify data before processing
      const validation = validateSpotifyData(userData);
      if (!validation.valid) {
        console.error('❌ Invalid Spotify data:', validation.errors);
        throw new Error(`Invalid Spotify data: ${validation.errors.join(', ')}`);
      }
      
      // Process through PTS system
      console.log('🎯 Processing through PTS system...');
      const { contribution, stats } = processGuestSpotifyData(
        userData,
        {
          vibeProfile: event.vibeProfile,
          guestCount: event.guestCount || 25,
          coordinates: undefined // TODO: Get user location if geo-fence enabled
        }
      );
      
      console.log('✅ PTS processing complete:', stats);
      console.log(`📊 ${stats.vibeGatePassed}/${stats.totalTracks} tracks passed Vibe Gate (${stats.vibeGatePassRate.toFixed(1)}%)`);
      console.log(`🎵 Average PTS: ${stats.averagePTS.toFixed(4)}`);
      
      // Store processed data
      setSpotifyData({
        ...userData,
        ptsContribution: contribution
      });
      setPtsStats(stats);
      setStep('quiz');
      
    } catch (error) {
      console.error('❌ Error fetching/processing Spotify data:', error);
      setSpotifyData(null);
      setPtsStats(null);
    } finally {
      setSpotifyLoading(false);
    }
  };

  const connectWithSpotify = async () => {
    setSpotifyLoading(true);
    
    try {
      console.log('🔄 Getting Spotify auth URL...');
      const response = await spotifyApi.getAuthUrl(event.code);
      
      if (response.success && response.data?.auth_url) {
        console.log('✅ Redirecting to Spotify auth...');
        window.location.href = response.data.auth_url;
      } else {
        console.error('❌ Failed to get Spotify auth URL:', response.error);
        setSpotifyLoading(false);
      }
    } catch (error) {
      console.error('❌ Error connecting to Spotify:', error);
      setSpotifyLoading(false);
    }
  };

  const connectWithApple = async () => {
    setAppleLoading(true);
    
    // Simulate Apple Music OAuth flow (placeholder)
    setTimeout(() => {
      alert('Apple Music integration coming soon! Please use Spotify or manual entry for now.');
      setAppleLoading(false);
    }, 1500);
  };

  const addArtist = () => {
    if (newArtist.trim() && !favoriteArtists.includes(newArtist.trim())) {
      setFavoriteArtists([...favoriteArtists, newArtist.trim()]);
      setNewArtist('');
    }
  };

  const removeArtist = (artist: string) => {
    setFavoriteArtists(favoriteArtists.filter(a => a !== artist));
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const submitManualPreferences = async () => {
    if (favoriteArtists.length === 0 && selectedGenres.length === 0) {
      alert('Please add at least one artist or select at least one genre.');
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
          guestId: guestId
        }
      };
      
      console.log('📝 Submitting manual preferences:', preferences);
      await onPreferencesSubmitted(preferences);
      setStep('success');
      
    } catch (error) {
      console.error('❌ Error submitting manual preferences:', error);
      alert('Failed to submit preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSpotifyPreferences = async (vibeAnswers: any) => {
    setIsSubmitting(true);
    
    try {
      const preferences = {
        spotifyUserData: spotifyData,
        guestContribution: spotifyData?.ptsContribution,
        stats: ptsStats,
        additionalPreferences: {
          vibeQuizAnswers: vibeAnswers,
          source: 'spotify',
          timestamp: new Date().toISOString(),
          guestId: guestId
        }
      };
      
      console.log('📝 Submitting Spotify preferences with PTS data:', preferences);
      console.log(`🎵 Contributing ${ptsStats?.vibeGatePassed || 0} tracks with avg PTS ${ptsStats?.averagePTS?.toFixed(4) || '0'}`);
      await onPreferencesSubmitted(preferences);
      
      // Award token for completing the flow
      const updatedTokens = {
        ...tokenData,
        tokens: tokenData.tokens + 1,
        totalEarned: tokenData.totalEarned + 1
      };
      setTokenData(updatedTokens);
      utils.storage.set('qrate_guest_tokens', updatedTokens);
      
      setStep('success');
      
    } catch (error) {
      console.error('❌ Error submitting Spotify preferences:', error);
      alert('Failed to submit preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Spotify auth loading screen
  if (step === 'spotify-auth') {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto animate-spin"></div>
          <h2 className="text-xl font-semibold text-foreground">Connecting to Spotify...</h2>
          <p className="text-muted-foreground text-sm">Please wait while we authenticate your account</p>
        </div>
      </div>
    );
  }

  // Apple auth loading screen
  if (step === 'apple-auth') {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto animate-spin"></div>
          <h2 className="text-xl font-semibold text-foreground">Connecting to Apple Music...</h2>
          <p className="text-muted-foreground text-sm">Please wait while we authenticate your account</p>
        </div>
      </div>
    );
  }

  // Welcome step - Redesigned to match mockup
  if (step === 'welcome') {
    // Generate mock guest avatars (placeholder images)
    const mockGuestCount = event.guestCount || 347;
    const displayGuestCount = Math.max(mockGuestCount, 12); // Show at least 12 for demo
    
    return (
      <div className="h-full bg-background relative overflow-hidden">
        {/* Geometric decorations - Angular lines */}
        <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none">
          <svg className="w-full h-full opacity-20" viewBox="0 0 200 200">
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

        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none transform rotate-180">
          <svg className="w-full h-full opacity-20" viewBox="0 0 200 200">
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

        <div className="px-4 py-4 relative z-10 flex flex-col h-full">
          {/* QRate Logo - Clickable */}
          <div className="flex justify-center mb-3 mt-1">
            <button
              onClick={onLogoClick || onBack}
              className="group transition-all duration-300 hover:scale-105 cursor-pointer"
              aria-label="Return to home"
            >
              <ImageWithFallback 
                src={logoImage} 
                alt="QRate" 
                className="h-28 w-auto object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(255,0,110,0.6)]"
              />
            </button>
          </div>

          {/* Main Content */}
          <div className="space-y-3 flex-1 flex flex-col">
            {/* Welcome Heading */}
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-bold text-white leading-tight">
                Welcome to {event.eventName}!
              </h1>
              <p className="text-sm font-semibold gradient-text">
                Your music, your party
              </p>
              <p className="text-white/80 text-xs px-2">
                Connect Spotify to add your favorite tracks to the party.
              </p>
            </div>

            {/* Connect with Spotify Button */}
            <div className="px-3 space-y-2">
              <Button 
                onClick={connectWithSpotify}
                disabled={spotifyLoading}
                className="w-full h-11 font-semibold rounded-full shadow-lg transition-all duration-300 hover:opacity-90"
                style={{
                  background: '#1DB954',
                  color: 'white',
                }}
              >
                {spotifyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 mr-2" />
                    Connect with Spotify
                  </>
                )}
              </Button>

              {/* Apple Music Button */}
              <Button 
                onClick={connectWithApple}
                disabled={appleLoading}
                className="w-full h-11 font-semibold rounded-full shadow-lg transition-all duration-300 hover:opacity-90"
                style={{
                  background: '#FC3C44',
                  color: 'white',
                }}
              >
                {appleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Apple className="w-4 h-4 mr-2" />
                    Connect with Apple Music
                  </>
                )}
              </Button>
            </div>

            {/* Event Details Card */}
            <div className="glass-effect border border-white/10 rounded-2xl p-3 space-y-2.5">
              {/* Event Name & Connected Count */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm">{event.eventName}</h3>
                  <p className="text-white/60 text-xs mt-0.5 line-clamp-2">
                    {event.eventDescription || `Join the vibe at ${event.eventName}!`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div 
                    className="relative w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, var(--neon-cyan) 0%, var(--neon-purple) 100%)',
                    }}
                  >
                    <div className="absolute inset-[2px] rounded-full bg-background flex flex-col items-center justify-center">
                      <div className="text-lg font-bold text-white">{displayGuestCount}</div>
                      <div className="text-[8px] text-white/70">Connected</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Avatars Grid - With real images */}
              <div className="grid grid-cols-6 gap-1">
                {[
                  'https://images.unsplash.com/photo-1724435811349-32d27f4d5806?w=100&h=100&fit=crop',
                  'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=100&h=100&fit=crop',
                  'https://images.unsplash.com/photo-1633037543479-a70452ea1e12?w=100&h=100&fit=crop',
                  'https://images.unsplash.com/photo-1690444963408-9573a17a8058?w=100&h=100&fit=crop',
                  'https://images.unsplash.com/photo-1610913041987-697d55b11998?w=100&h=100&fit=crop',
                  'https://images.unsplash.com/photo-1614436086835-d18683eb24f8?w=100&h=100&fit=crop'
                ].map((img, i) => (
                  <div 
                    key={i}
                    className="aspect-square rounded-full overflow-hidden border-2"
                    style={{
                      borderColor: i % 3 === 0 ? 'var(--neon-pink)' : i % 3 === 1 ? 'var(--neon-cyan)' : 'var(--neon-purple)',
                    }}
                  >
                    <ImageWithFallback
                      src={img}
                      alt={`Guest ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Entry & Quiz Options */}
            <div className="text-center mt-auto pb-3 space-y-1.5">
              <button
                onClick={() => {
                  // Set mock data for quiz without Spotify
                  setSpotifyData({ isQuizOnly: true });
                  setStep('quiz');
                }}
                className="block w-full text-white/70 hover:text-white text-xs underline transition-colors"
              >
                or take a quick vibe quiz
              </button>
              <button
                onClick={() => setStep('manual')}
                className="block w-full text-white/60 hover:text-white/90 text-[11px] underline transition-colors"
              >
                enter preferences manually
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Manual entry step
  if (step === 'manual') {
    return (
      <div className="h-full bg-background overflow-y-auto">
        <div className="px-4 py-6">
          <Button variant="ghost" onClick={() => setStep('welcome')} className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Tell Us Your Music Taste</h2>
              <p className="text-white/80 mt-2">Add your favorite artists and genres</p>
            </div>

            {/* Favorite Artists */}
            <Card className="glass-effect border-white/20">
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
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="Enter artist name..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    onKeyPress={(e) => e.key === 'Enter' && addArtist()}
                  />
                  <Button 
                    onClick={addArtist}
                    disabled={!newArtist.trim()}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {favoriteArtists.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {favoriteArtists.map((artist, index) => (
                      <Badge 
                        key={index} 
                        className="bg-primary/20 text-white border border-primary/40 px-3 py-1"
                      >
                        {artist}
                        <button
                          onClick={() => removeArtist(artist)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorite Genres */}
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Favorite Genres</CardTitle>
                <CardDescription className="text-white/70">
                  Select genres you enjoy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {genres.map((genre) => (
                    <div
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`
                        p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${selectedGenres.includes(genre)
                          ? 'border-primary bg-primary/20 text-white'
                          : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedGenres.includes(genre) ? 'border-primary bg-primary' : 'border-white/40'
                        }`}>
                          {selectedGenres.includes(genre) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{genre}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={submitManualPreferences}
              disabled={isSubmitting || (favoriteArtists.length === 0 && selectedGenres.length === 0)}
              className="w-full h-12 qrate-gradient text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Preferences
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz step (after Spotify connection or standalone)
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

  // Success screen
  if (step === 'success') {
    return (
      <div className="h-full bg-background flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full space-y-5 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full mx-auto flex items-center justify-center">
            <Check className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold gradient-text">You're All Set!</h2>
            <p className="text-muted-foreground">
              Your music preferences have been added to the mix. The DJ will use your taste to create the perfect vibe!
            </p>
          </div>

          <Card className="glass-effect border-primary/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Coins className="w-8 h-8 text-accent" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-white"> Enjoying the set?</div>
                  <div className="text-sm text-muted-foreground">Send a "thank you" tip to the DJ</div>
                </div>
              </div>
              <p className="text-sm text-white/80">
                Send your Song Requests and DJ Shoutout Requests with your tip.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={() => setStep('tip-jar')}
              className="w-full h-12 qrate-gradient text-white font-semibold bg-[rgb(255,20,122)]"
            >
              <PartyPopper className="w-4 h-4 mr-2" />
              Send a Tip to the DJ
            </Button>

            <Button
              onClick={onBack}
              variant="outline"
              className="w-full h-12 border-white/20 text-white hover:bg-white/10"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tip Jar step
  if (step === 'tip-jar') {
    return <GuestTipJar eventId={event.id} onBack={() => setStep('success')} />;
  }

  return null;
}

export default GuestFlow;
