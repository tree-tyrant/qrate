// Custom hook for managing DJ Dashboard state
// Extracted to separate state management from UI logic

import { useState, useEffect } from 'react';
import { utils } from '@/utils/api';

export interface Track {
  id: string;
  name?: string;
  title?: string;
  artist?: string;
  artists?: string[];
  album?: string;
  duration?: string;
  matchScore?: number;
  themeMatch?: number;
  reasons?: string[];
  energy?: number;
  danceability?: number;
  key?: string;
  source: 'ai' | 'spotify' | 'apple' | 'tip-request' | 'deep-cuts' | 'hidden-anthems';
  averageScore?: number;
  guestCount?: number;
  weight?: number;
  popularity?: number;
  suggestedBy?: string;
  suggestedAt?: string;
  playlistCount?: number;
  crowdAffinity?: number;
  recentPlays?: number;
  topTrackForGuests?: number;
  trendingRecent?: boolean;
  losingInfluence?: boolean;
  passionScore?: number;
  passionDescription?: string;
  transitionSongs?: Array<{
    name: string;
    artists: Array<{ name: string }>;
    transitionScore?: number;
  }>;
  audioFeatures?: {
    danceability?: number;
    energy?: number;
    valence?: number;
    tempo?: number;
    key?: number;
    mode?: number;
  };
  harmonicCompatibilityScore?: number;
  harmonicMatchType?: 'perfect' | 'relative' | 'energyBoost' | 'energyDrop' | 'adjacent' | 'compatible' | 'distant';
  rankChange?: number;
  tipAmount?: number;
  guestName?: string;
  crowdScore?: number;
  explicit?: boolean;
  // Spotify track data (when available)
  spotifyTrackId?: string;
  albumArt?: string;
  previewUrl?: string;
  previewStartMs?: number;
  previewDurationMs?: number;
  releaseYear?: number;
  instrumentalness?: number;
  valence?: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  duration?: string;
  tracks: Track[];
}

export interface SmartFilters {
  noExplicit: boolean;
  preventArtistRepetition: boolean;
  artistCooldownMinutes: number;
  eraMinDecade: number;
  eraMaxDecade: number;
  eraFilterEnabled: boolean;
  minEnergy: number;
  maxEnergy: number;
  minDanceability: number;
  maxDanceability: number;
  minValence: number;
  maxValence: number;
  vocalFocus: boolean;
  harmonicFlow: boolean;
}

/**
 * Main hook for managing DJ Dashboard state
 * Consolidates all useState declarations to improve maintainability
 * persistenceKey: optional key to persist state per-event
 */
