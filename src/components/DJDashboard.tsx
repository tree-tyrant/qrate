import { useState, useEffect, useRef, forwardRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ArrowLeft, Users, QrCode, Play, SkipForward, Heart, Clock, TrendingUp, TrendingDown, Music, RefreshCw, Plus, Headphones, X, CheckCircle, Sparkles, Volume2, Zap, Activity, Loader2, Filter, Star, Settings, Download, List, GripVertical, Pause, Trash2, Undo2, Info, Lightbulb, Flame, Radio, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { eventApi, utils } from '../utils/api';
import SmartFilters from './SmartFilters';
import { SongCard } from './SongCard';
import SettingsDialog from './SettingsDialog';
import { IntelligentSearch } from './IntelligentSearch';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { RefreshNotification } from './RefreshNotification';
import TipJar from './TipJar';
import djBackgroundImage from 'figma:asset/4efcd9e7df3cb63199cafe38a1c1eb2a6a9605aa.png';
import logoImage from 'figma:asset/08d0d06dd14cd5a887d78962b507773b63dedad4.png';

// Album cover images pool
const ALBUM_COVERS = [
  'https://images.unsplash.com/photo-1644855640845-ab57a047320e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFsYnVtJTIwY292ZXJ8ZW58MXx8fHwxNzYwOTMwMDYyfDA&ixlib=rb-4.1.0&q=80&w=400',
  'https://images.unsplash.com/photo-1564178413634-1ec30062c5e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHJlY29yZCUyMGFsYnVtfGVufDF8fHx8MTc2MTAwOTY3MHww&ixlib=rb-4.1.0&q=80&w=400',
  'https://images.unsplash.com/photo-1643964516811-acd68ed32c73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMG11c2ljJTIwYWxidW18ZW58MXx8fHwxNzYxMDE3NzcyfDA&ixlib=rb-4.1.0&q=80&w=400',
  'https://images.unsplash.com/photo-1653082658341-d18280d0c149?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwbXVzaWMlMjBjb3ZlcnxlbnwxfHx8fDE3NjEwMTc3NzJ8MA&ixlib=rb-4.1.0&q=80&w=400',
  'https://images.unsplash.com/photo-1509653382913-87a8ffd6ef25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYW5jZSUyMG11c2ljJTIwYWxidW18ZW58MXx8fHwxNzYxMDE3NzcyfDA&ixlib=rb-4.1.0&q=80&w=400',
];

// Mock Spotify Playlists
const MOCK_SPOTIFY_PLAYLISTS = [
  {
    id: 'party-hits-2024',
    name: 'Party Hits 2024',
    trackCount: 87,
    tracks: [
      { id: 'spotify-1', name: 'Levitating', artist: 'Dua Lipa', duration: '3:23', album: 'Future Nostalgia' },
      { id: 'spotify-2', name: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20', album: 'After Hours' },
      { id: 'spotify-3', name: 'Save Your Tears', artist: 'The Weeknd', duration: '3:36', album: 'After Hours' },
      { id: 'spotify-4', name: 'good 4 u', artist: 'Olivia Rodrigo', duration: '2:58', album: 'SOUR' },
      { id: 'spotify-5', name: 'Stay', artist: 'The Kid LAROI, Justin Bieber', duration: '2:21', album: 'F*ck Love 3' },
    ]
  },
  {
    id: 'weekend-mix',
    name: 'My Weekend Mix',
    trackCount: 142,
    tracks: [
      { id: 'spotify-6', name: 'Starboy', artist: 'The Weeknd, Daft Punk', duration: '3:50', album: 'Starboy' },
      { id: 'spotify-7', name: 'One Dance', artist: 'Drake, WizKid, Kyla', duration: '2:54', album: 'Views' },
      { id: 'spotify-8', name: 'Roses (Imanbek Remix)', artist: 'SAINt JHN', duration: '2:51', album: 'Roses' },
      { id: 'spotify-9', name: 'Heat Waves', artist: 'Glass Animals', duration: '3:59', album: 'Dreamland' },
      { id: 'spotify-10', name: 'Pepas', artist: 'Farruko', duration: '4:30', album: 'La 167' },
    ]
  },
  {
    id: 'dj-favorites',
    name: 'DJ Favorites',
    trackCount: 203,
    tracks: [
      { id: 'spotify-11', name: 'Titanium', artist: 'David Guetta, Sia', duration: '4:05', album: 'Nothing but the Beat' },
      { id: 'spotify-12', name: 'Animals', artist: 'Martin Garrix', duration: '5:03', album: 'Animals' },
      { id: 'spotify-13', name: 'Wake Me Up', artist: 'Avicii', duration: '4:09', album: 'True' },
      { id: 'spotify-14', name: 'Clarity', artist: 'Zedd, Foxes', duration: '4:32', album: 'Clarity' },
      { id: 'spotify-15', name: 'Don\'t You Worry Child', artist: 'Swedish House Mafia', duration: '3:32', album: 'Until Now' },
    ]
  }
];

// Get a consistent album cover for a song based on its ID
const getAlbumCover = (songId: string): string => {
  const hash = songId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ALBUM_COVERS[hash % ALBUM_COVERS.length];
};

// Generate random Camelot key for a song
const generateCamelotKey = (songId: string): string => {
  const keys = ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
                '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'];
  let hash = 0;
  for (let i = 0; i < songId.length; i++) {
    hash = ((hash << 5) - hash) + songId.charCodeAt(i);
    hash = hash & hash;
  }
  return keys[Math.abs(hash) % keys.length];
};

// Get harmonically compatible keys
const getCompatibleKeys = (key: string): { perfect: string; energyBoost: string; energyDrop: string } => {
  const number = parseInt(key);
  const letter = key.slice(-1);
  
  const nextNumber = number === 12 ? 1 : number + 1;
  const prevNumber = number === 1 ? 12 : number - 1;
  
  return {
    perfect: key, // Same key
    energyBoost: `${nextNumber}${letter}`, // One step up
    energyDrop: `${prevNumber}${letter}` // One step down
  };
};

// Get harmonic compatibility description
const getHarmonicDescription = (key: string, targetKey: string): { label: string; description: string } | null => {
  if (key === targetKey) {
    return { label: 'Perfect Match', description: 'Same key. Will mix seamlessly.' };
  }
  
  const compatible = getCompatibleKeys(targetKey);
  if (key === compatible.energyBoost) {
    return { label: 'Energy Boost', description: 'One step up. Will raise the energy.' };
  }
  if (key === compatible.energyDrop) {
    return { label: 'Energy Drop', description: 'One step down. Will mellow the vibe.' };
  }
  
  return null;
};

// Generate contextual metric for a song
const getSongMetric = (song: Track): string => {
  if (song.losingInfluence) {
    return "Losing influence: Most fans of this song may have left.";
  }
  if (song.trendingRecent) {
    return "Trending with guests who arrived in the last 30 minutes.";
  }
  if (song.topTrackForGuests && song.topTrackForGuests > 0) {
    return `This is a Top 10 track for ${song.topTrackForGuests} guest${song.topTrackForGuests > 1 ? 's' : ''}`;
  }
  if (song.recentPlays && song.recentPlays > 0) {
    return `${song.recentPlays} guest${song.recentPlays > 1 ? 's' : ''} played this song recently`;
  }
  if (song.playlistCount && song.playlistCount > 0) {
    return `This song is in ${song.playlistCount} guest${song.playlistCount > 1 ? 's' : ''} playlists`;
  }
  return `${song.guestCount || 1} guest${(song.guestCount || 1) > 1 ? 's' : ''} love this`;
};

interface Track {
  id: string;
  name?: string;
  title?: string;
  artist?: string;
  artists?: string[];
  album?: string;
  duration?: string;
  matchScore?: number;
  themeMatch?: number; // Theme match percentage
  reasons?: string[];
  energy?: number;
  danceability?: number;
  key?: string; // Musical key in Camelot notation (e.g., "8A", "9B")
  source: 'ai' | 'spotify' | 'apple' | 'tip-request';
  averageScore?: number;
  guestCount?: number;
  weight?: number;
  popularity?: number;
  suggestedBy?: string; // Guest who suggested this song
  suggestedAt?: string; // When it was suggested
  playlistCount?: number; // How many guest playlists feature this song
  crowdAffinity?: number; // Crowd affinity score (0-100)
  recentPlays?: number; // Number of guests who played this recently
  topTrackForGuests?: number; // Number of guests who have this in their top 10
  trendingRecent?: boolean; // Trending with recent arrivals
  losingInfluence?: boolean; // Fans may have left
  passionScore?: number; // How passionate the subset of fans are (0-100)
  passionDescription?: string; // Explanation of the passion/risk metric
  transitionSongs?: Array<{
    name: string;
    artists: Array<{ name: string }>;
    transitionScore?: number;
  }>; // Suggested songs for smooth transitions
  audioFeatures?: {
    danceability?: number;
    energy?: number;
    valence?: number; // Musical positivity
    tempo?: number; // BPM
  };
  rankChange?: number; // Positive means rank improved (lower number), negative means rank dropped (higher number), undefined means initial load or no change
  // Tip-specific metadata
  tipAmount?: number;
  guestName?: string;
  crowdScore?: number;
}

interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  duration: string;
  tracks: Track[];
}

interface Event {
  id: string;
  eventName?: string;
  name?: string;
  eventTheme?: string;
  theme?: string;
  code: string;
  guestCount?: number;
  preferences?: Array<{
    userId: string;
    artists: string[];
    genres: string[];
    recentTracks: string[];
  }>;
  connectedPlaylist?: Playlist;
  finalQueue?: any[];
  insights?: {
    totalGuests: number;
    topGenres: Array<{ name: string; weight: number; percentage: number }>;
    topArtists: Array<{ 
      name: string; 
      weight: number; 
      count: number;
      appearances?: number; // How many times artist appears in preferences
      crowdPresence?: number; // Percentage of crowd that likes this artist
    }>;
    recommendations: Track[];
    energyLevel: number;
    danceability: number;
    crowdAffinity?: number; // Overall crowd cohesion score (0-100)
  };
}

interface DJDashboardProps {
  event: Event;
  onBack: () => void;
  onShowQRCode: () => void;
  onConnectPlaylist: () => void;
  onUpdateEvent?: (updatedEvent: Event) => void;
  isLoading?: boolean;
}

// Detect if touch device for better DnD experience
const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Recommendation Song Card Component
interface RecommendationCardProps {
  song: Track;
  index: number;
  rank: number;
  addedSongs: Set<string>;
  addToQueue: (song: Track) => void;
  getSourceBadge: (source: string) => JSX.Element;
  harmonicFlowEnabled?: boolean;
  selectedSong?: Track | null;
  onSongSelect?: (song: Track | null) => void;
}

const RecommendationCard = forwardRef<HTMLDivElement, RecommendationCardProps>(({ song, index, rank, addedSongs, addToQueue, getSourceBadge, harmonicFlowEnabled, selectedSong, onSongSelect }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const songTitle = song.title || song.name || 'Unknown Track';
  const songArtist = Array.isArray(song.artists) ? song.artists.join(', ') : (song.artist || 'Unknown Artist');
  
  const handlePlayPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
    setTimeout(() => setIsPlaying(false), 2000);
  };
  
  const isSelected = harmonicFlowEnabled && selectedSong?.id === song.id;
  const harmonicInfo = harmonicFlowEnabled && selectedSong && selectedSong.key && song.key 
    ? getHarmonicDescription(song.key, selectedSong.key) 
    : null;

  return (
    <motion.div
      layout
      layoutId={`recommendation-${song.id}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ 
        layout: { duration: 0.8, type: "spring", stiffness: 100, damping: 25 },
        opacity: { duration: 0.4 },
        x: { duration: 0.5, delay: index * 0.03 }
      }}
      onClick={() => harmonicFlowEnabled && onSongSelect && onSongSelect(isSelected ? null : song)}
      className={harmonicFlowEnabled ? 'cursor-pointer' : ''}
    >
      <Card className={`glass-effect border-[var(--glass-border)] hover:border-[#FFBE0B]/50 transition-all duration-500 group ${
        addedSongs.has(song.id) 
          ? 'neon-glow border-[var(--neon-cyan)]/50 bg-gradient-to-r from-[var(--neon-cyan)]/5 to-transparent scale-[1.02]' 
          : isSelected
          ? 'border-[var(--neon-yellow)]/70 bg-gradient-to-r from-[var(--neon-yellow)]/10 to-transparent shadow-lg shadow-[var(--neon-yellow)]/20'
          : 'hover:shadow-lg hover:shadow-[#FFBE0B]/20'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Ranking Number with AI Badge */}
            <div className="w-10 flex-shrink-0 flex flex-col items-center justify-center gap-2">
              <span className="text-[rgb(255,190,11)] text-2xl font-bold drop-shadow-lg font-[Audiowide] font-normal text-[24px]">#{rank}</span>
              {getSourceBadge(song.source)}
            </div>
            
            {/* Album Cover with Play Button */}
            <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden group/cover">
              <ImageWithFallback
                src={getAlbumCover(song.id)}
                alt={songTitle}
                className="w-full h-full object-cover"
              />
              {addedSongs.has(song.id) && (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-blue)] opacity-70 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-black animate-pulse" />
                </div>
              )}
              {/* Play Preview Button */}
              {!addedSongs.has(song.id) && (
                <Button
                  size="sm"
                  onClick={handlePlayPreview}
                  className="absolute inset-0 w-full h-full bg-black/60 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center p-0 hover:bg-black/70"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="text-lg text-white group-hover:text-[#FFBE0B] transition-colors font-[Candal] font-bold font-normal">{songTitle}</h4>
                {addedSongs.has(song.id) && (
                  <Badge className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] text-black text-xs animate-pulse">
                    <Zap className="w-3 h-3 mr-1" />
                    Added!
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-300 mb-2">{songArtist}</p>
              
              {/* Scores */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1.5">
                  {song.rankChange !== undefined && song.rankChange !== 0 && (
                    song.rankChange > 0 ? (
                      <TrendingUp className="w-5 h-5 text-[#00ff00]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[#FF006E]" />
                    )
                  )}
                  <span className="text-2xl font-bold text-[rgb(255,190,11)]">
                    {Math.round(song.matchScore || 75)}%
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[rgb(255,255,255)] font-[Atkinson_Hyperlegible]">Crowd Match</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How likely this song would be popular with this crowd</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-[rgb(131,56,236)]">
                    {Math.round(song.themeMatch || Math.floor(Math.random() * 20) + 75)}%
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[rgb(255,255,255)] font-[Atkinson_Hyperlegible]">Theme Match</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How well this song fits the event theme</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              
              {/* Contextual Metric */}
              <div className="text-sm text-[rgb(195,203,216)] italic text-[13px]">
                {getSongMetric(song)}
              </div>
              
              {/* Harmonic Flow Info */}
              {harmonicFlowEnabled && song.key && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-[var(--neon-yellow)]/20 text-[var(--neon-yellow)] border-[var(--neon-yellow)]/30">
                    Key: {song.key}
                  </Badge>
                  {harmonicInfo && (
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-[var(--neon-cyan)]">{harmonicInfo.label}</div>
                      <div className="text-xs text-gray-400">{harmonicInfo.description}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                size="sm" 
                onClick={() => addToQueue(song)}
                disabled={addedSongs.has(song.id)}
                className={`transition-all duration-500 transform hover:scale-105 ${
                  addedSongs.has(song.id) 
                    ? 'bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-blue)] text-black shadow-lg shadow-[var(--neon-cyan)]/25' 
                    : 'bg-[var(--neon-purple)] text-black hover:shadow-lg hover:shadow-[var(--neon-purple)]'
                }`}
              >
                {addedSongs.has(song.id) ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Added!
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

RecommendationCard.displayName = 'RecommendationCard';

// Draggable Queue Item Component
interface DraggableQueueItemProps {
  song: Track;
  index: number;
  currentSongIndex: number;
  onPlaySong: (index: number) => void;
  onRemoveFromQueue: (songId: string) => void;
  onReturnToList: (songId: string, source: 'ai' | 'hidden-anthems' | 'tip-request') => void;
  onMoveItem: (dragIndex: number, hoverIndex: number) => void;
  getSourceBadge: (source: string) => JSX.Element;
}

function DraggableQueueItem({ 
  song, 
  index, 
  currentSongIndex, 
  onPlaySong, 
  onRemoveFromQueue, 
  onReturnToList,
  onMoveItem, 
  getSourceBadge 
}: DraggableQueueItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'queue-item',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'queue-item',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        onMoveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const handlePlayPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
    // This is just a visual toggle for now
    setTimeout(() => setIsPlaying(false), 2000);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't play if clicking on the drag handle or remove button
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-handle]') || target.closest('button')) {
      return;
    }
    if (!isDragging) {
      onPlaySong(index);
    }
  };

  // Connect drag handle to drag, and drop target to the whole card
  drag(dragRef);
  drop(ref);

  const songTitle = song.title || song.name || 'Unknown Track';
  const songArtist = Array.isArray(song.artists) ? song.artists.join(', ') : (song.artist || 'Unknown Artist');
  const isTipRequest = song.source === 'tip-request';
  const isGuestSuggestion = !!song.suggestedBy || isTipRequest;

  return (
    <motion.div 
      ref={ref}
      layout
      layoutId={`queue-${song.id}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0, scale: isDragging ? 0.95 : 1 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ 
        layout: { duration: 0.4, type: "spring", stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }}
    >
      <Card 
        className={`
          glass-effect border-[var(--glass-border)] relative
          ${index === currentSongIndex ? "border-[var(--neon-cyan)]/50 bg-gradient-to-r from-[var(--neon-cyan)]/10 to-transparent" : ""} 
          ${isTipRequest ? "border-[var(--neon-yellow)]/50 bg-gradient-to-r from-[var(--neon-yellow)]/5 to-transparent" : ""}
          ${isDragging ? "opacity-50 scale-95" : ""}
        `}
        onClick={handleClick}
      >
      {/* Undo button - top right corner */}
      {(song.source === 'ai' || song.source === 'hidden-anthems' || song.source === 'tip-request') && onReturnToList && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            onReturnToList(song.id, song.source as 'ai' | 'hidden-anthems' | 'tip-request');
          }}
          className="absolute top-2 right-2 z-10 px-3 py-2 h-auto hover:bg-[var(--neon-cyan)]/20 hover:text-[var(--neon-cyan)] text-white"
          title="Undo - Return to list"
        >
          <Undo2 className="w-5 h-5" />
        </Button>
      )}
      
      {/* Trash button - bottom right corner */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={(e) => {
          e.stopPropagation();
          onRemoveFromQueue(song.id);
        }}
        className="absolute bottom-2 right-2 z-10 text-xs px-2 py-1 h-auto hover:bg-[var(--destructive)]/20 hover:text-[var(--destructive)]"
        title="Remove from queue"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
      
      <CardContent className="p-3 sm:p-4 pr-12">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Drag Handle */}
            <div 
              ref={dragRef}
              data-drag-handle
              className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-[var(--neon-cyan)] transition-colors flex-shrink-0"
              title="Drag to reorder"
            >
              <GripVertical className="w-5 h-5" />
            </div>
            
            {/* Album Cover with Play Button */}
            <div 
              className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden group/cover"
              onMouseEnter={() => setShowPlayButton(true)}
              onMouseLeave={() => setShowPlayButton(false)}
            >
              <ImageWithFallback
                src={getAlbumCover(song.id)}
                alt={songTitle}
                className="w-full h-full object-cover"
              />
              {/* Play Button Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showPlayButton || isPlaying ? 1 : 0 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
                onClick={handlePlayPreview}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </motion.div>
              {/* Currently Playing Indicator */}
              {index === currentSongIndex && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] animate"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                <h4 className="font-medium text-sm sm:text-base truncate text-white group-hover:text-[var(--neon-cyan)] transition-colors">{songTitle}</h4>
                {isGuestSuggestion && (
                  <Badge className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-yellow)]/70 text-black text-xs flex-shrink-0">
                    <Star className="w-3 h-3 mr-1" />
                    {isTipRequest ? 'Guest Request' : 'Guest Request'}
                  </Badge>
                )}
                {!isGuestSuggestion && (
                  <div className="flex-shrink-0">
                    {getSourceBadge(song.source)}
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{songArtist}</p>
              {isTipRequest && song.crowdScore && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="text-xs bg-gradient-to-r from-[var(--neon-cyan)]/20 to-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30">
                    {Math.round(song.crowdScore)}% match
                  </Badge>
                </div>
              )}
              {isGuestSuggestion && !isTipRequest && song.matchScore && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="text-xs bg-gradient-to-r from-[var(--neon-cyan)]/20 to-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30">
                    {Math.round(song.matchScore)}% Match
                  </Badge>
                </div>
              )}
              {!isGuestSuggestion && song.matchScore && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="text-xs bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-blue)]/20 text-[rgb(0,217,255)] border border-[var(--neon-blue)]/30">
                    {Math.round(song.matchScore)}% match
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
    </motion.div>
  );
}

function DJDashboard({ event, onBack, onShowQRCode, onConnectPlaylist, onUpdateEvent, isLoading = false }: DJDashboardProps) {
  const [currentQueue, setCurrentQueue] = useState<Track[]>([]);
  const [connectedPlaylist, setConnectedPlaylist] = useState<Playlist | null>(event?.connectedPlaylist || null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [addedSongs, setAddedSongs] = useState<Set<string>>(new Set());
  const [insights, setInsights] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [existingPlaylists, setExistingPlaylists] = useState<any[]>([]);
  const [smartFilters, setSmartFilters] = useState({
    noExplicit: false,
    preventArtistRepetition: true,
    artistCooldownMinutes: 30,
    eraMinDecade: 1980,
    eraMaxDecade: 2020,
    eraFilterEnabled: false,
    minEnergy: 0,
    maxEnergy: 100,
    minDanceability: 0,
    maxDanceability: 100,
    minValence: 0,
    maxValence: 100,
    vocalFocus: false,
    harmonicFlow: false
  });
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [showAllAnthems, setShowAllAnthems] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [previousRecommendations, setPreviousRecommendations] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [previousCrowdScore, setPreviousCrowdScore] = useState<number | null>(null);
  const [newGuestsToAdd, setNewGuestsToAdd] = useState(0);
  const [selectedSongForHarmonic, setSelectedSongForHarmonic] = useState<Track | null>(null);
  const [discoveryQueue, setDiscoveryQueue] = useState<{ anthems: Track[] }>({ anthems: [] });
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState<Track[]>([]);
  const [trackScoreHistory, setTrackScoreHistory] = useState<Record<string, number>>({});
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(new Map());
  const [removedAnthems, setRemovedAnthems] = useState<Set<string>>(new Set());
  const [tipJarOpen, setTipJarOpen] = useState(false);
  const [totalTipAmount, setTotalTipAmount] = useState(0);
  const [hasNewTips, setHasNewTips] = useState(false);
  const [tipJarSheetOpen, setTipJarSheetOpen] = useState(false);
  const [removedDeepCuts, setRemovedDeepCuts] = useState<Set<string>>(new Set());
  const [guestSuggestions, setGuestSuggestions] = useState<Track[]>([]);
  
  const [trashedSongs, setTrashedSongs] = useState<Track[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Derived values (moved before useEffect to avoid initialization errors)
  const eventName = event.eventName || event.name || 'Event';

  // Monitor tips for notification badge
  useEffect(() => {
    const checkTips = () => {
      const storedTips = utils.storage.get(`qrate_tips_${event.id}`) || [];
      const activeTips = storedTips.filter((tip: any) => tip.message && !tip.dismissed);
      const total = storedTips.reduce((sum: number, tip: any) => sum + tip.amount, 0);
      setTotalTipAmount(total);
      setHasNewTips(activeTips.length > 0);
    };
    
    checkTips();
    const interval = setInterval(checkTips, 3000);
    return () => clearInterval(interval);
  }, [event.id]);

  // Auto-add playlist songs to queue when playlist is connected
  useEffect(() => {
    if (connectedPlaylist && connectedPlaylist.tracks) {
      setCurrentQueue(prev => [...prev, ...connectedPlaylist.tracks.slice(0, 5)]);
    }
  }, [connectedPlaylist]);

  // Initialize queue from saved event data and load insights
  useEffect(() => {
    if (event.finalQueue && event.finalQueue.length > 0) {
      console.log('📀 Loading saved queue from event data:', event.finalQueue.length, 'tracks');
      setCurrentQueue(event.finalQueue);
    }
    if (event.insights) {
      console.log('📊 Loading saved insights from event data');
      setInsights(event.insights);
    }
    
    // Load initial data - need to do this in a separate effect below
  }, []);

  // Simulate periodic updates to trigger toast notifications
  useEffect(() => {
    // Simulate updates every 60 seconds (only if recommendations exist)
    const simulationInterval = setInterval(() => {
      if (recommendations.length > 0 && !refreshing && !loadingInsights) {
        console.log('🔄 Simulating new updates available...');
        setHasNewUpdates(true);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(simulationInterval);
  }, [recommendations, refreshing, loadingInsights]);

  // Auto-save queue and DJ booth data whenever it changes (optimized)
  useEffect(() => {
    // Debounce saves to avoid too many updates
    const saveTimeout = setTimeout(() => {
      if (currentQueue.length > 0 && onUpdateEvent) {
        const updatedEvent = {
          ...event,
          finalQueue: currentQueue,
          insights: insights,
          connectedPlaylist: connectedPlaylist || undefined
        };
        console.log('💾 Auto-saving DJ booth data:', {
          queueLength: currentQueue.length,
          hasInsights: !!insights,
          hasPlaylist: !!connectedPlaylist
        });
        onUpdateEvent(updatedEvent);
        setLastSaved(new Date());
      }
    }, 5000); // Save after 5 seconds of inactivity (increased from 2s)

    return () => clearTimeout(saveTimeout);
  }, [currentQueue, insights, connectedPlaylist]);

  const loadDiscoveryQueue = async () => {
    setLoadingDiscovery(true);
    
    const eventCode = event.code || '';
    const isTestEvent = eventCode.toUpperCase() === 'POOL';
    
    if (isTestEvent) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    try {
      // Try to get discovery data from backend
      const response = await eventApi.getInsights(event.code);
      if (response.success && response.data?.discoveryQueue) {
        setDiscoveryQueue(response.data.discoveryQueue);
        setLoadingDiscovery(false);
        return;
      }
    } catch (error) {
      console.error('Error loading discovery queue:', error);
    }

      const mockAnthems: Track[] = [
        {
          id: 'anthem-1',
          title: 'Sunset Lover',
          artist: 'Petit Biscuit',
          album: 'Sunset Lover',
          duration: '3:43',
          matchScore: 72,
          themeMatch: 94,
          energy: 58,
          danceability: 74,
          source: 'ai',
          guestCount: 2,
          popularity: 35,
          passionDescription: 'Perfect theme match but under the radar. Could be a magical moment.',
          key: generateCamelotKey('anthem-1')
        },
        {
          id: 'anthem-2',
          title: 'Feel It Still',
          artist: 'Portugal. The Man',
          album: 'Woodstock',
          duration: '2:43',
          matchScore: 75,
          themeMatch: 91,
          energy: 79,
          danceability: 80,
          source: 'ai',
          guestCount: 3,
          popularity: 52,
          passionDescription: '91% theme match with moderate popularity. Safe creative choice.',
          key: generateCamelotKey('anthem-2')
        },
        {
          id: 'anthem-3',
          title: 'Electric Feel',
          artist: 'MGMT',
          album: 'Oracular Spectacular',
          duration: '3:49',
          matchScore: 77,
          themeMatch: 93,
          energy: 75,
          danceability: 83,
          source: 'ai',
          guestCount: 4,
          popularity: 48,
          passionDescription: 'Fits the vibe perfectly. Not overplayed, but recognizable.',
          key: generateCamelotKey('anthem-3')
        },
        {
          id: 'anthem-4',
          title: 'Island In The Sun',
          artist: 'Weezer',
          album: 'Weezer (Green Album)',
          duration: '3:20',
          matchScore: 73,
          themeMatch: 92,
          energy: 62,
          danceability: 72,
          source: 'ai',
          guestCount: 3,
          popularity: 44,
          passionDescription: 'Summer anthem that matches the pool party theme perfectly.',
          key: generateCamelotKey('anthem-4')
        },
        {
          id: 'anthem-5',
          title: 'Sunset',
          artist: 'The Midnight',
          album: 'Endless Summer',
          duration: '4:27',
          matchScore: 76,
          themeMatch: 96,
          energy: 68,
          danceability: 77,
          source: 'ai',
          guestCount: 2,
          popularity: 38,
          passionDescription: '96% theme match! Perfect for the golden hour moment.',
          key: generateCamelotKey('anthem-5')
        }
      ];

      setDiscoveryQueue({
        anthems: mockAnthems
      });
    }
    
    setLoadingDiscovery(false);
  };

  const loadEventInsights = async () => {
    setLoadingInsights(true);
    
    // Add delay for Pool Party demo event to make it look like AI is processing
    const eventCode = event.code || '';
    const isTestEvent = eventCode.toUpperCase() === 'POOL';
    
    if (isTestEvent) {
      await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 second delay
    }
    
    try {
      const response = await eventApi.getInsights(event.code);
      if (response.success && response.data?.insights) {
        setInsights(response.data.insights);
        if (response.data.insights.recommendations && response.data.insights.recommendations.length > 0) {
          setRecommendations(response.data.insights.recommendations.map((rec: any) => ({
            id: rec.song?.id || `rec-${Date.now()}-${Math.random()}`,
            name: rec.song?.name,
            title: rec.song?.name,
            artists: rec.song?.artists,
            artist: Array.isArray(rec.song?.artists) ? rec.song.artists.join(', ') : rec.song?.artists?.[0] || 'Unknown Artist',
            album: rec.song?.album || 'Unknown Album',
            duration: utils.formatDuration((rec.song?.duration_ms || 180000)),
            matchScore: Math.round(rec.averageScore || rec.song?.weight || 75),
            guestCount: rec.guestCount || 1,
            playlistCount: rec.playlistCount || Math.floor(Math.random() * 25) + 1,
            crowdAffinity: rec.crowdAffinity || Math.floor(Math.random() * 40) + 60,
            transitionSongs: rec.transitionSongs || [],
            audioFeatures: rec.audioFeatures || {
              danceability: rec.audioFeatures?.danceability || Math.random() * 0.4 + 0.6,
              energy: rec.audioFeatures?.energy || Math.random() * 0.4 + 0.5,
              valence: rec.audioFeatures?.valence || Math.random() * 0.6 + 0.3,
              tempo: rec.audioFeatures?.tempo || Math.random() * 80 + 100
            },
            reasons: [
              `${rec.guestCount || 1} guest${(rec.guestCount || 1) > 1 ? 's' : ''} love this`,
              rec.averageScore > 80 ? 'High crowd match' : 'Good crowd match',
              'AI recommended'
            ],
            energy: Math.round((rec.audioFeatures?.energy || 0.7) * 100),
            danceability: Math.round((rec.audioFeatures?.danceability || 0.75) * 100),
            source: 'ai' as const,
            weight: rec.song?.weight,
            popularity: rec.song?.popularity
          })));
          console.log('✅ Loaded AI recommendations from backend:', response.data.insights.recommendations.length);
          setLoadingInsights(false);
          return; // Exit early if we got backend data
        }
      }
      
      // If backend returns no recommendations, fall through to use mock data
      console.log('ℹ️ No backend recommendations available');
    } catch (error) {
      console.error('Error loading event insights:', error);
    }
    
    // Only show mock data if event has actual guests/preferences
    // This ensures fresh events start with clean slate
    const hasRealData = (event.guestCount || 0) > 0 || (event.preferences || []).length > 0;
    
    if (!hasRealData) {
      console.log('ℹ️ No guest data yet - showing empty state for recommendations');
      setInsights(null);
      setRecommendations([]);
      setLoadingInsights(false);
      return;
    }
    
    // Only show mock data for test event (POOL code - tester account)
    console.log('🎵 AI Recommendations - Test Detection:', {
      eventCode,
      isTestEvent,
      hasRealData
    });
    
    // Set mock data only for test event (only if we don't already have recommendations)
    if (recommendations.length === 0 && isTestEvent) {
      // Fallback to mock data for POOL test event
      setInsights({
        totalGuests: event.guestCount || 5,
        topGenres: [
          { name: 'Reggae', weight: 52, percentage: 78 },
          { name: 'R&B', weight: 45, percentage: 67 },
          { name: 'Merengue', weight: 38, percentage: 56 }
        ],
        topArtists: [
          { name: 'Kygo', weight: 42, count: 5, appearances: 3, crowdPresence: 60 },
          { name: 'Robin Schulz', weight: 38, count: 4, appearances: 2, crowdPresence: 40 },
          { name: 'Lost Frequencies', weight: 35, count: 4, appearances: 4, crowdPresence: 80 }
        ],
        topDecades: [
          { decade: '2010s', percentage: 62 },
          { decade: '2020s', percentage: 25 },
          { decade: '2000s', percentage: 8 },
          { decade: '1990s', percentage: 5 }
        ],
        energyLevel: 87,
        danceability: 84,
        crowdAffinity: 92,
        audienceProfile: {
          avgPopularity: 84,
          profile: 'Mainstream Hits',
          insight: 'This crowd loves anthems. Stick to the hits and well-known remixes for the biggest reaction.'
        }
      });
      
      // Sort by match score descending before setting
      const mockRecommendations: Track[] = [
        {
          id: 'ai-1',
          title: 'Firestone',
          artist: 'Kygo ft. Conrad Sewell',
          album: 'Cloud Nine',
          duration: '4:11',
          matchScore: 96,
          themeMatch: 93,
          energy: 75,
          danceability: 82,
          source: 'ai',
          guestCount: 5,
          playlistCount: 23,
          crowdAffinity: 96,
          topTrackForGuests: 5
        },
        {
          id: 'ai-2',
          title: 'Sugar',
          artist: 'Robin Schulz ft. Francesco Yates',
          album: 'Sugar',
          duration: '3:35',
          matchScore: 94,
          themeMatch: 91,
          energy: 78,
          danceability: 85,
          source: 'ai',
          guestCount: 4,
          playlistCount: 19,
          crowdAffinity: 90,
          recentPlays: 4
        },
        {
          id: 'ai-3',
          title: 'Are You With Me',
          artist: 'Lost Frequencies',
          album: 'Less Is More',
          duration: '3:14',
          matchScore: 92,
          themeMatch: 89,
          energy: 72,
          danceability: 80,
          source: 'ai',
          guestCount: 4,
          playlistCount: 17,
          crowdAffinity: 88,
          trendingRecent: true
        },
        {
          id: 'ai-4',
          title: 'Fast Car',
          artist: 'Jonas Blue ft. Dakota',
          album: 'Blue',
          duration: '3:33',
          matchScore: 90,
          themeMatch: 87,
          energy: 76,
          danceability: 78,
          source: 'ai',
          guestCount: 3,
          playlistCount: 15
        },
        {
          id: 'ai-5',
          title: 'Jubel',
          artist: 'Klingande',
          album: 'Jubel',
          duration: '3:19',
          matchScore: 89,
          themeMatch: 86,
          energy: 74,
          danceability: 82,
          source: 'ai',
          guestCount: 3,
          topTrackForGuests: 2
        },
        {
          id: 'ai-6',
          title: 'This Girl',
          artist: 'Kungs vs Cookin\' On 3 Burners',
          album: 'Layers',
          duration: '3:15',
          matchScore: 87,
          themeMatch: 84,
          energy: 80,
          danceability: 85,
          source: 'ai',
          guestCount: 3,
          recentPlays: 3
        },
        {
          id: 'ai-7',
          title: 'Show Me Love',
          artist: 'Sam Feldt ft. Kimberly Anne',
          album: 'Show Me Love',
          duration: '3:03',
          matchScore: 85,
          themeMatch: 82,
          energy: 73,
          danceability: 79,
          source: 'ai',
          guestCount: 2,
          playlistCount: 14
        },
        {
          id: 'ai-8',
          title: 'Stole the Show',
          artist: 'Kygo ft. Parson James',
          album: 'Cloud Nine',
          duration: '3:44',
          matchScore: 84,
          themeMatch: 81,
          energy: 71,
          danceability: 77,
          source: 'ai',
          guestCount: 3,
          playlistCount: 15,
          losingInfluence: true
        },
        {
          id: 'ai-9',
          title: 'Summer',
          artist: 'Calvin Harris',
          album: 'Motion',
          duration: '3:43',
          matchScore: 83,
          themeMatch: 80,
          energy: 82,
          danceability: 81,
          source: 'ai',
          guestCount: 4,
          playlistCount: 21,
          crowdAffinity: 88,
          recentPlays: 2
        },
        {
          id: 'ai-10',
          title: 'Prayer in C',
          artist: 'Lilly Wood & The Prick (Robin Schulz Remix)',
          album: 'Prayer in C',
          duration: '3:13',
          matchScore: 82,
          themeMatch: 79,
          energy: 70,
          danceability: 75,
          source: 'ai',
          guestCount: 3,
          playlistCount: 18,
          crowdAffinity: 84
        },
        {
          id: 'ai-11',
          title: 'Stolen Dance',
          artist: 'Milky Chance',
          album: 'Sadnecessary',
          duration: '3:14',
          matchScore: 80,
          themeMatch: 75,
          energy: 68,
          danceability: 74,
          source: 'ai',
          guestCount: 2,
          playlistCount: 16,
          crowdAffinity: 82,
          topTrackForGuests: 1
        },
        {
          id: 'ai-12',
          title: 'Outside',
          artist: 'Calvin Harris ft. Ellie Goulding',
          album: 'Motion',
          duration: '3:44',
          matchScore: 79,
          themeMatch: 76,
          energy: 77,
          danceability: 76,
          source: 'ai',
          guestCount: 3,
          playlistCount: 19,
          crowdAffinity: 83
        },
        {
          id: 'ai-13',
          title: 'Lean On',
          artist: 'Major Lazer & DJ Snake ft. MØ',
          album: 'Peace Is The Mission',
          duration: '2:56',
          matchScore: 78,
          themeMatch: 77,
          energy: 75,
          danceability: 78,
          source: 'ai',
          guestCount: 4,
          playlistCount: 22,
          crowdAffinity: 86
        },
        {
          id: 'ai-14',
          title: 'Hey Brother',
          artist: 'Avicii',
          album: 'True',
          duration: '4:15',
          matchScore: 77,
          themeMatch: 74,
          energy: 72,
          danceability: 73,
          source: 'ai',
          guestCount: 2,
          playlistCount: 14,
          crowdAffinity: 80
        }
      ];
      
      // Add keys to all recommendations
      const recommendationsWithKeys = mockRecommendations.map(song => ({
        ...song,
        key: generateCamelotKey(song.id)
      }));
      
      // Sort by matchScore descending
      setRecommendations(recommendationsWithKeys.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)));
      
      // Track crowd score for trend detection
      if (insights?.crowdAffinity !== undefined) {
        setPreviousCrowdScore(insights.crowdAffinity);
      }
    }
    
    setLoadingInsights(false);
  };

  const refreshRecommendations = async () => {
    setRefreshing(true);
    setHasNewUpdates(false); // Clear the notification
    setPreviousRecommendations([...recommendations]); // Store current state for animation
    setActiveTab('recommendations'); // Switch to AI suggestions tab
    
    // Store current ranks before update
    const currentRanks = new Map<string, number>();
    recommendations.forEach((song, index) => {
      currentRanks.set(song.id, index + 1);
    });
    
    // Simulate dynamic updates by modifying scores with more variation for visible reshuffling
    setTimeout(() => {
      setRecommendations(prev => {
        const updated = prev.map(song => {
          // Use more dramatic score changes to cause visible reordering (±8-15 points)
          const scoreChange = (Math.random() * 14) + 8; // 8-22 points
          const direction = Math.random() > 0.5 ? 1 : -1;
          
          return {
            ...song,
            matchScore: Math.max(30, Math.min(95, (song.matchScore || 75) + (scoreChange * direction))),
            themeMatch: Math.max(30, Math.min(95, (song.themeMatch || 75) + (Math.random() * 10 - 5))),
            guestCount: song.guestCount ? song.guestCount + Math.floor(Math.random() * 3) : song.guestCount,
            playlistCount: song.playlistCount ? song.playlistCount + Math.floor(Math.random() * 2) : song.playlistCount
          };
        });
        
        // Re-sort by new matchScore to create visible ranking changes
        const sorted = updated.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        
        // Calculate rank changes and add to songs
        return sorted.map((song, newIndex) => {
          const newRank = newIndex + 1;
          const previousRank = currentRanks.get(song.id);
          let rankChange = undefined;
          
          if (previousRank !== undefined) {
            // Positive means rank improved (lower number), negative means rank dropped (higher number)
            rankChange = previousRank - newRank;
          }
          
          return {
            ...song,
            rankChange
          };
        });
      });
      
      // Store the previous ranks for next refresh
      setPreviousRanks(currentRanks);
      
      // Update insights with dynamic values
      if (insights) {
        const currentCrowdAffinity = insights.crowdAffinity || 92;
        setPreviousCrowdScore(currentCrowdAffinity);
        
        // Slightly change crowd cohesion (±1-3%)
        const newCrowdAffinity = Math.max(80, Math.min(98, currentCrowdAffinity + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3 + 1)));
        
        // Update top genres percentages slightly
        const updatedTopGenres = insights.topGenres?.map((genre: any) => ({
          ...genre,
          percentage: Math.max(10, Math.min(100, genre.percentage + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3 + 1)))
        }));
        
        // Update top decades percentages slightly
        const updatedTopDecades = insights.topDecades?.map((item: any) => ({
          ...item,
          percentage: Math.max(2, Math.min(100, item.percentage + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2 + 1)))
        }));
        
        // Slightly adjust audience profile
        const currentPopularity = insights.audienceProfile?.avgPopularity || 34;
        const newPopularity = Math.max(45, Math.min(95, currentPopularity + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2 + 1)));
        const getProfileInfo = (pop: number) => {
          if (pop > 80) {
            return {
              profile: 'Mainstream Hits',
              insight: 'This crowd loves anthems. Stick to the hits and well-known remixes for the biggest reaction.'
            };
          } else if (pop >= 50) {
            return {
              profile: 'Balanced Mix',
              insight: 'This crowd knows their music. You can mix hits with well-regarded "deep cuts" and remixes.'
            };
          } else {
            return {
              profile: 'Crate Diggers',
              insight: 'This is a "music-first" crowd. They will appreciate lesser-known tracks and creative risks. Don\'t just play the hits.'
            };
          }
        };
        
        setInsights({
          ...insights,
          crowdAffinity: newCrowdAffinity,
          topGenres: updatedTopGenres,
          topDecades: updatedTopDecades,
          audienceProfile: {
            avgPopularity: newPopularity,
            ...getProfileInfo(newPopularity)
          },
          totalGuests: (insights.totalGuests || event.guestCount || 0) + newGuestsToAdd
        });
        
        // Reset new guests counter
        setNewGuestsToAdd(0);
      }
    }, 800);
    
    await loadEventInsights();
    

  // Show toast notification when updates are available
  useEffect(() => {
    if (hasNewUpdates && !refreshing && !loadingInsights && recommendations.length > 0) {
      // Randomly select a reason for variety in notifications
      const reasons = ['rank_volatility', 'guest_batch', 'top_rank_change'] as const;
      const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
      
      const newGuests = randomReason === 'guest_batch' ? Math.floor(Math.random() * 5) + 1 : 0;
      
      const notificationData = {
        shouldNotify: true,
        reason: randomReason,
        details: {
          rankVolatilityPercent: randomReason === 'rank_volatility' ? Math.floor(Math.random() * 30) + 20 : 0,
          newGuestsCount: newGuests,
          topRankChanged: randomReason === 'top_rank_change'
        }
      };
      
      // Store new guests count for when refresh is triggered
      setNewGuestsToAdd(newGuests);
      
      toast.custom((t) => (
        <div className="w-full max-w-md">
          <RefreshNotification 
            notification={notificationData}
            onRefresh={() => {
              toast.dismiss(t);
              refreshRecommendations();
            }}
            onDismiss={() => toast.dismiss(t)}
            duration={30000}
          />
        </div>
      ), {
        position: 'top-right',
        duration: 30000, // 30 seconds
      });
    }
  }, [hasNewUpdates]);

  const handleSearchTrackSelected = (track: any) => {
    // Convert search result to Track format
    const newTrack: Track = {
      id: track.trackId || `search-${Date.now()}`,
      name: track.name,
      title: track.name,
      artist: track.artist,
      artists: [track.artist],
      album: track.album,
      duration: track.duration || '0:00',
      source: 'spotify',
      matchScore: 0,
    };
    
    addToQueue(newTrack);
    toast.success(`Added "${track.name}" to queue`);
  };

  const addToQueue = async (song: Track) => {
    const newSong = { ...song, id: song.id || `queue-${Date.now()}-${Math.random()}` };
    setCurrentQueue([...currentQueue, newSong]);
    
    // Track if this is from deep cuts or hidden anthems
    if (song.source === 'deep-cuts') {
      setRemovedDeepCuts(prev => new Set([...prev, newSong.id]));
    } else if (song.source === 'hidden-anthems') {
      setRemovedAnthems(prev => new Set([...prev, newSong.id]));
    }
    
    // Add creative feedback
    setAddedSongs(prev => new Set([...prev, newSong.id]));
    // Remove the feedback after animation
    setTimeout(() => {
      setAddedSongs(prev => {
        const newSet = new Set(prev);
        newSet.delete(newSong.id);
        return newSet;
      });
    }, 2000);
  };

  const removeFromQueue = async (songId: string) => {
    // Find the song in the queue
    const song = currentQueue.find(s => s.id === songId);
    if (!song) return;
    
    // Move to trashed songs instead of deleting
    setTrashedSongs(prev => [...prev, song]);
    
    // Remove from queue
    setCurrentQueue(currentQueue.filter(s => s.id !== songId));
    
    // Adjust current song index if needed
    if (currentSongIndex >= currentQueue.length - 1) {
      setCurrentSongIndex(Math.max(0, currentQueue.length - 2));
    }
    
    toast.info(`Moved "${song.title || song.name}" to trash`);
  };

  const returnToList = (songId: string, source: 'ai'  | 'hidden-anthems' | 'tip-request') => {
    // Find the song in the queue
    const song = currentQueue.find(s => s.id === songId);
    if (!song) return;

    // Remove from queue
    setCurrentQueue(currentQueue.filter(s => s.id !== songId));

    // Add back to appropriate list if not already there
    if (source === 'ai') {
      if (!recommendations.find(r => r.id === songId)) {
        setRecommendations([...recommendations, song]);
      }
    } else if (source === 'tip-request') {
      // Tip requests don't go back to any list, just remove from queue
      toast.info('Tip request removed from queue');
    } else if (source === 'hidden-anthems') {
      // Remove from the removed set to make it visible again
      setRemovedAnthems(prev => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
    }

    // Adjust current song index if needed
    if (currentSongIndex >= currentQueue.length - 1) {
      setCurrentSongIndex(Math.max(0, currentQueue.length - 2));
    }
  };

  const skipToNext = () => {
    if (currentSongIndex < currentQueue.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
    }
  };

  const addPlaylistToQueue = (playlist: Playlist) => {
    setConnectedPlaylist(playlist);
    setCurrentQueue([...currentQueue, ...playlist.tracks]);
  };

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const draggedItem = currentQueue[dragIndex];
    const newQueue = [...currentQueue];
    newQueue.splice(dragIndex, 1);
    newQueue.splice(hoverIndex, 0, draggedItem);
    setCurrentQueue(newQueue);
    
    // Update current song index if needed
    if (dragIndex === currentSongIndex) {
      setCurrentSongIndex(hoverIndex);
    } else if (dragIndex < currentSongIndex && hoverIndex >= currentSongIndex) {
      setCurrentSongIndex(currentSongIndex - 1);
    } else if (dragIndex > currentSongIndex && hoverIndex <= currentSongIndex) {
      setCurrentSongIndex(currentSongIndex + 1);
    }
  };

  const playSong = (index: number) => {
    setCurrentSongIndex(index);
  };

  const handleSelectPlaylist = (playlist: typeof MOCK_SPOTIFY_PLAYLISTS[0]) => {
    // Convert playlist tracks to full Track objects with crowd analysis
    const tracksWithAnalysis = playlist.tracks.map(track => {
      // Calculate a realistic crowd score based on song popularity patterns
      const baseCrowdScore = 65 + Math.random() * 30; // 65-95% range
      const themeMatch = 70 + Math.random() * 25; // 70-95% range
      
      return {
        id: track.id,
        name: track.name,
        title: track.name,
        artist: track.artist,
        artists: [track.artist],
        album: track.album,
        duration: track.duration,
        source: 'spotify',
        matchScore: Math.round(baseCrowdScore),
        crowdScore: Math.round(baseCrowdScore),
        themeMatch: Math.round(themeMatch),
        key: generateCamelotKey(track.id)
      };
    });
    
    setSelectedPlaylistTracks(tracksWithAnalysis);
    setConnectedPlaylist({
      id: playlist.id,
      name: playlist.name,
      trackCount: playlist.trackCount,
      tracks: tracksWithAnalysis
    });
    setShowPlaylistDialog(false);
    toast.success(`Connected to ${playlist.name}`);
  };

  const addSpotifyTrackToQueue = (track: Track) => {
    // Store the current crowd score for trend tracking
    setTrackScoreHistory(prev => ({
      ...prev,
      [track.id]: track.crowdScore || 0
    }));
    
    addToQueue(track);
    toast.success(`Added "${track.name}" to queue`);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ai':
        return <Badge className="text-xs bg-[var(--neon-purple)]/30 border-[var(--neon-purple)] text-[var(--neon-purple)] text-[rgb(215,72,255)] font-[Inter] text-[11px]">
          <Sparkles className="w-3 h-3 mr-1" />
          AI
        </Badge>;
      case 'spotify':
        return <Badge className="text-xs bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <Music className="w-3 h-3 mr-1" />
          Spotify
        </Badge>;
      case 'apple':
        return <Badge className="text-xs bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0">
          <Music className="w-3 h-3 mr-1" />
          Apple
        </Badge>;
      case 'tip-request':
        return <Badge className="text-xs bg-gradient-to-r from-[var(--neon-yellow)]/20 to-[var(--neon-yellow)]/10 text-[var(--neon-yellow)] border border-[var(--neon-yellow)]/30">
          <Zap className="w-3 h-3 mr-1" />
          Guest Suggestion
        </Badge>;
      case 'hidden-anthems':
        return <Badge className="text-xs bg-gradient-to-r from-[var(--neon-pink)]/20 to-[var(--neon-pink)]/10 text-[var(--neon-pink)] border border-[var(--neon-pink)]/30">
          <Radio className="w-3 h-3 mr-1" />
          Hidden Anthem
        </Badge>;
      default:
        return null;
    }
  };

  // Apply smart filters to recommendations
  const applySmartFilters = (tracks: Track[]) => {
    let filtered = [...tracks];

    // Content Filter - no explicit content
    if (smartFilters.noExplicit) {
      filtered = filtered.filter(track => !track.explicit);
    }

    // Repetition Velocity Control - prevent artist repetition
    if (smartFilters.preventArtistRepetition) {
      const recentArtists = new Set(
        currentQueue
          .slice(-Math.floor(smartFilters.artistCooldownMinutes / 3)) // Rough approximation
          .map(song => song.artist)
      );
      filtered = filtered.filter(track => !recentArtists.has(track.artist));
    }

    // Eras Bias - filter by decade
    if (smartFilters.eraFilterEnabled) {
      filtered = filtered.filter(track => {
        const year = track.releaseYear || new Date().getFullYear();
        const decade = Math.floor(year / 10) * 10;
        return decade >= smartFilters.eraMinDecade && decade <= smartFilters.eraMaxDecade;
      });
    }

    // Energy filter
    if (smartFilters.minEnergy > 0 || smartFilters.maxEnergy < 100) {
      filtered = filtered.filter(track => {
        const energy = track.energy || 50;
        return energy >= smartFilters.minEnergy && energy <= smartFilters.maxEnergy;
      });
    }

    // Danceability filter
    if (smartFilters.minDanceability > 0 || smartFilters.maxDanceability < 100) {
      filtered = filtered.filter(track => {
        const danceability = track.danceability || 50;
        return danceability >= smartFilters.minDanceability && danceability <= smartFilters.maxDanceability;
      });
    }

    // Valence (mood) filter
    if (smartFilters.minValence > 0 || smartFilters.maxValence < 100) {
      filtered = filtered.filter(track => {
        const valence = track.valence || 50;
        return valence >= smartFilters.minValence && valence <= smartFilters.maxValence;
      });
    }

    // Vocal Focus - prioritize tracks with vocals (this would need backend support)
    if (smartFilters.vocalFocus) {
      // Sort by instrumentalness (lower = more vocals)
      filtered = filtered.sort((a, b) => {
        const aInst = a.instrumentalness || 0.5;
        const bInst = b.instrumentalness || 0.5;
        return aInst - bInst;
      });
    }

    return filtered;
  };

  const totalGuests = insights?.totalGuests || event.guestCount || 128;

  // Apply filters to recommendations and guest suggestions
  let filteredRecommendations = applySmartFilters(recommendations);
  // Sort guest suggestions by matchScore for consistent ranking
  const filteredGuestSuggestions = applySmartFilters(guestSuggestions).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  
  // Apply harmonic flow filtering if enabled and a song is selected
  if (smartFilters.harmonicFlow && selectedSongForHarmonic && selectedSongForHarmonic.key) {
    const selectedKey = selectedSongForHarmonic.key;
    const compatibleKeys = getCompatibleKeys(selectedKey);
    
    // Filter to only show harmonically compatible tracks
    const harmonicMatches = filteredRecommendations.filter(song => {
      if (!song.key) return false;
      return song.key === compatibleKeys.perfect || 
             song.key === compatibleKeys.energyBoost || 
             song.key === compatibleKeys.energyDrop;
    });
    
    // Show selected song + 3 compatible tracks (one of each type if possible)
    const perfectMatch = harmonicMatches.find(s => s.key === compatibleKeys.perfect && s.id !== selectedSongForHarmonic.id);
    const energyBoost = harmonicMatches.find(s => s.key === compatibleKeys.energyBoost);
    const energyDrop = harmonicMatches.find(s => s.key === compatibleKeys.energyDrop);
    
    filteredRecommendations = [
      selectedSongForHarmonic,
      ...[perfectMatch, energyBoost, energyDrop].filter(Boolean) as Track[]
    ].slice(0, 4);
  }

  // Load event insights and recommendations when component mounts or event code changes
  useEffect(() => {
    if (!dataLoaded) {
      loadEventInsights();
      loadDiscoveryQueue();
      setDataLoaded(true);
    }
  }, [event.code, dataLoaded]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Synthwave Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${djBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Dark Overlay for readability */}
      <div 
        className="fixed inset-0 z-0 bg-black/60"
        style={{
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(2px)'
        }}
      />
      
      {/* Content wrapper */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6">
        {/* Header with Neon Effects */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8"
        >
          <Button 
            onClick={onBack} 
            className="glass-effect bg-[var(--neon-purple)]/10 hover:bg-[var(--neon-purple)]/20 border border-[var(--neon-purple)]/50 hover:border-[var(--neon-purple)] text-[var(--neon-purple)] self-start -ml-6"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          {/* Clickable QRate Logo */}
          <button
            onClick={() => window.location.reload()}
            className="group transition-all duration-300 hover:scale-105 self-start"
            title="Return to home"
          >
            <img 
              src={logoImage} 
              alt="QRate" 
              className="h-20 w-auto transition-all duration-300 group-hover:brightness-125"
            />
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold break-words mb-2 text-[var(--neon-purple)] font-[Changa_One]">
              {eventName}
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
              <div className="flex items-center gap-1 glass-effect px-2 py-1 rounded border border-[var(--glass-border)]">
                <Users className="w-3 h-3 text-[var(--neon-cyan)]" />
                <span className="text-xs text-white font-medium">{totalGuests}</span>
              </div>
              <span> Code: {event.code}</span>
              <Button 
                size="sm" 
                onClick={onShowQRCode}
                className="group glass-effect bg-transparent hover:bg-[var(--neon-cyan)]/10 border-0 hover:border hover:border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] transition-all duration-300 h-7 px-2 hover:px-3 overflow-hidden"
                disabled={isLoading}
              >
                <QrCode className="w-4 h-4" />
                <span className="max-w-0 group-hover:max-w-xs group-hover:ml-2 overflow-hidden transition-all duration-300 whitespace-nowrap text-xs">QR Code</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => setFiltersOpen(true)}
              className="group relative glass-effect bg-transparent hover:bg-[var(--neon-cyan)]/10 border-0 hover:border hover:border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] transition-all duration-300 overflow-hidden px-2 hover:px-3"
              disabled={isLoading}
            >
              <Filter className="w-4 h-4" />
              <span className="max-w-0 group-hover:max-w-xs group-hover:ml-2 overflow-hidden transition-all duration-300 whitespace-nowrap">Filters</span>
            </Button>
            
            <Button 
              size="sm" 
              onClick={() => setTipJarSheetOpen(true)}
              className="group relative glass-effect bg-transparent hover:bg-[#10b981]/10 border-0 hover:border hover:border-[#10b981]/50 text-[#10b981] transition-all duration-300 overflow-hidden px-2 hover:px-3"
              disabled={isLoading}
            >
              {hasNewTips && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-[var(--dark-bg)] z-10"></span>
              )}
              <DollarSign className="w-4 h-4" />
              <span className="max-w-0 group-hover:max-w-xs group-hover:ml-2 overflow-hidden transition-all duration-300 whitespace-nowrap">Tip Jar: ${totalTipAmount.toFixed(2)}</span>
            </Button>

            <Button 
              size="sm" 
              onClick={() => setSettingsOpen(true)}
              className="group relative glass-effect bg-transparent hover:bg-[var(--neon-cyan)]/10 border-0 hover:border hover:border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] transition-all duration-300 overflow-hidden px-2 hover:px-3"
              disabled={isLoading}
            >
              <Settings className="w-4 h-4" />
              <span className="max-w-0 group-hover:max-w-xs group-hover:ml-2 overflow-hidden transition-all duration-300 whitespace-nowrap">Settings</span>
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left 2/3 */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Tabs - Removed Queue tab */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-visible">
            <TabsList className="grid w-full grid-cols-2 glass-effect border border-[var(--glass-border)] bg-transparent p-0 h-auto relative">
              <TabsTrigger 
                value="recommendations" 
                className="text-sm text-gray-400 data-[state=active]:text-[var(--neon-purple)] data-[state=active]:bg-transparent relative py-3 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--neon-purple)] after:transition-all after:duration-300 data-[state=active]:after:opacity-100 after:opacity-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Suggestions ({filteredRecommendations.length})
              </TabsTrigger>
              <TabsTrigger 
                value="discovery-queue" 
                className="text-sm text-gray-400 data-[state=active]:text-[var(--neon-pink)] data-[state=active]:bg-transparent relative py-3 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--neon-pink)] after:transition-all after:duration-300 data-[state=active]:after:opacity-100 after:opacity-0"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Discovery ({(discoveryQueue.anthems.length)})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[20px] font-[Audiowide] font-bold not-italic font-normal">Crowd-generated Favorites</h3>
                  <p className="text-sm text-muted-foreground font-[Chivo_Mono] text-[13px]">
                    AI-powered suggestions based on {totalGuests} guest{totalGuests !== 1 ? 's' : ''} music preferences and data
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={refreshRecommendations}
                  disabled={refreshing || loadingInsights}
                  className="relative"
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {hasNewUpdates && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-[var(--dark-bg)]"></span>
                      )}
                    </>
                  )}
                  Refresh
                </Button>
              </div>



              {loadingInsights ? (
                <Card className="glass-effect border-[var(--glass-border)]">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-pink)]/20 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-[var(--neon-purple)] animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      AI is analyzing crowd preferences...
                    </h3>
                  </CardContent>
                </Card>
              ) : recommendations.length === 0 ? (
                <Card className="glass-effect border-[var(--glass-border)]">
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {totalGuests === 0 
                        ? "Waiting for guests to share their preferences..."
                        : "AI recommendations will appear here based on guest preferences"
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {(showAllRecommendations ? filteredRecommendations : filteredRecommendations.slice(0, 5)).map((song, index) => (
                        <RecommendationCard
                          key={song.id}
                          song={song}
                          index={index}
                          rank={index + 1}
                          addedSongs={addedSongs}
                          addToQueue={addToQueue}
                          getSourceBadge={getSourceBadge}
                          harmonicFlowEnabled={smartFilters.harmonicFlow}
                          selectedSong={selectedSongForHarmonic}
                          onSongSelect={setSelectedSongForHarmonic}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  {filteredRecommendations.length > 5 && !showAllRecommendations && (
                    <div className="text-center pt-2">
                      <Button
                        onClick={() => setShowAllRecommendations(true)}
                        className="glass-effect bg-[var(--neon-purple)]/10 hover:bg-[var(--neon-purple)]/20 border border-[var(--neon-purple)]/50 hover:border-[var(--neon-purple)] text-[var(--neon-purple)]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Load ({filteredRecommendations.length - 5}) more songs
                      </Button>
                    </div>
                  )}
                  {showAllRecommendations && filteredRecommendations.length > 5 && (
                    <div className="text-center pt-2">
                      <Button
                        onClick={() => setShowAllRecommendations(false)}
                        variant="ghost"
                        className="text-gray-400 hover:text-white"
                      >
                        Show Less
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="discovery-queue" className="space-y-6 relative z-10">
              {/* Intelligent Search */}
              <Card className="glass-effect border-[var(--glass-border)] overflow-visible relative z-20">
                <CardContent className="pt-6 overflow-visible">
                  <IntelligentSearch
                    onTrackSelected={handleSearchTrackSelected}
                    placeholder="Search for track..."
                    autoFocus={false}
                    className="relative z-30"
                  />
                </CardContent>
              </Card>

              {/* Crowd Insights Card - Moved from Sidebar */}
              <Card className="glass-effect border-[var(--glass-border)] hover:border-[var(--neon-purple)]/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2 text-white text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/10">
                      <TrendingUp className="w-6 h-6 text-[var(--neon-purple)]" />
                    </div>
                    Crowd Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Top Genres and Top Decades - Side by Side */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Top Genres */}
                    {insights?.topGenres && (
                      <div>
                        <h4 className="text-sm font-medium text-white mb-3">Top Genres</h4>
                        <div className="space-y-3">
                          {insights.topGenres.slice(0, 3).map((genre: any) => (
                            <div key={genre.name} className="group">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-white group-hover:text-[var(--neon-purple)] transition-colors">{genre.name}</span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toast.success(`Finding ${genre.name} tracks...`);
                                          }}
                                        >
                                          <Music className="w-3 h-3 text-[var(--neon-purple)]" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Find {genre.name} songs</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <span className="text-sm text-[var(--neon-purple)]">{genre.percentage}%</span>
                              </div>
                              <div className="relative h-2 bg-gray-800/50 rounded-full overflow-hidden">
                                <div 
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] rounded-full transition-all duration-500"
                                  style={{ width: `${genre.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Top Decades */}
                    {insights?.topDecades && (
                      <div>
                        <h4 className="text-sm font-medium text-white mb-3">Top Decades</h4>
                        <div className="space-y-3">
                          {insights.topDecades.slice(0, 3).map((decade: any) => (
                            <div key={decade.decade} className="group">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-white group-hover:text-[var(--neon-cyan)] transition-colors">{decade.decade}</span>
                                <span className="text-sm text-[var(--neon-cyan)]">{decade.percentage}%</span>
                              </div>
                              <div className="relative h-2 bg-gray-800/50 rounded-full overflow-hidden">
                                <div 
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] rounded-full transition-all duration-500"
                                  style={{ width: `${decade.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Top Artists Column */}
                      {insights?.topArtists && (
                        <div>
                          <h4 className="text-sm font-medium text-white mb-3">Top Artists</h4>
                          {/* Top row: Artists 1-3 */}
                          <div className="flex items-center justify-around gap-2 mb-4">
                            {[
                              { name: 'Kygo', image: 'https://images.unsplash.com/photo-1601642965991-43f29377082b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxreWdvJTIwZGolMjBhcnRpc3R8ZW58MXx8fHwxNzYxMDIzODQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                              { name: 'Robin Schulz', image: 'https://images.unsplash.com/photo-1549045508-cf64fd077a0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZG0lMjBkaiUyMHBlcmZvcm1lcnxlbnwxfHx8fDE3NjEwMjM4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                              { name: 'Lost Frequencies', image: 'https://images.unsplash.com/photo-1663081026395-cde8824e1aac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3N0JTIwZnJlcXVlbmNpZXMlMjBkanxlbnwxfHx8fDE3NjEwMjM4NDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' }
                            ].map((artist, index) => (
                              <div key={artist.name} className="group flex flex-col items-center gap-2 relative cursor-pointer">
                                <div className="relative flex-shrink-0">
                                  <ImageWithFallback
                                    src={artist.image}
                                    alt={artist.name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-[var(--neon-purple)]/30 group-hover:border-[var(--neon-purple)] transition-all"
                                  />
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-purple)]/80 rounded-full flex items-center justify-center text-[4px]">
                                    <span className="text-white text-xs font-bold text-[11px]">{index + 1}</span>
                                  </div>
                                  {/* Hover action */}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full flex items-center justify-center"
                                          onClick={() => {
                                            toast.success(`Adding top 3 ${artist.name} songs to queue...`);
                                          }}
                                        >
                                          <Plus className="w-5 h-5 text-white" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Add top 3 {artist.name} songs</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <span className="text-xs text-gray-300 text-center">{artist.name}</span>
                              </div>
                            ))}
                          </div>
                          {/* Bottom row: Artists 4-5 */}
                          <div className="flex items-center justify-center gap-8">
                            {[
                              { name: 'Calvin Harris', image: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwbXVzaWMlMjBkanxlbnwxfHx8fDE3NjA5NTc0NDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
                              { name: 'Avicii', image: 'https://images.unsplash.com/photo-1536295677096-0aafbaa8e22c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdmljaWklMjBkaiUyMGFydGlzdHxlbnwxfHx8fDE3NjEwMjM4NDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' }
                            ].map((artist, index) => (
                              <div key={artist.name} className="group flex flex-col items-center gap-2 relative cursor-pointer">
                                <div className="relative flex-shrink-0">
                                  <ImageWithFallback
                                    src={artist.image}
                                    alt={artist.name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-[var(--neon-purple)]/30 group-hover:border-[var(--neon-purple)] transition-all"
                                  />
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-purple)]/80 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">{index + 4}</span>
                                  </div>
                                  {/* Hover action */}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full flex items-center justify-center"
                                          onClick={() => {
                                            toast.success(`Adding top 3 ${artist.name} songs to queue...`);
                                          }}
                                        >
                                          <Plus className="w-5 h-5 text-white" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Add top 3 {artist.name} songs</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <span className="text-xs text-gray-300 text-center">{artist.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Emerging Artists Column */}
                      <div className="border-l border-[var(--glass-border)] pl-4">
                        <h4 className="text-sm font-medium text-white mb-3">Emerging Artists</h4>
                        <p className="text-xs text-gray-400 mb-3">Artists in many guests' libraries but not yet played</p>
                        {/* Top row: Artists 1-3 */}
                        <div className="flex items-center justify-around gap-2 mb-4">
                          {[
                            { name: 'Glass Animals', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400' },
                            { name: 'Tame Impala', image: 'https://images.unsplash.com/photo-1524650359799-842906ca1c06?w=400' },
                            { name: 'ODESZA', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400' }
                          ].map((artist, index) => (
                            <div key={artist.name} className="flex flex-col items-center gap-2">
                              <div className="relative flex-shrink-0">
                                <ImageWithFallback
                                  src={artist.image}
                                  alt={artist.name}
                                  className="w-14 h-14 rounded-full object-cover border-2 border-[var(--neon-pink)]/30"
                                />
                              </div>
                              <span className="text-xs text-gray-300 text-center">{artist.name}</span>
                            </div>
                          ))}
                        </div>
                        {/* Bottom row: Artists 4-5 */}
                        <div className="flex items-center justify-center gap-8">
                          {[
                            { name: 'Jungle', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
                            { name: 'Big Wild', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400' }
                          ].map((artist, index) => (
                            <div key={artist.name} className="flex flex-col items-center gap-2">
                              <div className="relative flex-shrink-0">
                                <ImageWithFallback
                                  src={artist.image}
                                  alt={artist.name}
                                  className="w-14 h-14 rounded-full object-cover border-2 border-[var(--neon-pink)]/30"
                                />
                              </div>
                              <span className="text-xs text-gray-300 text-center">{artist.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  


                    {/* Audience Profile */}
                    {insights?.audienceProfile && (
                      <div>
                        <h4 className="text-sm font-medium text-white mb-3">Audience Profile</h4>
                        <div className={`p-4 rounded-lg border ${
                          insights.audienceProfile.avgPopularity > 80 
                            ? 'bg-gradient-to-br from-[var(--neon-purple)]/10 to-[var(--neon-pink)]/5 border-[var(--neon-purple)]/30'
                            : insights.audienceProfile.avgPopularity >= 50
                            ? 'bg-gradient-to-br from-[var(--neon-cyan)]/10 to-[var(--neon-blue)]/5 border-[var(--neon-cyan)]/30'
                            : 'bg-gradient-to-br from-[var(--neon-yellow)]/10 to-[var(--neon-yellow)]/5 border-[var(--neon-yellow)]/30'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={
                              insights.audienceProfile.avgPopularity > 80
                                ? 'bg-[var(--neon-purple)]/20 text-[var(--neon-purple)] border-[var(--neon-purple)]/30 px-3 py-1'
                                : insights.audienceProfile.avgPopularity >= 50
                                ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30 px-3 py-1'
                                : 'bg-[var(--neon-yellow)]/20 text-[var(--neon-yellow)] border-[var(--neon-yellow)]/30 px-3 py-1'
                            }>
                              {insights.audienceProfile.profile}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 text-gray-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>Average popularity of crowd's top 50 tracks. Tells you how safe or experimental you can be.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <span className="text-xs text-gray-400">Avg: {insights.audienceProfile.avgPopularity}%</span>
                            </div>
                          </div>
                          <Progress value={insights.audienceProfile.avgPopularity} className="h-2 mb-3" />
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {insights.audienceProfile.insight}
                          </p>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Discovery Queue Header */}
              <div>
                <h3 className="text-lg font-semibold text-white text-[20px]">Discovery Queue</h3>
                <p className="text-sm text-gray-400">
                  Smart creative risks based on a high theme match
                </p>
              </div>


              {loadingDiscovery ? (
                <Card className="glass-effect border-[var(--glass-border)]">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--neon-pink)]/20 to-[var(--neon-pink)]/10 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-[var(--neon-pink)] animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      Analyzing theme match...
                    </h3>
                    <p className="text-gray-400">
                      Finding  hidden anthems
                    </p>
                  </CardContent>
                </Card>
              ) :  discoveryQueue.anthems.length === 0 ? (
                <Card className="glass-effect border-[var(--glass-border)]">
                  <CardContent className="p-12 text-center">
                    <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Discovery suggestions will appear here once more guest data is available
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Anthems Section */}
                  {discoveryQueue.anthems.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-[var(--glass-border)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Radio className="w-5 h-5 text-[var(--neon-pink)]" />
                          <h4 className="font-semibold text-white">Hidden Anthems</h4>
                          <Badge className="bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] border-[var(--neon-pink)]/30 text-xs">
                            High Theme Match / Low Popularity
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {/* Refresh anthems */}}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-[var(--neon-pink)]"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">
                        Perfect fits for the vibe that aren't overplayed. Safe creative choices that feel fresh.
                      </p>
                      
                      {(showAllAnthems ? discoveryQueue.anthems : discoveryQueue.anthems.slice(0, 2)).map((song, index) => (
                        <Card key={song.id} className="glass-effect border-[var(--glass-border)] hover:border-[var(--neon-pink)]/50 transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Album Cover */}
                              <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden">
                                <ImageWithFallback
                                  src={getAlbumCover(song.id)}
                                  alt={song.title || song.name || 'Track'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="text-lg font-bold text-white">{song.title || song.name}</h4>
                                  <Badge className="bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] border-[var(--neon-pink)]/30 text-xs">
                                    {song.themeMatch}% Theme Match
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-300 mb-2">{song.artist}</p>
                                
                                {/* Metrics */}
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-lg font-bold text-[var(--neon-pink)]">
                                      {Math.round(song.matchScore || song.popularity || 55)}%
                                    </span>
                                    <span className="text-xs text-gray-400">Crowd Match</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-[var(--neon-purple)]">
                                      {Math.round(song.themeMatch || 90)}%
                                    </span>
                                    <span className="text-xs text-gray-400">Theme Match</span>
                                  </div>
                                </div>
                                
                                {/* Theme Description */}
                                <div className="text-sm text-[var(--neon-pink)] italic">
                                  {song.passionDescription}
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  size="sm" 
                                  onClick={() => addToQueue({...song, source: 'hidden-anthems'})}
                                  disabled={addedSongs.has(song.id)}
                                  className={`transition-all duration-500 transform hover:scale-105 ${
                                    addedSongs.has(song.id) 
                                      ? 'bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] text-black shadow-lg shadow-[var(--neon-cyan)]/25' 
                                      : 'bg-[var(--neon-pink)] text-white hover:shadow-lg hover:shadow-[var(--neon-pink)]/25'
                                  }`}
                                >
                                  {addedSongs.has(song.id) ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Added!
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4 mr-1" />
                                      Add
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {discoveryQueue.anthems.length > 2 && !showAllAnthems && (
                        <div className="text-center pt-2">
                          <Button
                            onClick={() => setShowAllAnthems(true)}
                            className="glass-effect bg-[var(--neon-pink)]/10 hover:bg-[var(--neon-pink)]/20 border border-[var(--neon-pink)]/50 hover:border-[var(--neon-pink)] text-[var(--neon-pink)]"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Load  ({discoveryQueue.anthems.length - 2} more)
                          </Button>
                        </div>
                      )}
                      {showAllAnthems && discoveryQueue.anthems.length > 2 && (
                        <div className="text-center pt-2">
                          <Button
                            onClick={() => setShowAllAnthems(false)}
                            variant="ghost"
                            className="text-gray-400 hover:text-white"
                          >
                            Show Less
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="queue" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[20px]">Queue</h3>
                  {currentQueue.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {currentSongIndex + 1} of {currentQueue.length} songs
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setExportDialogOpen(true)}
                    disabled={currentQueue.length === 0}
                    className="glass-effect border-green-500/40 hover:border-green-500/60 hover:bg-green-500/10"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export to Spotify
                  </Button>
                </div>
              </div>

              {currentQueue.length === 0 ? (
                <Card className="glass-effect border-[var(--glass-border)]">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-blue)]/20 flex items-center justify-center animate-float">
                      <Music className="w-10 h-10 text-[var(--neon-cyan)]" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      Queue is Empty
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {connectedPlaylist ? 'Add AI recommendations to get the party started!' : 'Connect a playlist or add recommendations to begin!'}
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect text-xs text-[var(--neon-purple)]">
                      <Sparkles className="w-3 h-3" />
                      AI is ready to suggest perfect tracks
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-3">
                      {currentQueue.map((song, index) => (
                        <DraggableQueueItem
                          key={song.id}
                          song={song}
                          index={index}
                          currentSongIndex={currentSongIndex}
                          onPlaySong={playSong}
                          onRemoveFromQueue={removeFromQueue}
                          onReturnToList={returnToList}
                          onMoveItem={moveItem}
                          getSourceBadge={getSourceBadge}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                  <div className="mt-6 p-4 glass-effect rounded-xl border border-[var(--glass-border)] text-xs text-center">
                    <div className="flex items-center justify-center gap-2 text-[var(--neon-cyan)] mb-2">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-medium">Pro Tips</span>
                    </div>
                    <p className="text-gray-400">
                      Drag songs to reorder the queue • Hover over album covers to preview • Click a song to play
                    </p>
                  </div>
                </DndProvider>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Sidebar - Queue (Permanent) */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-6 overflow-visible"
        >
          {/* Queue - Now permanent in sidebar */}
          <Card className="glass-effect border-[var(--glass-border)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white font-[Chango]">
                  <List className="w-5 h-5 text-[var(--neon-cyan)]" />
                  Queue
                </CardTitle>
                {currentQueue.length > 0 && (
                  <Badge className="bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30">
                    {currentSongIndex + 1} of {currentQueue.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQueue.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-blue)]/20 flex items-center justify-center">
                    <Music className="w-8 h-8 text-[var(--neon-cyan)]" />
                  </div>
                  <p className="text-sm text-gray-400">
                    Queue is empty
                  </p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[400px]">
                    <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
                      <AnimatePresence mode="popLayout">
                        <div className="space-y-2">
                          {currentQueue.slice(0, 10).map((song, index) => (
                            <DraggableQueueItem
                              key={song.id}
                              song={song}
                              index={index}
                              currentSongIndex={currentSongIndex}
                              onPlaySong={playSong}
                              onRemoveFromQueue={removeFromQueue}
                              onReturnToList={returnToList}
                              onMoveItem={moveItem}
                              getSourceBadge={getSourceBadge}
                            />
                          ))}
                        </div>
                      </AnimatePresence>
                    </DndProvider>
                  </ScrollArea>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setExportDialogOpen(true)}
                      disabled={currentQueue.length === 0}
                      className="w-full glass-effect border-green-500/40 hover:border-green-500/60 hover:bg-green-500/10 text-green-400"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export to Spotify
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        if (trashedSongs.length > 0) {
                          setCurrentQueue([...currentQueue, ...trashedSongs]);
                          setTrashedSongs([]);
                          toast.success('Restored trashed songs to queue!');
                        }
                      }}
                      disabled={trashedSongs.length === 0}
                      className={`w-full glass-effect ${
                        trashedSongs.length === 0 
                          ? 'border-gray-600/40 text-gray-600 cursor-not-allowed opacity-50' 
                          : 'border-[var(--neon-purple)]/40 hover:border-[var(--neon-purple)]/60 hover:bg-[var(--neon-purple)]/10 text-[var(--neon-purple)]'
                      }`}
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      Restore Trashed Songs {trashedSongs.length > 0 && `(${trashedSongs.length})`}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Spotify Playlist Embed - Show on Discovery tab */}
          {activeTab === 'discovery-queue' && (
            <Card className="glass-effect border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Music className="w-5 h-5 text-green-500" />
                  Connected Playlist
                </CardTitle>
                {connectedPlaylist && (
                  <CardDescription className="text-muted-foreground text-sm">
                    {connectedPlaylist.name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedPlaylist ? (
                  <div className="space-y-3">
                    {/* Spotify Embed Placeholder */}
                    <div className="aspect-square w-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30 flex items-center justify-center overflow-hidden">
                      <div className="text-center p-4">
                        <div className="w-16 h-16 mx-auto mb-3 bg-green-500 rounded-full flex items-center justify-center">
                          <Music className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-sm text-white font-medium mb-1">{connectedPlaylist.name}</p>
                        <p className="text-xs text-muted-foreground">{connectedPlaylist.trackCount} tracks</p>
                      </div>
                    </div>
                    <Button
                      onClick={onConnectPlaylist}
                      variant="outline"
                      size="sm"
                      className="w-full glass-effect border-green-500/40 hover:bg-green-500/10 text-green-400"
                    >
                      <RefreshCw className="w-3 h-3 mr-2" />
                      Change Playlist
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="aspect-square w-full bg-gradient-to-br from-gray-500/10 to-gray-600/10 rounded-lg border border-border/30 flex items-center justify-center">
                      <div className="text-center p-4">
                        <Music className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No playlist connected</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowPlaylistDialog(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Connect Spotify
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
        </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userType="dj"
        username={event.code}
      />

      {/* Spotify Playlist Selection Dialog */}
      <Dialog open={showPlaylistDialog} onOpenChange={setShowPlaylistDialog}>
        <DialogContent className="sm:max-w-2xl glass-effect border-green-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Music className="w-6 h-6 text-green-500" />
              Connect Spotify Playlist
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select a playlist to analyze tracks and add them to your queue
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {MOCK_SPOTIFY_PLAYLISTS.map((playlist) => (
              <Card
                key={playlist.id}
                className="glass-effect border-green-500/30 hover:border-green-500/60 transition-all cursor-pointer group"
                onClick={() => handleSelectPlaylist(playlist)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Music className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-1">{playlist.name}</h4>
                      <p className="text-sm text-gray-400">{playlist.trackCount} tracks</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      onClick={() => handleSelectPlaylist(playlist)}
                    >
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Smart Filters Sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-[var(--dark-bg)] border-[var(--glass-border)]">
          <SheetHeader className="sr-only">
            <SheetTitle>Smart Filters</SheetTitle>
            <SheetDescription>Configure your music filtering preferences</SheetDescription>
          </SheetHeader>
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-[var(--dark-bg)] pb-[16px] mb-2 border-b border-[var(--glass-border)] pt-[50px] pr-[0px] pl-[0px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 px-[20px] py-[0px]">
                <div className="rounded-lg bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/10 py-[0px] p-[8px]">
                  <Filter className="w-5 h-5 text-[var(--neon-purple)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Smart Filters</h3>
                  {(smartFilters.noExplicit || smartFilters.preventArtistRepetition || smartFilters.eraFilterEnabled || smartFilters.minEnergy > 0 || smartFilters.maxEnergy < 100 || smartFilters.minDanceability > 0 || smartFilters.maxDanceability < 100 || smartFilters.minValence > 0 || smartFilters.maxValence < 100 || smartFilters.vocalFocus) && (
                    <Badge className="bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30">
                      {[
                        smartFilters.noExplicit,
                        smartFilters.preventArtistRepetition,
                        smartFilters.eraFilterEnabled,
                        smartFilters.minEnergy > 0 || smartFilters.maxEnergy < 100,
                        smartFilters.minDanceability > 0 || smartFilters.maxDanceability < 100,
                        smartFilters.minValence > 0 || smartFilters.maxValence < 100,
                        smartFilters.vocalFocus
                      ].filter(Boolean).length} active
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const resetFilters = {
                    noExplicit: false,
                    preventArtistRepetition: true,
                    artistCooldownMinutes: 30,
                    eraMinDecade: 1980,
                    eraMaxDecade: 2020,
                    eraFilterEnabled: false,
                    minEnergy: 0,
                    maxEnergy: 100,
                    minDanceability: 0,
                    maxDanceability: 100,
                    minValence: 0,
                    maxValence: 100,
                    vocalFocus: false
                  };
                  setSmartFilters(resetFilters);
                  eventApi.updateSmartFilters(event.code, resetFilters);
                  loadEventInsights();
                }}
                className="text-gray-400 hover:text-white hover:bg-[var(--neon-purple)]/10"
              >
                Reset All
              </Button>
            </div>
            <p className="text-sm text-gray-400 py-[0px] pt-[0px] pr-[10px] pb-[0px] pl-[25px]">Fine-tune your AI recommendations with advanced filtering options</p>
          </div>
          
          <ScrollArea className="h-[calc(100vh-160px)] pr-4">
            <SmartFilters
              eventCode={event.code}
              currentFilters={smartFilters}
              hostPreferences={event.vibeProfile}
              onFiltersUpdated={(newFilters) => {
                setSmartFilters(newFilters);
                // Optionally trigger a refresh of recommendations with the new filters
                loadEventInsights();
              }}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Tip Jar Sheet */}
      <Sheet open={tipJarSheetOpen} onOpenChange={setTipJarSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-[var(--dark-bg)] border-[var(--glass-border)]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white">
              <DollarSign className="w-6 h-6 text-[#10b981]" />
              Tip Jar
            </SheetTitle>
            <SheetDescription className="text-gray-400">
              View tips from guests and their song requests
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <TipJar 
              eventId={event.id}
              eventCode={event.code}
              eventName={event.eventName || event.name}
              onAddToQueue={(tip) => {
                // Add tip request to queue with special badge
                if (tip.trackName) {
                  const tipTrackForQueue = {
                    id: `tip-${tip.id}`,
                    name: tip.trackName,
                    artist: tip.trackArtist || 'Unknown Artist',
                    duration: '3:30',
                    source: 'tip-request',
                    tipAmount: tip.amount,
                    guestName: tip.guestName,
                    crowdScore: tip.crowdScore,
                    themeMatch: tip.themeMatch,
                    album: 'Tip Request',
                  };
                  addToQueue(tipTrackForQueue);
                  toast.success(`Added "${tip.trackName}" from ${tip.guestName}'s $${tip.amount} tip to queue!`);
                }
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Export to Spotify Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="glass-effect border-primary/30 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="gradient-text text-2xl flex items-center gap-2">
              <Download className="w-6 h-6" />
              Export Queue to Spotify
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new playlist or add to an existing one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Create New Playlist */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                  1
                </div>
                <h4 className="text-white font-medium">Create New Playlist</h4>
              </div>
              <div className="ml-10 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="playlist-name" className="text-sm text-muted-foreground">
                    Playlist Name
                  </Label>
                  <Input
                    id="playlist-name"
                    placeholder={`${event.eventName || event.name || 'Event'} - QRate Mix`}
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="glass-effect border-border/50 focus:border-green-500/50"
                  />
                </div>
                <Button
                  onClick={() => {
                    const playlistName = newPlaylistName || `${event.eventName || event.name || 'Event'} - QRate Mix`;
                    alert(`Creating new Spotify playlist: "${playlistName}" with ${currentQueue.length} songs.\n\nNote: Spotify integration coming soon!`);
                    setExportDialogOpen(false);
                    setNewPlaylistName('');
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Playlist ({currentQueue.length} songs)
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/50"></div>
              <span className="text-xs text-muted-foreground uppercase">or</span>
              <div className="flex-1 h-px bg-border/50"></div>
            </div>

            {/* Add to Existing Playlist */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                  2
                </div>
                <h4 className="text-white font-medium">Add to Existing Playlist</h4>
              </div>
              <div className="ml-10 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select a Spotify playlist to add these tracks to
                </p>
                
                {/* Mock existing playlists */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[
                    { id: '1', name: 'Party Hits 2024', tracks: 87 },
                    { id: '2', name: 'My Weekend Mix', tracks: 142 },
                    { id: '3', name: 'DJ Favorites', tracks: 203 }
                  ].map((playlist) => (
                    <Button
                      key={playlist.id}
                      onClick={() => {
                        alert(`Adding ${currentQueue.length} songs to "${playlist.name}".\n\nNote: Spotify integration coming soon!`);
                        setExportDialogOpen(false);
                      }}
                      variant="outline"
                      className="w-full justify-start glass-effect border-border/40 hover:border-cyan-500/60 hover:bg-cyan-500/10 text-left"
                    >
                      <List className="w-4 h-4 mr-3 text-cyan-400" />
                      <div className="flex-1">
                        <div className="font-medium text-white">{playlist.name}</div>
                        <div className="text-xs text-muted-foreground">{playlist.tracks} tracks</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="glass-effect p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
              <p className="text-sm text-muted-foreground">
                💡 <span className="font-semibold text-white">Coming Soon:</span> Direct Spotify integration will allow you to export your queue instantly!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DJDashboard;