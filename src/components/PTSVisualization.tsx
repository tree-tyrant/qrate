import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  calculatePTS, 
  getPTSScoreRanges,
  type TrackWithMetadata,
  type PTSResult 
} from '../utils/personalTasteScore';
import {
  getDecayProjection,
  applyContextualWeighting,
  type GuestArrival,
  type EventConfig
} from '../utils/contextualWeighting';
import { TrendingUp, Users, Clock, MapPin, Zap } from 'lucide-react';

interface PTSVisualizationProps {
  eventSize?: 'small' | 'large';
  geoFenceEnabled?: boolean;
}

export function PTSVisualization({ 
  eventSize = 'large',
  geoFenceEnabled = true 
}: PTSVisualizationProps) {
  
  // Example tracks with different scenarios
  const exampleTracks: TrackWithMetadata[] = [
    {
      id: 'track_1',
      name: 'Current #1 Hit',
      artist: 'Top Artist',
      rank: 1,
      timeframe: 'short_term',
      isSaved: true,
      userId: 'user_1'
    },
    {
      id: 'track_2',
      name: 'Recent Favorite',
      artist: 'Trending Artist',
      rank: 10,
      timeframe: 'short_term',
      isSaved: false,
      userId: 'user_1'
    },
    {
      id: 'track_3',
      name: 'Classic Favorite',
      artist: 'Established Artist',
      rank: 25,
      timeframe: 'medium_term',
      isSaved: true,
      userId: 'user_1'
    },
    {
      id: 'track_4',
      name: 'Old Favorite',
      artist: 'Legacy Artist',
      rank: 50,
      timeframe: 'long_term',
      isSaved: false,
      userId: 'user_1'
    }
  ];

  const ptsResults = exampleTracks.map(track => calculatePTS(track));
  const scoreRanges = getPTSScoreRanges();

  // Contextual weighting example
  const eventConfig: EventConfig = {
    eventId: 'demo',
    startTime: new Date(),
    eventSize,
    geoFenceEnabled,
    geoFenceCenter: { lat: 40.7128, lon: -74.0060 },
    geoFenceRadius: 100
  };

  const presentGuest: GuestArrival = {
    userId: 'user_present',
    arrivalTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    cohortIndex: 0,
    presenceStatus: 'present',
    coordinates: { lat: 40.7128, lon: -74.0060 }
  };

  const absentGuest: GuestArrival = {
    userId: 'user_absent',
    arrivalTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    cohortIndex: 0,
    presenceStatus: 'absent',
    coordinates: { lat: 40.7500, lon: -74.0500 }
  };

  const presentDecay = getDecayProjection(0.90, 5);
  const absentDecay = getDecayProjection(0.40, 5);

  const weightedPresentPTS = applyContextualWeighting(1.0, presentGuest, eventConfig);
  const weightedAbsentPTS = applyContextualWeighting(1.0, absentGuest, eventConfig);

  return (
    <Card className="glass-effect border-border">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Personal Taste Score (PTS) System
        </CardTitle>
        <CardDescription>
          How QRate quantifies and weights music preferences
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="pts" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full glass-effect">
            <TabsTrigger value="pts">PTS Calculation</TabsTrigger>
            <TabsTrigger value="decay">Time Decay</TabsTrigger>
            <TabsTrigger value="combined">Combined Score</TabsTrigger>
          </TabsList>

          {/* PTS Calculation Tab */}
          <TabsContent value="pts" className="space-y-4">
            {/* Total Pool Size Info */}
            <Card className="glass-effect border-accent/20 bg-accent/5">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Total pool size:</strong> ~500 tracks before filtering → ~350 tracks after Vibe Gate
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  These filtered tracks enter the recommendation algorithm where they're ranked by aggregated PTS scores.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  Formula: PTS = BaseRank × Recency × SavedBonus
                </h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• <strong>BaseRank</strong>: e^(-0.05×(rank-1)) - Exponential decay based on position</p>
                  <p>• <strong>Recency</strong>: Short-term (1.5x), Medium-term (1.2x), Long-term (1.0x)</p>
                  <p>• <strong>SavedBonus</strong>: 1.1x if track is in Liked Songs</p>
                </div>
              </CardContent>
            </Card>

            {/* Score Ranges */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">
                      {scoreRanges.best.toFixed(3)}
                    </div>
                    <div className="text-xs text-muted-foreground">Best Score</div>
                    <div className="text-xs text-green-400/80 mt-1">
                      Rank #1, Recent, Saved
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-500/5 border-yellow-500/20">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">
                      {scoreRanges.average.toFixed(3)}
                    </div>
                    <div className="text-xs text-muted-foreground">Average Score</div>
                    <div className="text-xs text-yellow-400/80 mt-1">
                      Rank #50, Medium-term
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-400">
                      {scoreRanges.worst.toFixed(3)}
                    </div>
                    <div className="text-xs text-muted-foreground">Lowest Score</div>
                    <div className="text-xs text-red-400/80 mt-1">
                      Rank #100, All-time
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Example Tracks */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Example Calculations</h4>
              {ptsResults.map((pts, idx) => (
                <Card key={idx} className="bg-card/30 border-border/50">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{exampleTracks[idx].name}</div>
                        <div className="text-xs text-muted-foreground">{exampleTracks[idx].artist}</div>
                      </div>
                      <Badge className="bg-primary/20 border-primary/30 text-primary">
                        {pts.finalPTS.toFixed(4)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Rank #{pts.breakdown.rank}</span>
                        <span>{pts.baseRankScore.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {pts.breakdown.timeframe.replace('_', '-')} 
                          <span className="ml-1 text-accent">×{pts.recencyMultiplier}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {pts.breakdown.isSaved ? '❤️ Saved' : 'Not Saved'} 
                          <span className="ml-1 text-accent">×{pts.savedBonus}</span>
                        </span>
                      </div>
                      <Progress value={(pts.finalPTS / scoreRanges.best) * 100} className="h-1 mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Time Decay Tab */}
          <TabsContent value="decay" className="space-y-4">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  Context-Aware Time Decay
                </h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• Early guests' influence decays as they may leave</p>
                  <p>• Present guests: 10% decay per hour (D = 0.90)</p>
                  <p>• Absent guests: 60% decay per hour (D = 0.40)</p>
                  <p>• Small events ({`<20`} guests): Use gentle decay for all</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              {/* Present Guest Decay */}
              <Card className="bg-green-500/5 border-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    Present Guest
                  </CardTitle>
                  <CardDescription className="text-xs">
                    At venue • D = 0.90
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {presentDecay.map(({ hour, percentage }) => (
                    <div key={hour} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Hour {hour}</span>
                        <span className="text-green-400 font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-1.5 bg-green-950/30"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Absent Guest Decay */}
              <Card className="bg-red-500/5 border-red-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    Absent Guest
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Left venue • D = 0.40
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {absentDecay.map(({ hour, percentage }) => (
                    <div key={hour} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Hour {hour}</span>
                        <span className="text-red-400 font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-1.5 bg-red-950/30"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Key Insight */}
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-accent">Key Insight:</strong> After 2 hours, present guests retain 81% influence 
                  while absent guests drop to just 16%. This ensures the playlist adapts to who's actually at the event!
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Combined Score Tab */}
          <TabsContent value="combined" className="space-y-4">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Final Weighted Score
                </h4>
                <p className="text-xs text-muted-foreground">
                  Weighted PTS = Base PTS × Time Decay Multiplier
                </p>
              </CardContent>
            </Card>

            {/* Event Configuration */}
            <Card className="bg-secondary/30 border-border/50">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Event Size</span>
                  <Badge variant="outline">{eventSize}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Geo-Fence</span>
                  <Badge variant={geoFenceEnabled ? 'default' : 'secondary'}>
                    {geoFenceEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Time Elapsed</span>
                  <span className="font-medium">2 hours</span>
                </div>
              </CardContent>
            </Card>

            {/* Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-green-500/5 border-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-green-400">Present Guest</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Base PTS</span>
                      <span>1.0000</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Decay (2h)</span>
                      <span className="text-green-400">×{weightedPresentPTS.timeDecayMultiplier.toFixed(4)}</span>
                    </div>
                    <div className="h-px bg-border my-2"></div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Weighted PTS</span>
                      <span className="text-green-400">{weightedPresentPTS.weightedPTS.toFixed(4)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-500/5 border-red-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-red-400">Absent Guest</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Base PTS</span>
                      <span>1.0000</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Decay (2h)</span>
                      <span className="text-red-400">×{weightedAbsentPTS.timeDecayMultiplier.toFixed(4)}</span>
                    </div>
                    <div className="h-px bg-border my-2"></div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Weighted PTS</span>
                      <span className="text-red-400">{weightedAbsentPTS.weightedPTS.toFixed(4)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Impact Visualization */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-2 text-primary">Impact on Playlist</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  With equal Base PTS scores, present guests have <strong className="text-primary">
                  {((weightedPresentPTS.weightedPTS / weightedAbsentPTS.weightedPTS) * 100).toFixed(0)}% more influence
                  </strong> on the playlist than absent guests after 2 hours.
                </p>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Present Guest Influence</span>
                      <span className="text-green-400">81%</span>
                    </div>
                    <Progress value={81} className="h-2 bg-green-950/30" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Absent Guest Influence</span>
                      <span className="text-red-400">16%</span>
                    </div>
                    <Progress value={16} className="h-2 bg-red-950/30" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
