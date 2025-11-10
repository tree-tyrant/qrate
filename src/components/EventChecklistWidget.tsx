import type { ComponentType, SVGProps } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import { CheckCircle2, Circle, AlertCircle, Calendar, Clock3, MapPin, Users } from 'lucide-react';
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
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description: string;
}

interface EventChecklistWidgetProps {
  upcomingEvents: Event[];
  onEventClick?: (event: Event) => void;
  onCreateEvent?: () => void;
  onViewAll?: () => void;
  isLoading?: boolean;
  maxVisible?: number;
}

export default function EventChecklistWidget({
  upcomingEvents,
  onEventClick,
  onCreateEvent,
  onViewAll,
  isLoading = false,
  maxVisible = 3
}: EventChecklistWidgetProps) {
  const getEventTitle = (event: Event) => event.eventName || event.name || 'Untitled event';

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
        icon: CheckCircle2,
        description: 'Your event shell is set up. Keep polishing the details below.'
      },
      {
        id: 'details',
        label: 'Details Set',
        completed: hasDetails && hasTheme,
        icon: hasDetails && hasTheme ? CheckCircle2 : Circle,
        description: hasDetails && hasTheme
          ? 'Guests can see when and what to expect—nice work!'
          : 'Add a date, time, and theme so guests know what they’re signing up for.'
      },
      {
        id: 'promotion',
        label: 'Promotion Started',
        completed: hasGuests,
        icon: hasGuests ? CheckCircle2 : Circle,
        description: hasGuests
          ? 'Guests are already RSVP’ing or sharing preferences.'
          : 'Invite guests or share your event link to start collecting RSVPs.'
      },
      {
        id: 'playlist',
        label: 'Playlist Connected',
        completed: hasPlaylist,
        icon: hasPlaylist ? CheckCircle2 : Circle,
        description: hasPlaylist
          ? 'Your soundtrack is locked in and ready.'
          : 'Connect a Spotify playlist (or create one) to get the vibe just right.'
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

  const visibleEvents = upcomingEvents.slice(0, maxVisible);
  const hiddenEventCount = Math.max(upcomingEvents.length - visibleEvents.length, 0);

  if (isLoading) {
    return (
      <Card className="border-border/50 glass-effect">
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
          <div className="space-y-4">
            {Array.from({ length: maxVisible }).map((_, index) => (
              <div
                key={`event-skeleton-${index}`}
                className="space-y-4 p-4 border border-border/20 rounded-lg glass-effect"
              >
                <div className="space-y-2">
                  <Skeleton className="w-2/3 h-4" />
                  <Skeleton className="w-1/4 h-3" />
                </div>
                <Skeleton className="rounded-full w-full h-2" />
                <div className="space-y-2">
                  <Skeleton className="w-2/5 h-3" />
                  <Skeleton className="w-3/5 h-3" />
                  <Skeleton className="w-1/3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && upcomingEvents.length === 0) {
    return (
      <Card className="border-border/50 glass-effect">
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
          <div className="space-y-4 py-8 text-center">
            <p className="mx-auto max-w-xs text-muted-foreground text-sm">
              No upcoming events yet. Create your next celebration to unlock planning tips and progress tracking.
            </p>
            {onCreateEvent && (
              <Button
                size="sm"
                onClick={onCreateEvent}
                className="bg-gradient-to-r from-blue-600 hover:from-blue-700 to-cyan-500 hover:to-cyan-600 text-white transition-colors"
              >
                Create an event
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="border-border/50 glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent" aria-hidden="true" />
            Event Checklist
          </CardTitle>
          <CardDescription>
            Track your event planning progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {visibleEvents.map((event, index) => {
            const items = getChecklistItems(event);
            const progress = getProgress(items);
            const progressColor = getProgressColor(progress);
            const eventTitle = getEventTitle(event);

            return (
              <div key={event.id} className="space-y-4">
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border border-border/30 hover:border-accent/50 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background w-full text-left transition-all glass-effect"
                  onClick={() => onEventClick?.(event)}
                  aria-label={`View checklist for ${eventTitle}`}
                  disabled={!onEventClick}
                >
                  {/* Event header */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center gap-2">
                      <h4 className="font-semibold text-foreground text-sm truncate">
                        {eventTitle}
                      </h4>
                      <Badge variant="outline" className="border-border/30 text-[10px] text-muted-foreground uppercase tracking-wide">
                        {event.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {event.time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5" aria-hidden="true" />
                          {event.time}
                        </span>
                      )}
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                          {event.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" aria-hidden="true" />
                        {event.guestCount ?? 0} guest{(event.guestCount ?? 0) === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`${eventTitle} completion`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground text-xs">Progress</span>
                      <span className="font-semibold text-foreground text-xs">{Math.round(progress)}%</span>
                    </div>
                    <div className="bg-muted rounded-full h-2 overflow-hidden">
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
                      const isComplete = item.completed;
                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 hover:bg-muted/40 px-1 py-1 rounded-md transition-colors">
                              <Icon
                                aria-hidden="true"
                                className={`w-4 h-4 flex-shrink-0 ${
                                  isComplete
                                    ? 'text-green-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                              <span
                                className={`text-xs ${
                                  isComplete
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {item.label}
                              </span>
                              {!isComplete && (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-500/20 ml-auto border-amber-500/30 text-[10px] text-amber-200"
                                >
                                  Next step
                                </Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs leading-relaxed">
                            {item.description}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>

                  {/* Status badge */}
                  {progress === 100 && (
                    <Badge
                      className="bg-gradient-to-r from-green-500 to-emerald-400 mt-3 border-0 text-white"
                    >
                      Ready to go! 🎉
                    </Badge>
                  )}
                  {progress < 100 && progress >= 50 && (
                    <Badge
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 mt-3 border-0 text-white"
                    >
                      Making progress
                    </Badge>
                  )}
                  {progress < 50 && (
                    <Badge
                      className="bg-gradient-to-r from-yellow-500 to-orange-400 mt-3 border-0 text-white"
                    >
                      Needs attention
                    </Badge>
                  )}
                </motion.button>
                {index < visibleEvents.length - 1 && (
                  <Separator className="bg-border/40" />
                )}
              </div>
            );
          })}

          {hiddenEventCount > 0 && (
            <div className="pt-2 text-muted-foreground text-xs text-center">
              <span>
                +{hiddenEventCount} more upcoming event{hiddenEventCount !== 1 ? 's' : ''}
              </span>
              {onViewAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 px-2 h-7 text-accent hover:text-accent/80 text-xs"
                  onClick={onViewAll}
                >
                  View all
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
