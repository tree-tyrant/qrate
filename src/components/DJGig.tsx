// Refactored DJ Dashboard Component
// This is the main orchestrator that uses custom hooks and sub-components
// The original 2000+ line file has been broken down for better maintainability

import { useState, useEffect, useRef, forwardRef, useCallback, useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'motion/react';
import { toast } from 'sonner';

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
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

// Icons
import { 
  TrendingUp, TrendingDown, CheckCircle, Sparkles, GripVertical, 
  Pause, Play, Trash2, Undo2, Info, Lightbulb, Star, Music, 
  List, Download, Plus, Filter, DollarSign, AlertCircle, Loader2 
} from 'lucide-react';

// Custom Hooks
import { useDJDashboardState, type Track, type Playlist } from '../hooks/useDJDashboardState';
import { useQueueManagement } from '../hooks/useQueueManagement';
import { useEventInsightsManagement } from '../hooks/useEventInsightsManagement';
import { useDiscoveryQueue } from '../hooks/useDiscoveryQueue';
import { useTipManagement } from '../hooks/useTipManagement';
import { useSmartFilters } from '../hooks/useSmartFilters';
import { usePreviewController } from '../hooks/usePreviewController';

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
import type { Event as QRateEvent } from '@/utils/types';

// Utils
import { eventApi, utils } from '../utils/api';
import { 
  getAlbumCover, 
  getSourceBadge, 
  getSongMetric, 
  getHarmonicDescription,
  generateCamelotKey,
  MOCK_SPOTIFY_PLAYLISTS
} from '../utils/djDashboardHelpers';

// Assets
import djBackgroundImage from '../assets/djbackground.png';

type GigEvent = QRateEvent & {
  name?: string;
  theme?: string;
  connectedPlaylist?: QRateEvent['connectedPlaylist'] | Playlist;
};

interface DJGigProps {
  event: GigEvent;
  onBack: () => void;
  onShowQRCode: () => void;
  onConnectPlaylist: () => void;
  onUpdateEvent?: (updatedEvent: GigEvent) => void;
  isLoading?: boolean;
  isGuestAccess?: boolean;
  onRequestAuth?: () => void;
}

/**
 * Recommendation Card Component (kept local as it's tightly coupled to this view)
 */
const RecommendationCard = forwardRef<HTMLDivElement, any>(({ 
  song,
  index,
  rank,
  addedSongs,
  addToQueue,
  getSourceBadge,
  harmonicFlowEnabled,
  selectedSong,
  onSongSelect,
  onPreview,
  isPreviewing = false,
  isPreviewLoading = false,
  previewAvailable = true
}, ref) => {
  const songTitle = song.title || song.name || 'Unknown Track';
  const songArtist = Array.isArray(song.artists) ? song.artists.join(', ') : (song.artist || 'Unknown Artist');
  
  const handlePlayPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!previewAvailable) return;
    onPreview?.(song);
  };
  
  const isSelected = harmonicFlowEnabled && selectedSong?.id === song.id;
  const harmonicInfo = harmonicFlowEnabled && selectedSong && selectedSong.key && song.key 
    ? getHarmonicDescription(song.key, selectedSong.key) 
    : null;

  return (
    <motion.div
      ref={ref}
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
            <div className="flex flex-col flex-shrink-0 justify-center items-center gap-2 w-10">
              <span className="drop-shadow-lg font-[Audiowide] font-normal font-bold text-[24px] text-[rgb(255,190,11)] text-2xl">#{rank}</span>
              {getSourceBadge(song.source)}
            </div>
            
            {/* Album Cover with Play Button */}
            <div className="group/cover relative flex-shrink-0 rounded-xl w-14 h-14 overflow-hidden">
              <ImageWithFallback
                src={getAlbumCover(song.id)}
                alt={songTitle}
                className="w-full h-full object-cover"
              />
              {addedSongs.has(song.id) && (
                <div className="absolute inset-0 flex justify-center items-center bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-blue)] opacity-70">
                  <CheckCircle className="w-7 h-7 text-black animate-pulse" />
                </div>
              )}
              {!addedSongs.has(song.id) && (
                <Button
                  size="sm"
                  onClick={handlePlayPreview}
                  disabled={!previewAvailable}
                  title={previewAvailable ? (isPreviewing ? 'Pause preview' : 'Play preview') : 'Preview unavailable'}
                  className={`absolute inset-0 flex justify-center items-center bg-black/60 hover:bg-black/70 opacity-0 group-hover/cover:opacity-100 p-0 w-full h-full transition-opacity ${
                    !previewAvailable ? 'cursor-not-allowed hover:bg-black/60' : ''
                  }`}
                >
                  {isPreviewLoading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : isPreviewing ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="font-[Candal] font-normal font-bold text-white group-hover:text-[#FFBE0B] text-lg transition-colors">{songTitle}</h4>
                {addedSongs.has(song.id) && (
                  <Badge className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] text-black text-xs animate-pulse">
                    <Sparkles className="mr-1 w-3 h-3" />
                    Added!
                  </Badge>
                )}
              </div>
              <p className="mb-2 text-gray-300 text-sm">{songArtist}</p>
              
              {/* Scores */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1.5">
                  {song.rankChange !== undefined && song.rankChange !== 0 && (
                    song.rankChange > 0 ? <TrendingUp className="w-5 h-5 text-[#00ff00]" /> : <TrendingDown className="w-5 h-5 text-[#FF006E]" />
                  )}
                  <span className="font-bold text-[rgb(255,190,11)] text-2xl">{Math.round(song.matchScore || 75)}%</span>
                  <div className="flex items-center gap-1">
                    <span className="font-[Atkinson_Hyperlegible] text-[rgb(255,255,255)] text-xs">Crowd Match</span>
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
                  <span className="font-bold text-[rgb(131,56,236)] text-lg">
                    {Math.round(song.themeMatch || Math.floor(Math.random() * 20) + 75)}%
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-[Atkinson_Hyperlegible] text-[rgb(255,255,255)] text-xs">Theme Match</span>
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
              <div className="text-[13px] text-[rgb(195,203,216)] text-sm italic">
                {getSongMetric(song)}
              </div>
              
              {/* Harmonic Flow Info */}
              {harmonicFlowEnabled && song.key && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-[var(--neon-yellow)]/20 border-[var(--neon-yellow)]/30 text-[var(--neon-yellow)]">
                    Key: {song.key}
                  </Badge>
                  {harmonicInfo && (
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--neon-cyan)] text-xs">{harmonicInfo.label}</div>
                      <div className="text-gray-400 text-xs">{harmonicInfo.description}</div>
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
                    <CheckCircle className="mr-1 w-4 h-4" />
                    Added!
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 w-4 h-4" />
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

const CLIENT_DEFAULT_PREVIEW_DURATION_MS = 20000;
const CLIENT_DEFAULT_PREVIEW_START_MS = 30000;
const CLIENT_MIN_PREVIEW_START_MS = 15000;

function parseDurationToMs(value?: string): number | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const segments = value.split(':').map((segment) => Number(segment.trim()));
  if (segments.some((num) => Number.isNaN(num))) {
    return undefined;
  }
  if (segments.length === 2) {
    const [minutes, seconds] = segments;
    return ((minutes * 60) + seconds) * 1000;
  }
  if (segments.length === 3) {
    const [hours, minutes, seconds] = segments;
    return (((hours * 60) + minutes) * 60 + seconds) * 1000;
  }
  return undefined;
}

function computePreviewStart(durationMs?: number, clipDurationMs: number = CLIENT_DEFAULT_PREVIEW_DURATION_MS) {
  if (!durationMs || durationMs <= 0) {
    return CLIENT_DEFAULT_PREVIEW_START_MS;
  }
  const heuristicStart = Math.round(durationMs * 0.4);
  const maxStart = Math.max(0, durationMs - clipDurationMs);
  return Math.max(CLIENT_MIN_PREVIEW_START_MS, Math.min(heuristicStart, maxStart));
}

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
  getSourceBadge,
  onPreview,
  isPreviewing = false,
  isPreviewLoading = false,
  previewAvailable = true
}: any) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
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
    if (!previewAvailable) return;
    onPreview?.(song);
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
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onReturnToList(song.id, song.source);
          }}
          className="top-2 right-2 z-10 absolute hover:bg-[var(--neon-cyan)]/20 px-3 py-2 h-auto text-white hover:text-[var(--neon-cyan)]"
          title="Undo - Return to list"
        >
          <Undo2 className="w-5 h-5" />
        </Button>
      )}
      
      {/* Trash button - bottom right corner */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onRemoveFromQueue(song.id);
        }}
        className="right-2 bottom-2 z-10 absolute hover:bg-[var(--destructive)]/20 px-2 py-1 h-auto hover:text-[var(--destructive)] text-xs"
        title="Remove from queue"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
      
      <CardContent className="p-3 sm:p-4 pr-12">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
            {/* Drag Handle */}
            <div 
              ref={dragRef}
              data-drag-handle
              className="flex-shrink-0 text-gray-500 hover:text-[var(--neon-cyan)] transition-colors cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical className="w-5 h-5" />
            </div>
            
            {/* Album Cover with Play Button */}
            <div 
              className="group/cover relative flex-shrink-0 rounded-md w-12 h-12 overflow-hidden"
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
                animate={{ opacity: showPlayButton || isPreviewing ? 1 : 0 }}
                className={`absolute inset-0 flex justify-center items-center bg-black/60 ${
                  previewAvailable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                onClick={handlePlayPreview}
              >
                {isPreviewLoading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : isPreviewing ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </motion.div>
              {index === currentSongIndex && (
                <div className="right-0 bottom-0 left-0 absolute bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] h-1 animate"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                <h4 className="font-medium text-white group-hover:text-[var(--neon-cyan)] text-sm sm:text-base truncate transition-colors">{songTitle}</h4>
                {isGuestSuggestion && (
                  <Badge className="flex-shrink-0 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-yellow)]/70 text-black text-xs">
                    <Star className="mr-1 w-3 h-3" />
                    {isTipRequest ? 'Guest Request' : 'Guest Request'}
                  </Badge>
                )}
                {!isGuestSuggestion && (
                  <div className="flex-shrink-0">
                    {getSourceBadge(song.source)}
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-xs sm:text-sm truncate">{songArtist}</p>
              {isTipRequest && song.crowdScore && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-gradient-to-r from-[var(--neon-cyan)]/20 to-[var(--neon-cyan)]/20 border border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)] text-xs">
                    {Math.round(song.crowdScore)}% match
                  </Badge>
                </div>
              )}
              {isGuestSuggestion && !isTipRequest && song.matchScore && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-blue)]/20 border border-[var(--neon-blue)]/30 text-[rgb(0,217,255)] text-xs">
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
function DJGig({ event, onBack, onShowQRCode, onConnectPlaylist, onUpdateEvent, isLoading = false, isGuestAccess = false, onRequestAuth }: DJGigProps) {
  // Initialize all state using custom hook
  const state = useDJDashboardState();
  const {
    setDjSpotifyToken,
    setUserPlaylists,
    setExportError,
    setExportDialogOpen,
    setNewPlaylistName,
    setSelectedPlaylistId,
    setIsExporting,
    setExportedPlaylist
  } = state;
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const {
    state: previewState,
    toggle: togglePreview,
    isActive: isPreviewActive
  } = usePreviewController();

  const resolvePreviewUrl = useCallback((track: Track | (Track & Record<string, any>)) => {
    const fallback = track as Record<string, unknown>;
    return (
      track.previewUrl ||
      (typeof fallback.preview_url === 'string' ? (fallback.preview_url as string) : undefined) ||
      (typeof fallback.spotifyPreviewUrl === 'string' ? (fallback.spotifyPreviewUrl as string) : undefined) ||
      (typeof fallback.applePreviewUrl === 'string' ? (fallback.applePreviewUrl as string) : undefined) ||
      (typeof fallback.itunesPreviewUrl === 'string' ? (fallback.itunesPreviewUrl as string) : undefined) ||
      (typeof fallback.itunes_preview_url === 'string' ? (fallback.itunes_preview_url as string) : undefined) ||
      (typeof fallback.preview === 'string' ? (fallback.preview as string) : undefined)
    );
  }, []);

  const resolvePreviewDurationMs = useCallback((track: Track | (Track & Record<string, any>)) => {
    const fallback = track as Record<string, unknown>;
    return (
      track.previewDurationMs ||
      (typeof fallback.preview_duration_ms === 'number' ? (fallback.preview_duration_ms as number) : undefined) ||
      (resolvePreviewUrl(track) ? CLIENT_DEFAULT_PREVIEW_DURATION_MS : undefined)
    );
  }, [resolvePreviewUrl]);

  const resolveTrackDurationMs = useCallback((track: Track | (Track & Record<string, any>)) => {
    const fallback = track as Record<string, unknown>;
    if (typeof fallback.durationMs === 'number') return fallback.durationMs as number;
    if (typeof fallback.duration_ms === 'number') return fallback.duration_ms as number;
    if (typeof track.duration === 'number') return track.duration;
    return parseDurationToMs(typeof track.duration === 'string' ? track.duration : undefined);
  }, []);

  const resolvePreviewStartMs = useCallback(
    (track: Track | (Track & Record<string, any>), clipDurationMs?: number) => {
      const fallback = track as Record<string, unknown>;
      const explicit =
        track.previewStartMs ??
        (typeof fallback.preview_start_ms === 'number' ? (fallback.preview_start_ms as number) : undefined) ??
        (typeof fallback.chorus_offset_ms === 'number' ? (fallback.chorus_offset_ms as number) : undefined) ??
        (typeof fallback.chorusOffsetMs === 'number' ? (fallback.chorusOffsetMs as number) : undefined);

      if (typeof explicit === 'number' && !Number.isNaN(explicit) && explicit >= 0) {
        return explicit;
      }

      const durationMs = resolveTrackDurationMs(track);
      return computePreviewStart(durationMs, clipDurationMs ?? CLIENT_DEFAULT_PREVIEW_DURATION_MS);
    },
    [resolveTrackDurationMs]
  );

  const handlePreviewToggle = useCallback(
    (track: Track) => {
      const previewUrl = resolvePreviewUrl(track);
      if (!previewUrl) {
        toast.warning(`No preview available for "${track.title || track.name || 'this track'}".`);
        return;
      }
      const previewDurationMs = resolvePreviewDurationMs(track) ?? CLIENT_DEFAULT_PREVIEW_DURATION_MS;
      const previewStartMs = resolvePreviewStartMs(track, previewDurationMs);

      togglePreview({
        id: track.id,
        url: previewUrl,
        startAtMs: previewStartMs,
        playMs: previewDurationMs,
      });
    },
    [resolvePreviewDurationMs, resolvePreviewStartMs, resolvePreviewUrl, togglePreview]
  );

  useEffect(() => {
    if (previewState.error) {
      toast.error(previewState.error);
    }
  }, [previewState.error]);

  const RecommendationCardWithPreview = useMemo(
    () =>
      forwardRef<HTMLDivElement, any>((props, ref) => {
        const previewUrl = resolvePreviewUrl(props.song);
        const isCurrent = previewState.currentId === props.song.id;
        return (
          <RecommendationCard
            {...props}
            ref={ref}
            onPreview={() => handlePreviewToggle(props.song)}
            isPreviewing={isPreviewActive(props.song.id)}
            isPreviewLoading={Boolean(isCurrent && previewState.isLoading)}
            previewAvailable={Boolean(previewUrl)}
          />
        );
      }),
    [
      handlePreviewToggle,
      isPreviewActive,
      previewState.currentId,
      previewState.isLoading,
      resolvePreviewUrl,
    ]
  );

  const DraggableQueueItemWithPreview = useMemo(
    () =>
      (props: any) => {
        const previewUrl = resolvePreviewUrl(props.song);
        const isCurrent = previewState.currentId === props.song.id;
        return (
          <DraggableQueueItem
            {...props}
            onPreview={() => handlePreviewToggle(props.song)}
            isPreviewing={isPreviewActive(props.song.id)}
            isPreviewLoading={Boolean(isCurrent && previewState.isLoading)}
            previewAvailable={Boolean(previewUrl)}
          />
        );
      },
    [
      handlePreviewToggle,
      isPreviewActive,
      previewState.currentId,
      previewState.isLoading,
      resolvePreviewUrl,
    ]
  );
  
  // Derived values
  const eventName = event.eventName || event.name || 'Event';
  const totalGuests = state.insights?.totalGuests || event.guestCount || 128;

  const userPlaylistsCount = state.userPlaylists.length;

  const fetchDjPlaylists = useCallback(async () => {
    if (!state.djSpotifyToken) {
      return;
    }

    setPlaylistsLoading(true);
    setExportError(null);

    try {
      const playlists: any[] = [];
      let nextUrl: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50';

      while (nextUrl) {
        const response: Response = await fetch(nextUrl, {
          headers: {
            Authorization: `Bearer ${state.djSpotifyToken!}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch Spotify playlists');
        }

        const data: any = await response.json();
        if (Array.isArray(data.items)) {
          playlists.push(...data.items);
        }

        const next: string | null = typeof data.next === 'string' ? data.next : null;
        // Guard against excessive pagination
        if (!next || playlists.length >= 150) {
          nextUrl = null;
        } else {
          nextUrl = next;
        }
      }

      const normalized = playlists.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        trackCount: playlist.tracks?.total || 0,
        image: playlist.images?.[0]?.url,
        url: playlist.external_urls?.spotify
      }));

      setUserPlaylists(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch Spotify playlists';
      setExportError(message);
      toast.error(message);
    } finally {
      setPlaylistsLoading(false);
    }
  }, [setExportError, setUserPlaylists, state.djSpotifyToken]);

  useEffect(() => {
    const accessToken = utils.storage.get('spotify_access_token');
    const expiresAt = utils.storage.get('spotify_expires_at');
    const expiresAtNumber = typeof expiresAt === 'string' ? parseInt(expiresAt, 10) : expiresAt;

    if (typeof expiresAtNumber === 'number' && !Number.isNaN(expiresAtNumber) && Date.now() >= expiresAtNumber) {
      utils.storage.remove('spotify_access_token');
      utils.storage.remove('spotify_refresh_token');
      utils.storage.remove('spotify_expires_at');
      setDjSpotifyToken(null);
      return;
    }

    if (typeof accessToken === 'string') {
      setDjSpotifyToken(accessToken);
    } else if (accessToken) {
      setDjSpotifyToken(String(accessToken));
    } else {
      setDjSpotifyToken(null);
    }
  }, [setDjSpotifyToken]);

  useEffect(() => {
    if (!state.exportDialogOpen) {
      return;
    }

    if (!state.djSpotifyToken) {
      return;
    }

    if (userPlaylistsCount === 0 && !playlistsLoading) {
      fetchDjPlaylists();
    }
  }, [fetchDjPlaylists, playlistsLoading, state.djSpotifyToken, state.exportDialogOpen, userPlaylistsCount]);

  useEffect(() => {
    if (!state.exportDialogOpen) {
      setNewPlaylistName('');
      setSelectedPlaylistId(null);
      setExportError(null);
      setIsExporting(false);
    } else {
      setExportError(null);
    }
  }, [setExportError, setIsExporting, setNewPlaylistName, setSelectedPlaylistId, state.exportDialogOpen]);

  // Initialize queue management
  const {
    addToQueue,
    removeFromQueue,
    returnToList,
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
    currentQueue: state.currentQueue,
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

  // Sort guest suggestions by matchScore (kept for potential future use)
  // const filteredGuestSuggestions = applySmartFilters(state.guestSuggestions).sort(
  //   (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
  // );

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
      
      toast.custom((t: string | number) => (
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

  const getExportTrackIds = () => {
    return state.currentQueue
      .map(track => track.spotifyTrackId || track.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  };

  const handleCreatePlaylistExport = async () => {
    if (!state.djSpotifyToken) {
      toast.error('Connect your Spotify account to export playlists.');
      onConnectPlaylist();
      return;
    }

    const playlistName = state.newPlaylistName.trim();
    if (!playlistName) {
      toast.error('Enter a playlist name before exporting.');
      return;
    }

    const trackIds = getExportTrackIds();
    if (trackIds.length === 0) {
      toast.error('No Spotify tracks found in the queue to export.');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const response = await eventApi.createSpotifyPlaylist(event.code, {
        access_token: state.djSpotifyToken,
        playlist_name: playlistName,
        playlist_description: `Queue export from ${eventName}`,
        is_public: true,
        track_ids: trackIds
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create Spotify playlist');
      }

      const payload = response.data as any;
      const playlist = payload?.playlist || payload;

      if (playlist?.id) {
        setExportedPlaylist({
          id: playlist.id,
          name: playlist.name || playlistName,
          url: playlist.url
        });
      }

      toast.success(`Exported ${trackIds.length} tracks to "${playlist?.name || playlistName}"`);
      setExportDialogOpen(false);
      setNewPlaylistName('');
      await fetchDjPlaylists();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export playlist';
      setExportError(message);
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddToExistingPlaylist = async (playlistId: string) => {
    if (!state.djSpotifyToken) {
      toast.error('Connect your Spotify account to export playlists.');
      onConnectPlaylist();
      return;
    }

    const trackIds = getExportTrackIds();
    if (trackIds.length === 0) {
      toast.error('No Spotify tracks found in the queue to export.');
      return;
    }

    setSelectedPlaylistId(playlistId);
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await eventApi.createSpotifyPlaylist(event.code, {
        access_token: state.djSpotifyToken,
        playlist_id: playlistId,
        track_ids: trackIds
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update Spotify playlist');
      }

      const payload = response.data as any;
      const playlist = payload?.playlist || payload;

      if (playlist?.id) {
        setExportedPlaylist({
          id: playlist.id,
          name: playlist.name,
          url: playlist.url
        });
      } else {
        const existing = state.userPlaylists.find((p: any) => p.id === playlistId);
        if (existing) {
          setExportedPlaylist({
            id: existing.id,
            name: existing.name,
            url: existing.url
          });
        }
      }

      toast.success(`Added ${trackIds.length} tracks to the playlist.`);
      setExportDialogOpen(false);
      setSelectedPlaylistId(null);
      await fetchDjPlaylists();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update playlist';
      setExportError(message);
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenExportDialog = () => {
    if (!state.djSpotifyToken) {
      toast.error('Connect your Spotify account to export playlists.');
      onConnectPlaylist();
      return;
    }

    if (state.currentQueue.length === 0) {
      toast.error('Add songs to your queue before exporting.');
      return;
    }

    setExportDialogOpen(true);
  };

  const exportedPlaylist = state.exportedPlaylist;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Synthwave Background Image */}
      <div 
        className="z-0 fixed inset-0"
        style={{
          backgroundImage: `url(${djBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Dark Overlay for readability */}
      <div 
        className="z-0 fixed inset-0 bg-black/60"
        style={{
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(2px)'
        }}
      />
      
      {/* Content wrapper */}
      <div className="z-10 relative">
        <div className="mx-auto px-4 py-6 container">
          {isGuestAccess && (
            <Alert variant="default" className="bg-primary/10 mb-6 border-primary/40">
              <AlertTitle className="flex flex-wrap items-center gap-2 text-primary text-sm">
                You’re running this gig in guest mode
              </AlertTitle>
              <AlertDescription className="text-primary/80 text-xs">
                Sign in or create your QRate marketplace profile to unlock analytics, booking requests, and your public profile.
              </AlertDescription>
              {onRequestAuth && (
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <Button size="sm" className="bg-primary/80 hover:bg-primary" onClick={onRequestAuth}>
                    Create Marketplace Profile
                  </Button>
                  <span className="text-muted-foreground text-xs">You can keep mixing here while you set it up.</span>
                </div>
              )}
            </Alert>
          )}

          {/* Header */}
          <div className="flex sm:flex-row flex-col justify-between items-center gap-4 mb-8">
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

          <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
            {/* Main Content - Left 2/3 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6 lg:col-span-2"
            >
              {exportedPlaylist?.id && (
                <div className="space-y-3 p-4 border border-[var(--glass-border)] rounded-xl glass-effect">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <div className="text-[var(--neon-cyan)] text-sm uppercase tracking-widest">Spotify Export</div>
                      <h3 className="font-semibold text-white text-lg">{exportedPlaylist.name}</h3>
                    </div>
                    {exportedPlaylist.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-[var(--neon-cyan)]/10 border-[var(--neon-cyan)]/40 text-[var(--neon-cyan)]"
                        onClick={() => window.open(exportedPlaylist.url, '_blank', 'noopener')}
                      >
                        Open in Spotify
                      </Button>
                    )}
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <iframe
                      title="Spotify Playlist"
                      src={`https://open.spotify.com/embed/playlist/${exportedPlaylist.id}?utm_source=qrate`}
                      width="100%"
                      height="152"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Tabs */}
              <Tabs value={state.activeTab} onValueChange={state.setActiveTab} className="w-full overflow-visible">
                <TabsList className="relative grid grid-cols-2 bg-transparent p-0 border border-[var(--glass-border)] w-full h-auto glass-effect">
                  <TabsTrigger 
                    value="recommendations" 
                    className="after:right-0 after:bottom-0 after:left-0 after:absolute relative data-[state=active]:bg-transparent after:bg-[var(--neon-purple)] data-[state=active]:after:opacity-100 after:opacity-0 py-3 after:h-0.5 text-gray-400 data-[state=active]:text-[var(--neon-purple)] text-sm transition-all after:transition-all duration-300 after:duration-300"
                  >
                    <Sparkles className="mr-2 w-4 h-4" />
                    AI Suggestions ({filteredRecommendations.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="discovery-queue" 
                    className="after:right-0 after:bottom-0 after:left-0 after:absolute relative data-[state=active]:bg-transparent after:bg-[var(--neon-pink)] data-[state=active]:after:opacity-100 after:opacity-0 py-3 after:h-0.5 text-gray-400 data-[state=active]:text-[var(--neon-pink)] text-sm transition-all after:transition-all duration-300 after:duration-300"
                  >
                    <Lightbulb className="mr-2 w-4 h-4" />
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
                    RecommendationCard={RecommendationCardWithPreview}
                  />
                </TabsContent>
                
                <TabsContent value="discovery-queue" className="z-10 relative space-y-6">
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
              onExport={handleOpenExportDialog}
              getSourceBadge={getSourceBadge}
              DraggableQueueItem={DraggableQueueItemWithPreview}
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
        <DialogContent className="border-green-500/30 sm:max-w-2xl glass-effect">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Music className="w-6 h-6 text-green-500" />
              Connect Spotify Playlist
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select a playlist to analyze tracks and add them to your queue
            </DialogDescription>
          </DialogHeader>
          
          <div className="gap-4 grid py-4">
            {MOCK_SPOTIFY_PLAYLISTS.map((playlist) => (
              <Card
                key={playlist.id}
                className="group border-green-500/30 hover:border-green-500/60 transition-all cursor-pointer glass-effect"
                onClick={() => handleSelectPlaylist(playlist)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex justify-center items-center bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg w-16 h-16 group-hover:scale-105 transition-transform">
                      <Music className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-1 font-semibold text-white text-lg">{playlist.name}</h4>
                      <p className="text-gray-400 text-sm">{playlist.trackCount} tracks</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-green-500 hover:from-green-600 to-emerald-500 hover:to-emerald-600 text-white"
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
        <SheetContent className="bg-[var(--dark-bg)] border-[var(--glass-border)] w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Smart Filters</SheetTitle>
            <SheetDescription>Configure your music filtering preferences</SheetDescription>
          </SheetHeader>
          <div className="top-0 z-10 sticky bg-[var(--dark-bg)] mb-2 pt-[50px] pr-[0px] pb-[16px] pl-[0px] border-[var(--glass-border)] border-b">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3 px-[20px] py-[0px]">
                <div className="bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/10 p-[8px] py-[0px] rounded-lg">
                  <Filter className="w-5 h-5 text-[var(--neon-purple)]" />
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-white text-lg">Smart Filters</h3>
                  {(state.smartFilters.noExplicit || state.smartFilters.preventArtistRepetition || state.smartFilters.eraFilterEnabled || state.smartFilters.minEnergy > 0 || state.smartFilters.maxEnergy < 100 || state.smartFilters.minDanceability > 0 || state.smartFilters.maxDanceability < 100 || state.smartFilters.minValence > 0 || state.smartFilters.maxValence < 100 || state.smartFilters.vocalFocus) && (
                    <Badge className="bg-[var(--neon-cyan)]/20 border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)]">
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
                className="hover:bg-[var(--neon-purple)]/10 text-gray-400 hover:text-white"
              >
                Reset All
              </Button>
            </div>
            <p className="py-[0px] pt-[0px] pr-[10px] pb-[0px] pl-[25px] text-gray-400 text-sm">Fine-tune your AI recommendations with advanced filtering options</p>
          </div>
          
          <ScrollArea className="pr-4 h-[calc(100vh-160px)]">
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
        <SheetContent className="bg-[var(--dark-bg)] border-[var(--glass-border)] w-full sm:max-w-xl overflow-y-auto">
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
      <Dialog open={state.exportDialogOpen} onOpenChange={(open: boolean) => setExportDialogOpen(open)}>
        <DialogContent className="border-primary/30 max-w-lg text-white glass-effect">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl gradient-text">
              <Download className="w-6 h-6" />
              Export Queue to Spotify
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new playlist or add to an existing one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {!state.djSpotifyToken && (
              <div className="flex flex-col gap-3 bg-red-500/10 p-3 border border-red-500/30 rounded-lg text-red-200 text-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="flex-shrink-0 mt-0.5 w-5 h-5" />
                  <div>
                    <p className="font-medium text-red-100">Spotify connection required</p>
                    <p className="text-red-200/80">
                      Connect your Spotify account to export the queue. We&rsquo;ll return you here once authentication is complete.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start hover:bg-red-500/10 border-red-500/40 text-red-100"
                  onClick={() => {
                    setExportDialogOpen(false);
                    onConnectPlaylist();
                  }}
                >
                  Connect Spotify
                </Button>
              </div>
            )}

            {state.exportError && (
              <div className="flex items-start gap-3 bg-red-500/10 p-3 border border-red-500/30 rounded-lg text-red-200 text-sm">
                <AlertCircle className="flex-shrink-0 mt-0.5 w-5 h-5" />
                <div>
                  <p className="font-medium text-red-100">Export failed</p>
                  <p className="text-red-200/80">{state.exportError}</p>
                </div>
              </div>
            )}

            {/* Create New Playlist */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-8 h-8 font-bold text-white">
                  1
                </div>
                <h4 className="font-medium text-white">Create New Playlist</h4>
              </div>
              <div className="space-y-3 ml-10">
                <Input
                  placeholder="Enter playlist name..."
                  value={state.newPlaylistName}
                  onChange={(e) => state.setNewPlaylistName(e.target.value)}
                  className="border-border/40 text-white placeholder:text-gray-500 glass-effect"
                />
                <Button
                  onClick={handleCreatePlaylistExport}
                  disabled={
                    !state.newPlaylistName.trim() ||
                    !state.djSpotifyToken ||
                    state.isExporting ||
                    getExportTrackIds().length === 0
                  }
                  className="bg-gradient-to-r from-green-500 hover:from-green-600 to-emerald-500 hover:to-emerald-600 w-full text-white"
                >
                  {state.isExporting ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 w-4 h-4" />
                  )}
                  {state.isExporting ? 'Exporting…' : `Create Playlist (${state.currentQueue.length} songs)`}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 bg-border/50 h-px"></div>
              <span className="text-muted-foreground text-xs uppercase">or</span>
              <div className="flex-1 bg-border/50 h-px"></div>
            </div>

            {/* Add to Existing Playlist */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-8 h-8 font-bold text-white">
                  2
                </div>
                <h4 className="font-medium text-white">Add to Existing Playlist</h4>
              </div>
              <div className="space-y-3 ml-10">
                <div className="flex justify-between items-center gap-3">
                  <p className="text-muted-foreground text-sm">
                    Select a Spotify playlist to add these tracks to
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchDjPlaylists}
                    disabled={playlistsLoading || state.isExporting || !state.djSpotifyToken}
                    className="hover:bg-cyan-500/10 text-cyan-300"
                  >
                    Refresh
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {!state.djSpotifyToken ? (
                    <p className="text-muted-foreground text-sm">
                      Connect your Spotify account above to load your playlists.
                    </p>
                  ) : playlistsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading playlists...
                    </div>
                  ) : userPlaylistsCount === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No playlists found in this Spotify account. Create one above!
                    </p>
                  ) : (
                    state.userPlaylists.map((playlist: any) => (
                      <Button
                        key={playlist.id}
                        onClick={() => handleAddToExistingPlaylist(playlist.id)}
                        variant={state.selectedPlaylistId === playlist.id ? 'default' : 'outline'}
                        disabled={state.isExporting}
                        className={`justify-start w-full text-left glass-effect ${
                          state.selectedPlaylistId === playlist.id
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-transparent text-white'
                            : 'hover:bg-cyan-500/10 border-border/40 hover:border-cyan-500/60'
                        }`}
                      >
                        <List className="mr-3 w-4 h-4" />
                        <div className="flex-1">
                          <div className="font-medium text-white">{playlist.name}</div>
                          <div className="text-muted-foreground text-xs">{playlist.trackCount} tracks</div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-500/5 p-4 border border-yellow-500/30 rounded-lg glass-effect">
              <p className="text-muted-foreground text-sm">
                💡 <span className="font-semibold text-white">Tip:</span> We export the current queue order. Make sure it&rsquo;s dialed in before sending it to Spotify.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DJGig;
