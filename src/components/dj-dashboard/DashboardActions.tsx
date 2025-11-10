// Dashboard Actions Component
// Action buttons for filters, tip jar, and settings

import { Button } from '../ui/button';
import { Filter, DollarSign, Settings, UserPlus } from 'lucide-react';
import { isDemoAccount } from '../../utils/mockEventData';

interface DashboardActionsProps {
  totalTipAmount: number;
  hasNewTips: boolean;
  onOpenFilters: () => void;
  onOpenTipJar: () => void;
  onOpenSettings: () => void;
  onOpenDemoGuest?: () => void;
  isLoading?: boolean;
}

/**
 * Action buttons row for DJ Dashboard
 * Contains filters, tip jar, and settings buttons
 */
export function DashboardActions({
  totalTipAmount,
  hasNewTips,
  onOpenFilters,
  onOpenTipJar,
  onOpenSettings,
  onOpenDemoGuest,
  isLoading = false
}: DashboardActionsProps) {
  const isDemo = isDemoAccount();
  
  return (
    <div className="flex items-center gap-2">
      {isDemo && onOpenDemoGuest && (
        <Button 
          size="sm" 
          onClick={onOpenDemoGuest}
          className="group relative bg-transparent hover:bg-[var(--neon-yellow)]/10 px-2 hover:px-3 hover:border border-0 hover:border-[var(--neon-yellow)]/50 overflow-hidden text-[var(--neon-yellow)] transition-all duration-300 glass-effect"
          disabled={isLoading}
        >
          <UserPlus className="w-4 h-4" />
          <span className="group-hover:ml-2 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-300">+ Add Demo Guest</span>
        </Button>
      )}
      
      <Button 
        size="sm" 
        onClick={onOpenFilters}
        className="group relative bg-transparent hover:bg-[var(--neon-cyan)]/10 px-2 hover:px-3 hover:border border-0 hover:border-[var(--neon-cyan)]/50 overflow-hidden text-[var(--neon-cyan)] transition-all duration-300 glass-effect"
        disabled={isLoading}
      >
        <Filter className="w-4 h-4" />
        <span className="group-hover:ml-2 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-300">Filters</span>
      </Button>
      
      <Button 
        size="sm" 
        onClick={onOpenTipJar}
        className="group relative bg-transparent hover:bg-[#10b981]/10 px-2 hover:px-3 hover:border border-0 hover:border-[#10b981]/50 overflow-hidden text-[#10b981] transition-all duration-300 glass-effect"
        disabled={isLoading}
      >
        {hasNewTips && (
          <span className="top-0 right-0 z-10 absolute bg-red-500 border-[var(--dark-bg)] border-2 rounded-full w-3 h-3 animate-pulse"></span>
        )}
        <DollarSign className="w-4 h-4" />
        <span className="group-hover:ml-2 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-300">Tip Jar: ${totalTipAmount.toFixed(2)}</span>
      </Button>

      <Button 
        size="sm" 
        onClick={onOpenSettings}
        className="group relative bg-transparent hover:bg-[var(--neon-cyan)]/10 px-2 hover:px-3 hover:border border-0 hover:border-[var(--neon-cyan)]/50 overflow-hidden text-[var(--neon-cyan)] transition-all duration-300 glass-effect"
        disabled={isLoading}
      >
        <Settings className="w-4 h-4" />
        <span className="group-hover:ml-2 max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap transition-all duration-300">Settings</span>
      </Button>
    </div>
  );
}
