// Dashboard Actions Component
// Action buttons for filters, tip jar, and settings

import { Button } from '../ui/button';
import { Filter, DollarSign, Settings } from 'lucide-react';

interface DashboardActionsProps {
  totalTipAmount: number;
  hasNewTips: boolean;
  onOpenFilters: () => void;
  onOpenTipJar: () => void;
  onOpenSettings: () => void;
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
  isLoading = false
}: DashboardActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button 
        size="sm" 
        onClick={onOpenFilters}
        className="group relative glass-effect bg-transparent hover:bg-[var(--neon-cyan)]/10 border-0 hover:border hover:border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] transition-all duration-300 overflow-hidden px-2 hover:px-3"
        disabled={isLoading}
      >
        <Filter className="w-4 h-4" />
        <span className="max-w-0 group-hover:max-w-xs group-hover:ml-2 overflow-hidden transition-all duration-300 whitespace-nowrap">Filters</span>
      </Button>
      
      <Button 
        size="sm" 
        onClick={onOpenTipJar}
        className="group relative glass-effect bg-transparent hover:bg-[#10b981]/10 border-0 hover:border hover:border-[#10b981]/50 text-[#10b981] transition-all duration-300 overflow-hidden px-2 hover:px-3"
        disabled={isLoading}
      >
        {hasNewTips && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-[var(--dark-bg)] z-10"></span>
        )}
        <DollarSign className="w-4 h-4" />
        <span className="max-w-0 group-hover:max-w-xs group-hover:ml-2 overflow-hidden transition-all duration-300 whitespace-nowrap">Tip Jar: ${totalTipAmount.toFixed(2)}</span>
      </Button>

      <Button 
        size="sm" 
        onClick={onOpenSettings}
        className="group relative glass-effect bg-transparent hover:bg-[var(--neon-cyan)]/10 border-0 hover:border hover:border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] transition-all duration-300 overflow-hidden px-2 hover:px-3"
        disabled={isLoading}
      >
        <Settings className="w-4 h-4" />
        <span className="max-w-0 group-hover:max-w-xs group-hover:ml-2 overflow-hidden transition-all duration-300 whitespace-nowrap">Settings</span>
      </Button>
    </div>
  );
}
