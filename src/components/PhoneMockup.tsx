import React from 'react';
import iphoneMockup from 'figma:asset/03076d54d61a704e0ad299c6eb4f7fd25fad191a.png';

interface PhoneMockupProps {
  children: React.ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background relative">
      {/* Desktop background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-2 h-2 bg-[var(--neon-pink)] rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-16 w-1 h-1 bg-[var(--neon-cyan)] rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-[var(--neon-yellow)] rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-32 w-1 h-1 bg-[var(--neon-purple)] rounded-full animate-pulse delay-300"></div>
        
        {/* Large gradient orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-[var(--neon-purple)]/20 to-transparent rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-[var(--neon-cyan)]/20 to-transparent rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* iPhone mockup with content */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        {/* iPhone frame container */}
        {/* Use padding-top for aspect ratio (852 / 393 = 2.1679) */}
        <div className="relative w-full" style={{ paddingBottom: '100.79%' }}>

          {/* iPhone mockup image - overlay on top */}
          {/* This img will scale with its parent's width */}
          <img
            src={iphoneMockup}
            alt="iPhone Frame"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
          />

          {/* Content area - positioned to fit within the phone screen */}
          {/* These 'top', 'left', 'width', 'height' values are percentages
              relative to the *original* iPhone frame dimensions.
              Original iPhone: 393x852
              Content screen:  349x800
              Top offset:      26px
              Left offset:     22px

              Percentage calculations:
              top:    (26 / 852) * 100 = 3.05%
              left:   (22 / 393) * 100 = 5.60%
              width:  (349 / 393) * 100 = 88.80%
              height: (800 / 852) * 100 = 93.90%
          */}
          <div
            className="absolute rounded-[8%]"
            style={{
              top: '3.05%',
              left: '5.60%',
              width: '88.80%',
              height: '93.90%',
              overflow: 'hidden'
            }}
          >
            {/* Scrollable content wrapper with proper constraints */}
            <div 
              className="w-full h-full bg-background"
              style={{
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhoneMockup;
