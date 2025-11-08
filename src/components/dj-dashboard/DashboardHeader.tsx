// Dashboard Header Component
// Displays event name, logo, and basic event info

import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { ArrowLeft, Users, QrCode } from 'lucide-react';
import logoImage from 'figma:asset/08d0d06dd14cd5a887d78962b507773b63dedad4.png';

interface DashboardHeaderProps {
  eventName: string;
  eventCode: string;
  totalGuests: number;
  onBack: () => void;
  onShowQRCode: () => void;
  isLoading?: boolean;
}

/**
 * Header component for DJ Dashboard
 * Shows back button, logo, event name, guest count, and QR code button
 */
export function DashboardHeader({
  eventName,
  eventCode,
  totalGuests,
  onBack,
  onShowQRCode,
  isLoading = false
}: DashboardHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8"
    >
      <Button 
        onClick={onBack} 
        className="glass-effect bg-[var(--neon-purple)]/10 hover:bg-[var(--neon-purple)]/20 border border-[var(--neon-purple)]/50 hover:border-[var(--neon-purple)] text-[var(--neon-purple)] self-start -ml-6"
        disabled={isLoading}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      
      {/* Clickable QRate Logo */}
      <button
        onClick={() => window.location.reload()}
        className="group transition-all duration-300 hover:scale-105 self-start"
        title="Return to home"
      >
        <img 
          src={logoImage} 
          alt="QRate" 
          className="h-20 w-auto transition-all duration-300 group-hover:brightness-125"
        />
      </button>
      
      <div className="text-center flex-1">
        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold break-words mb-2 text-[var(--neon-purple)] font-[Changa_One]">
          {eventName}
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
          <div className="flex items-center gap-1 glass-effect px-2 py-1 rounded border border-[var(--glass-border)]">
            <Users className="w-3 h-3 text-[var(--neon-cyan)]" />
            <span className="text-xs text-white font-medium">{totalGuests}</span>
          </div>
          <span> Code: {eventCode}</span>
          <Button 
            size="sm" 
            onClick={onShowQRCode}
            className="group glass-effect bg-transparent hover:bg-[var(--neon-cyan)]/10 border-0 hover:border hover:border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] transition-all duration-300 h-7 px-2 hover:px-3 overflow-hidden"
            disabled={isLoading}
          >
            <QrCode className="w-4 h-4" />
            <span className="max-w-0 group-hover:max-w-xs group-hover:ml-2 overflow-hidden transition-all duration-300 whitespace-nowrap text-xs">QR Code</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
