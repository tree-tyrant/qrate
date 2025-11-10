
import React from 'react';
import iphoneMockup from '../assets/iphonemock.png';

interface PhoneMockupProps {
  children: React.ReactNode;
  showQRCodeInfo?: boolean;
}

export function PhoneMockup({ children, showQRCodeInfo = false }: PhoneMockupProps) {
  return (
    <div className="relative flex justify-center items-center bg-background p-4 min-h-screen overflow-hidden">
      {/* Desktop background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="top-10 left-10 absolute bg-[var(--neon-pink)] rounded-full w-2 h-2 animate-pulse"></div>
        <div className="top-32 right-16 absolute bg-[var(--neon-cyan)] rounded-full w-1 h-1 animate-pulse delay-700"></div>
        <div className="bottom-20 left-20 absolute bg-[var(--neon-yellow)] rounded-full w-1.5 h-1.5 animate-pulse delay-1000"></div>
        <div className="right-32 bottom-40 absolute bg-[var(--neon-purple)] rounded-full w-1 h-1 animate-pulse delay-300"></div>
        
        {/* Large gradient orbs */}
        <div className="-top-32 -right-32 absolute bg-gradient-to-br from-[var(--neon-purple)]/20 to-transparent blur-3xl rounded-full w-96 h-96 animate-float"></div>
        <div className="-bottom-32 -left-32 absolute bg-gradient-to-tr from-[var(--neon-cyan)]/20 to-transparent blur-3xl rounded-full w-80 h-80 animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* QR Code Info Text - shown on right side above the iPhone frame for event code entry */}
      {showQRCodeInfo && (
        <div className="hidden lg:block top-[5vh] right-4 md:right-8 z-10 absolute max-w-xs">
          <p className="text-white/80 text-sm leading-relaxed">
            Scanning the QR code takes guests directly to the event page, bypassing manual event code entry.
          </p>
        </div>
      )}

      {/* Text above iPhone frame on left side */}
      <div className="top-8 left-8 z-10 absolute">
        <p className="text-white/80 text-sm">
          Note: The iPhone frame is for demo purposes and only displays on desktop.
        </p>
      </div>

      {/* iPhone mockup with content */}
      <div className="z-10 relative flex justify-center items-center mx-auto" style={{ 
        width: 'min(24rem, 90vw)',
        height: '95vh',
        maxHeight: '95vh'
      }}>
        {/* iPhone frame container - scales to fit both width and height while maintaining aspect ratio */}
        <div className="relative w-full h-full" style={{ 
          aspectRatio: '393 / 852',
          maxWidth: '100%',
          maxHeight: '100%'
        }}>

          {/* iPhone mockup image - overlay on top */}
          {/* This img will scale with its parent's width */}
          <img
            src={iphoneMockup}
            alt="iPhone Frame"
            className="z-10 absolute inset-0 w-full h-full object-contain pointer-events-none"
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
            className="absolute rounded-[8%] overflow-hidden"
            style={{
              top: '3.05%',
              left: '5.60%',
              width: '88.80%',
              height: '93.90%',
            }}
          >
            {/* Content wrapper - no scrolling, content should fit */}
            <div 
              className="bg-background w-full h-full overflow-hidden"
              style={{
                maxWidth: '100%',
                boxSizing: 'border-box'
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
