import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ArrowLeft, Upload, X, Filter, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { VibeGateConfigurator } from './VibeGateConfigurator';
import { PTSVisualization } from './PTSVisualization';
import { VibeProfile } from '../utils/types';

interface EventCreationProps {
  onEventCreated: (event: { 
    name: string; 
    theme: string; 
    description: string; 
    date: string; 
    time: string; 
    endTime?: string;
    location?: string;
    vibes?: string[];
    genre?: string;
    imageUrl?: string;
    vibeProfile?: VibeProfile;
  }) => void;
  onBack: () => void;
  isLoading?: boolean;
}

function EventCreation({ onEventCreated, onBack, isLoading }: EventCreationProps) {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [vibeProfile, setVibeProfile] = useState<VibeProfile | undefined>();
  const [algorithmDialogOpen, setAlgorithmDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('details');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default date and time
  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    setEventDate(today);
    setEventTime(currentTime);
    
    // Set default end time to 4 hours later
    const endDate = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const endTime = endDate.toTimeString().slice(0, 5);
    setEventEndTime(endTime);
  }, []);

  const handleCreateEvent = () => {
    if (!eventName.trim() || selectedVibes.length === 0 || !eventDate || !eventTime) return;
    
    const eventData = {
      name: eventName.trim(),
      theme: selectedVibes[0],
      description: `${selectedVibes.join(', ')} event`,
      date: eventDate,
      time: eventTime,
      endTime: eventEndTime || undefined,
      location: eventLocation.trim() || undefined,
      vibes: selectedVibes,
      genre: selectedGenre || undefined,
      imageUrl: uploadedImage || selectedImage || undefined,
      vibeProfile: vibeProfile
    };

    onEventCreated(eventData);
  };

  const vibeThemes = [
    { value: 'chill', label: 'Chill', color: 'from-green-500 to-teal-500' },
    { value: 'rave', label: 'Rave', color: 'from-purple-500 to-pink-600' },
    { value: 'energetic', label: 'Energetic', color: 'from-orange-500 to-red-500' },
    { value: 'romantic', label: 'Romantic', color: 'from-pink-400 to-rose-500' },
    { value: 'groovy', label: 'Groovy', color: 'from-yellow-500 to-orange-500' },
    { value: 'euphoric', label: 'Euphoric', color: 'from-cyan-500 to-blue-600' },
    { value: 'intimate', label: 'Intimate', color: 'from-purple-400 to-pink-400' },
    { value: 'upbeat', label: 'Upbeat', color: 'from-blue-500 to-cyan-500' },
    { value: 'mellow', label: 'Mellow', color: 'from-indigo-400 to-purple-400' },
    { value: 'wild', label: 'Wild', color: 'from-red-500 to-pink-600' },
    { value: 'classy', label: 'Classy', color: 'from-amber-600 to-yellow-600' },
    { value: 'retro', label: 'Retro', color: 'from-pink-500 to-purple-600' }
  ];

  const genres = [
    'Pop', 'Hip Hop', 'EDM', 'House', 'Techno', 'R&B', 'Rock', 
    'Indie', 'Latin', 'Reggaeton', 'Afrobeats', 'Country', 
    'Jazz', 'Soul', 'Funk', 'Disco', 'Dubstep', 'Trap', 'Mixed'
  ];

  const stockImages = [
    'https://images.unsplash.com/photo-1504704911898-68304a7d2807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZW9uJTIwcGFydHl8ZW58MXx8fHwxNzYwMTY1NDgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1625612446042-afd3fe024131?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWIlMjBwYXJ0eSUyMGxpZ2h0c3xlbnwxfHx8fDE3NjA0NjMyNjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1656283384093-1e227e621fad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGNvbmNlcnQlMjBjcm93ZHxlbnwxfHx8fDE3NjA0ODY4MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1760135434461-dc7073aa7139?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaiUyMGJvb3RoJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2MDUzNTY2M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1688725890186-4a0441ecde4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb29mdG9wJTIwcGFydHklMjBzdW5zZXR8ZW58MXx8fHwxNzYwNTE4MDA1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1689793354800-de168c0a4c9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZXN0aXZhbCUyMHN0YWdlJTIwbGlnaHRzfGVufDF8fHx8MTc2MDUyMzE4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1650584997985-e713a869ee77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMGNlbGVicmF0aW9uJTIwcGFydHl8ZW58MXx8fHwxNzYwNTAyNDgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1708569176813-746f00614012?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwZGFuY2UlMjBmbG9vcnxlbnwxfHx8fDE3NjA0NzEwMTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1562866470-3774249bef10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb29sJTIwcGFydHklMjBzdW1tZXJ8ZW58MXx8fHwxNzYwNTM1NjY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1581862206629-27d35e2640b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHBhcnR5JTIwYm9uZmlyZXxlbnwxfHx8fDE3NjA1MzU2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1702873036982-fd89e3d20121?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbHViJTIwZGlzY28lMjBiYWxsfGVufDF8fHx8MTc2MDUzNTY2Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1655238865814-1e57e8dff451?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMHBhcnR5JTIwZnJpZW5kc3xlbnwxfHx8fDE3NjA1MzU2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1731998423336-2218c0403603?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwc3RhZ2UlMjBzaG93fGVufDF8fHx8MTc2MDUzNTY2Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1570872626485-d8ffea69f463?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbHViJTIwbGlnaHRzfGVufDF8fHx8MTc2MDE2NTQ4M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1544785316-6e58aed68a50?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaiUyMGNvbmNlcnR8ZW58MXx8fHwxNzYwMTY1NDg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1574155376612-bfa4ed8aabfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdodGNsdWJ8ZW58MXx8fHwxNzYwMTY1NDg0fDA&ixlib=rb-4.1.0&q=80&w=1080'
  ];

  const toggleVibe = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter(v => v !== vibe));
    } else {
      setSelectedVibes([...selectedVibes, vibe]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setSelectedImage('');
      };
      reader.readAsDataURL(file);
    }
  };

  const currentImage = uploadedImage || selectedImage;

  return (
    <div className="min-h-screen bg-background py-4">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-3">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="glass-effect border border-border/30 hover:border-primary/50"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setAlgorithmDialogOpen(true)}
            className="glass-effect border-accent/40 hover:border-accent/60 hover:bg-accent/10 text-accent"
            size="sm"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Algorithm
          </Button>
        </div>

        <Tabs defaultValue="details" className="space-y-3" value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-2xl mx-auto glass-effect">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="vibe">Vibe & Gate</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3">
            {/* Event Details Card */}
            <Card className="glass-effect border-cyan-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-cyan-400 text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex flex-col h-full">
              {/* Event Name */}
              <div className="space-y-1">
                <Label htmlFor="event-name" className="text-muted-foreground text-xs">Event Name</Label>
                <Input
                  id="event-name"
                  placeholder="Enter event name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="bg-input-background border-border/50 focus:border-cyan-500/50 h-8 text-sm"
                />
              </div>

              {/* Date and Location Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="event-date" className="text-muted-foreground text-xs">Date</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-input-background border-border/50 focus:border-cyan-500/50 h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="location" className="text-muted-foreground text-xs">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="Venue"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="bg-input-background border-border/50 focus:border-cyan-500/50 h-8 text-sm"
                  />
                </div>
              </div>

              {/* Start Time and End Time Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="event-time" className="text-muted-foreground text-xs">Start Time</Label>
                  <Input
                    id="event-time"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="bg-input-background border-border/50 focus:border-cyan-500/50 h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end-time" className="text-muted-foreground text-xs">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="bg-input-background border-border/50 focus:border-cyan-500/50 h-8 text-sm"
                  />
                </div>
              </div>

              {/* Genre removed - now handled in Vibe Gate */}

              {/* Set the Vibe Button - at bottom */}
              <div className="pt-2 mt-auto">
                {/* Help Text */}
                <div className="text-center text-xs text-muted-foreground mb-3 pb-2 border-b border-border/30">
                  Configure your event vibe and filters to proceed
                </div>
                
                <Button 
                  onClick={() => setCurrentTab('vibe')}
                  disabled={!eventName.trim() || !eventDate || !eventTime}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/20 h-9 text-sm transition-transform hover:scale-105 active:scale-95"
                >
                  Set the Vibe →
                </Button>
              </div>
            </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vibe" className="space-y-3">
            {/* Vibe & Style Card */}
            <Card className="glass-effect border-purple-500/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-purple-400">Vibe & Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Image Selection */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Event Poster (Optional)</Label>
                
                <div className="grid grid-cols-5 gap-1.5">
                  {stockImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImage(img);
                        setUploadedImage('');
                      }}
                      className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                        (selectedImage === img && !uploadedImage)
                          ? 'border-cyan-500/80 ring-2 ring-cyan-500/30' 
                          : 'border-border/30 hover:border-cyan-500/50'
                      }`}
                    >
                      <ImageWithFallback
                        src={img}
                        alt={`Party ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                  
                  {/* Upload Button as Tile */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      uploadedImage
                        ? 'border-purple-500/80 ring-2 ring-purple-500/30 bg-purple-500/10' 
                        : 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 hover:bg-purple-500/10'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span className="text-[0.6rem] text-purple-400">Upload</span>
                  </button>
                </div>

                {/* Show uploaded image preview */}
                {uploadedImage && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-purple-500/50">
                    <ImageWithFallback
                      src={uploadedImage}
                      alt="Uploaded poster"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setUploadedImage('')}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-all"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Save Event Button */}
              <div className="pt-2">
                <Button 
                  onClick={handleCreateEvent}
                  disabled={!eventName.trim() || selectedVibes.length === 0 || !eventDate || !eventTime || isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/20 h-9 text-sm transition-transform hover:scale-105 active:scale-95"
                >
                  {isLoading ? 'Creating...' : 'Save Event'}
                </Button>
              </div>
            </CardContent>
            </Card>

            {/* Vibe Gate Configurator */}
            <VibeGateConfigurator
              theme={selectedVibes[0] || selectedGenre || ''}
              eventName={eventName}
              vibeProfile={vibeProfile}
              onChange={setVibeProfile}
              selectedVibes={selectedVibes}
              onVibeChange={setSelectedVibes}
            />
            
            {/* Save Event Button at Bottom */}
            <div className="pt-2">
              <Button 
                onClick={handleCreateEvent}
                disabled={!eventName.trim() || selectedVibes.length === 0 || !eventDate || !eventTime || isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 shadow-lg shadow-green-500/20 h-10 text-sm transition-transform hover:scale-105 active:scale-95"
              >
                {isLoading ? 'Creating...' : '✓ Save Event'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Algorithm Dialog */}
        <Dialog open={algorithmDialogOpen} onOpenChange={setAlgorithmDialogOpen}>
          <DialogContent className="glass-effect border-primary/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="gradient-text text-2xl">
                QRate Algorithm
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                How QRate uses Personal Taste Score to create perfect playlists
              </DialogDescription>
            </DialogHeader>
            
            <PTSVisualization 
              eventSize={selectedVibes.includes('intimate') ? 'small' : 'large'}
              geoFenceEnabled={true}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default EventCreation;
