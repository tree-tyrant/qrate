import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DollarSign, X, ChevronRight, AlertTriangle, Coins, Undo2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tip, TipMessageType } from '../utils/types';
import { utils } from '../utils/api';

interface TipJarProps {
  eventId: string;
  eventCode?: string;
  eventName?: string;
  onAddToQueue?: (tip: Tip) => void;
}

export default function TipJar({ eventId, eventCode, eventName, onAddToQueue }: TipJarProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [totalTips, setTotalTips] = useState(0);
  const [lastTip, setLastTip] = useState<{ amount: number; guestName: string } | null>(null);
  const [newTipAnimation, setNewTipAnimation] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'SHOUTOUT' | 'MESSAGE' | 'REQUEST' | 'dismissed'>('all');

  // Initialize mock tips for Pool Party event
  useEffect(() => {
    console.log('🔍 TipJar: Checking for Pool Party event');
    console.log('   Event ID:', eventId);
    console.log('   Event Code (prop):', eventCode);
    console.log('   Event Name (prop):', eventName);
    
    // Check both event code and event name for backward compatibility
    const isPoolParty = eventCode?.toUpperCase() === 'POOL' || 
                        eventName?.toLowerCase().includes('pool party');

    console.log('   Is Pool Party?', isPoolParty);

    if (isPoolParty) {
      const existingTips = utils.storage.get(`qrate_tips_${eventId}`) || [];
      console.log('   Existing tips count:', existingTips.length);
      
      if (existingTips.length === 0) {
        // Initialize with mock tips
        const MOCK_TIPS: Tip[] = [
          {
            id: 'mock-tip-1',
            eventId,
            guestName: 'Alex Jones',
            amount: 10.00,
            message: "It's my friend Maria's birthday! Can you give her a shoutout?",
            messageType: 'SHOUTOUT',
            timestamp: new Date(Date.now() - 7 * 60000).toISOString(),
            dismissed: false,
            djEarnings: 8.50,
            platformFee: 1.50,
          },
          {
            id: 'mock-tip-2',
            eventId,
            guestName: 'James',
            amount: 5.00,
            message: "Please play 'Blinding Lights' by The Weeknd! 🙏",
            messageType: 'REQUEST',
            trackName: 'Blinding Lights',
            trackArtist: 'The Weeknd',
            timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
            dismissed: false,
            crowdScore: 88,
            themeMatch: 75,
            djEarnings: 4.25,
            platformFee: 0.75,
          },
          {
            id: 'mock-tip-3',
            eventId,
            guestName: 'Big Fan',
            amount: 20.00,
            message: "This set is incredible! You're killing it!",
            messageType: 'MESSAGE',
            timestamp: new Date(Date.now() - 7 * 60000).toISOString(),
            dismissed: false,
            djEarnings: 17.00,
            platformFee: 3.00,
          }
        ];
        utils.storage.set(`qrate_tips_${eventId}`, MOCK_TIPS);
        console.log('✅ Initialized mock tips for Pool Party event:', eventId);
        console.log('   Mock tips:', MOCK_TIPS);
      } else {
        console.log('   Mock tips already exist:', existingTips);
      }
    }
  }, [eventId, eventCode, eventName]);

  // Simulate receiving new tips for Pool Party (demo purposes)
  useEffect(() => {
    // Check both event code and event name for backward compatibility
    const isPoolParty = eventCode?.toUpperCase() === 'POOL' || 
                        eventName?.toLowerCase().includes('pool party');

    if (isPoolParty) {
      // Simulate a new tip every 30-60 seconds
      const simulateTip = () => {
        const existingTips = utils.storage.get(`qrate_tips_${eventId}`) || [];
        const mockTipTypes = [
          {
            guestName: 'Sarah M.',
            amount: 15.00,
            message: 'Amazing vibes tonight! Keep it going! 🎉',
            messageType: 'MESSAGE' as TipMessageType,
          },
          {
            guestName: 'David R.',
            amount: 7.50,
            message: 'Can you play some Calvin Harris?',
            messageType: 'REQUEST' as TipMessageType,
            trackName: 'Summer',
            trackArtist: 'Calvin Harris',
            crowdScore: 92,
            themeMatch: 95,
          },
          {
            guestName: 'Lisa K.',
            amount: 10.00,
            message: "It's Jenny's 30th birthday! Shoutout please! 🎂",
            messageType: 'SHOUTOUT' as TipMessageType,
          },
        ];

        const randomTip = mockTipTypes[Math.floor(Math.random() * mockTipTypes.length)];
        const newTip: Tip = {
          id: `mock-tip-${Date.now()}`,
          eventId,
          ...randomTip,
          timestamp: new Date().toISOString(),
          dismissed: false,
          djEarnings: randomTip.amount * 0.85,
          platformFee: randomTip.amount * 0.15,
        };

        const updatedTips = [...existingTips, newTip];
        utils.storage.set(`qrate_tips_${eventId}`, updatedTips);
        
        // Trigger animation
        setNewTipAnimation(true);
        setTimeout(() => setNewTipAnimation(false), 1000);
      };

      // Random interval between 30-60 seconds
      const interval = setInterval(() => {
        const randomDelay = 30000 + Math.random() * 30000;
        setTimeout(simulateTip, randomDelay);
      }, 45000);

      return () => clearInterval(interval);
    }
  }, [eventId]);

  // Load tips from localStorage
  useEffect(() => {
    const loadTips = () => {
      const storedTips = utils.storage.get(`qrate_tips_${eventId}`) || [];
      console.log('💰 TipJar: Loading tips for event:', eventId);
      console.log('   LocalStorage key:', `qrate_tips_${eventId}`);
      console.log('   Stored tips from localStorage:', storedTips);
      console.log('   Stored tips count:', storedTips.length);
      
      // Check each tip's properties
      storedTips.forEach((tip: Tip, index: number) => {
        console.log(`   Tip ${index + 1}:`, {
          id: tip.id,
          hasMessage: !!tip.message,
          message: tip.message,
          dismissed: tip.dismissed,
          willBeShown: !!tip.message && !tip.dismissed
        });
      });
      
      const activeTips = storedTips.filter((tip: Tip) => tip.message && !tip.dismissed);
      console.log('   Active tips (after filtering):', activeTips);
      console.log('   Active tips count:', activeTips.length);
      
      setTips(activeTips);

      // Calculate total (include all tips, not just active ones)
      const total = storedTips.reduce((sum: number, tip: Tip) => sum + tip.amount, 0);
      setTotalTips(total);

      // Get last tip
      if (storedTips.length > 0) {
        const last = storedTips[storedTips.length - 1];
        setLastTip({ amount: last.amount, guestName: last.guestName });
      }
    };

    // Load tips immediately on mount and when eventId changes
    loadTips();

    // Poll for new tips every 3 seconds
    const interval = setInterval(loadTips, 3000);
    return () => clearInterval(interval);
  }, [eventId]);

  const handleDismiss = (tipId: string) => {
    const allTips = utils.storage.get(`qrate_tips_${eventId}`) || [];
    const updatedTips = allTips.map((tip: Tip) =>
      tip.id === tipId ? { ...tip, dismissed: true } : tip
    );
    utils.storage.set(`qrate_tips_${eventId}`, updatedTips);
    setTips(tips.filter(tip => tip.id !== tipId));
  };

  const handleRestore = (tipId: string) => {
    const allTips = utils.storage.get(`qrate_tips_${eventId}`) || [];
    const updatedTips = allTips.map((tip: Tip) =>
      tip.id === tipId ? { ...tip, dismissed: false } : tip
    );
    utils.storage.set(`qrate_tips_${eventId}`, updatedTips);
  };

  const handleAddToQueue = (tip: Tip) => {
    if (onAddToQueue) {
      onAddToQueue(tip);
    }
    
    // Mark as added to queue
    const allTips = utils.storage.get(`qrate_tips_${eventId}`) || [];
    const updatedTips = allTips.map((t: Tip) =>
      t.id === tip.id ? { ...t, addedToQueue: true } : t
    );
    utils.storage.set(`qrate_tips_${eventId}`, updatedTips);
    
    // Dismiss from tip jar
    handleDismiss(tip.id);
  };

  const getMessageTypeColor = (type?: TipMessageType) => {
    switch (type) {
      case 'REQUEST':
        return 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30';
      case 'SHOUTOUT':
        return 'bg-[var(--neon-purple)]/20 text-[var(--neon-purple)] border-[var(--neon-purple)]/30';
      case 'MESSAGE':
        return 'bg-[rgb(255,190,11)]/20 text-[rgb(255,190,11)] border-[rgb(255,190,11)]/30';
      default:
        return 'bg-white/10 text-white border-white/20';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <Card className={`glass-effect border-[#10b981]/30 overflow-hidden hover:border-[#10b981]/50 transition-all duration-300 ${
      newTipAnimation ? 'animate-pulse shadow-lg shadow-[#10b981]/40' : ''
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <motion.div
            animate={newTipAnimation ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Coins className="w-5 h-5 text-[#10b981]" />
          </motion.div>
          <span className="text-white">Tip Jar</span>
          {newTipAnimation && (
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-[#10b981] font-bold"
            >
              +NEW
            </motion.span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Tips Display */}
        <motion.div 
          animate={newTipAnimation ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="text-center py-4 px-4 rounded-xl bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/10 border border-[#10b981]/30"
        >
          <div className="text-4xl font-bold text-[#10b981] mb-1">
            ${totalTips.toFixed(2)}
          </div>
          <div className="text-xs text-white/60">
            Total Tips
          </div>
        </motion.div>

        {/* Last Tip */}
        {lastTip && (
          <div className="text-xs text-white/70 text-center">
            Last tip: ${lastTip.amount} from "{lastTip.guestName}"
          </div>
        )}

        {/* Tips with Messages */}
        <div className="space-y-2">
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-2">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="SHOUTOUT" className="text-xs">Shoutouts</TabsTrigger>
              <TabsTrigger value="MESSAGE" className="text-xs">Messages</TabsTrigger>
              <TabsTrigger value="REQUEST" className="text-xs">Requests</TabsTrigger>
              <TabsTrigger value="dismissed" className="text-xs">Dismissed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <ScrollArea className="h-[400px] pr-3">
            <AnimatePresence>
              {(() => {
                const allStoredTips = utils.storage.get(`qrate_tips_${eventId}`) || [];
                const filteredTips = filterType === 'all' 
                  ? tips 
                  : filterType === 'dismissed'
                  ? allStoredTips.filter((t: Tip) => t.dismissed)
                  : tips.filter((t: Tip) => t.messageType === filterType);
                
                return filteredTips.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 px-4 text-white/50 text-sm"
                  >
                    {filterType === 'dismissed' 
                      ? 'No dismissed messages.'
                      : filterType === 'all'
                      ? 'Your Tip Jar is open. Tips with messages from guests will appear here.'
                      : `No ${filterType.toLowerCase()} messages yet.`}
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {filteredTips.map((tip: Tip) => (
                    <motion.div
                      key={tip.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="glass-effect border-white/10 hover:border-[#10b981]/40 transition-all">
                        <CardContent className="p-3 space-y-2">
                          {/* Amount, Name, Time */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-lg font-bold text-[#10b981]">
                                ${tip.amount.toFixed(2)}
                              </div>
                              <div className="text-xs text-white/70 truncate">
                                from {tip.guestName}
                              </div>
                            </div>
                            <div className="text-xs text-white/50 flex-shrink-0">
                              {formatTime(tip.timestamp)}
                            </div>
                          </div>

                          {/* Message Type Badge */}
                          {tip.messageType && (
                            <Badge 
                              variant="outline" 
                              className={`${getMessageTypeColor(tip.messageType)} text-xs px-2`}
                            >
                              [{tip.messageType}]
                            </Badge>
                          )}

                          {/* Message */}
                          <div className="text-sm text-white/90 bg-white/5 rounded-lg p-2 border border-white/10">
                            "{tip.message}"
                          </div>

                          {/* Warning for low scores (if request) */}
                          {tip.messageType === 'REQUEST' && (
                            <div className="flex gap-2 text-xs">
                              {tip.crowdScore !== undefined && (
                                <div className={`flex items-center gap-1 ${tip.crowdScore < 30 ? 'text-red-400' : 'text-white/60'}`}>
                                  {tip.crowdScore < 30 && <AlertTriangle className="w-3 h-3" />}
                                  {tip.crowdScore}% Crowd
                                </div>
                              )}
                              {tip.themeMatch !== undefined && (
                                <div className={`flex items-center gap-1 ${tip.themeMatch < 50 ? 'text-red-400' : 'text-white/60'}`}>
                                  {tip.themeMatch < 50 && <AlertTriangle className="w-3 h-3" />}
                                  {tip.themeMatch}% Theme
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            {filterType === 'dismissed' ? (
                              <Button
                                size="sm"
                                onClick={() => handleRestore(tip.id)}
                                className="flex-1 h-8 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/30"
                              >
                                <Undo2 className="w-3 h-3 mr-1" />
                                Restore
                              </Button>
                            ) : (
                              <>
                                {tip.messageType === 'REQUEST' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddToQueue(tip)}
                                    className="flex-1 h-8 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/30"
                                  >
                                    <ChevronRight className="w-3 h-3 mr-1" />
                                    Queue
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDismiss(tip.id)}
                                  className="h-8 px-3 hover:bg-white/10 text-white/70 hover:text-white"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Dismiss
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    ))}
                  </div>
                );
              })()}
            </AnimatePresence>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
