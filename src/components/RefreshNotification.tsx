import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RefreshCw, Users, TrendingUp, Star, X } from 'lucide-react';
import { RefreshNotification as RefreshData } from '../utils/intelligentRefresh';

interface RefreshNotificationProps {
  notification: RefreshData;
  onRefresh: () => void;
  onDismiss?: () => void;
  duration?: number;
  className?: string;
}

export function RefreshNotification({ notification, onRefresh, onDismiss, duration = 30000, className = '' }: RefreshNotificationProps) {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [duration]);
  
  if (!notification.shouldNotify) return null;
  
  const { reason, details } = notification;
  
  // Icon based on reason
  const getIcon = () => {
    if (reason === 'guest_batch') return <Users className="w-5 h-5" />;
    if (reason === 'top_rank_change') return <Star className="w-5 h-5" />;
    if (reason === 'rank_volatility') return <TrendingUp className="w-5 h-5" />;
    return <RefreshCw className="w-5 h-5" />;
  };
  
  // Color theme based on reason
  const getColorClass = () => {
    if (reason === 'guest_batch') return 'from-accent/20 to-accent/5 border-accent/30';
    if (reason === 'top_rank_change') return 'from-primary/20 to-primary/5 border-primary/30';
    if (reason === 'rank_volatility') return 'from-chart-3/20 to-chart-3/5 border-chart-3/30';
    return 'from-chart-2/20 to-chart-2/5 border-chart-2/30';
  };
  
  return (
    <div 
      className={`
        relative overflow-hidden rounded-lg border
        bg-[var(--dark-bg)]/95 border-[var(--glass-border)]
        backdrop-blur-xl
        animate-slide-in
        shadow-lg
        ${className}
      `}
    >
      <div className="relative px-4 py-3 flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-pink)]/20 flex items-center justify-center">
            {getIcon()}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90">
            {getNotificationMessage(notification)}
          </p>
        </div>
        
        {/* Refresh button */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button
            onClick={onRefresh}
            size="sm"
            className="bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-purple)] hover:from-[var(--neon-purple)]/80 hover:to-[var(--neon-purple)]/80 text-white h-8 px-3 group"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </Button>
          {onDismiss && (
            <Button
              onClick={onDismiss}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--glass-border)]">
        <div 
          className="h-full bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function getNotificationMessage(notification: RefreshData): string {
  const { reason, details } = notification;
  
  if (reason === 'multiple') {
    return `Major changes detected! ${details.newGuestsCount || 0} new guests and significant playlist updates.`;
  }
  
  if (reason === 'guest_batch') {
    return `${details.newGuestsCount} new guests have checked in. Fresh recommendations ready.`;
  }
  
  if (reason === 'top_rank_change') {
    return `The crowd's #1 favorite has changed! See the new top pick.`;
  }
  
  if (reason === 'rank_volatility') {
    return `Big shifts in the crowd's preferences. Time to update your playlist.`;
  }
  
  return 'New recommendations available based on recent guest check-ins.';
}
