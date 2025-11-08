import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { validateTrackAgainstVibe, calculateTracksPerPerson } from '../utils/vibeGate';
import { VibeProfile } from '../utils/types';
import { CheckCircle, XCircle, Info, Users } from 'lucide-react';

interface VibeGateDemoProps {
  vibeProfile: VibeProfile;
  guestCount?: number;
}

// Example tracks for demonstration
const SAMPLE_TRACKS = [
  { name: 'Waterfalls', artist: 'TLC', genres: ['R&B'], releaseDate: '1994-11-15', energy: 0.65, danceability: 0.72, explicit: false },
  { name: 'No Scrubs', artist: 'TLC', genres: ['R&B', 'Hip-Hop'], releaseDate: '1999-02-02', energy: 0.70, danceability: 0.75, explicit: false },
  { name: 'Blinding Lights', artist: 'The Weeknd', genres: ['Pop', 'Synth-Pop'], releaseDate: '2019-11-29', energy: 0.73, danceability: 0.51, explicit: false },
  { name: 'Levitating', artist: 'Dua Lipa', genres: ['Pop', 'Dance'], releaseDate: '2020-10-01', energy: 0.82, danceability: 0.70, explicit: false },
  { name: 'Creep', artist: 'TLC', genres: ['R&B'], releaseDate: '1994-10-31', energy: 0.55, danceability: 0.68, explicit: false },
  { name: 'Un-Break My Heart', artist: 'Toni Braxton', genres: ['R&B', 'Soul'], releaseDate: '1996-10-07', energy: 0.48, danceability: 0.42, explicit: false },
  { name: 'Sicko Mode', artist: 'Travis Scott', genres: ['Hip-Hop', 'Trap'], releaseDate: '2018-08-21', energy: 0.76, danceability: 0.83, explicit: true },
  { name: 'End of the Road', artist: 'Boyz II Men', genres: ['R&B', 'Soul'], releaseDate: '1992-06-30', energy: 0.42, danceability: 0.48, explicit: false }
];

export function VibeGateDemo({ vibeProfile, guestCount = 25 }: VibeGateDemoProps) {
  const [showResults, setShowResults] = useState(false);
  
  const results = SAMPLE_TRACKS.map(track => 
    validateTrackAgainstVibe(track, vibeProfile)
  );
  
  const passedTracks = results.filter(r => r.passed);
  const failedTracks = results.filter(r => !r.passed);
  const passRate = (passedTracks.length / results.length) * 100;
  const tracksPerPerson = calculateTracksPerPerson(guestCount);

  return (
    <Card className="glass-effect border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-accent" />
              Vibe Gate Preview
            </CardTitle>
            <CardDescription>
              See how your vibe profile filters sample tracks
            </CardDescription>
          </div>
          <Button 
            onClick={() => setShowResults(!showResults)}
            variant="secondary"
            size="sm"
          >
            {showResults ? 'Hide' : 'Test'} Filter
          </Button>
        </div>
      </CardHeader>

      {showResults && (
        <CardContent className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{passedTracks.length}</div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{failedTracks.length}</div>
                  <div className="text-xs text-muted-foreground">Rejected</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{passRate.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">Pass Rate</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contribution Sizing Info */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Contribution Sizing</span>
              </div>
              <p className="text-xs text-muted-foreground">
                With <strong>{guestCount} guests</strong>, each will contribute their top <strong>{tracksPerPerson} tracks</strong>
              </p>
            </CardContent>
          </Card>

          {/* Pass Rate Visual */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Filter Effectiveness</span>
              <span className={passRate >= 60 && passRate <= 80 ? 'text-green-400' : 'text-yellow-400'}>
                {passRate >= 60 && passRate <= 80 ? 'Optimal' : passRate > 80 ? 'Too Loose' : 'Too Strict'}
              </span>
            </div>
            <Progress value={passRate} className="h-2" />
          </div>

          {/* Passed Tracks */}
          {passedTracks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Passed Vibe Gate ({passedTracks.length})
              </h4>
              <div className="space-y-2">
                {passedTracks.map((result, idx) => (
                  <Card key={idx} className="bg-green-500/5 border-green-500/20">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{result.track.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{result.track.artist}</div>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 shrink-0">
                          {result.score}%
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.reasons.filter(r => r.startsWith('✓')).map((reason, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Failed Tracks */}
          {failedTracks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Rejected by Vibe Gate ({failedTracks.length})
              </h4>
              <div className="space-y-2">
                {failedTracks.map((result, idx) => (
                  <Card key={idx} className="bg-red-500/5 border-red-500/20">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{result.track.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{result.track.artist}</div>
                        </div>
                        <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 shrink-0">
                          {result.score}%
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.reasons.filter(r => !r.startsWith('✓')).map((reason, i) => (
                          <Badge key={i} variant="destructive" className="text-xs opacity-80">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Tip:</strong> A healthy pass rate is 60-80%. If it's too high, your filter may be too loose. 
                If it's too low, consider switching to "loose" mode or removing some restrictions.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      )}
    </Card>
  );
}
