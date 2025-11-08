import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeft, ArrowRight, Loader2, Music } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import logoImage from 'figma:asset/08d0d06dd14cd5a887d78962b507773b63dedad4.png';

interface GuestEventCodeEntryProps {
  onJoinEvent: (eventCode: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function GuestEventCodeEntry({ onJoinEvent, onBack, isLoading = false }: GuestEventCodeEntryProps) {
  const [eventCode, setEventCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (eventCode.trim()) {
      setIsSubmitting(true);
      setTimeout(() => {
        onJoinEvent(eventCode.trim().toUpperCase());
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Geometric decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none">
        <svg className="w-full h-full opacity-20" viewBox="0 0 200 200">
          <path d="M 20,20 L 100,60 L 60,120 Z" fill="none" stroke="url(#grad1)" strokeWidth="1.5" />
          <path d="M 40,40 L 120,80 L 80,140 Z" fill="none" stroke="url(#grad2)" strokeWidth="1" />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'var(--neon-purple)', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: 'var(--neon-cyan)', stopOpacity: 0.4 }} />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'var(--neon-pink)', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: 'var(--neon-cyan)', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none transform rotate-180">
        <svg className="w-full h-full opacity-20" viewBox="0 0 200 200">
          <path d="M 20,20 L 100,60 L 60,120 Z" fill="none" stroke="url(#grad3)" strokeWidth="1.5" />
          <path d="M 40,40 L 120,80 L 80,140 Z" fill="none" stroke="url(#grad4)" strokeWidth="1" />
          <defs>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'var(--neon-cyan)', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: 'var(--neon-purple)', stopOpacity: 0.4 }} />
            </linearGradient>
            <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'var(--neon-cyan)', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: 'var(--neon-pink)', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Back button */}
      <div className="p-4 relative z-10">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-white/80 hover:text-white hover:bg-white/10 pt-[50px] pr-[12px] pb-[8px] pl-[12px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Main content - centered */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* QRate Logo */}
          <div className="flex justify-center">
            <ImageWithFallback 
              src={logoImage} 
              alt="QRate" 
              className="h-32 w-auto object-contain"
            />
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl text-white">
              Join the Party
            </h1>
            <p className="text-white/70 text-sm">
              Enter the event code to share your music vibe
            </p>
          </div>

          {/* Event Code Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                placeholder="Enter Event Code"
                className="h-14 text-center text-2xl tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary rounded-xl"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
                disabled={isSubmitting || isLoading}
              />
              <p className="text-xs text-white/50 text-center">
                Ask your host for the 6-character event code
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!eventCode.trim() || eventCode.trim().length < 3 || isSubmitting || isLoading}
              className="w-full h-12 qrate-gradient text-white font-semibold rounded-full disabled:opacity-50"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join Event
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Info Card */}
          <div className="glass-effect border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-white text-sm">What happens next?</p>
                <p className="text-white/60 text-xs">
                  Connect your Spotify and share your music taste to help create the perfect playlist
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
