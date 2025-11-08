// Custom hook for queue management operations
// Extracted to separate queue logic from main component

import { toast } from 'sonner@2.0.3';
import type { Track } from './useDJDashboardState';

interface UseQueueManagementProps {
  currentQueue: Track[];
  setCurrentQueue: (queue: Track[]) => void;
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  setAddedSongs: (fn: (prev: Set<string>) => Set<string>) => void;
  setTrashedSongs: (fn: (prev: Track[]) => Track[]) => void;
  setRecommendations: (fn: (prev: Track[]) => Track[]) => void;
  setRemovedAnthems: (fn: (prev: Set<string>) => Set<string>) => void;
  setRemovedDeepCuts: (fn: (prev: Set<string>) => Set<string>) => void;
  recommendations: Track[];
}

/**
 * Hook for managing queue operations
 * Handles adding, removing, reordering, and playing songs
 */
export function useQueueManagement({
  currentQueue,
  setCurrentQueue,
  currentSongIndex,
  setCurrentSongIndex,
  setAddedSongs,
  setTrashedSongs,
  setRecommendations,
  setRemovedAnthems,
  setRemovedDeepCuts,
  recommendations
}: UseQueueManagementProps) {
  
  /**
   * Add a song to the queue with visual feedback
   */
  const addToQueue = async (song: Track) => {
    const newSong = { ...song, id: song.id || `queue-${Date.now()}-${Math.random()}` };
    setCurrentQueue([...currentQueue, newSong]);
    
    // Track if this is from deep cuts or hidden anthems
    if (song.source === 'deep-cuts') {
      setRemovedDeepCuts(prev => new Set([...prev, newSong.id]));
    } else if (song.source === 'hidden-anthems') {
      setRemovedAnthems(prev => new Set([...prev, newSong.id]));
    }
    
    // Add creative feedback animation
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

  /**
   * Remove a song from the queue (moves to trash)
   */
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

  /**
   * Return a song from queue back to its original list
   */
  const returnToList = (songId: string, source: 'ai' | 'hidden-anthems' | 'tip-request') => {
    // Find the song in the queue
    const song = currentQueue.find(s => s.id === songId);
    if (!song) return;

    // Remove from queue
    setCurrentQueue(currentQueue.filter(s => s.id !== songId));

    // Add back to appropriate list if not already there
    if (source === 'ai') {
      if (!recommendations.find(r => r.id === songId)) {
        setRecommendations(prev => [...prev, song]);
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

  /**
   * Skip to the next song in the queue
   */
  const skipToNext = () => {
    if (currentSongIndex < currentQueue.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
    }
  };

  /**
   * Play a specific song by index
   */
  const playSong = (index: number) => {
    setCurrentSongIndex(index);
  };

  /**
   * Reorder queue items via drag and drop
   */
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

  return {
    addToQueue,
    removeFromQueue,
    returnToList,
    skipToNext,
    playSong,
    moveItem
  };
}
