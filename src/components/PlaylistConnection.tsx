import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Music, Users, Clock, ArrowLeft, Check, Loader2, AlertCircle, Apple } from 'lucide-react';
import { spotifyApi, utils } from '../utils/api';
import { STORAGE_KEYS, SPOTIFY_OAUTH_VERSION } from '../utils/constants';

interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  duration: string;
  image?: string;
  tracks: Track[];
  owner?: string;
  description?: string;
  public?: boolean;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  source: 'spotify' | 'apple';
  preview_url?: string;
}

interface PlaylistConnectionProps {
  onPlaylistSelected: (playlist: Playlist) => void;
  onBack: () => void;
  isLoading?: boolean;
}

function PlaylistConnection({ onPlaylistSelected, onBack, isLoading: parentLoading = false }: PlaylistConnectionProps) {
  const [step, setStep] = useState<'choose-service' | 'spotify-auth' | 'apple-auth' | 'select-playlist'>('choose-service');
  const [service, setService] = useState<'spotify' | 'apple' | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  // Check for existing Spotify token on load
  useEffect(() => {
    const accessToken = utils.storage.get('spotify_access_token');
    const expiresAt = utils.storage.get('spotify_expires_at');
    
    if (accessToken && expiresAt && Date.now() < expiresAt) {
      setSpotifyConnected(true);
    }
  }, []);

  const handleSpotifyCallback = async (code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Exchange code for access token via backend
      const response = await spotifyApi.exchangeDJCode(code);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to exchange code for token');
      }

      const { access_token, refresh_token, expires_in } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received from backend');
      }

      console.log('✅ Successfully exchanged code for Spotify access token');
      
      // Store tokens
      utils.storage.set('spotify_access_token', access_token);
      if (refresh_token) {
        utils.storage.set('spotify_refresh_token', refresh_token);
      }
      if (expires_in) {
        const expiresAt = Date.now() + (parseInt(expires_in) * 1000);
        utils.storage.set('spotify_expires_at', expiresAt);
      }
      
      // Update OAuth version to match current scopes
      utils.storage.set(STORAGE_KEYS.SPOTIFY_OAUTH_VERSION, SPOTIFY_OAUTH_VERSION);
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Mark as connected and fetch playlists
      setSpotifyConnected(true);
      await fetchSpotifyPlaylists();
      
    } catch (error: any) {
      console.error('❌ Error exchanging Spotify code:', error);
      setError(error.message || 'Failed to complete Spotify authentication. Please try again.');
      setLoading(false);
      // Clean URL even on error
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Handle Spotify OAuth callback when redirected back from Spotify
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    // If we have an error from Spotify, show it
    if (error) {
      console.error('❌ Spotify OAuth error:', error);
      setError(`Spotify authentication failed: ${error}`);
      setLoading(false);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    // If we have a code, exchange it for tokens
    if (code) {
      console.log('🎵 Spotify OAuth callback received, exchanging code for tokens...');
      handleSpotifyCallback(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectToSpotify = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Connecting to Spotify for DJ playlist access...');
      // Use DJ-specific auth endpoint
      const response = await spotifyApi.getDJAuthUrl();
      
      if (response.success && response.data?.auth_url) {
        console.log('✅ Redirecting to Spotify auth...');
        window.location.href = response.data.auth_url;
      } else {
        console.error('❌ Failed to get Spotify auth URL:', response.error);
        setError('Failed to connect to Spotify. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error connecting to Spotify:', error);
      setError('Failed to connect to Spotify. Please try again.');
      setLoading(false);
    }
  };

  const fetchSpotifyPlaylists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const accessToken = utils.storage.get('spotify_access_token');
      if (!accessToken) {
        setError('No Spotify access token found');
        return;
      }

      console.log('🔍 Fetching Spotify playlists...');
      
      // Get user's playlists
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }

      const data = await response.json();
      console.log('✅ Fetched Spotify playlists:', data);

      // Transform playlists to our format
      const transformedPlaylists: Playlist[] = await Promise.all(
        data.items.map(async (playlist: any) => {
          // Get playlist tracks
          const tracksResponse = await fetch(playlist.tracks.href, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          const tracksData = tracksResponse.ok ? await tracksResponse.json() : { items: [] };
          
          const tracks: Track[] = tracksData.items
            .filter((item: any) => item.track && item.track.id)
            .map((item: any) => ({
              id: item.track.id,
              title: item.track.name,
              artist: item.track.artists.map((a: any) => a.name).join(', '),
              album: item.track.album.name,
              duration: formatDuration(item.track.duration_ms),
              source: 'spotify' as const,
              preview_url: item.track.preview_url
            }));

          return {
            id: playlist.id,
            name: playlist.name,
            trackCount: playlist.tracks.total,
            duration: calculateTotalDuration(tracksData.items),
            image: playlist.images?.[0]?.url,
            tracks: tracks,
            owner: playlist.owner.display_name,
            description: playlist.description,
            public: playlist.public
          };
        })
      );

      setPlaylists(transformedPlaylists);
      setStep('select-playlist');
      
    } catch (error) {
      console.error('❌ Error fetching Spotify playlists:', error);
      setError('Failed to fetch playlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const connectToApple = () => {
    setError('Apple Music integration is coming soon! Please use Spotify for now.');
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateTotalDuration = (items: any[]): string => {
    const totalMs = items.reduce((sum, item) => {
      return sum + (item.track?.duration_ms || 0);
    }, 0);
    
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleServiceSelect = (selectedService: 'spotify' | 'apple') => {
    setService(selectedService);
    
    if (selectedService === 'spotify') {
      if (spotifyConnected) {
        fetchSpotifyPlaylists();
      } else {
        setStep('spotify-auth');
      }
    } else {
      setStep('apple-auth');
    }
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    onPlaylistSelected(playlist);
  };

  // Choose service step
  if (step === 'choose-service') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Button variant="ghost" onClick={onBack} className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Music className="w-16 h-16 text-cyan-400 mx-auto" />
              <h2 className="text-2xl font-bold">Connect Your Music</h2>
              <p className="text-white/80">Import playlists from your music streaming service</p>
            </div>

            <div className="space-y-4">
              {/* Spotify Option */}
              <Card 
                className={`cursor-pointer transition-colors ${
                  spotifyConnected 
                    ? 'bg-[#1DB954] border-[#1DB954] text-white hover:bg-[#1ed760]' 
                    : 'bg-[#1DB954] border-[#1DB954] text-white hover:bg-[#1ed760]'
                }`}
                onClick={() => handleServiceSelect('spotify')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Music className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Spotify</h3>
                      <p className="text-white/80 text-sm">
                        {spotifyConnected ? 'Connected - Access your playlists' : 'Connect your Spotify account'}
                      </p>
                      {spotifyConnected && (
                        <Badge className="bg-green-500/20 text-green-300 border-green-400/30 mt-1">
                          Connected
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl">🎵</div>
                  </div>
                </CardContent>
              </Card>

              {/* Apple Music Option */}
              <Card 
                className="cursor-pointer bg-black border-gray-700 text-white hover:bg-gray-900 transition-colors opacity-60"
                onClick={() => handleServiceSelect('apple')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Apple className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Apple Music</h3>
                      <p className="text-white/80 text-sm">Connect your Apple Music library</p>
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30 mt-1">
                        Coming Soon
                      </Badge>
                    </div>
                    <div className="text-2xl">🍎</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Spotify auth step
  if (step === 'spotify-auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Button variant="ghost" onClick={() => setStep('choose-service')} className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#1DB954] rounded-full mx-auto flex items-center justify-center">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Connect Spotify</h2>
                <p className="text-white/80 mt-2">
                  Connect your Spotify account to import your playlists
                </p>
              </div>
            </div>

            {error && (
              <Card className="bg-red-500/20 border-red-400/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="glass-effect border-white/20">
              <CardContent className="p-6 text-center space-y-4">
                <Music className="w-12 h-12 text-[#1DB954] mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Access Your Playlists</h3>
                  <p className="text-white/80 text-sm mt-2">
                    We'll securely connect to your Spotify account to import your playlists
                  </p>
                </div>
                <div className="space-y-2 text-xs text-white/70">
                  <p>✓ Read your playlists</p>
                  <p>✓ View track information</p>
                  <p>✓ No access to personal data</p>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={connectToSpotify}
              disabled={loading}
              className="w-full h-12 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect Spotify
                  <Music className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Apple auth step (placeholder)
  if (step === 'apple-auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Button variant="ghost" onClick={() => setStep('choose-service')} className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-black rounded-full mx-auto flex items-center justify-center">
                <Apple className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Apple Music</h2>
                <p className="text-white/80 mt-2">
                  Apple Music integration is coming soon!
                </p>
              </div>
            </div>

            <Card className="glass-effect border-white/20">
              <CardContent className="p-6 text-center space-y-4">
                <Apple className="w-12 h-12 text-white mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Coming Soon</h3>
                  <p className="text-white/80 text-sm mt-2">
                    We're working on Apple Music integration. For now, please use Spotify to import your playlists.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={connectToApple}
              disabled={true}
              className="w-full h-12 bg-gray-600 text-white font-semibold cursor-not-allowed"
            >
              Apple Music (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Select playlist step
  if (step === 'select-playlist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Button variant="ghost" onClick={() => setStep('choose-service')} className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Select Playlist</h2>
              <p className="text-white/80">Choose a playlist to import for your DJ set</p>
            </div>

            {loading && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-white/80">Loading playlists...</p>
              </div>
            )}

            {error && (
              <Card className="bg-red-500/20 border-red-400/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {playlists.map((playlist) => (
                <Card 
                  key={playlist.id}
                  className="glass-effect border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handlePlaylistSelect(playlist)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {playlist.image ? (
                        <img 
                          src={playlist.image} 
                          alt={playlist.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-white/70 mt-1">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{playlist.trackCount} tracks</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{playlist.duration}</span>
                          </div>
                        </div>
                        {playlist.owner && (
                          <p className="text-xs text-white/60 mt-1">by {playlist.owner}</p>
                        )}
                      </div>
                      <Check className="w-5 h-5 text-cyan-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {playlists.length === 0 && !loading && !error && (
              <Card className="glass-effect border-white/20">
                <CardContent className="p-6 text-center">
                  <Music className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Playlists Found</h3>
                  <p className="text-white/70 text-sm">
                    Create some playlists in Spotify first, then try again.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default PlaylistConnection;