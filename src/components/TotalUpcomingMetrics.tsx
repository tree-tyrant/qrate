import { Card, CardContent } from './ui/card';
import { Mail, UserCheck, Music, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface TotalUpcomingMetricsProps {
  events: Array<{
    guestCount?: number;
    preferences?: any[];
    invitesSent?: number;
    rsvpsConfirmed?: number;
  }>;
}

export function TotalUpcomingMetrics({ events }: TotalUpcomingMetricsProps) {
  // Calculate totals across all upcoming events
  const totalInvites = events.reduce((sum, event) => sum + (event.invitesSent || 0), 0);
  const totalRsvps = events.reduce((sum, event) => sum + (event.rsvpsConfirmed || 0), 0);
  const totalMusicSynced = events.reduce((sum, event) => sum + (event.preferences?.length || 0), 0);
  const totalEvents = events.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Upcoming Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Card className="relative glass-effect border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <div className="text-xs uppercase tracking-wider text-blue-400/70">Scheduled</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-blue-400">{totalEvents}</div>
              <div className="text-xs text-muted-foreground">Total Events</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Total Invites Sent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Card className="relative glass-effect border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              <div className="text-xs uppercase tracking-wider text-cyan-400/70">All Events</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-cyan-400">{totalInvites}</div>
              <div className="text-xs text-muted-foreground">Invites Sent</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Total RSVPs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Card className="relative glass-effect border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              <div className="text-xs uppercase tracking-wider text-purple-400/70">Confirmed</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-purple-400">{totalRsvps}</div>
              <div className="text-xs text-muted-foreground">RSVPs</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Total Music Synced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Card className="relative glass-effect border-pink-500/30 hover:border-pink-500/60 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <Music className="w-5 h-5 text-pink-400" />
              <div className="text-xs uppercase tracking-wider text-pink-400/70">Synced</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-pink-400">{totalMusicSynced}</div>
              <div className="text-xs text-muted-foreground">Music Preferences</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
