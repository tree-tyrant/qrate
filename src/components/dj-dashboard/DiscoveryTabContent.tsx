// Discovery Tab Content Component
// Displays intelligent search, crowd insights, and hidden anthems

import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Lightbulb, Radio, RefreshCw, Plus, CheckCircle } from 'lucide-react';
import { IntelligentSearch } from '../IntelligentSearch';
import { CrowdInsightsCard } from './CrowdInsightsCard';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getAlbumCover } from '../../utils/djDashboardHelpers';
import type { Track } from '../../hooks/useDJDashboardState';

interface DiscoveryTabContentProps {
  loadingDiscovery: boolean;
  discoveryQueue: { anthems: Track[] };
  insights: any;
  showAllAnthems: boolean;
  addedSongs: Set<string>;
  onSearchTrackSelected: (track: any) => void;
  onSetShowAllAnthems: (showAll: boolean) => void;
  onAddToQueue: (song: Track) => void;
  onRefreshAnthems?: () => void;
}

/**
 * Discovery tab content
 * Shows intelligent search, crowd insights, and curated discovery recommendations
 */
export function DiscoveryTabContent({
  loadingDiscovery,
  discoveryQueue,
  insights,
  showAllAnthems,
  addedSongs,
  onSearchTrackSelected,
  onSetShowAllAnthems,
  onAddToQueue,
  onRefreshAnthems
}: DiscoveryTabContentProps) {
  
  return (
    <div className="space-y-6 relative z-10">
      {/* Intelligent Search */}
      <Card className="glass-effect border-[var(--glass-border)] overflow-visible relative z-20">
        <CardContent className="pt-6 overflow-visible">
          <IntelligentSearch
            onTrackSelected={onSearchTrackSelected}
            placeholder="Search for track..."
            autoFocus={false}
            className="relative z-30"
          />
        </CardContent>
      </Card>

      {/* Crowd Insights Card */}
      <CrowdInsightsCard insights={insights} />

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
              Finding hidden anthems
            </p>
          </CardContent>
        </Card>
      ) : discoveryQueue.anthems.length === 0 ? (
        <Card className="glass-effect border-[var(--glass-border)]">
          <CardContent className="p-12 text-center">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Add songs to your queue to discover similar hidden anthems
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
                  onClick={() => {
                    if (onRefreshAnthems) {
                      onRefreshAnthems();
                    }
                  }}
                  disabled={loadingDiscovery}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-[var(--neon-pink)] disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingDiscovery ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Perfect fits for the vibe that aren't overplayed. Safe creative choices that feel fresh.
              </p>
              
              {(showAllAnthems ? discoveryQueue.anthems : discoveryQueue.anthems.slice(0, 2)).map((song) => (
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
                          onClick={() => onAddToQueue({...song, source: 'hidden-anthems'})}
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
                    onClick={() => onSetShowAllAnthems(true)}
                    className="glass-effect bg-[var(--neon-pink)]/10 hover:bg-[var(--neon-pink)]/20 border border-[var(--neon-pink)]/50 hover:border-[var(--neon-pink)] text-[var(--neon-pink)]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Load ({discoveryQueue.anthems.length - 2} more)
                  </Button>
                </div>
              )}
              {showAllAnthems && discoveryQueue.anthems.length > 2 && (
                <div className="text-center pt-2">
                  <Button
                    onClick={() => onSetShowAllAnthems(false)}
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
    </div>
  );
}
