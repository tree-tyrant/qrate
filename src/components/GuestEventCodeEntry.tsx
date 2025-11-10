import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, Loader2, Music } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import logoImage from '../assets/qrate_title.png';
import { cn } from './ui/utils';

interface GuestEventCodeEntryProps {
  onJoinEvent: (eventCode: string) => void | Promise<unknown>;
  onBack: () => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

const CODE_LENGTH = 6;
const CODE_CHAR_PATTERN = /^[A-Z0-9]$/;

export default function GuestEventCodeEntry({
  onJoinEvent,
  onBack,
  isLoading = false,
  errorMessage = null,
}: GuestEventCodeEntryProps) {
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const eventCode = codeDigits.join('');

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (errorMessage) {
      setError(errorMessage);
    }
  }, [errorMessage]);

  const handleChange = (index: number, value: string) => {
    const upperValue = value.toUpperCase();
    const char = upperValue.slice(-1);

    const nextDigits = [...codeDigits];

    if (!char) {
      nextDigits[index] = '';
      setCodeDigits(nextDigits);
      setError(null);
      return;
    }

    if (!CODE_CHAR_PATTERN.test(char)) {
      return;
    }

    nextDigits[index] = char;
    setCodeDigits(nextDigits);
    setError(null);

    if (index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    } else {
      inputsRef.current[index]?.blur();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const nextDigits = [...codeDigits];
      if (nextDigits[index]) {
        nextDigits[index] = '';
        setCodeDigits(nextDigits);
      } else if (index > 0) {
        nextDigits[index - 1] = '';
        setCodeDigits(nextDigits);
        inputsRef.current[index - 1]?.focus();
      }
      setError(null);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (index < CODE_LENGTH - 1) {
        inputsRef.current[index + 1]?.focus();
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
    if (!pasted) {
      return;
    }

    const nextDigits = [...codeDigits];
    for (let i = 0; i < pasted.length && index + i < CODE_LENGTH; i++) {
      nextDigits[index + i] = pasted[i];
    }
    setCodeDigits(nextDigits);
    setError(null);

    const lastIndex = Math.min(index + pasted.length - 1, CODE_LENGTH - 1);
    inputsRef.current[lastIndex]?.focus();
  };

  const handleSubmit = () => {
    if (isSubmitting || isLoading) {
      return;
    }

    if (eventCode.length !== CODE_LENGTH) {
      setError('Code must be 6 characters');
      const firstEmptyIndex = codeDigits.findIndex((digit) => digit === '');
      const focusIndex = firstEmptyIndex === -1 ? CODE_LENGTH - 1 : firstEmptyIndex;
      inputsRef.current[focusIndex]?.focus();
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = onJoinEvent(eventCode);

    if (
      result !== undefined &&
      result !== null &&
      typeof (result as Promise<unknown>).finally === 'function'
    ) {
      (result as Promise<unknown>).finally(() => {
        setIsSubmitting(false);
      });
    }
  };

  return (
    <div className="relative flex flex-col bg-background w-full h-full overflow-hidden">
      {/* Geometric decorations */}
      <div className="top-0 left-0 absolute w-64 h-64 pointer-events-none">
        <svg className="opacity-20 w-full h-full" viewBox="0 0 200 200">
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

      <div className="top-0 right-0 absolute w-64 h-64 rotate-180 pointer-events-none transform">
        <svg className="opacity-20 w-full h-full" viewBox="0 0 200 200">
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
      <div className="z-10 relative px-2 pt-4 pb-0">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="hover:bg-white/10 p-2 text-white/80 hover:text-white text-sm"
        >
          <ArrowLeft className="mr-1 w-3 h-3" />
          Back
        </Button>
      </div>

      {/* Main content - centered */}
      <div className="z-10 relative flex flex-1 justify-center items-center px-8 py-1 overflow-hidden">
        <div className="space-y-2 w-full max-w-xs">
          {/* QRate Logo */}
          <div className="flex justify-center -mt-2">
            <ImageWithFallback 
              src={logoImage} 
              alt="QRate" 
              className="w-auto h-24 object-contain"
            />
          </div>

          {/* Title */}
          <div className="space-y-0.5 text-center">
            <h1 id="join-label" className="text-white text-lg">
              Join the Party
            </h1>
            <p className="text-[11px] text-white/70">
              Enter the event code to share your music vibe
            </p>
          </div>

          {/* Event Code Input */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div
                role="group"
                aria-labelledby="join-label"
                className={cn(
                  'gap-1.5 grid',
                  'grid-cols-6',
                )}
              >
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputsRef.current[index] = element;
                    }}
                    value={digit}
                    onChange={(event) => handleChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={(event) => handlePaste(index, event)}
                    inputMode="text"
                    autoComplete="one-time-code"
                    maxLength={1}
                    className={cn(
                      'border rounded-xl focus:outline-none h-11 font-semibold text-lg text-center tracking-widest transition',
                      'bg-white/10 border-white/20 text-white placeholder:text-white/40',
                      'focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent',
                      (isSubmitting || isLoading) && 'opacity-70',
                      error && 'ring-2 ring-neon-pink/70',
                    )}
                    placeholder="—"
                    aria-invalid={!!error}
                    aria-describedby="event-code-hint"
                    aria-label={`Event code character ${index + 1}`}
                    disabled={isSubmitting || isLoading}
                  />
                ))}
              </div>

              <p id="event-code-hint" className="text-[11px] text-white/60 text-center">
                Ask your host for the six-character code. Paste works too!
              </p>
              <div aria-live="polite">
                {error && (
                  <p role="alert" className="text-neon-pink text-xs text-center">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={eventCode.length !== CODE_LENGTH || isSubmitting || isLoading}
              className="disabled:opacity-50 rounded-full w-full h-9 font-semibold text-white text-xs qrate-gradient"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join Event
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>

          {/* Info Card */}
          <div className="space-y-1.5 p-2 border border-white/10 rounded-xl glass-effect">
            <div className="flex items-center gap-1.5">
              <div className="bg-primary/20 p-1 rounded-full">
                <Music className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-white">What happens next?</p>
                <p className="text-[10px] text-white/60 leading-snug">
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
