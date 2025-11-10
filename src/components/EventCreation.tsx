import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ArrowLeft, Upload, X, Filter, TrendingUp, Sparkles, Calendar, Clock, MapPin, Image as ImageIcon, Music2, Zap, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { VibeGateConfigurator } from './VibeGateConfigurator';
import { PTSVisualization } from './PTSVisualization';
import { VibeProfile } from '../utils/types';
import { motion, AnimatePresence } from 'motion/react';

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
    <div className="bg-gradient-to-br from-background via-background/95 to-background/90 py-6 min-h-screen">
      <div className="mx-auto px-4 max-w-5xl container">
        {/* Header with gradient accent */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6"
        >
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="group hover:bg-cyan-500/10 border border-border/30 hover:border-cyan-500/50 transition-all duration-300 glass-effect"
            size="sm"
          >
            <ArrowLeft className="mr-2 w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setAlgorithmDialogOpen(true)}
            className="hover:bg-purple-500/10 border-purple-500/40 hover:border-purple-500/60 text-purple-400 transition-all duration-300 glass-effect"
            size="sm"
          >
            <TrendingUp className="mr-2 w-4 h-4" />
            Algorithm
          </Button>
        </motion.div>

        <Tabs defaultValue="details" className="space-y-4" value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid grid-cols-2 mx-auto p-1 border border-border/30 w-full max-w-2xl glass-effect">
            <TabsTrigger 
              value="details"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:border-cyan-500/30 data-[state=active]:text-cyan-400 transition-all"
            >
              <Calendar className="mr-2 w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger 
              value="vibe"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border-purple-500/30 data-[state=active]:text-purple-400 transition-all"
            >
              <Sparkles className="mr-2 w-4 h-4" />
              Vibe & Gate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-cyan-500/10 shadow-xl border-cyan-500/30 overflow-hidden glass-effect">
                <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-transparent pb-4 border-cyan-500/20 border-b">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-2 rounded-lg">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                    </div>
                    <CardTitle className="font-semibold text-cyan-400 text-xl">Event Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Event Name */}
                  <div className="space-y-2">
                    <Label htmlFor="event-name" className="flex items-center gap-2 font-medium text-foreground/80 text-sm">
                      <Music2 className="w-4 h-4 text-cyan-400" />
                      Event Name
                    </Label>
                    <Input
                      id="event-name"
                      placeholder="Enter event name"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="bg-input-background/50 border-border/50 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 h-10 text-sm transition-all"
                    />
                  </div>

                  {/* Date and Location Row */}
                  <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="event-date" className="flex items-center gap-2 font-medium text-foreground/80 text-sm">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        Date
                      </Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-input-background/50 border-border/50 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 h-10 text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-2 font-medium text-foreground/80 text-sm">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        Location (Optional)
                      </Label>
                      <Input
                        id="location"
                        placeholder="Venue name"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="bg-input-background/50 border-border/50 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 h-10 text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Start Time and End Time Row */}
                  <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="event-time" className="flex items-center gap-2 font-medium text-foreground/80 text-sm">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        Start Time
                      </Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="bg-input-background/50 border-border/50 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 h-10 text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time" className="flex items-center gap-2 font-medium text-foreground/80 text-sm">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        End Time
                      </Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="bg-input-background/50 border-border/50 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 h-10 text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Set the Vibe Button */}
                  <div className="mt-4 pt-4 border-border/30 border-t">
                    <div className="mb-4 text-muted-foreground text-xs text-center">
                      <Sparkles className="inline mr-2 w-4 h-4 text-purple-400" />
                      Configure your event vibe and filters to proceed
                    </div>
                    
                    <Button 
                      onClick={() => setCurrentTab('vibe')}
                      disabled={!eventName.trim() || !eventDate || !eventTime}
                      className="bg-gradient-to-r from-purple-600 hover:from-purple-700 via-purple-500 hover:via-purple-600 to-pink-500 hover:to-pink-600 disabled:opacity-50 shadow-lg shadow-purple-500/30 w-full h-11 font-medium text-sm hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 transition-all duration-300 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="mr-2 w-4 h-4" />
                      Set the Vibe →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="vibe" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {/* Vibe & Style Card */}
              <Card className="shadow-purple-500/10 shadow-xl border-purple-500/40 overflow-hidden glass-effect">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent pb-4 border-purple-500/20 border-b">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-2 rounded-lg">
                      <ImageIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <CardTitle className="font-semibold text-purple-400 text-lg">Vibe & Style</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Image Selection */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 font-medium text-foreground/80 text-sm">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      Event Poster (Optional)
                    </Label>
                    
                    <div className="gap-2 grid grid-cols-5">
                      {stockImages.map((img, idx) => (
                        <motion.button
                          key={idx}
                          onClick={() => {
                            setSelectedImage(img);
                            setUploadedImage('');
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            (selectedImage === img && !uploadedImage)
                              ? 'border-purple-500/80 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20' 
                              : 'border-border/30 hover:border-purple-500/50 hover:shadow-md'
                          }`}
                        >
                          <ImageWithFallback
                            src={img}
                            alt={`Party ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </motion.button>
                      ))}
                      
                      {/* Upload Button as Tile */}
                      <motion.button
                        onClick={() => fileInputRef.current?.click()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${
                          uploadedImage
                            ? 'border-purple-500/80 ring-2 ring-purple-500/30 bg-purple-500/10 shadow-lg shadow-purple-500/20' 
                            : 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 hover:bg-purple-500/10 hover:shadow-md'
                        }`}
                      >
                        <Upload className={`w-5 h-5 ${uploadedImage ? 'text-purple-400' : 'text-purple-400/70'}`} />
                        <span className={`text-[0.65rem] font-medium ${uploadedImage ? 'text-purple-400' : 'text-purple-400/70'}`}>Upload</span>
                      </motion.button>
                    </div>

                    {/* Show uploaded image preview */}
                    <AnimatePresence>
                      {uploadedImage && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative shadow-lg border-2 border-purple-500/50 rounded-lg aspect-video overflow-hidden"
                        >
                          <ImageWithFallback
                            src={uploadedImage}
                            alt="Uploaded poster"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setUploadedImage('')}
                            className="top-2 right-2 absolute flex justify-center items-center bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded-full w-7 h-7 hover:scale-110 transition-all"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Vibe Gate Configurator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <VibeGateConfigurator
                theme={selectedVibes[0] || selectedGenre || ''}
                eventName={eventName}
                vibeProfile={vibeProfile}
                onChange={setVibeProfile}
                selectedVibes={selectedVibes}
                onVibeChange={setSelectedVibes}
              />
            </motion.div>
            
            {/* Save Event Button at Bottom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="pt-4"
            >
              <Button 
                onClick={handleCreateEvent}
                disabled={!eventName.trim() || selectedVibes.length === 0 || !eventDate || !eventTime || isLoading}
                className="bg-gradient-to-r from-green-600 hover:from-green-700 via-emerald-500 hover:via-emerald-600 to-teal-500 hover:to-teal-600 disabled:opacity-50 shadow-green-500/30 shadow-lg w-full h-12 font-medium text-sm hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 transition-all duration-300 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 w-4 h-4" />
                    ✓ Save Event
                  </>
                )}
              </Button>
            </motion.div>
          </TabsContent>
        </Tabs>
        
        {/* Algorithm Dialog */}
        <Dialog open={algorithmDialogOpen} onOpenChange={setAlgorithmDialogOpen}>
          <DialogContent className="border-primary/30 max-w-4xl max-h-[90vh] overflow-y-auto text-white glass-effect">
            <DialogHeader>
              <DialogTitle className="text-2xl gradient-text">
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
