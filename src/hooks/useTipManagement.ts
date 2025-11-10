// Custom hook for managing tip jar functionality
// Handles tip tracking and notifications

import { useEffect } from 'react';
import { utils } from '@/utils/api';

interface UseTipManagementProps {
  eventId: string;
  totalTipAmount: number;
  setTotalTipAmount: (amount: number) => void;
  hasNewTips: boolean;
  setHasNewTips: (hasNew: boolean) => void;
}

/**
 * Hook for managing tip jar functionality
 * Monitors tips and provides notifications for new tips
 */
export function useTipManagement({
  eventId,
  totalTipAmount,
  setTotalTipAmount,
  hasNewTips,
  setHasNewTips
}: UseTipManagementProps) {

  /**
   * Monitor tips for notification badge
   */
  useEffect(() => {
    const checkTips = () => {
      const storedTips = utils.storage.get(`qrate_tips_${eventId}`) || [];
      const activeTips = storedTips.filter((tip: any) => tip.message && !tip.dismissed);
      const total = storedTips.reduce((sum: number, tip: any) => sum + tip.amount, 0);
      setTotalTipAmount(total);
      setHasNewTips(activeTips.length > 0);
    };
    
    checkTips();
    const interval = setInterval(checkTips, 3000);
    return () => clearInterval(interval);
  }, [eventId, setTotalTipAmount, setHasNewTips]);

  return {
    // Currently just handles the side effect, but could expose methods here
  };
}
