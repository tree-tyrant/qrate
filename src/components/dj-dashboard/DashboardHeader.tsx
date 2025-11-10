// Dashboard Header Component
// Displays event name, logo, and basic event info

import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { ArrowLeft, Users, QrCode } from 'lucide-react';
import logoImage from '../../assets/qrate_title.png';

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
      className="flex sm:flex-row flex-col justify-between items-center gap-4 mb-8"
    >
      <Button 
        onClick={onBack} 
        className="self-start bg-[var(--neon-purple)]/10 hover:bg-[var(--neon-purple)]/20 -ml-6 border border-[var(--neon-purple)]/50 hover:border-[var(--neon-purple)] text-[var(--neon-purple)] glass-effect"
        disabled={isLoading}
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      
      {/* Clickable QRate Logo */}
      <button
        onClick={() => window.location.reload()}
        className="group self-start hover:scale-105 transition-all duration-300"
        title="Return to home"
      >
        <img 
          src={logoImage} 
          alt="QRate" 
          className="group-hover:brightness-125 w-auto h-20 transition-all duration-300"
        />
      </button>
      
      <div className="flex-1 text-center">
        <h1 className="mb-2 font-[Changa_One] font-bold text-[var(--neon-purple)] text-xl sm:text-2xl md:text-4xl break-words">
          {eventName}
        </h1>
        <div className="flex justify-center items-center gap-2 text-gray-300 text-sm">
          <div className="flex items-center gap-1 px-2 py-1 border border-[var(--glass-border)] rounded glass-effect">
            <Users className="w-3 h-3 text-[var(--neon-cyan)]" />
            <span className="font-medium text-white text-xs">{totalGuests}</span>
          </div>
          <span> Code: {eventCode}</span>
          <Button 
            size="sm" 
            onClick={onShowQRCode}
            className="group bg-transparent hover:bg-[var(--neon-cyan)]/10 px-2 hover:px-3 hover:border border-0 hover:border-[var(--neon-cyan)]/50 h-7 overflow-hidden text-[var(--neon-cyan)] transition-all duration-300 glass-effect"
            disabled={isLoading}
          >
            <QrCode className="w-4 h-4" />
            <span className="group-hover:ml-2 max-w-0 group-hover:max-w-xs overflow-hidden text-xs whitespace-nowrap transition-all duration-300">QR Code</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
