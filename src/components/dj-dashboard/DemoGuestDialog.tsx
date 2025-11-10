// Demo Guest Dialog Component
// Allows selection of demo guest personas to add to the event

import { useState } from 'react';
import { motion } from 'motion/react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Check, UserPlus } from 'lucide-react';
import { DEMO_PERSONAS, type DemoPersona } from '../../utils/demoPersonas';

interface DemoGuestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGuests: (personas: DemoPersona[]) => void;
}

/**
 * Dialog for selecting demo guest personas
 * Shows all available personas with multi-select capability
 */
export function DemoGuestDialog({ isOpen, onClose, onAddGuests }: DemoGuestDialogProps) {
  const [selectedPersonas, setSelectedPersonas] = useState<Set<string>>(new Set());

  const togglePersona = (personaId: string) => {
    setSelectedPersonas(prev => {
      const next = new Set(prev);
      if (next.has(personaId)) {
        next.delete(personaId);
      } else {
        next.add(personaId);
      }
      return next;
    });
  };

  const handleAddSelected = () => {
    const personasToAdd = DEMO_PERSONAS.filter(persona => selectedPersonas.has(persona.id));
    if (personasToAdd.length > 0) {
      onAddGuests(personasToAdd);
      setSelectedPersonas(new Set());
      onClose();
    }
  };

  const selectedCount = selectedPersonas.size;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-[var(--dark-bg)] border-[var(--glass-border)] w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-white">
            <UserPlus className="w-6 h-6 text-[var(--neon-yellow)]" />
            Add Demo Guests
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            Select one or multiple demo guest personas to add to your event. Each persona has pre-defined music preferences that will influence recommendations.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <ScrollArea className="h-[calc(100vh-250px)] pr-4">
            <div className="space-y-3">
              {DEMO_PERSONAS.map((persona) => {
                const isSelected = selectedPersonas.has(persona.id);
                return (
                  <motion.div
                    key={persona.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className={`glass-effect border-[var(--glass-border)] cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? 'border-[var(--neon-yellow)]/70 bg-gradient-to-r from-[var(--neon-yellow)]/10 to-transparent shadow-lg shadow-[var(--neon-yellow)]/20'
                          : 'hover:border-[var(--neon-yellow)]/50 hover:shadow-md'
                      }`}
                      onClick={() => togglePersona(persona.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                            isSelected
                              ? 'bg-[var(--neon-yellow)]/20 border-2 border-[var(--neon-yellow)]'
                              : 'bg-[var(--neon-yellow)]/10 border-2 border-[var(--neon-yellow)]/30'
                          }`}>
                            {persona.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white text-lg">{persona.name}</h3>
                              {isSelected && (
                                <Badge className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-yellow)]/70 text-black">
                                  <Check className="w-3 h-3 mr-1" />
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm mb-2">{persona.vibe}</p>
                            
                            {/* Genres */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {persona.genres.slice(0, 3).map((genre) => (
                                <Badge
                                  key={genre}
                                  variant="outline"
                                  className="text-xs border-[var(--glass-border)] text-gray-400"
                                >
                                  {genre}
                                </Badge>
                              ))}
                            </div>

                            {/* Track count */}
                            <div className="text-xs text-gray-500">
                              {persona.seedTrackIds.length} seed tracks
                            </div>
                          </div>

                          {/* Checkbox indicator */}
                          <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[var(--neon-yellow)] border-[var(--neon-yellow)]'
                              : 'border-gray-500'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-black" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Footer with Add Button */}
        <div className="mt-6 pt-4 border-t border-[var(--glass-border)]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              {selectedCount > 0 ? (
                <span className="text-[var(--neon-yellow)] font-semibold">
                  {selectedCount} persona{selectedCount > 1 ? 's' : ''} selected
                </span>
              ) : (
                'Select one or more personas to add'
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 glass-effect border-[var(--glass-border)] text-white hover:bg-[var(--glass-border)]/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={selectedCount === 0}
              className="flex-1 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-yellow)]/80 hover:from-[var(--neon-yellow)]/90 hover:to-[var(--neon-yellow)]/70 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add {selectedCount > 0 ? `${selectedCount} Guest${selectedCount > 1 ? 's' : ''}` : 'Guests'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


