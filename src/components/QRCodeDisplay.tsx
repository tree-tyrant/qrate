import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { QrCode, Share2, Copy, Check, ArrowLeft, Calendar, Music, MapPin, Headphones } from 'lucide-react';
import { motion } from 'motion/react';
import { utils } from '../utils/api';
import { ImageWithFallback } from './figma/ImageWithFallback';
import logoImage from 'figma:asset/08d0d06dd14cd5a887d78962b507773b63dedad4.png';

interface QRCodeDisplayProps {
  event: any;
  onBack: () => void;
  onEnterDJBooth: () => void;
  onSimulateGuest: () => void;
  onLogoClick: () => void;
}

function QRCodeDisplay({ event, onBack, onEnterDJBooth, onSimulateGuest, onLogoClick }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);
  
  // Generate QR code URL with higher resolution
  const guestUrl = `${window.location.origin}?code=${event.code}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(guestUrl)}`;
  
  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(guestUrl);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = guestUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert(`Copy this URL: ${guestUrl}`);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share && navigator.canShare) {
        await navigator.share({
          title: `Join ${event.eventName || event.name}`,
          text: `Share your music preferences for ${event.eventName || event.name}!`,
          url: guestUrl,
        });
      } else {
        await handleCopyUrl();
      }
    } catch (error) {
      console.error('Share failed:', error);
      await handleCopyUrl();
    }
  };

  const handleQrError = () => {
    setQrError(true);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Synthwave background gradient */}
      <div 
        className="fixed inset-0 z-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 40% 40%, #8b5cf6 0%, transparent 50%),
            radial-gradient(circle at 60% 60%, #06b6d4 0%, transparent 50%),
            radial-gradient(circle at 50% 70%, #ec4899 0%, transparent 50%),
            linear-gradient(45deg, #000000, #1a1a2e, #16213e)
          `
        }}
      />

      {/* Content wrapper - matches PromotionModal size */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* Header with QRate logo and back button */}
        <div className="mb-4 flex items-center justify-between">
          {/* QRate Logo - Clickable */}
          <button
            onClick={onLogoClick}
            className="group transition-all duration-300 hover:scale-105"
          >
            <ImageWithFallback 
              src={logoImage} 
              alt="QRate" 
              className="h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_20px_rgba(255,0,110,0.6)]"
            />
          </button>
          
          <Button 
            onClick={onBack} 
            variant="ghost"
            className="glass-effect border border-border/30 hover:border-primary/50 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Main content - modal-like container */}
        <div className="glass-effect border border-border/50 rounded-lg shadow-2xl max-h-[85vh] overflow-y-auto">
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              
              {/* Left Column - Event Info & QR Code */}
              <div className="space-y-4">
                {/* Event Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center lg:text-left space-y-4"
                >
                  <div>
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white mb-3">
                      Event Code: {event.code}
                    </Badge>
                    <h1 className="gradient-text text-3xl sm:text-4xl lg:text-5xl mb-3">
                      {event.eventName || event.name}
                    </h1>
                  </div>
                  
                  <div className="space-y-1 text-muted-foreground text-sm">
                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                      <Music className="w-3 h-3 text-primary" />
                      <span>{event.eventTheme || event.theme}</span>
                    </div>
                    {event.date && (
                      <div className="flex items-center gap-2 justify-center lg:justify-start">
                        <Calendar className="w-3 h-3 text-accent" />
                        <span>
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                          {event.time && ` at ${utils.time.to12Hour(event.time)}`}
                        </span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2 justify-center lg:justify-start">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* QR Code Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="glass-effect border-primary/30 hover:border-primary/60 transition-all duration-300 overflow-hidden relative group">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <CardHeader className="text-center relative z-10">
                      <CardTitle className="text-white flex items-center justify-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        Guest QR Code
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Guests scan this to share their music preferences
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 relative z-10">
                      {/* QR Code with responsive sizing */}
                      <div className="bg-white p-3 sm:p-4 rounded-xl mx-auto w-fit">
                        {!qrError ? (
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code for event access" 
                            className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 mx-auto"
                            onError={handleQrError}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 mx-auto flex items-center justify-center bg-gray-100 text-gray-600">
                            <div className="text-center space-y-2">
                              <QrCode className="w-10 h-10 mx-auto" />
                              <p className="font-medium text-sm">QR Code</p>
                              <p className="text-xs">Use link below</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Share Link Section */}
                      <div className="space-y-3">
                        <p className="text-sm text-center text-muted-foreground">
                          Or share this link directly:
                        </p>
                        
                        <div className="glass-effect p-3 sm:p-4 rounded-lg border border-border/30">
                          <p className="text-xs sm:text-sm text-foreground/90 break-all font-mono text-center">
                            {guestUrl}
                          </p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            onClick={handleCopyUrl}
                            variant="outline" 
                            className="flex-1 glass-effect border-primary/40 text-white hover:bg-primary/20 hover:border-primary/60 transition-all duration-300"
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            onClick={handleShare}
                            variant="outline" 
                            className="flex-1 glass-effect border-accent/40 text-white hover:bg-accent/20 hover:border-accent/60 transition-all duration-300"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Instructions & Demo */}
              <div className="space-y-4">
                {/* Instructions Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="glass-effect border-accent/30 hover:border-accent/60 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-white">How Guests Use This</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Simple steps for your guests
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            1
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">Scan QR Code</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Use phone camera to scan the code above
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            2
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">Connect Account</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Link Spotify or enter preferences manually
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            3
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">Share Preferences</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Tell us about their music taste
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            4
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">Enjoy the Party!</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              AI creates the perfect playlist for everyone
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Demo Button Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="glass-effect border-green-500/30 hover:border-green-500/60 transition-all duration-300 overflow-hidden relative group">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <CardContent className="p-4 text-center relative z-10">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-white" />
                      </div>
                      
                      <h3 className="text-lg text-white mb-2">Test the Experience</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        See exactly what your guests will experience when they scan the QR code
                      </p>
                      
                      <Button 
                        onClick={onSimulateGuest}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg shadow-green-500/20 transition-all duration-300 hover:shadow-green-500/40 mb-3"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Simulate Guest Experience
                      </Button>

                      <Button 
                        onClick={onEnterDJBooth}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-500/40"
                      >
                        <Headphones className="w-4 h-4 mr-2" />
                        Enter DJ Booth
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Stats Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card className="glass-effect border-border/30">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-3xl gradient-text mb-1">
                            {event.guestCount || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Guests Joined</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl gradient-text mb-1">
                            {event.preferences?.length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Preferences</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRCodeDisplay;