// Refactored DJ Dashboard Component
// This is the main orchestrator that uses custom hooks and sub-components
// The original 2000+ line file has been broken down for better maintainability

import { useState, useEffect, useRef, forwardRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';

// UI Components
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// Icons
import { 
  TrendingUp, TrendingDown, CheckCircle, Sparkles, GripVertical, 
  Pause, Play, Trash2, Undo2, Info, Lightbulb, Star, Music, 
  List, Download, Plus, Loader2, Filter, DollarSign, RefreshCw 
} from 'lucide-react';

// Custom Hooks
import { useDJDashboardState, type Track, type Playlist } from '../hooks/useDJDashboardState';
import { useQueueManagement } from '../hooks/useQueueManagement';
import { useEventInsightsManagement } from '../hooks/useEventInsightsManagement';
import { useDiscoveryQueue } from '../hooks/useDiscoveryQueue';
import { useTipManagement } from '../hooks/useTipManagement';
import { useSmartFilters } from '../hooks/useSmartFilters';

// Dashboard Components
import { DashboardHeader } from './dj-dashboard/DashboardHeader';
import { DashboardActions } from './dj-dashboard/DashboardActions';
import { QueueSidebar } from './dj-dashboard/QueueSidebar';
import { RecommendationsTabContent } from './dj-dashboard/RecommendationsTabContent';
import { DiscoveryTabContent } from './dj-dashboard/DiscoveryTabContent';

// Other Components
import SmartFilters from './SmartFilters';
import SettingsDialog from './SettingsDialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { RefreshNotification } from './RefreshNotification';
import TipJar from './TipJar';

// Utils
import { eventApi, utils } from '../utils/api';
import { 
  getAlbumCover, 
  getSourceBadge, 
  getSongMetric, 
  getHarmonicDescription,
  generateCamelotKey,
  isTouchDevice,
  MOCK_SPOTIFY_PLAYLISTS
} from '../utils/djDashboardHelpers';

// Assets
import djBackgroundImage from 'figma:asset/4efcd9e7df3cb63199cafe38a1c1eb2a6a9605aa.png';

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
  insights?: any;
  vibeProfile?: any;
}

interface DJDashboardProps {
  event: Event;
  onBack: () => void;
  onShowQRCode: () => void;
  onConnectPlaylist: () => void;
  onUpdateEvent?: (updatedEvent: Event) => void;
  isLoading?: boolean;
}

/**
 * Recommendation Card Component (kept local as it's tightly coupled to this view)
 */
const RecommendationCard = forwardRef<HTMLDivElement, any>(({ 
  song, index, rank, addedSongs, addToQueue, getSourceBadge, 
  harmonicFlowEnabled, selectedSong, onSongSelect 
}, ref) => {
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
            {/* Ranking Number with Badge */}
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
              {!addedSongs.has(song.id) && (
                <Button
                  size="sm"
                  onClick={handlePlayPreview}
                  className="absolute inset-0 w-full h-full bg-black/60 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center p-0 hover:bg-black/70"
                >
                  {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                </Button>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="text-lg text-white group-hover:text-[#FFBE0B] transition-colors font-[Candal] font-bold font-normal">{songTitle}</h4>
                {addedSongs.has(song.id) && (
                  <Badge className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] text-black text-xs animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Added!
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-300 mb-2">{songArtist}</p>
              
              {/* Scores */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1.5">
                  {song.rankChange !== undefined && song.rankChange !== 0 && (
                    song.rankChange > 0 ? <TrendingUp className="w-5 h-5 text-[#00ff00]" /> : <TrendingDown className="w-5 h-5 text-[#FF006E]" />
                  )}
                  <span className="text-2xl font-bold text-[rgb(255,190,11)]">{Math.round(song.matchScore || 75)}%</span>
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

/**
 * Draggable Queue Item Component (kept local as it's tightly coupled to this view)
 */
function DraggableQueueItem({ 
  song, 
  index, 
  currentSongIndex, 
  onPlaySong, 
  onRemoveFromQueue, 
  onReturnToList,
  onMoveItem, 
  getSourceBadge 
}: any) {
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
    setTimeout(() => setIsPlaying(false), 2000);
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-handle]') || target.closest('button')) {
      return;
    }
    if (!isDragging) {
      onPlaySong(index);
    }
  };

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
            onReturnToList(song.id, song.source);
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showPlayButton || isPlaying ? 1 : 0 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
                onClick={handlePlayPreview}
              >
                {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
              </motion.div>
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

/**
 * Main DJ Dashboard Component
 * Orchestrates all the hooks and components
 */
function DJDashboard({ event, onBack, onShowQRCode, onConnectPlaylist, onUpdateEvent, isLoading = false }: DJDashboardProps) {
  // Initialize all state using custom hook
  const state = useDJDashboardState();
  
  // Derived values
  const eventName = event.eventName || event.name || 'Event';
  const totalGuests = state.insights?.totalGuests || event.guestCount || 128;

  // Initialize queue management
  const {
    addToQueue,
    removeFromQueue,
    returnToList,
    skipToNext,
    playSong,
    moveItem
  } = useQueueManagement({
    currentQueue: state.currentQueue,
    setCurrentQueue: state.setCurrentQueue,
    currentSongIndex: state.currentSongIndex,
    setCurrentSongIndex: state.setCurrentSongIndex,
    setAddedSongs: state.setAddedSongs,
    setTrashedSongs: state.setTrashedSongs,
    setRecommendations: state.setRecommendations,
    setRemovedAnthems: state.setRemovedAnthems,
    setRemovedDeepCuts: state.setRemovedDeepCuts,
    recommendations: state.recommendations
  });

  // Initialize event insights management
  const { loadEventInsights, refreshRecommendations } = useEventInsightsManagement({
    eventCode: event.code,
    eventGuestCount: event.guestCount || 0,
    eventPreferences: event.preferences || [],
    loadingInsights: state.loadingInsights,
    setLoadingInsights: state.setLoadingInsights,
    recommendations: state.recommendations,
    setRecommendations: state.setRecommendations,
    insights: state.insights,
    setInsights: state.setInsights,
    setPreviousCrowdScore: state.setPreviousCrowdScore,
    refreshing: state.refreshing,
    setRefreshing: state.setRefreshing,
    hasNewUpdates: state.hasNewUpdates,
    setHasNewUpdates: state.setHasNewUpdates,
    setPreviousRecommendations: state.setPreviousRecommendations,
    setPreviousRanks: state.setPreviousRanks,
    setActiveTab: state.setActiveTab,
    newGuestsToAdd: state.newGuestsToAdd,
    setNewGuestsToAdd: state.setNewGuestsToAdd
  });

  // Initialize discovery queue
  const { loadDiscoveryQueue } = useDiscoveryQueue({
    eventCode: event.code,
    loadingDiscovery: state.loadingDiscovery,
    setLoadingDiscovery: state.setLoadingDiscovery,
    discoveryQueue: state.discoveryQueue,
    setDiscoveryQueue: state.setDiscoveryQueue
  });

  // Initialize tip management
  useTipManagement({
    eventId: event.id,
    totalTipAmount: state.totalTipAmount,
    setTotalTipAmount: state.setTotalTipAmount,
    hasNewTips: state.hasNewTips,
    setHasNewTips: state.setHasNewTips
  });

  // Initialize smart filters
  const { applySmartFilters, applyHarmonicFlow } = useSmartFilters({
    smartFilters: state.smartFilters,
    currentQueue: state.currentQueue,
    selectedSongForHarmonic: state.selectedSongForHarmonic
  });

  // Apply filters to recommendations
  let filteredRecommendations = applySmartFilters(state.recommendations);
  filteredRecommendations = applyHarmonicFlow(filteredRecommendations);

  // Sort guest suggestions by matchScore
  const filteredGuestSuggestions = applySmartFilters(state.guestSuggestions).sort(
    (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
  );

  // Auto-add playlist songs to queue when playlist is connected
  useEffect(() => {
    if (state.connectedPlaylist && state.connectedPlaylist.tracks) {
      state.setCurrentQueue(prev => [...prev, ...state.connectedPlaylist!.tracks.slice(0, 5)]);
    }
  }, [state.connectedPlaylist]);

  // Initialize queue from saved event data and load insights
  useEffect(() => {
    if (event.finalQueue && event.finalQueue.length > 0) {
      console.log('📀 Loading saved queue from event data:', event.finalQueue.length, 'tracks');
      state.setCurrentQueue(event.finalQueue);
    }
    if (event.insights) {
      console.log('📊 Loading saved insights from event data');
      state.setInsights(event.insights);
    }
  }, []);

  // Simulate periodic updates to trigger toast notifications
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      if (state.recommendations.length > 0 && !state.refreshing && !state.loadingInsights) {
        console.log('🔄 Simulating new updates available...');
        state.setHasNewUpdates(true);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(simulationInterval);
  }, [state.recommendations, state.refreshing, state.loadingInsights]);

  // Auto-save queue and DJ booth data whenever it changes
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (state.currentQueue.length > 0 && onUpdateEvent) {
        const updatedEvent = {
          ...event,
          finalQueue: state.currentQueue,
          insights: state.insights,
          connectedPlaylist: state.connectedPlaylist || undefined
        };
        console.log('💾 Auto-saving DJ booth data:', {
          queueLength: state.currentQueue.length,
          hasInsights: !!state.insights,
          hasPlaylist: !!state.connectedPlaylist
        });
        onUpdateEvent(updatedEvent);
        state.setLastSaved(new Date());
      }
    }, 5000); // Save after 5 seconds of inactivity

    return () => clearTimeout(saveTimeout);
  }, [state.currentQueue, state.insights, state.connectedPlaylist]);

  // Load event insights and recommendations when component mounts
  useEffect(() => {
    if (!state.dataLoaded) {
      loadEventInsights();
      loadDiscoveryQueue();
      state.setDataLoaded(true);
    }
  }, [event.code, state.dataLoaded]);

  // Show toast notification when updates are available
  useEffect(() => {
    if (state.hasNewUpdates && !state.refreshing && !state.loadingInsights && state.recommendations.length > 0) {
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
      
      state.setNewGuestsToAdd(newGuests);
      
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
        duration: 30000,
      });
    }
  }, [state.hasNewUpdates]);

  const handleSearchTrackSelected = (track: any) => {
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

  const handleSelectPlaylist = (playlist: typeof MOCK_SPOTIFY_PLAYLISTS[0]) => {
    const tracksWithAnalysis = playlist.tracks.map(track => {
      const baseCrowdScore = 65 + Math.random() * 30;
      const themeMatch = 70 + Math.random() * 25;
      
      return {
        id: track.id,
        name: track.name,
        title: track.name,
        artist: track.artist,
        artists: [track.artist],
        album: track.album,
        duration: track.duration,
        source: 'spotify' as const,
        matchScore: Math.round(baseCrowdScore),
        crowdScore: Math.round(baseCrowdScore),
        themeMatch: Math.round(themeMatch),
        key: generateCamelotKey(track.id)
      };
    });
    
    state.setSelectedPlaylistTracks(tracksWithAnalysis);
    state.setConnectedPlaylist({
      id: playlist.id,
      name: playlist.name,
      trackCount: playlist.trackCount,
      tracks: tracksWithAnalysis
    });
    state.setShowPlaylistDialog(false);
    toast.success(`Connected to ${playlist.name}`);
  };

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <DashboardHeader
              eventName={eventName}
              eventCode={event.code}
              totalGuests={totalGuests}
              onBack={onBack}
              onShowQRCode={onShowQRCode}
              isLoading={isLoading}
            />
            
            <DashboardActions
              totalTipAmount={state.totalTipAmount}
              hasNewTips={state.hasNewTips}
              onOpenFilters={() => state.setFiltersOpen(true)}
              onOpenTipJar={() => state.setTipJarSheetOpen(true)}
              onOpenSettings={() => state.setSettingsOpen(true)}
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left 2/3 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Tabs */}
              <Tabs value={state.activeTab} onValueChange={state.setActiveTab} className="w-full overflow-visible">
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
                    Discovery ({state.discoveryQueue.anthems.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="recommendations" className="space-y-4">
                  <RecommendationsTabContent
                    filteredRecommendations={filteredRecommendations}
                    totalGuests={totalGuests}
                    loadingInsights={state.loadingInsights}
                    refreshing={state.refreshing}
                    hasNewUpdates={state.hasNewUpdates}
                    showAllRecommendations={state.showAllRecommendations}
                    addedSongs={state.addedSongs}
                    harmonicFlowEnabled={state.smartFilters.harmonicFlow}
                    selectedSong={state.selectedSongForHarmonic}
                    onRefresh={refreshRecommendations}
                    onSetShowAll={state.setShowAllRecommendations}
                    onAddToQueue={addToQueue}
                    onSongSelect={state.setSelectedSongForHarmonic}
                    getSourceBadge={getSourceBadge}
                    RecommendationCard={RecommendationCard}
                  />
                </TabsContent>
                
                <TabsContent value="discovery-queue" className="space-y-6 relative z-10">
                  <DiscoveryTabContent
                    loadingDiscovery={state.loadingDiscovery}
                    discoveryQueue={state.discoveryQueue}
                    insights={state.insights}
                    showAllAnthems={state.showAllAnthems}
                    addedSongs={state.addedSongs}
                    onSearchTrackSelected={handleSearchTrackSelected}
                    onSetShowAllAnthems={state.setShowAllAnthems}
                    onAddToQueue={addToQueue}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Sidebar - Queue */}
            <QueueSidebar
              currentQueue={state.currentQueue}
              currentSongIndex={state.currentSongIndex}
              trashedSongs={state.trashedSongs}
              setCurrentQueue={state.setCurrentQueue}
              setTrashedSongs={state.setTrashedSongs}
              onPlaySong={playSong}
              onRemoveFromQueue={removeFromQueue}
              onReturnToList={returnToList}
              onMoveItem={moveItem}
              onExport={() => state.setExportDialogOpen(true)}
              getSourceBadge={getSourceBadge}
              DraggableQueueItem={DraggableQueueItem}
            />
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={state.settingsOpen}
        onClose={() => state.setSettingsOpen(false)}
        userType="dj"
        username={event.code}
      />

      {/* Spotify Playlist Selection Dialog */}
      <Dialog open={state.showPlaylistDialog} onOpenChange={state.setShowPlaylistDialog}>
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
      <Sheet open={state.filtersOpen} onOpenChange={state.setFiltersOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-[var(--dark-bg)] border-[var(--glass-border)]">
          <SheetHeader className="sr-only">
            <SheetTitle>Smart Filters</SheetTitle>
            <SheetDescription>Configure your music filtering preferences</SheetDescription>
          </SheetHeader>
          <div className="sticky top-0 z-10 bg-[var(--dark-bg)] pb-[16px] mb-2 border-b border-[var(--glass-border)] pt-[50px] pr-[0px] pl-[0px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 px-[20px] py-[0px]">
                <div className="rounded-lg bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/10 py-[0px] p-[8px]">
                  <Filter className="w-5 h-5 text-[var(--neon-purple)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Smart Filters</h3>
                  {(state.smartFilters.noExplicit || state.smartFilters.preventArtistRepetition || state.smartFilters.eraFilterEnabled || state.smartFilters.minEnergy > 0 || state.smartFilters.maxEnergy < 100 || state.smartFilters.minDanceability > 0 || state.smartFilters.maxDanceability < 100 || state.smartFilters.minValence > 0 || state.smartFilters.maxValence < 100 || state.smartFilters.vocalFocus) && (
                    <Badge className="bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30">
                      {[
                        state.smartFilters.noExplicit,
                        state.smartFilters.preventArtistRepetition,
                        state.smartFilters.eraFilterEnabled,
                        state.smartFilters.minEnergy > 0 || state.smartFilters.maxEnergy < 100,
                        state.smartFilters.minDanceability > 0 || state.smartFilters.maxDanceability < 100,
                        state.smartFilters.minValence > 0 || state.smartFilters.maxValence < 100,
                        state.smartFilters.vocalFocus
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
                    vocalFocus: false,
                    harmonicFlow: false
                  };
                  state.setSmartFilters(resetFilters);
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
              currentFilters={state.smartFilters}
              hostPreferences={event.vibeProfile}
              onFiltersUpdated={(newFilters) => {
                state.setSmartFilters(newFilters);
                loadEventInsights();
              }}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Tip Jar Sheet */}
      <Sheet open={state.tipJarSheetOpen} onOpenChange={state.setTipJarSheetOpen}>
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
                if (tip.trackName) {
                  const tipTrackForQueue: Track = {
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
      <Dialog open={state.exportDialogOpen} onOpenChange={state.setExportDialogOpen}>
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
          <div className="space-y-6 py-4">
            {/* Create New Playlist */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                  1
                </div>
                <h4 className="text-white font-medium">Create New Playlist</h4>
              </div>
              <div className="ml-10 space-y-3">
                <Input
                  placeholder="Enter playlist name..."
                  value={state.newPlaylistName}
                  onChange={(e) => state.setNewPlaylistName(e.target.value)}
                  className="glass-effect border-border/40 text-white placeholder:text-gray-500"
                />
                <Button
                  onClick={() => {
                    if (state.newPlaylistName.trim()) {
                      alert(`Creating playlist "${state.newPlaylistName}" with ${state.currentQueue.length} songs.\n\nNote: Spotify integration coming soon!`);
                      state.setExportDialogOpen(false);
                      state.setNewPlaylistName('');
                    }
                  }}
                  disabled={!state.newPlaylistName.trim()}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Playlist ({state.currentQueue.length} songs)
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
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
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[
                    { id: '1', name: 'Party Hits 2024', tracks: 87 },
                    { id: '2', name: 'My Weekend Mix', tracks: 142 },
                    { id: '3', name: 'DJ Favorites', tracks: 203 }
                  ].map((playlist) => (
                    <Button
                      key={playlist.id}
                      onClick={() => {
                        alert(`Adding ${state.currentQueue.length} songs to "${playlist.name}".\n\nNote: Spotify integration coming soon!`);
                        state.setExportDialogOpen(false);
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
                  ))}</div>
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
