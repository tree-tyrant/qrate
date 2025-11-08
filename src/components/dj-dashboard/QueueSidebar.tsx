// Queue Sidebar Component
// Displays the current queue in the right sidebar

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { List, Music, Download, Undo2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { isTouchDevice } from '../../utils/djDashboardHelpers';
import type { Track } from '../../hooks/useDJDashboardState';

interface QueueSidebarProps {
  currentQueue: Track[];
  currentSongIndex: number;
  trashedSongs: Track[];
  setCurrentQueue: (queue: Track[]) => void;
  setTrashedSongs: (songs: Track[]) => void;
  onPlaySong: (index: number) => void;
  onRemoveFromQueue: (songId: string) => void;
  onReturnToList: (songId: string, source: 'ai' | 'hidden-anthems' | 'tip-request') => void;
  onMoveItem: (dragIndex: number, hoverIndex: number) => void;
  onExport: () => void;
  getSourceBadge: (source: string) => JSX.Element | null;
  DraggableQueueItem: any; // The DraggableQueueItem component
}

/**
 * Queue sidebar component
 * Shows the current queue with drag-and-drop reordering
 */
export function QueueSidebar({
  currentQueue,
  currentSongIndex,
  trashedSongs,
  setCurrentQueue,
  setTrashedSongs,
  onPlaySong,
  onRemoveFromQueue,
  onReturnToList,
  onMoveItem,
  onExport,
  getSourceBadge,
  DraggableQueueItem
}: QueueSidebarProps) {
  
  const handleRestoreTrashed = () => {
    if (trashedSongs.length > 0) {
      setCurrentQueue([...currentQueue, ...trashedSongs]);
      setTrashedSongs([]);
      toast.success('Restored trashed songs to queue!');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="space-y-6 overflow-visible"
    >
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
                          onPlaySong={onPlaySong}
                          onRemoveFromQueue={onRemoveFromQueue}
                          onReturnToList={onReturnToList}
                          onMoveItem={onMoveItem}
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
                  onClick={onExport}
                  disabled={currentQueue.length === 0}
                  className="w-full glass-effect border-green-500/40 hover:border-green-500/60 hover:bg-green-500/10 text-green-400"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Spotify
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRestoreTrashed}
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
    </motion.div>
  );
}
