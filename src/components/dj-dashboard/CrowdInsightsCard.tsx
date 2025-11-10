// Crowd Insights Card Component
// Displays crowd analytics and top genres/artists

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { TrendingUp, Music, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface CrowdInsightsCardProps {
  insights: any;
}

/**
 * Crowd Insights Card
 * Shows analytics about the crowd's music preferences
 */
export function CrowdInsightsCard({ insights }: CrowdInsightsCardProps) {
  if (!insights) return null;

  return (
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
      
        {/* Audience Profile */}
        {insights?.audienceProfile && (
          <div className="pt-4 border-t border-[var(--glass-border)]">
            <h4 className="text-sm font-medium text-white mb-3">Audience Profile</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={
                  insights.audienceProfile.avgPopularity > 70
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
  );
}
