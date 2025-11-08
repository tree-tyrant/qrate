import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mail, UserCheck, Music } from 'lucide-react';
import { calculateMusicSyncedPercent } from '../utils/mockEventData';

interface UpcomingEventMetricsProps {
  event: {
    guestCount?: number;
    preferences?: any[];
    invitesSent?: number;
    rsvpsConfirmed?: number;
  };
}

export function UpcomingEventMetrics({ event }: UpcomingEventMetricsProps) {
  //  example data if none exists
  const hasRealData = event.invitesSent || event.rsvpsConfirmed || (event.preferences && event.preferences.length > 0);
  
  const invitesSent = event.invitesSent || (hasRealData ? 0 : 45);
  const rsvpsConfirmed = event.rsvpsConfirmed || (hasRealData ? 0 : 32);
  const preferencesCount = (event.preferences || []).length || (hasRealData ? 0 : 28);
  
  const musicSynced = hasRealData 
    ? calculateMusicSyncedPercent(
        event.preferences || [],
        rsvpsConfirmed > 0 ? rsvpsConfirmed : invitesSent
      )
    : Math.round((preferencesCount / (rsvpsConfirmed > 0 ? rsvpsConfirmed : invitesSent)) * 100);

  return (
    <Card className="glass-effect border-blue-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-400 text-base">Upcoming Event Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Guests */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-white">{event.guestCount || rsvpsConfirmed || 32}</div>
            <div className="text-xs text-blue-200/70">Invites Sent</div>
          </div>
        </div>

        {/* Music Preferences */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-white">{preferencesCount}</div>
            <div className="text-xs text-purple-200/70">RSVPs Confirmed</div>
          </div>
        </div>

        {/* Music Synced - Most Important */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 animate-pulse-neon">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold gradient-text">{musicSynced}%</div>
            <div className="text-xs text-cyan-200/80 font-medium">Music Synced</div>
            <div className="text-xs text-cyan-300/60 mt-1">
              {musicSynced >= 80 && '🔥 AI will deliver amazing vibes!'}
              {musicSynced >= 50 && musicSynced < 80 && '👍 Good data for AI recommendations'}
              {musicSynced > 0 && musicSynced < 50 && '💡 More syncs = better playlist'}
              {musicSynced === 0 && '📱 Have guests sync their music preferences'}
            </div>
          </div>
        </div>

        {/* Invites Section */}
        {!hasRealData && invitesSent === 0 && (
          <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-400/20">
            <p className="text-xs text-blue-200/70 leading-relaxed">
              <span className="font-semibold text-blue-300">💡 Pro Tip:</span> Use QRate for invites to track RSVPs and music preferences automatically!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
