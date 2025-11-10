import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { PartyPopper, Check, Music, MessageSquare, CreditCard, Search, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Tip, TipMessageType } from '../utils/types';
import { utils, apiCall } from '../utils/api';

interface GuestTipJarProps {
  eventId: string;
  onBack: () => void;
}

export default function GuestTipJar({ eventId, onBack }: GuestTipJarProps) {
  const [step, setStep] = useState<'select-amount' | 'success'>('select-amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [messageType, setMessageType] = useState<TipMessageType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [amountError, setAmountError] = useState<string>('');
  const [noSpotifyToken, setNoSpotifyToken] = useState<boolean>(false);
  const [coverFees, setCoverFees] = useState<boolean>(false);

  const presetAmounts = [5, 10, 20];
  const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
  const djReceives = selectedAmount * 0.85;
  const totalCharged = coverFees ? selectedAmount / 0.85 : selectedAmount;

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    if (amount >= 5) {
      setAmountError('');
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 5) {
      setSelectedAmount(parsed);
      setAmountError('');
    } else if (!isNaN(parsed) && parsed < 5) {
      setSelectedAmount(parsed);
      setAmountError('Minimum tip is $5.00');
    }
  };

  // Search Spotify when user types a song request
  useEffect(() => {
    if (messageType === 'REQUEST' && searchQuery.trim().length >= 2) {
      const searchTimeout = setTimeout(async () => {
        setIsSearching(true);
        try {
          // Try to get DJ Spotify token (for demo purposes, allow guest to use DJ token)
          const djToken = localStorage.getItem('dj_spotify_access_token');
          
          if (djToken) {
            setNoSpotifyToken(false);
            const response = await apiCall<{ success: boolean; tracks?: any[] }>('/spotify/search', {
              method: 'POST',
              body: JSON.stringify({
                query: searchQuery.trim(),
                access_token: djToken,
                limit: 5
              })
            });

            if (response.success && response.data?.tracks) {
              setSearchResults(response.data.tracks);
            } else {
              setSearchResults([]);
            }
          } else {
            // No token available, clear results
            setSearchResults([]);
            setNoSpotifyToken(true);
          }
        } catch (error) {
          console.error('Error searching Spotify:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500); // Debounce search

      return () => clearTimeout(searchTimeout);
    } else {
      setSearchResults([]);
      setSelectedTrack(null);
      setNoSpotifyToken(false);
    }
  }, [searchQuery, messageType]);

  // Extract search query from message when REQUEST type is selected
  useEffect(() => {
    if (messageType === 'REQUEST' && message.trim()) {
      // Try to extract song name from message
      const match = message.match(/["']([^"']+)["']|play\s+(.+?)(?:\s+by|$)/i);
      if (match) {
        const extracted = (match[1] || match[2]).trim();
        setSearchQuery(extracted);
      } else {
        // Use the whole message as search query
        setSearchQuery(message.trim());
      }
    } else {
      setSearchQuery('');
      setSelectedTrack(null);
    }
  }, [message, messageType]);

  // Prefill/persist guest name
  useEffect(() => {
    const saved = utils.storage.get('qrate_guest_name');
    if (saved) setGuestName(saved);
  }, []);
  useEffect(() => {
    if (guestName) utils.storage.set('qrate_guest_name', guestName);
  }, [guestName]);

  const handleSendTip = async () => {
    if (selectedAmount < 5) {
      setAmountError('Minimum tip is $5.00');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create tip object
    const tip: Tip = {
      id: `tip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount: selectedAmount,
      guestName: guestName.trim() || 'Anonymous',
      timestamp: new Date().toISOString(),
      message: message.trim() || undefined,
      messageType: message.trim() ? messageType || 'MESSAGE' : undefined,
      dismissed: false,
      addedToQueue: false,
    };

    // Handle song request with Spotify track data
    if (messageType === 'REQUEST' && message.trim()) {
      if (selectedTrack) {
        // Use selected Spotify track data
        tip.trackName = selectedTrack.trackName || selectedTrack.name;
        tip.trackArtist = selectedTrack.artistName || selectedTrack.artists?.[0]?.name || 'Unknown Artist';
        tip.spotifyTrackId = selectedTrack.id || selectedTrack.spotifyTrackId;
        tip.spotifyAlbumArt = selectedTrack.albumArt || selectedTrack.album?.images?.[0]?.url;
        tip.spotifyPreviewUrl = selectedTrack.previewUrl;
        tip.spotifyDurationMs = selectedTrack.durationMs || selectedTrack.duration_ms;
        tip.spotifyAlbumName = selectedTrack.albumName || selectedTrack.album?.name;
        // Mock scores for demo
        tip.crowdScore = Math.floor(Math.random() * 100);
        tip.themeMatch = Math.floor(Math.random() * 100);
      } else {
        // Fallback: parse track info from message
        const match = message.match(/["']([^"']+)["']|play\s+(.+?)(?:\s+by|$)/i);
        if (match) {
          tip.trackName = match[1] || match[2];
          // Try to extract artist if mentioned
          const artistMatch = message.match(/by\s+(.+?)(?:\s|$)/i);
          if (artistMatch) {
            tip.trackArtist = artistMatch[1].trim();
          }
          // Mock scores for demo
          tip.crowdScore = Math.floor(Math.random() * 100);
          tip.themeMatch = Math.floor(Math.random() * 100);
        }
      }
    }

    // Store tip in localStorage
    const stored = utils.storage.get(`qrate_tips_${eventId}`);
    const existingTips = Array.isArray(stored) ? stored : [];
    utils.storage.set(`qrate_tips_${eventId}`, [...existingTips, tip]);

    setIsProcessing(false);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="flex justify-center items-center bg-background p-4 min-h-screen">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6 w-full max-w-md text-center"
        >
          <div className="flex justify-center items-center bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] mx-auto rounded-full w-20 h-20">
            <Check className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-3xl gradient-text">Tip Sent!</h2>
            <p className="text-white/80">
              Thanks for supporting the DJ! We've passed your message along.
            </p>
          </div>

          <Card className="border-[var(--neon-cyan)]/30 glass-effect">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Amount sent:</span>
                <span className="font-bold text-[rgb(255,190,11)] text-2xl">
                  {currency.format(selectedAmount)}
                </span>
              </div>
              <div className="mt-2 text-white/50 text-xs">
                DJ receives: {currency.format(djReceives)} (85%)
              </div>
              {message && (
                <div className="mt-4 text-white/70 text-sm text-left">
                  <div className="font-medium">Your message:</div>
                  <div className="text-white/80">{message}</div>
                </div>
              )}
              {selectedTrack && (
                <div className="mt-2 text-white/70 text-sm text-left">
                  <div className="font-medium">Requested track:</div>
                  <div className="text-white/80">
                    {selectedTrack.trackName} – {selectedTrack.artistName || selectedTrack.artists?.[0]?.name}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={onBack}
            className="w-full h-12 font-semibold text-white qrate-gradient"
          >
            Close
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setStep('select-amount');
              setIsProcessing(false);
              setAmountError('');
              setSelectedTrack(null);
              // keep message/guestName to allow quick repeat, or reset if needed
            }}
            className="hover:bg-white/10 w-full h-10 text-white/80 hover:text-white"
          >
            Send another tip
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 min-h-screen">
      <div className="space-y-6 mx-auto py-8 max-w-md">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="flex justify-center items-center bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-purple)] mx-auto rounded-full w-16 h-16">
            <PartyPopper className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-bold text-3xl gradient-text">Enjoying the music?</h2>
          <p className="text-white/80">
            Send a "thank you" tip to the DJ!
          </p>
          <p className="text-white/50 text-xs">
            This tip goes directly to the DJ to support their work.
          </p>
        </div>

        {/* Amount Selection */}
        <Card className="border-white/20 glass-effect">
          <CardHeader>
            <CardTitle className="text-white">Select Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset Amounts */}
            <div className="gap-3 grid grid-cols-3">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  onClick={() => handleAmountSelect(amount)}
                  disabled={isProcessing}
                  variant={selectedAmount === amount && !customAmount ? 'default' : 'outline'}
                  className={`h-14 text-lg font-semibold ${
                    selectedAmount === amount && !customAmount
                      ? 'qrate-gradient text-white'
                      : 'glass-effect border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="custom-amount" className="text-white/70">
                Or enter custom amount (min. $5.00)
              </Label>
              <Input
                id="custom-amount"
                type="number"
                min="5"
                step="0.01"
                placeholder="Enter amount..."
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                disabled={isProcessing}
                className="border-white/20 h-12 text-white placeholder:text-white/40 glass-effect"
              />
              {amountError && (
                <div className="text-[rgb(255,190,11)]/90 text-xs">{amountError}</div>
              )}
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <input
                  type="checkbox"
                  checked={coverFees}
                  onChange={(e) => setCoverFees(e.target.checked)}
                  disabled={isProcessing}
                />
                <span>Cover fees so DJ receives {currency.format(selectedAmount)}</span>
                <span className="ml-auto text-white/50">
                  You pay {currency.format(totalCharged)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Type Selection */}
        <Card className="border-white/20 glass-effect">
          <CardHeader>
            <CardTitle className="text-white text-sm">Message Type (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={messageType === 'REQUEST' ? 'default' : 'outline'}
                onClick={() => setMessageType(messageType === 'REQUEST' ? null : 'REQUEST')}
                disabled={isProcessing}
                className={`flex-1 ${
                  messageType === 'REQUEST'
                    ? 'bg-[var(--neon-cyan)]/30 border-[var(--neon-cyan)] text-[var(--neon-cyan)]'
                    : 'glass-effect border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <Music className="mr-2 w-4 h-4" />
                Song Request
              </Button>
              <Button
                size="sm"
                variant={messageType === 'SHOUTOUT' ? 'default' : 'outline'}
                onClick={() => setMessageType(messageType === 'SHOUTOUT' ? null : 'SHOUTOUT')}
                disabled={isProcessing}
                className={`flex-1 ${
                  messageType === 'SHOUTOUT'
                    ? 'bg-[var(--neon-purple)]/30 border-[var(--neon-purple)] text-[var(--neon-purple)]'
                    : 'glass-effect border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <MessageSquare className="mr-2 w-4 h-4" />
                Shoutout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card className="border-white/20 glass-effect">
          <CardHeader>
            <CardTitle className="text-white text-sm">Add Message (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder={messageType === 'REQUEST' ? 'Enter song name (e.g., "Espresso by Sabrina Carpenter") or type to search...' : 'Add a message, shoutout, or request...'}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isProcessing}
              className="border-white/20 min-h-[100px] text-white placeholder:text-white/40 glass-effect"
            />
            {/* Selected track chip */}
            {selectedTrack && (
              <div className="flex items-center gap-2 bg-white/5 px-2 py-1 border border-white/10 rounded text-xs">
                {selectedTrack.albumArt && (
                  <img src={selectedTrack.albumArt} alt="album" className="rounded w-5 h-5" />
                )}
                <span className="truncate">
                  {selectedTrack.trackName} – {selectedTrack.artistName || selectedTrack.artists?.[0]?.name}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6"
                  onClick={() => setSelectedTrack(null)}
                  disabled={isProcessing}
                >
                  ×
                </Button>
              </div>
            )}
            
            {/* Spotify Search Results for Song Requests */}
            {messageType === 'REQUEST' && (isSearching || searchResults.length > 0 || (searchQuery && !selectedTrack)) && (
              <div className="space-y-2">
                {isSearching && (
                  <div aria-live="polite" className="flex items-center gap-2 text-white/60 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching Spotify...
                  </div>
                )}
                {!isSearching && noSpotifyToken && (
                  <div className="text-white/50 text-xs">
                    Spotify search is unavailable right now, but you can still send your request.
                  </div>
                )}
                {!isSearching && searchResults.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {searchResults.map((track) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setSelectedTrack(track);
                        }}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          selectedTrack?.id === track.id
                            ? 'bg-[var(--neon-cyan)]/20 border border-[var(--neon-cyan)]/50'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {track.albumArt && (
                            <img 
                              src={track.albumArt} 
                              alt={track.trackName}
                              className="rounded w-10 h-10 object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-sm truncate">
                              {track.trackName}
                            </div>
                            <div className="text-white/60 text-xs truncate">
                              {track.artistName || track.artists?.[0]?.name || 'Unknown Artist'}
                            </div>
                          </div>
                          {selectedTrack?.id === track.id && (
                            <Check className="w-4 h-4 text-[var(--neon-cyan)]" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                {!isSearching && searchQuery && searchResults.length === 0 && (
                  <div className="py-2 text-white/50 text-xs text-center">
                    No results found. You can still send the request and the DJ will see it.
                  </div>
                )}
              </div>
            )}
            
            {/* Guest Name */}
            <div className="space-y-2">
              <Label htmlFor="guest-name" className="text-white/70 text-xs">
                Your Name (optional)
              </Label>
              <Input
                id="guest-name"
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                disabled={isProcessing}
                className="border-white/20 h-10 text-white placeholder:text-white/40 glass-effect"
              />
              <p className="text-white/50 text-xs">
                No name entered will show as "Anonymous"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="px-4 text-white/50 text-xs text-center">
          *This is a tip, not a purchase. Any requests are not guaranteed. 15% processing fee is applied.
        </p>

        {/* Submit Button */}
        <Button
          onClick={handleSendTip}
          disabled={isProcessing || selectedAmount < 5}
          className="w-full h-14 font-semibold text-white text-lg qrate-gradient"
        >
          {isProcessing ? (
            'Processing...'
          ) : (
            <>
              <CreditCard className="mr-2 w-5 h-5" />
              Send {currency.format(selectedAmount)} Tip
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={onBack}
          className="hover:bg-white/10 w-full text-white/70 hover:text-white"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
