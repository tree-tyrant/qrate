import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Event {
  id: string;
  eventName?: string;
  name?: string;
  eventTheme?: string;
  theme?: string;
  code: string;
  date: string;
  time: string;
  location?: string;
  status: 'past' | 'live' | 'upcoming';
  guestCount?: number;
  connectedPlaylist?: any;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  icon: typeof CheckCircle2;
}

interface EventChecklistWidgetProps {
  upcomingEvents: Event[];
  onEventClick?: (event: Event) => void;
}

export default function EventChecklistWidget({ upcomingEvents, onEventClick }: EventChecklistWidgetProps) {
  // Calculate checklist items for an event
  const getChecklistItems = (event: Event): ChecklistItem[] => {
    const hasTheme = Boolean(event.eventTheme || event.theme);
    const hasDetails = Boolean(event.date && event.time);
    const hasGuests = (event.guestCount || 0) > 0;
    const hasPlaylist = Boolean(event.connectedPlaylist);

    return [
      {
        id: 'created',
        label: 'Event Created',
        completed: true, // Always true if event exists
        icon: CheckCircle2
      },
      {
        id: 'details',
        label: 'Details Set',
        completed: hasDetails && hasTheme,
        icon: hasDetails && hasTheme ? CheckCircle2 : Circle
      },
      {
        id: 'promotion',
        label: 'Promotion Started',
        completed: hasGuests,
        icon: hasGuests ? CheckCircle2 : Circle
      },
      {
        id: 'playlist',
        label: 'Playlist Connected',
        completed: hasPlaylist,
        icon: hasPlaylist ? CheckCircle2 : Circle
      }
    ];
  };

  const getProgress = (items: ChecklistItem[]) => {
    const completed = items.filter(item => item.completed).length;
    return (completed / items.length) * 100;
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'from-green-500 to-emerald-400';
    if (progress >= 75) return 'from-blue-500 to-cyan-400';
    if (progress >= 50) return 'from-yellow-500 to-orange-400';
    return 'from-red-500 to-pink-400';
  };

  if (upcomingEvents.length === 0) {
    return (
      <Card className="glass-effect border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent" />
            Event Checklist
          </CardTitle>
          <CardDescription>
            Track your event planning progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No upcoming events. Create an event to get started!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-accent" />
          Event Checklist
        </CardTitle>
        <CardDescription>
          Track your event planning progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingEvents.slice(0, 3).map((event, index) => {
          const items = getChecklistItems(event);
          const progress = getProgress(items);
          const progressColor = getProgressColor(progress);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-effect p-4 rounded-lg border border-border/30 hover:border-accent/50 transition-all cursor-pointer"
              onClick={() => onEventClick?.(event)}
            >
              {/* Event header */}
              <div className="mb-3">
                <h4 className="font-semibold text-sm truncate">
                  {event.eventName || event.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    className={`h-full bg-gradient-to-r ${progressColor}`}
                  />
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-center gap-2">
                      <Icon 
                        className={`w-4 h-4 flex-shrink-0 ${
                          item.completed 
                            ? 'text-green-400' 
                            : 'text-muted-foreground'
                        }`}
                      />
                      <span 
                        className={`text-xs ${
                          item.completed 
                            ? 'text-foreground' 
                            : 'text-muted-foreground'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status badge */}
              {progress === 100 && (
                <Badge 
                  className="mt-3 bg-gradient-to-r from-green-500 to-emerald-400 text-white border-0"
                >
                  Ready to go! 🎉
                </Badge>
              )}
              {progress < 100 && progress >= 50 && (
                <Badge 
                  className="mt-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-0"
                >
                  Making progress
                </Badge>
              )}
              {progress < 50 && (
                <Badge 
                  className="mt-3 bg-gradient-to-r from-yellow-500 to-orange-400 text-white border-0"
                >
                  Needs attention
                </Badge>
              )}
            </motion.div>
          );
        })}

        {upcomingEvents.length > 3 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            +{upcomingEvents.length - 3} more upcoming event{upcomingEvents.length - 3 !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
