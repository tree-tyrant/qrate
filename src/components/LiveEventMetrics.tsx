import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Zap, Music, TrendingUp, Activity } from 'lucide-react';
import { calculateLiveVibeScore, getTopGenres, getEnergyLevel } from '../utils/mockEventData';

interface LiveEventMetricsProps {
  event: {
    guestCount?: number;
    preferences?: any[];
    currentTrack?: any;
  };
}

export function LiveEventMetrics({ event }: LiveEventMetricsProps) {
  const liveGuestCount = event.guestCount || 0;
  const liveVibeScore = calculateLiveVibeScore(event.preferences, event.currentTrack);
  const topGenres = getTopGenres(event.preferences || [], 3);
  const energyLevel = getEnergyLevel();
  
  // Calculate energy percentage for gauge
  const energyPercent = energyLevel === 'Peaking' ? 92 : energyLevel === 'Grooving' ? 72 : 45;
  
  // Get energy color
  const getEnergyColor = () => {
    if (energyLevel === 'Peaking') return 'from-red-500 to-orange-500';
    if (energyLevel === 'Grooving') return 'from-yellow-500 to-green-500';
    return 'from-blue-500 to-cyan-500';
  };

  return (
    <div className="space-y-4">
      {/* Big Bold Numbers at Top */}
      <div className="grid grid-cols-2 gap-3">
        {/* Live Guest Count */}
        <Card className="glass-effect border-green-500/40 bg-gradient-to-br from-green-900/20 to-emerald-900/10">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl font-bold text-green-400 mb-1">
              {liveGuestCount}
            </div>
            <div className="text-xs text-green-200/70 font-medium">Live Guest Count</div>
            <div className="text-xs text-green-300/50 mt-1">Checked in via QR</div>
          </CardContent>
        </Card>

        {/* Live Vibe Score™ */}
        <Card className="glass-effect border-cyan-500/40 bg-gradient-to-br from-cyan-900/20 to-blue-900/10">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-2">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-4xl font-bold gradient-text mb-1">
              {liveVibeScore}%
            </div>
            <div className="text-xs text-cyan-200/70 font-medium">Live Vibe Score™</div>
            <div className="text-xs text-cyan-300/50 mt-1">Music-to-crowd alignment</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// New component for Live Crowd Analytics (Crowd Profile + Energy Meter)
export function LiveCrowdAnalytics({ event }: LiveEventMetricsProps) {
  const topGenres = getTopGenres(event.preferences || [], 3);
  const energyLevel = getEnergyLevel();
  
  // Calculate energy percentage for gauge
  const energyPercent = energyLevel === 'Peaking' ? 92 : energyLevel === 'Grooving' ? 72 : 45;
  
  // Get energy color
  const getEnergyColor = () => {
    if (energyLevel === 'Peaking') return 'from-red-500 to-orange-500';
    if (energyLevel === 'Grooving') return 'from-yellow-500 to-green-500';
    return 'from-blue-500 to-cyan-500';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Live Crowd Profile */}
      <Card className="glass-effect border-purple-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-400 text-base flex items-center gap-2">
            <Music className="w-4 h-4" />
            Live Crowd Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-purple-200/60 mb-3">
            Top 3 genres currently represented at the event
          </p>
          
          {topGenres.map((genre, index) => (
            <div 
              key={genre}
              className="flex items-center gap-3 p-2.5 rounded-lg glass-effect border border-purple-400/20 hover:border-purple-400/40 transition-all"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                index === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{genre}</div>
                <div className="text-xs text-purple-200/50">
                  {index === 0 ? 'Most popular' : index === 1 ? 'Strong presence' : 'Growing'}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Energy Level Meter */}
      <Card className="glass-effect border-orange-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-400 text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Energy Level Meter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-orange-200/60 mb-3">
            Current energy of the music being played
          </p>
          
          {/* Speedometer-style gauge */}
          <div className="relative h-24 mb-2">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-900/40 via-yellow-900/40 to-red-900/40 overflow-hidden">
              {/* Energy bar */}
              <div 
                className={`h-full bg-gradient-to-r ${getEnergyColor()} transition-all duration-1000 relative`}
                style={{ width: `${energyPercent}%` }}
              >
                <div className="absolute inset-0 animate-pulse opacity-50" />
              </div>
            </div>
            
            {/* Labels */}
            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
              <span className={`text-xs font-medium ${energyLevel === 'Chill' ? 'text-cyan-300' : 'text-white/40'}`}>
                Chill
              </span>
              <span className={`text-xs font-medium ${energyLevel === 'Grooving' ? 'text-yellow-300' : 'text-white/40'}`}>
                Grooving
              </span>
              <span className={`text-xs font-medium ${energyLevel === 'Peaking' ? 'text-orange-300' : 'text-white/40'}`}>
                Peaking
              </span>
            </div>
          </div>

          {/* Current status */}
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-gradient-to-r from-white/5 to-white/10">
            <TrendingUp className={`w-4 h-4 ${
              energyLevel === 'Peaking' ? 'text-orange-400' :
              energyLevel === 'Grooving' ? 'text-yellow-400' :
              'text-cyan-400'
            }`} />
            <span className="text-sm font-bold text-white">{energyLevel}</span>
            <span className="text-xs text-white/50">
              ({energyPercent}%)
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