export function useDJDashboardState(persistenceKey?: string) {
  // Queue and playback state
  const [currentQueue, setCurrentQueue] = useState<Track[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [connectedPlaylist, setConnectedPlaylist] = useState<Playlist | null>(null);
  const [trashedSongs, setTrashedSongs] = useState<Track[]>([]);
  
  // Recommendations and insights
  const [insights, setInsights] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [guestSuggestions, setGuestSuggestions] = useState<Track[]>([]);
  const [previousRecommendations, setPreviousRecommendations] = useState<Track[]>([]);
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(new Map());
  
  // Discovery queue
  const [discoveryQueue, setDiscoveryQueue] = useState<{ anthems: Track[] }>({ anthems: [] });
  const [removedAnthems, setRemovedAnthems] = useState<Set<string>>(new Set());
  const [removedDeepCuts, setRemovedDeepCuts] = useState<Set<string>>(new Set());
  
  // Loading and refresh state
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [newGuestsToAdd, setNewGuestsToAdd] = useState(0);
  
  // UI state
  const [addedSongs, setAddedSongs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('recommendations');
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [showAllAnthems, setShowAllAnthems] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [demoGuestDialogOpen, setDemoGuestDialogOpen] = useState(false);
  
  // Smart filters
  const [smartFilters, setSmartFilters] = useState<SmartFilters>({
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
  
  // Harmonic flow
  const [selectedSongForHarmonic, setSelectedSongForHarmonic] = useState<Track | null>(null);
  
  // Tips
  const [tipJarOpen, setTipJarOpen] = useState(false);
  const [tipJarSheetOpen, setTipJarSheetOpen] = useState(false);
  const [totalTipAmount, setTotalTipAmount] = useState(0);
  const [hasNewTips, setHasNewTips] = useState(false);
  
  // Playlist connection
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [existingPlaylists, setExistingPlaylists] = useState<any[]>([]);
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState<Track[]>([]);
  const [trackScoreHistory, setTrackScoreHistory] = useState<Record<string, number>>({});
  
  // Spotify export state
  const [djSpotifyToken, setDjSpotifyToken] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedPlaylist, setExportedPlaylist] = useState<{ url: string; name: string; id?: string } | null>(null);
  const [exportType, setExportType] = useState<'new' | 'existing'>('new');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  
  // Other state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previousCrowdScore, setPreviousCrowdScore] = useState<number | null>(null);

  // Load persisted state (if persistenceKey is provided)
  useEffect(() => {
    if (!persistenceKey) return;
    const saved = utils.storage.get(persistenceKey) as any;
    if (!saved) return;
    try {
      if (Array.isArray(saved.currentQueue)) setCurrentQueue(saved.currentQueue);
      if (typeof saved.currentSongIndex === 'number') setCurrentSongIndex(saved.currentSongIndex);
      if (Array.isArray(saved.trashedSongs)) setTrashedSongs(saved.trashedSongs);
      if (saved.discoveryQueue && typeof saved.discoveryQueue === 'object') {
        setDiscoveryQueue(saved.discoveryQueue);
      }
      if (saved.smartFilters && typeof saved.smartFilters === 'object') {
        setSmartFilters(prev => ({ ...prev, ...saved.smartFilters }));
      }
      if (typeof saved.activeTab === 'string') setActiveTab(saved.activeTab);
      if (typeof saved.showAllRecommendations === 'boolean') setShowAllRecommendations(saved.showAllRecommendations);
      if (typeof saved.filtersOpen === 'boolean') setFiltersOpen(saved.filtersOpen);
      if (typeof saved.showPlaylistDialog === 'boolean') setShowPlaylistDialog(saved.showPlaylistDialog);
      if (saved.exportType === 'new' || saved.exportType === 'existing') setExportType(saved.exportType);
      if (typeof saved.selectedPlaylistId === 'string' || saved.selectedPlaylistId === null) {
        setSelectedPlaylistId(saved.selectedPlaylistId);
      }
    } catch {
      // ignore malformed payloads
    }
  }, [persistenceKey]);

  // Persist a compact state snapshot
  useEffect(() => {
    if (!persistenceKey) return;
    const snapshot = {
      currentQueue,
      currentSongIndex,
      trashedSongs,
      discoveryQueue,
      smartFilters,
      activeTab,
      showAllRecommendations,
      filtersOpen,
      showPlaylistDialog,
      exportType,
      selectedPlaylistId
    };
    utils.storage.set(persistenceKey, snapshot);
    setLastSaved(new Date());
  }, [
    persistenceKey,
    currentQueue,
    currentSongIndex,
    trashedSongs,
    discoveryQueue,
    smartFilters,
    activeTab,
    showAllRecommendations,
    filtersOpen,
    showPlaylistDialog,
    exportType,
    selectedPlaylistId
  ]);

  return {
    // Queue and playback
    currentQueue,
    setCurrentQueue,
    currentSongIndex,
    setCurrentSongIndex,
    connectedPlaylist,
    setConnectedPlaylist,
    trashedSongs,
    setTrashedSongs,
    
    // Recommendations and insights
    insights,
    setInsights,
    recommendations,
    setRecommendations,
    guestSuggestions,
    setGuestSuggestions,
    previousRecommendations,
    setPreviousRecommendations,
    previousRanks,
    setPreviousRanks,
    
    // Discovery queue
    discoveryQueue,
    setDiscoveryQueue,
    removedAnthems,
    setRemovedAnthems,
    removedDeepCuts,
    setRemovedDeepCuts,
    
    // Loading and refresh
    loadingInsights,
    setLoadingInsights,
    loadingDiscovery,
    setLoadingDiscovery,
    refreshing,
    setRefreshing,
    dataLoaded,
    setDataLoaded,
    hasNewUpdates,
    setHasNewUpdates,
    newGuestsToAdd,
    setNewGuestsToAdd,
    
    // UI state
    addedSongs,
    setAddedSongs,
    activeTab,
    setActiveTab,
    showAllRecommendations,
    setShowAllRecommendations,
    showAllAnthems,
    setShowAllAnthems,
    settingsOpen,
    setSettingsOpen,
    filtersOpen,
    setFiltersOpen,
    exportDialogOpen,
    setExportDialogOpen,
    showPlaylistDialog,
    setShowPlaylistDialog,
    demoGuestDialogOpen,
    setDemoGuestDialogOpen,
    
    // Smart filters
    smartFilters,
    setSmartFilters,
    
    // Harmonic flow
    selectedSongForHarmonic,
    setSelectedSongForHarmonic,
    
    // Tips
    tipJarOpen,
    setTipJarOpen,
    tipJarSheetOpen,
    setTipJarSheetOpen,
    totalTipAmount,
    setTotalTipAmount,
    hasNewTips,
    setHasNewTips,
    
    // Playlist connection
    newPlaylistName,
    setNewPlaylistName,
    existingPlaylists,
    setExistingPlaylists,
    selectedPlaylistTracks,
    setSelectedPlaylistTracks,
    trackScoreHistory,
    setTrackScoreHistory,
    
    // Spotify export
    djSpotifyToken,
    setDjSpotifyToken,
    isExporting,
    setIsExporting,
    exportError,
    setExportError,
    exportedPlaylist,
    setExportedPlaylist,
    exportType,
    setExportType,
    selectedPlaylistId,
    setSelectedPlaylistId,
    userPlaylists,
    setUserPlaylists,
    
    // Other
    lastSaved,
    setLastSaved,
    previousCrowdScore,
    setPreviousCrowdScore
  };
}
