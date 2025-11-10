// Recommendations Tab Content Component
// Displays AI-generated recommendations

import { AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Loader2, TrendingUp, RefreshCw, Plus } from 'lucide-react';
import type { Track } from '../../hooks/useDJDashboardState';

interface RecommendationsTabContentProps {
  filteredRecommendations: Track[];
  totalGuests: number;
  loadingInsights: boolean;
  refreshing: boolean;
  hasNewUpdates: boolean;
  showAllRecommendations: boolean;
  addedSongs: Set<string>;
  harmonicFlowEnabled: boolean;
  selectedSong: Track | null;
  onRefresh: () => void;
  onSetShowAll: (showAll: boolean) => void;
  onAddToQueue: (song: Track) => void;
  onSongSelect: (song: Track | null) => void;
  getSourceBadge: (source: string) => JSX.Element | null;
  RecommendationCard: any; // The RecommendationCard component
}

/**
 * Recommendations tab content
 * Shows AI-powered song recommendations based on guest preferences
 */
export function RecommendationsTabContent({
  filteredRecommendations,
  totalGuests,
  loadingInsights,
  refreshing,
  hasNewUpdates,
  showAllRecommendations,
  addedSongs,
  harmonicFlowEnabled,
  selectedSong,
  onRefresh,
  onSetShowAll,
  onAddToQueue,
  onSongSelect,
  getSourceBadge,
  RecommendationCard
}: RecommendationsTabContentProps) {
  const anchorTrackName = selectedSong?.title || selectedSong?.name || selectedSong?.artist || 'this track';
  const anchorKeyLabel = selectedSong?.key;
  const flowMatches = harmonicFlowEnabled && selectedSong
    ? filteredRecommendations.filter(
        (track) => track.id !== selectedSong.id && typeof track.harmonicCompatibilityScore === 'number'
      )
    : [];
  const hasFlowMatches = flowMatches.length > 0;
  
  return (
    <div className="space-y-4">
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
          onClick={onRefresh}
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

      {harmonicFlowEnabled && selectedSong && (
        <div className="glass-effect rounded-xl border border-[var(--neon-purple)]/40 bg-[var(--neon-purple)]/10 p-4">
          <div className="text-sm font-semibold text-white">
            Harmonic Flow active — anchoring to {anchorTrackName}
            {anchorKeyLabel ? ` (${anchorKeyLabel})` : ''}
          </div>
          <p className="text-xs text-gray-300 mt-1">
            {hasFlowMatches
              ? `Showing ${flowMatches.length} tracks ranked by how smoothly they mix into the anchor.`
              : 'No direct harmonic matches available yet—showing crowd favorites until the right track appears.'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Tap a recommendation to change the anchor and preview new harmonic paths.
          </p>
        </div>
      )}

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
      ) : filteredRecommendations.length === 0 ? (
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
                  addToQueue={onAddToQueue}
                  getSourceBadge={getSourceBadge}
                  harmonicFlowEnabled={harmonicFlowEnabled}
                  selectedSong={selectedSong}
                  onSongSelect={onSongSelect}
                />
              ))}
            </AnimatePresence>
          </div>
          {filteredRecommendations.length > 5 && !showAllRecommendations && (
            <div className="text-center pt-2">
              <Button
                onClick={() => onSetShowAll(true)}
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
                onClick={() => onSetShowAll(false)}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Show Less
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
