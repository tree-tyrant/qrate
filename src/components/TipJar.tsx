import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { X, ChevronRight, Coins, Undo2, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tip, TipMessageType } from '../utils/types';
import { useTipJar } from '../hooks/useTipJar';
import { StatusBar } from './ui/StatusBar';
import { SortSelect } from './ui/SortSelect';
import { Toast } from './ui/Toast';

interface TipJarProps {
  eventId: string;
  eventCode?: string;
  eventName?: string;
  onAddToQueue?: (tip: Tip) => void;
  onOpenShare?: () => void;
}

export default function TipJar({ eventId, eventCode, eventName, onAddToQueue, onOpenShare }: TipJarProps) {
  const {
    tips,
    dismissedTips,
    addedToQueueTips,
    totalAllTime,
    totalToday,
    totalLocal,
    lastTip,
    sort,
    setSort,
    filterType,
    setFilterType,
    addToQueue,
    dismiss,
    restore,
    resetLocalTotal,
    newTipNotice,
    clearNewTipNotice,
  } = useTipJar({ eventId });
  const [newTipAnimation, setNewTipAnimation] = useState(false);
  const [showQueuedView, setShowQueuedView] = useState(false);
  const [queuedMap, setQueuedMap] = useState<Record<string, boolean>>({});
  const [totalMode, setTotalMode] = useState<'Local' | 'Today' | 'All-time'>('Local');

  useEffect(() => {
    if (!newTipNotice) return;
    setNewTipAnimation(true);
    const t = setTimeout(() => setNewTipAnimation(false), 1000);
    return () => clearTimeout(t);
  }, [newTipNotice]);

  const handleAddToQueue = (tip: Tip) => {
    if (onAddToQueue) onAddToQueue(tip);
    addToQueue(tip);
    setQueuedMap(prev => ({ ...prev, [tip.id]: true }));
    setTimeout(() => {
      setQueuedMap(prev => {
        const copy = { ...prev };
        delete copy[tip.id];
        return copy;
      });
    }, 2000);
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

  const currentTotal = useMemo(() => {
    switch (totalMode) {
      case 'Today': return totalToday;
      case 'All-time': return totalAllTime;
      case 'Local':
      default: return totalLocal;
    }
  }, [totalMode, totalToday, totalAllTime, totalLocal]);

  return (
    <Card className={`relative glass-effect border-[#10b981]/30 overflow-hidden hover:border-[#10b981]/50 transition-all duration-300 ${
      newTipAnimation ? 'animate-pulse shadow-lg shadow-[#10b981]/40' : ''
    }`}>
      <Toast show={!!newTipNotice} onClose={clearNewTipNotice}>
        New tip: ${newTipNotice?.amount.toFixed(2)} from {newTipNotice?.guestName}
      </Toast>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <motion.div
            animate={newTipAnimation ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Coins className="w-5 h-5 text-[#10b981]" />
          </motion.div>
          <span className="text-white">Tip Jar</span>
          <div className="flex items-center gap-2 ml-auto">
            <SortSelect value={sort} onChange={setSort} />
            <label className="flex items-center gap-1 text-white/60 text-xs">
              <input
                type="checkbox"
                className="accent-[#10b981]"
                checked={showQueuedView}
                onChange={(e) => setShowQueuedView(e.target.checked)}
              />
              Queued
            </label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Tips Display */}
        <motion.div 
          animate={newTipAnimation ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/10 px-4 py-4 border border-[#10b981]/30 rounded-xl text-center"
        >
          <div className="flex justify-center items-center gap-2 mb-1">
            <div className="font-bold text-[#10b981] text-4xl">
              ${currentTotal.toFixed(2)}
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Total mode"
                className="bg-white/5 px-2 py-1 border border-white/10 rounded focus:outline-none focus:ring-[#10b981] focus:ring-2 text-white text-xs"
                value={totalMode}
                onChange={(e) => setTotalMode(e.target.value as any)}
              >
                <option>Local</option>
                <option>Today</option>
                <option>All-time</option>
              </select>
              <Button
                size="sm"
                className="bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/30 h-7 text-[#10b981]"
                onClick={resetLocalTotal}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className="text-white/60 text-xs">
            {totalMode} total
          </div>
        </motion.div>

        {/* Last Tip */}
        {lastTip && (
          <div className="text-white/70 text-xs text-center">
            Last tip: ${lastTip.amount} from "{lastTip.guestName}"
          </div>
        )}

        {/* Tips with Messages */}
        <div className="space-y-2">
          <Tabs value={filterType} onValueChange={(v: string) => setFilterType(v as any)} className="w-full">
            <TabsList className="grid grid-cols-5 mb-2 w-full">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="SHOUTOUT" className="text-xs">Shoutouts</TabsTrigger>
              <TabsTrigger value="MESSAGE" className="text-xs">Messages</TabsTrigger>
              <TabsTrigger value="REQUEST" className="text-xs">Requests</TabsTrigger>
              <TabsTrigger value="dismissed" className="text-xs">Dismissed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <ScrollArea className="pr-3 h-[400px]">
            <AnimatePresence>
              {(() => {
                const filteredTips = showQueuedView
                  ? addedToQueueTips
                  : filterType === 'dismissed'
                  ? dismissedTips
                  : tips;
                
                return filteredTips.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-8 text-white/50 text-sm text-center"
                  >
                    {showQueuedView
                      ? 'No queued items yet.'
                      : filterType === 'dismissed' 
                        ? 'No dismissed messages.'
                        : filterType === 'all'
                          ? (
                            <div className="space-y-3">
                              <div>Your Tip Jar is open. Tips with messages from guests will appear here.</div>
                              <div className="flex justify-center items-center">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (onOpenShare) onOpenShare();
                                    else {
                                      window.dispatchEvent(new CustomEvent('open-share-modal', { detail: { eventId, eventCode, eventName } }));
                                    }
                                  }}
                                  className="bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/30 h-8 text-[#10b981]"
                                >
                                  <Share2 className="mr-1 w-3 h-3" />
                                  Share your QR code
                                </Button>
                              </div>
                            </div>
                          )
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
                      <Card className={`glass-effect border-white/10 hover:border-[#10b981]/40 transition-all ${tip.amount >= 20 ? 'ring-1 ring-[#10b981]/50' : ''}`}>
                        <CardContent className="space-y-2 p-3 text-[14px]">
                          {/* Two-column top: Amount/Guest/Time + Type/Actions */}
                          <div className="items-start gap-3 grid grid-cols-12">
                            <div className="col-span-7 min-w-0">
                              <div className="font-bold text-[#10b981] text-xl">
                                ${tip.amount.toFixed(2)}
                              </div>
                              <div className="text-white/70 text-xs truncate">from {tip.guestName}</div>
                              <div className="text-white/50 text-xs">{formatTime(tip.timestamp)}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2 col-span-5">
                              {tip.messageType && (
                                <Badge 
                                  variant="outline" 
                                  className={`${getMessageTypeColor(tip.messageType)} text-xs px-2`}
                                >
                                  [{tip.messageType}]
                                </Badge>
                              )}
                              <div className="flex items-center gap-2">
                                {!showQueuedView && (
                                  <>
                                    {tip.messageType === 'REQUEST' && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleAddToQueue(tip)}
                                        className="bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/30 h-8 text-[#10b981]"
                                      >
                                        {queuedMap[tip.id] ? 'Queued ✓' : (
                                          <>
                                            <ChevronRight className="mr-1 w-3 h-3" />
                                            Queue
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    <button
                                      aria-label="Dismiss tip"
                                      onClick={() => dismiss(tip.id)}
                                      className="place-items-center grid hover:bg-white/10 border border-transparent hover:border-white/10 rounded-md focus:outline-none focus:ring-[#10b981] focus:ring-2 w-8 h-8 text-white/70 hover:text-white"
                                      title="Dismiss"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                                {filterType === 'dismissed' && (
                                  <Button
                                    size="sm"
                                    onClick={() => restore(tip.id)}
                                    className="bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/30 h-8 text-[#10b981]"
                                  >
                                    <Undo2 className="mr-1 w-3 h-3" />
                                    Restore
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Message */}
                          <div className="bg-white/5 p-2 border border-white/10 rounded-lg text-white/90 text-sm">
                            "{tip.message}"
                          </div>

                          {/* Request status bars */}
                          {tip.messageType === 'REQUEST' && (
                            <div className="flex gap-3 text-xs">
                              <StatusBar crowd={tip.crowdScore} theme={tip.themeMatch} />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                    ))}
                  </div>
                );
              })()}
            </AnimatePresence>
          </ScrollArea>
          {/* Added-to-queue summary */}
          {addedToQueueTips.length > 0 && filterType !== 'dismissed' && !showQueuedView && (
            <div className="text-[11px] text-white/50 text-center">
              {addedToQueueTips.length} request{addedToQueueTips.length > 1 ? 's' : ''} already queued
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
