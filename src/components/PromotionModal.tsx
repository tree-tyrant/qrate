import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Download, Copy, Check, Share2, Instagram, Facebook, Twitter, QrCode } from 'lucide-react';
import { motion } from 'motion/react';

interface Event {
  id: string;
  eventName?: string;
  name?: string;
  eventTheme?: string;
  theme?: string;
  code: string;
  date: string;
  time: string;
  location?: string;
}

interface PromotionModalProps {
  open: boolean;
  onClose: () => void;
  event: Event | null;
}

export default function PromotionModal({ open, onClose, event }: PromotionModalProps) {
  const [copied, setCopied] = useState(false);
  const [flyerGenerated, setFlyerGenerated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const eventName = event?.eventName || event?.name || 'Event';
  const eventTheme = event?.eventTheme || event?.theme || '';
  const eventUrl = event ? `${window.location.origin}?code=${event.code}` : '';

  // Generate QR code flyer on canvas - Optimized for faster rendering
  useEffect(() => {
    if (!event || !canvasRef.current) return;
    
    // Reset flyer generated state when event changes
    setFlyerGenerated(false);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (600x900px - optimized smaller size for faster rendering)
    canvas.width = 600;
    canvas.height = 900;

    // Draw QRate-branded flyer
    const drawFlyer = async () => {
      // Background gradient (simplified)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a0f');
      gradient.addColorStop(0.5, '#1a0a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Simplified border (no glow for faster rendering)
      ctx.strokeStyle = '#ff006e';
      ctx.lineWidth = 6;
      ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

      // QRate logo/title at top
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QRate', canvas.width / 2, 90);
      
      ctx.font = '20px Arial';
      ctx.fillStyle = '#00d9ff';
      ctx.fillText('AI-Powered Event Playlists', canvas.width / 2, 120);

      // Event name
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#ffffff';
      const maxWidth = canvas.width - 80;
      const eventNameText = eventName.length > 25 ? eventName.substring(0, 25) + '...' : eventName;
      ctx.fillText(eventNameText, canvas.width / 2, 195);

      // Event theme
      if (eventTheme) {
        ctx.font = '24px Arial';
        ctx.fillStyle = '#8338ec';
        ctx.fillText(eventTheme, canvas.width / 2, 230);
      }

      // Event details
      if (event.date && event.time) {
        const dateObj = new Date(event.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#e8e8ff';
        ctx.fillText(formattedDate, canvas.width / 2, 275);
        ctx.fillText(`at ${event.time}`, canvas.width / 2, 305);
      }

      if (event.location) {
        ctx.font = '18px Arial';
        ctx.fillStyle = '#8892b0';
        const locationText = event.location.length > 35 ? event.location.substring(0, 35) + '...' : event.location;
        ctx.fillText(locationText, canvas.width / 2, 335);
      }

      // QR Code placeholder box (centered, smaller for faster loading)
      const qrSize = 280;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 370;

      // Draw QR code background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);

      // Load and draw QR code (smaller size for faster loading)
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(eventUrl)}`;
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      qrImage.onload = () => {
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        
        // Instructions below QR code
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('Scan to Share Your Music Taste', canvas.width / 2, qrY + qrSize + 45);
        
        ctx.font = '18px Arial';
        ctx.fillStyle = '#00d9ff';
        ctx.fillText('Help us create the perfect playlist!', canvas.width / 2, qrY + qrSize + 70);

        // Event code at bottom
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#ff006e';
        ctx.fillText(`Event Code: ${event.code}`, canvas.width / 2, canvas.height - 60);

        // QRate tagline
        ctx.font = '16px Arial';
        ctx.fillStyle = '#8892b0';
        ctx.fillText('Powered by QRate - The Future of Event Music', canvas.width / 2, canvas.height - 30);

        setFlyerGenerated(true);
      };
      qrImage.onerror = () => {
        // Fallback: draw placeholder text if QR code fails to load
        console.log('QR code image failed to load, using fallback');
        ctx.fillStyle = '#ff006e';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', canvas.width / 2, qrY + qrSize / 2);
        setFlyerGenerated(true);
      };
      qrImage.src = qrCodeUrl;
    };

    drawFlyer();
  }, [event, eventName, eventTheme, eventUrl, flyerGenerated]);

  const handleDownloadFlyer = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QRate-${event?.code || 'Event'}-Flyer.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Social media post templates
  const socialMediaTemplates = {
    instagram: `🎵 You're invited to ${eventName}! 🎉\n\n🎨 Theme: ${eventTheme}\n📅 ${event ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''}\n\n🎧 Help us create the perfect playlist by sharing your music preferences!\n\n👉 Scan the QR code or use code: ${event?.code}\n\n#QRate #EventPlaylist #AIMusic #PartyVibes #${eventTheme.replace(/\s+/g, '')}`,
    
    facebook: `🎉 Join us for ${eventName}! 🎵\n\nWe're using QRate's AI-powered playlist system to create the perfect soundtrack for our event. Share your music preferences and help us curate an amazing experience!\n\n📍 ${event?.location || 'Location TBA'}\n📅 ${event ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''} at ${event?.time || ''}\n🎨 Theme: ${eventTheme}\n\nScan the QR code in the flyer or visit:\n${eventUrl}\n\nEvent Code: ${event?.code}`,
    
    twitter: `🎵 Coming to ${eventName}? Help create the perfect playlist! 🎧\n\n✨ ${eventTheme} vibes\n📅 ${event ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}\n\nShare your music taste:\n${eventUrl}\n\nCode: ${event?.code}\n\n#QRate #AI #EventMusic`
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-effect border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Event Promotion Toolkit</DialogTitle>
          <DialogDescription>
            Share your event and get more guests to contribute their music preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="qrcode" className="w-full">
          <TabsList className="grid w-full grid-cols-4 glass-effect">
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="flyer">Flyer</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          <TabsContent value="qrcode" className="space-y-4">
            <Card className="glass-effect border-border/50">
              <CardHeader>
                <CardTitle className="text-accent flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Event QR Code
                </CardTitle>
                <CardDescription>
                  Share this QR code for guests to join {eventName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code Display */}
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(eventUrl)}`}
                      alt="Event QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                  
                  {/* Event Code Display */}
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Event Code</p>
                    <div className="glass-effect px-6 py-3 rounded-lg border border-primary/30">
                      <p className="text-3xl font-bold gradient-text tracking-wider">{event?.code}</p>
                    </div>
                  </div>

                  {/* Event URL */}
                  <div className="w-full space-y-2">
                    <Label className="text-sm text-muted-foreground">Share Link</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={eventUrl}
                        className="glass-effect border-border/50 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(eventUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="glass-effect border-accent/40 hover:bg-accent/20"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="glass-effect p-4 rounded-lg border border-border/30">
                  <p className="text-sm text-muted-foreground">
                    💡 <span className="font-semibold">How to use:</span>
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Display QR code at your event entrance</li>
                    <li>Guests scan to instantly share their music preferences</li>
                    <li>Or share the event code: <span className="font-mono font-semibold text-primary">{event?.code}</span></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flyer" className="space-y-4">
            <Card className="glass-effect border-border/50">
              <CardHeader>
                <CardTitle className="text-accent">Downloadable Event Flyer</CardTitle>
                <CardDescription>
                  A ready-to-share QRate-branded flyer with your event's QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Canvas preview */}
                <div className="flex justify-center">
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      className="border border-border/50 rounded-lg shadow-lg max-w-full h-auto"
                      style={{ maxHeight: '600px', width: 'auto' }}
                    />
                    {!flyerGenerated && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                        <div className="text-center">
                          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Generating flyer...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download button */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadFlyer}
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    disabled={!flyerGenerated}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Flyer (PNG)
                  </Button>
                </div>

                <div className="glass-effect p-4 rounded-lg border border-border/30">
                  <p className="text-sm text-muted-foreground">
                    💡 <span className="font-semibold">Pro tips:</span>
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Print and place on tables at your venue</li>
                    <li>Post on social media to build hype</li>
                    <li>Send to guests via email or messaging apps</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <Card className="glass-effect border-border/50">
              <CardHeader>
                <CardTitle className="text-accent">Social Media Templates</CardTitle>
                <CardDescription>
                  Ready-to-use posts for Instagram, Facebook, and Twitter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instagram */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-effect p-4 rounded-lg border border-pink-500/30"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold">Instagram Post</h4>
                  </div>
                  <div className="bg-background/50 p-3 rounded border border-border/30 mb-3">
                    <p className="text-sm whitespace-pre-wrap">{socialMediaTemplates.instagram}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyText(socialMediaTemplates.instagram)}
                    className="w-full border-pink-500/40 hover:bg-pink-500/20"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </Button>
                </motion.div>

                {/* Facebook */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-effect p-4 rounded-lg border border-blue-500/30"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold">Facebook Post</h4>
                  </div>
                  <div className="bg-background/50 p-3 rounded border border-border/30 mb-3">
                    <p className="text-sm whitespace-pre-wrap">{socialMediaTemplates.facebook}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyText(socialMediaTemplates.facebook)}
                    className="w-full border-blue-500/40 hover:bg-blue-500/20"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </Button>
                </motion.div>

                {/* Twitter/X */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-effect p-4 rounded-lg border border-cyan-500/30"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                      <Twitter className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold">Twitter/X Post</h4>
                  </div>
                  <div className="bg-background/50 p-3 rounded border border-border/30 mb-3">
                    <p className="text-sm whitespace-pre-wrap">{socialMediaTemplates.twitter}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyText(socialMediaTemplates.twitter)}
                    className="w-full border-cyan-500/40 hover:bg-cyan-500/20"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </Button>
                </motion.div>

                <div className="glass-effect p-4 rounded-lg border border-border/30">
                  <p className="text-sm text-muted-foreground">
                    💡 <span className="font-semibold">Engagement tips:</span>
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Post the flyer image along with the text</li>
                    <li>Tag your venue and featured artists</li>
                    <li>Use relevant hashtags for your music genre</li>
                    <li>Share guest testimonials and playlist previews</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <Card className="glass-effect border-border/50">
              <CardHeader>
                <CardTitle className="text-accent">Event Success Checklist</CardTitle>
                <CardDescription>
                  Essential steps to make your event a hit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 glass-effect p-3 rounded-lg border border-green-500/30">
                    <div className="mt-1 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Share QR Code Early</div>
                      <p className="text-sm text-muted-foreground">Display QR codes at your venue entrance and on tables for easy guest access. The more preferences you collect, the better the playlist!</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 glass-effect p-3 rounded-lg border border-cyan-500/30">
                    <div className="mt-1 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Promote on Social Media</div>
                      <p className="text-sm text-muted-foreground">Share your event flyer and link on Instagram, Facebook, and Twitter. Use the templates in the Social tab to save time!</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 glass-effect p-3 rounded-lg border border-purple-500/30">
                    <div className="mt-1 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Connect Spotify Playlist</div>
                      <p className="text-sm text-muted-foreground">Link your Spotify playlist before the event to enable seamless music integration in the DJ Booth.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 glass-effect p-3 rounded-lg border border-yellow-500/30">
                    <div className="mt-1 w-6 h-6 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Test the DJ Booth</div>
                      <p className="text-sm text-muted-foreground">Familiarize yourself with the AI recommendations and queue management before your event starts.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 glass-effect p-3 rounded-lg border border-pink-500/30">
                    <div className="mt-1 w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Engage Your Guests</div>
                      <p className="text-sm text-muted-foreground">Remind guests to check in throughout the event. More preferences = better recommendations!</p>
                    </div>
                  </div>
                </div>

                <div className="glass-effect p-4 rounded-lg border border-border/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                  <p className="text-sm text-muted-foreground">
                    🎯 <span className="font-semibold text-white">Pro Tip:</span> Events with 10+ guest preferences see 3x better engagement and crowd satisfaction!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
