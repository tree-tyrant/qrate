import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, RotateCcw, Calendar, Music, MapPin, X } from 'lucide-react';
import { utils } from '../utils/api';

interface Event {
  id: string;
  eventName?: string;
  name?: string;
  eventTheme?: string;
  theme?: string;
  eventDescription?: string;
  code: string;
  date: string;
  time: string;
  location?: string;
  status: 'past' | 'live' | 'upcoming';
  guestCount?: number;
  preferences?: Array<any>;
  trashedAt?: string;
}

interface TrashedEventsModalProps {
  open: boolean;
  onClose: () => void;
  trashedEvents: Event[];
  onRestoreEvent: (event: Event) => void;
  onPermanentDelete?: (event: Event) => void;
}

function TrashedEventsModal({ open, onClose, trashedEvents, onRestoreEvent, onPermanentDelete }: TrashedEventsModalProps) {
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-destructive/30 text-white max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trash2 className="w-6 h-6 text-destructive" />
            Trashed Events
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Events you've deleted. You can restore them or they'll be permanently removed after 30 days.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-2 space-y-3 max-h-[60vh]">
          {trashedEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg text-muted-foreground">No trashed events</p>
              <p className="text-sm text-muted-foreground mt-1">Deleted events will appear here</p>
            </div>
          ) : (
            trashedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-effect border-border/30 hover:border-destructive/50 transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Event Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">
                              {event.eventName || event.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/30">
                                Code: {event.code}
                              </Badge>
                              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-accent" />
                            <span>{event.eventTheme || event.theme}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>
                              {new Date(event.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                              {event.time && ` at ${utils.time.to12Hour(event.time)}`}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.trashedAt && (
                            <div className="flex items-center gap-2 text-xs text-destructive/70 mt-2">
                              <Trash2 className="w-3 h-3" />
                              <span>
                                Deleted {new Date(event.trashedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          onClick={() => onRestoreEvent(event)}
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none glass-effect border-green-500/40 text-green-400 hover:bg-green-500/20 hover:border-green-500/60 transition-all duration-300"
                        >
                          <RotateCcw className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Restore</span>
                        </Button>
                        
                        {onPermanentDelete && (
                          <Button
                            onClick={() => onPermanentDelete(event)}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none glass-effect border-destructive/40 text-destructive hover:bg-destructive/20 hover:border-destructive/60 transition-all duration-300"
                          >
                            <X className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-border/30">
          <Button
            onClick={onClose}
            variant="outline"
            className="glass-effect border-border/40 text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TrashedEventsModal;
