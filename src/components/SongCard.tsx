import { useMemo, memo } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { X, Users, TrendingUp, Music, ArrowRight, Volume2, Heart } from 'lucide-react';

interface SongCardProps {
  song: {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album?: { name: string; images?: Array<{ url: string }> };
    popularity?: number;
    explicit?: boolean;
    duration_ms?: number;
  };
  averageScore?: number;
  playlistCount?: number;
  crowdAffinity?: number;
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
  onRemove?: () => void;
  showDetails?: boolean;
  rank?: number;
}

const SongCard = memo(function SongCard({ 
  song, 
  averageScore = 0, 
  playlistCount = 0,
  crowdAffinity = 0,
  transitionSongs = [],
  audioFeatures,
  onRemove, 
  showDetails = true,
  rank 
}: SongCardProps) {

  // Memoize expensive computations
  const artistNames = useMemo(
    () => song.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    [song.artists]
  );
  
  const albumArt = useMemo(
    () => song.album?.images?.[0]?.url,
    [song.album?.images]
  );
  
  const duration = useMemo(
    () => song.duration_ms ? Math.floor(song.duration_ms / 1000 / 60) + ':' + String(Math.floor((song.duration_ms / 1000) % 60)).padStart(2, '0') : '',
    [song.duration_ms]
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAffinityLevel = (affinity: number) => {
    if (affinity >= 80) return { label: 'Crowd Favorite', color: 'bg-green-500' };
    if (affinity >= 60) return { label: 'Popular Pick', color: 'bg-yellow-500' };
    if (affinity >= 40) return { label: 'Solid Choice', color: 'bg-blue-500' };
    return { label: 'Discovery Track', color: 'bg-purple-500' };
  };

  const affinityLevel = useMemo(
    () => getAffinityLevel(crowdAffinity),
    [crowdAffinity]
  );

  return (
    <Card className="group bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          {rank && (
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                rank <= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black' :
                rank <= 10 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                'bg-zinc-700 text-zinc-300'
              }`}>
                {rank}
              </div>
            </div>
          )}

          {/* Album Art */}
          <div className="flex-shrink-0">
            <div className="flex justify-center items-center bg-zinc-800 rounded-lg w-12 h-12 overflow-hidden">
              {albumArt ? (
                <img src={albumArt} alt={song.album?.name} className="w-full h-full object-cover" />
              ) : (
                <Music className="w-6 h-6 text-zinc-400" />
              )}
            </div>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-white truncate">{song.name}</h3>
              {song.explicit && (
                <Badge variant="outline" className="px-1 py-0 border-red-500 text-red-400 text-xs">
                  E
                </Badge>
              )}
            </div>
            <p className="text-zinc-400 text-sm truncate">{artistNames}</p>
            {song.album?.name && (
              <p className="mt-0.5 text-zinc-500 text-xs truncate">{song.album.name}</p>
            )}
          </div>

          {/* Stats */}
          {showDetails && (
            <div className="flex-shrink-0 space-y-1">
              {/* Crowd Affinity */}
              <div className="flex items-center gap-2">
                <Badge className={`${affinityLevel.color} text-white text-xs`}>
                  {Math.round(crowdAffinity)}% crowd
                </Badge>
              </div>
              
              {/* Score */}
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="w-3 h-3 text-zinc-400" />
                <span className={`font-medium ${getScoreColor(averageScore)}`}>
                  {Math.round(averageScore)}
                </span>
              </div>

              {/* Playlist Count */}
              {playlistCount > 0 && (
                <div className="flex items-center gap-1 text-zinc-400 text-xs">
                  <Users className="w-3 h-3" />
                  <span>{playlistCount} playlists</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-2">
            {/* Info Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Volume2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    {albumArt && (
                      <img src={albumArt} alt={song.album?.name} className="rounded-lg w-12 h-12" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        {song.name}
                        {song.explicit && <Badge variant="outline" className="border-red-500 text-red-400">E</Badge>}
                      </div>
                      <p className="font-normal text-zinc-400 text-sm">{artistNames}</p>
                    </div>
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500">
                    Track insights and crowd analytics
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Crowd Stats */}
                  <div className="gap-4 grid grid-cols-2">
                    <div className="bg-zinc-800/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-pink-400" />
                        <span className="font-medium text-sm">Crowd Affinity</span>
                      </div>
                      <div className="font-bold text-pink-400 text-2xl">{Math.round(crowdAffinity)}%</div>
                      <p className="mt-1 text-zinc-400 text-xs">{affinityLevel.label}</p>
                    </div>
                    
                    <div className="bg-zinc-800/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="font-medium text-sm">In Playlists</span>
                      </div>
                      <div className="font-bold text-blue-400 text-2xl">{playlistCount}</div>
                      <p className="mt-1 text-zinc-400 text-xs">
                        {playlistCount > 15 ? 'Very Popular' : playlistCount > 8 ? 'Popular' : 'Niche Pick'}
                      </p>
                    </div>
                  </div>

                  {/* Audio Features */}
                  {audioFeatures && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-white">Audio Characteristics</h4>
                      <div className="gap-4 grid grid-cols-2">
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="text-zinc-400">Danceability</span>
                            <span className="text-white">{Math.round((audioFeatures.danceability || 0) * 100)}%</span>
                          </div>
                          <Progress value={(audioFeatures.danceability || 0) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="text-zinc-400">Energy</span>
                            <span className="text-white">{Math.round((audioFeatures.energy || 0) * 100)}%</span>
                          </div>
                          <Progress value={(audioFeatures.energy || 0) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="text-zinc-400">Positivity</span>
                            <span className="text-white">{Math.round((audioFeatures.valence || 0) * 100)}%</span>
                          </div>
                          <Progress value={(audioFeatures.valence || 0) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="text-zinc-400">Tempo</span>
                            <span className="text-white">{Math.round(audioFeatures.tempo || 0)} BPM</span>
                          </div>
                          <Progress value={((audioFeatures.tempo || 0) / 200) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transition Recommendations */}
                  {transitionSongs.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 font-medium text-white">
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                        Great Transitions
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {transitionSongs.slice(0, 4).map((transition, index) => (
                          <div key={index} className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                            <div>
                              <p className="font-medium text-white text-sm">{transition.name}</p>
                              <p className="text-zinc-400 text-xs">
                                {transition.artists?.map(a => a.name).join(', ')}
                              </p>
                            </div>
                            {transition.transitionScore && (
                              <Badge variant="outline" className="border-cyan-500 text-cyan-400 text-xs">
                                {Math.round(transition.transitionScore)}%
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Remove Button */}
            {onRemove && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRemove}
                className="hover:bg-red-500/10 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Duration */}
        {duration && (
          <div className="mt-2 text-zinc-500 text-xs text-right">
            {duration}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SongCard.displayName = 'SongCard';

export default SongCard;