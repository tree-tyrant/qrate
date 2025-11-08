// Custom hook for managing DJ Dashboard state
// Extracted to separate state management from UI logic

import { useState, useEffect } from 'react';

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
  };
  rankChange?: number;
  tipAmount?: number;
  guestName?: string;
  crowdScore?: number;
  explicit?: boolean;
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
 */
export function useDJDashboardState() {
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
  
  // Other state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previousCrowdScore, setPreviousCrowdScore] = useState<number | null>(null);

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
    
    // Other
    lastSaved,
    setLastSaved,
    previousCrowdScore,
    setPreviousCrowdScore
  };
}
