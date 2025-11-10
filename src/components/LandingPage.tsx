import { useState, useEffect, useRef, useMemo, useCallback, memo, Suspense, lazy } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Music, Sparkles, Users, Zap, ArrowRight, Star, Settings, Mic2, Calendar, TrendingUp, CheckCircle, XCircle, BarChart3, Radio, PartyPopper, QrCode, Headphones, Trophy, Play, Volume2, Heart, Shield, Clock, Gauge, Waves, Gift, ChevronRight } from 'lucide-react';
import MercuryTitle from './MercuryTitle';
import qrateLogo from '../assets/QRate_LogoTitle.png';
import React from 'react';
import { throttle } from '../utils/performanceUtils';

// Lazy load Spline to avoid dynamic import issues
const Spline = lazy(() => 
  import('@splinetool/react-spline')
    .then(module => ({ default: module.default }))
    .catch((error) => {
      console.error('Failed to load Spline:', error);
      // Return a fallback component
      return { default: () => null };
    })
);

interface LandingPageProps {
  onCreateEvent: () => void;
  onJoinEvent: (eventCode: string) => void;
  isLoading?: boolean;
}

// Animated Counter Component - Memoized for performance
const AnimatedCounter = memo(function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, end, duration]);

  return <div ref={ref}>{count}{suffix}</div>;
});

const LandingPage = memo(function LandingPage({ onCreateEvent, onJoinEvent, isLoading = false }: LandingPageProps) {
  const [eventCode, setEventCode] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showSpotifyTest, setShowSpotifyTest] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleJoinEvent = useCallback(() => {
    if (eventCode.trim()) {
      setIsAnimating(true);
      setTimeout(() => {
        onJoinEvent(eventCode);
      }, 300);
    }
  }, [eventCode, onJoinEvent]);

  const handleJoinParty = useCallback(() => {
    setShowJoinInput(true);
  }, []);

  // Scroll to section handler - Memoized
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  }, []);

  // Track scroll progress - Throttled for performance
  const sections = useMemo(() => ['hero', 'stats', 'problem-solution', 'how-it-works', 'for-djs', 'for-hosts', 'for-guests', 'demo'], []);
  
  useEffect(() => {
    const handleScroll = throttle(() => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setScrollProgress((currentScroll / totalScroll) * 100);

      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    }, 16); // ~60fps throttling

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <div className="relative bg-black min-h-screen overflow-hidden">
      {/* Spline 3D Background - At top of page, not fixed */}
      <div 
        className="relative w-full overflow-hidden" 
        style={{ 
          height: '100vh',
          width: '100%',
          pointerEvents: 'auto'
        }}
      >
        {/* Navigation Bar - Absolute positioned over Spline */}
        <nav className="absolute top-0 right-0 left-0 z-[150] bg-transparent">
        <div className="w-full px-6 md:px-8 lg:px-12 xl:pl-0 xl:pr-12 2xl:pr-16 pt-2 md:pt-3 lg:pt-4 pb-4 md:pb-6">
          <div className="flex justify-between items-center">
            <img 
              src={qrateLogo}
              alt="QRate"
              className="hover:opacity-80 h-40 md:h-48 lg:h-56 xl:h-64 2xl:h-72 transition-opacity cursor-pointer xl:-ml-6 2xl:-ml-8"
              onClick={() => scrollToSection('hero')}
            />
            
            <div className="hidden sm:flex items-center gap-8 lg:gap-12 xl:gap-16" style={{ fontFamily: "'Lexend Tera', sans-serif", fontWeight: 300 }}>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-white hover:text-gray-300 transition-colors"
                style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', color: '#ffffff' }}
              >
                How it Works
              </button>
              <button
                onClick={() => scrollToSection('for-djs')}
                className="text-white hover:text-gray-300 transition-colors"
                style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', color: '#ffffff' }}
              >
                For DJs
              </button>
              <button
                onClick={() => scrollToSection('for-hosts')}
                className="text-white hover:text-gray-300 transition-colors"
                style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', color: '#ffffff' }}
              >
                For Hosts & Venues
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onCreateEvent}
                className="hover:opacity-80 px-8 md:px-10 lg:px-12 xl:px-14 py-2 md:py-2.5 lg:py-3 border-2 rounded-full transition-all"
                style={{ 
                  fontFamily: "'Lexend Tera', sans-serif", 
                  fontWeight: 700,
                  borderColor: '#7F6C7C',
                  color: 'white',
                  fontSize: 'clamp(13px, 1.4vw, 16px)',
                  whiteSpace: 'nowrap'
                }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
        </nav>

        <Suspense fallback={<div className="w-full h-full bg-black" />}>
          <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
            <Spline 
              scene="https://prod.spline.design/uFtyQBoyDqcwCjdW/scene.splinecode"
            />
          </div>
        </Suspense>

        {/* Hero Section - Positioned absolutely over Spline */}
        <section id="hero" className="absolute top-0 left-0 right-0 min-h-screen overflow-hidden" style={{ pointerEvents: 'none', height: '100vh' }}>
          {/* Left Side - Hero Text */}
          <div className="absolute left-8 md:left-12 lg:left-16 xl:left-24 2xl:left-32 top-1/2 -translate-y-1/2 z-10 animate-slide-in" style={{ pointerEvents: 'auto' }}>
            <h1 
              className="mb-4 md:mb-6 text-white leading-tight"
              style={{ 
                fontFamily: "'Lexend Tera', sans-serif", 
                fontWeight: 400,
                fontSize: 'clamp(36px, 5vw, 65px)',
                lineHeight: '1.1',
                letterSpacing: '0em'
              }}
            >
              where words fail,<br />
              music speaks.
            </h1>
            
            <div 
              className="text-gray-400 mt-4"
              style={{ fontFamily: "'Lexend Tera', sans-serif", fontWeight: 300, fontSize: 'clamp(11px, 1.2vw, 13px)' }}
            >
              crowd generated / The playlist, perfected / your music, your night
            </div>
          </div>

          {/* Bottom Right - CTA (Above QR code area) */}
          <div 
            className="absolute z-10 flex flex-col items-end animate-slide-in" 
            style={{
              animationDelay: '0.2s',
              right: 'clamp(24px, 4vw, 64px)',
              bottom: 'clamp(120px, 18vh, 220px)',
              pointerEvents: 'auto'
            }}
          >
            <div 
              className="mb-6 text-right"
              style={{ fontFamily: "'Lexend Tera', sans-serif", fontWeight: 300, fontSize: 'clamp(12px, 1.4vw, 14px)', lineHeight: '1.6' }}
            >
              <p className="text-white">
                The future of curation
              </p>
              <p className="text-white">
                is collective.
              </p>
            </div>

            <button
              onClick={onCreateEvent}
              disabled={isLoading}
              className="group flex items-center gap-3 bg-transparent hover:opacity-80 disabled:opacity-50 px-6 md:px-7 py-2.5 md:py-3 border-2 border-gray-600 hover:border-gray-400 rounded-full text-white transition-all"
              style={{ fontFamily: "'Lexend Tera', sans-serif", fontWeight: 700, fontSize: 'clamp(11px, 1.2vw, 13px)' }}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="mr-3 border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin"></div>
                  Loading...
                </div>
              ) : (
                <>
                  Get started for free
                  <ArrowRight className="inline-block right-0 w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: 'var(--neon-pink)' }} />
                </>
              )}
            </button>
          </div>

          {/* Join Party Input */}
          {showJoinInput && (
            <div className="z-[60] fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm p-6 animate-slide-in">
              <Card className="shadow-[var(--neon-pink)]/10 shadow-2xl border-[var(--glass-border)] border-[var(--neon-pink)]/50 w-full max-w-md glass-effect">
                <CardContent className="p-6 text-center">
                  <h3 className="mb-4 text-white text-xl">Enter Party Code</h3>
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter party code (e.g., ABC123)"
                      value={eventCode}
                      onChange={(e) => setEventCode(e.target.value)}
                      className="bg-[var(--input-background)] border-[var(--glass-border)] focus:border-[var(--neon-cyan)] rounded-xl focus:ring-[var(--neon-cyan)] text-white placeholder-gray-400"
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinEvent()}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleJoinEvent}
                        disabled={!eventCode.trim() || isAnimating || isLoading}
                        className="flex-1 bg-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/80 disabled:opacity-50 hover:shadow-[var(--neon-cyan)]/25 hover:shadow-lg py-3 rounded-xl text-black transition-all duration-300"
                      >
                        {isAnimating || isLoading ? (
                          <div className="flex items-center">
                            <div className="mr-2 border-2 border-black/30 border-t-black rounded-full w-4 h-4 animate-spin"></div>
                            {isLoading ? 'Loading...' : 'Joining...'}
                          </div>
                        ) : (
                          <>
                            Join the Vibe
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => setShowJoinInput(false)}
                        variant="outline"
                        className="px-4 py-3 border-[var(--glass-border)] hover:border-[var(--neon-pink)]/50 rounded-xl text-gray-300 hover:text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <Star className="w-4 h-4 text-[var(--neon-yellow)]" />
                      <p className="text-gray-400 text-xs">
                        Get party codes from your host or event organizer
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </section>
      </div>

      {/* Scroll Progress Bar */}
      <div className="top-0 left-0 z-[100] fixed bg-transparent w-full h-1">
        <div 
          className="bg-gradient-to-r from-[var(--neon-pink)] via-[var(--neon-purple)] to-[var(--neon-cyan)] h-full transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Content sections below Spline - Normal document flow with black background */}
      <div className="relative bg-black" style={{ pointerEvents: 'auto' }}>
        {/* Problem / Solution Section */}
        <section id="problem-solution" className="mx-auto px-6 py-20 container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-white text-4xl md:text-5xl">
                No More <span className="text-[var(--neon-pink)]">Guessing Games</span>
              </h2>
              <p className="mx-auto max-w-3xl text-gray-300 text-xl">
                Traditional event music curation is broken. QRate fixes it.
              </p>
            </div>

            <div className="gap-8 grid lg:grid-cols-2">
              {/* Problems */}
              <Card className="group border-[var(--glass-border)] border-red-500/30 overflow-hidden glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-red-500/10 p-3 rounded-xl">
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-white text-2xl">The Old Way</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 bg-red-500/5 p-3 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors">
                      <div className="flex-shrink-0 bg-red-500 mt-2 rounded-full w-2 h-2"></div>
                      <p className="text-gray-300"><span className="text-white">DJs guess</span> what the crowd wants – high risk, low reward</p>
                    </div>
                    <div className="flex gap-3 bg-red-500/5 p-3 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors">
                      <div className="flex-shrink-0 bg-red-500 mt-2 rounded-full w-2 h-2"></div>
                      <p className="text-gray-300"><span className="text-white">Song requests</span> are disruptive and break the flow</p>
                    </div>
                    <div className="flex gap-3 bg-red-500/5 p-3 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors">
                      <div className="flex-shrink-0 bg-red-500 mt-2 rounded-full w-2 h-2"></div>
                      <p className="text-gray-300"><span className="text-white">Guests leave early</span> when the vibe doesn't match</p>
                    </div>
                    <div className="flex gap-3 bg-red-500/5 p-3 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors">
                      <div className="flex-shrink-0 bg-red-500 mt-2 rounded-full w-2 h-2"></div>
                      <p className="text-gray-300"><span className="text-white">Hosts lose business</span> when events fall flat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Solution */}
              <Card className="group border-[var(--glass-border)] border-[var(--neon-cyan)]/50 overflow-hidden glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-cyan)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[var(--neon-cyan)]/10 p-3 rounded-xl">
                      <CheckCircle className="w-8 h-8 text-[var(--neon-cyan)]" />
                    </div>
                    <h3 className="text-white text-2xl">The QRate Way</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 bg-[var(--neon-cyan)]/5 p-3 border border-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/40 rounded-lg transition-colors">
                      <div className="flex-shrink-0 bg-[var(--neon-cyan)] mt-2 rounded-full w-2 h-2"></div>
                      <p className="text-gray-300"><span className="text-white">One QR scan</span> – everyone's voice is heard automatically</p>
                    </div>
                    <div className="flex gap-3 bg-[var(--neon-cyan)]/5 p-3 border border-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/40 rounded-lg transition-colors">
                      <div className="flex-shrink-0 bg-[var(--neon-cyan)] mt-2 rounded-full w-2 h-2"></div>
                      <p className="text-gray-300"><span className="text-white">AI analyzes</span> crowd preferences in real-time</p>
                    </div>
                    <div className="flex gap-3 bg-[var(--neon-cyan)]/5 p-3 border border-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/40 rounded-lg transition-colors">
                      <div className="flex-shrink-0 bg-[var(--neon-cyan)] mt-2 rounded-full w-2 h-2"></div>
                      <p className="text-gray-300"><span className="text-white">Guests stay engaged</span> as co-creators of the vibe</p>
                    </div>
                    <div className="flex gap-3 bg-[var(--neon-cyan)]/5 p-3 border border-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/40 rounded-lg transition-colors">
                      <div className="flex-shrink-0 bg-[var(--neon-cyan)] mt-2 rounded-full w-2 h-2"></div>
                      <p className="text-gray-300"><span className="text-white">Events thrive</span> with data-driven success</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <Card className="inline-block border-[var(--glass-border)] border-[var(--neon-purple)]/30 glass-effect">
                <CardContent className="p-6">
                  <p className="text-white text-xl">
                    <span className="text-[var(--neon-cyan)]">No more reading the room</span> – <span className="text-[var(--neon-pink)]">we read it for you</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="mx-auto px-6 py-20 container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-white text-4xl md:text-5xl">
                Simple as <span className="text-[var(--neon-cyan)]">1-2-3</span>
              </h2>
              <p className="mx-auto max-w-3xl text-gray-300 text-xl">
                Transform any gathering into a personalized concert in three steps
              </p>
            </div>

            <div className="gap-8 grid md:grid-cols-3 mb-12">
              <Card className="group relative border-[var(--glass-border)] hover:border-[var(--neon-pink)]/50 overflow-hidden transition-all duration-300 glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-pink)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8 text-center">
                  <div className="inline-flex justify-center items-center bg-gradient-to-br from-[var(--neon-pink)]/20 to-[var(--neon-pink)]/5 mb-6 rounded-full w-20 h-20 group-hover:scale-110 transition-transform">
                    <QrCode className="w-10 h-10 text-[var(--neon-pink)]" />
                  </div>
                  <div className="inline-flex justify-center items-center bg-[var(--neon-pink)]/20 mb-4 rounded-full w-10 h-10 text-[var(--neon-pink)] text-xl">1</div>
                  <h3 className="mb-4 text-white text-2xl">Scan QR Code</h3>
                  <p className="text-gray-300 leading-relaxed">Guests scan a QR code at the event entrance – quick, seamless, effortless</p>
                </CardContent>
              </Card>

              <Card className="group relative border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/50 overflow-hidden transition-all duration-300 glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-cyan)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8 text-center">
                  <div className="inline-flex justify-center items-center bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-cyan)]/5 mb-6 rounded-full w-20 h-20 group-hover:scale-110 transition-transform">
                    <Music className="w-10 h-10 text-[var(--neon-cyan)]" />
                  </div>
                  <div className="inline-flex justify-center items-center bg-[var(--neon-cyan)]/20 mb-4 rounded-full w-10 h-10 text-[var(--neon-cyan)] text-xl">2</div>
                  <h3 className="mb-4 text-white text-2xl">Sync Spotify</h3>
                  <p className="text-gray-300 leading-relaxed">Connect Spotify to instantly share music preferences and listening history</p>
                </CardContent>
              </Card>

              <Card className="group relative border-[var(--glass-border)] hover:border-[var(--neon-purple)]/50 overflow-hidden transition-all duration-300 glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8 text-center">
                  <div className="inline-flex justify-center items-center bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/5 mb-6 rounded-full w-20 h-20 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-10 h-10 text-[var(--neon-purple)]" />
                  </div>
                  <div className="inline-flex justify-center items-center bg-[var(--neon-purple)]/20 mb-4 rounded-full w-10 h-10 text-[var(--neon-purple)] text-xl">3</div>
                  <h3 className="mb-4 text-white text-2xl">AI Magic</h3>
                  <p className="text-gray-300 leading-relaxed">Our AI creates a crowd-powered playlist that evolves in real-time</p>
                </CardContent>
              </Card>
            </div>

            {/* Visual Flow */}
            <div className="relative">
              <div className="hidden lg:block top-1/2 right-0 left-0 absolute bg-gradient-to-r from-[var(--neon-pink)] via-[var(--neon-cyan)] to-[var(--neon-purple)] h-0.5 -translate-y-1/2"></div>
              <div className="z-10 relative gap-4 grid lg:grid-cols-3">
                <div className="p-6 border border-[var(--neon-pink)]/30 rounded-xl text-center glass-effect">
                  <p className="mb-2 text-[var(--neon-pink)]">Guest Input</p>
                  <p className="text-gray-400 text-sm">Spotify preferences collected</p>
                </div>
                <div className="p-6 border border-[var(--neon-cyan)]/30 rounded-xl text-center glass-effect">
                  <p className="mb-2 text-[var(--neon-cyan)]">AI Processing</p>
                  <p className="text-gray-400 text-sm">Machine learning analysis</p>
                </div>
                <div className="p-6 border border-[var(--neon-purple)]/30 rounded-xl text-center glass-effect">
                  <p className="mb-2 text-[var(--neon-purple)]">Perfect Playlist</p>
                  <p className="text-gray-400 text-sm">Real-time recommendations</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For DJs Section */}
        <section id="for-djs" className="mx-auto px-6 py-20 container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-[var(--neon-pink)]/20 to-[var(--neon-pink)]/5 p-4 rounded-full">
                  <Headphones className="w-10 h-10 text-[var(--neon-pink)]" />
                </div>
                <h2 className="text-white text-4xl md:text-5xl">For DJs</h2>
              </div>
              <p className="mx-auto mb-4 max-w-3xl text-gray-300 text-xl">
                Stop guessing. Start mixing. Let AI be your personal assistant.
              </p>
              <p className="mx-auto max-w-2xl text-gray-400 text-lg">
                Focus on your art while we handle the crowd intelligence
              </p>
            </div>

            <div className="gap-8 grid lg:grid-cols-2 mb-12">
              <Card className="group border-[var(--glass-border)] overflow-hidden glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-pink)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-[var(--neon-pink)]/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                      <Mic2 className="w-8 h-8 text-[var(--neon-pink)]" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-white text-2xl">Focus on Your Art</h3>
                      <p className="text-gray-400 text-sm">Creative freedom meets data intelligence</p>
                    </div>
                  </div>
                  <p className="mb-4 text-gray-300 leading-relaxed">
                    No more frantic searching or risky guesses. QRate's AI analyzes the crowd and delivers track recommendations that match the vibe.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    You stay in creative flow while we handle crowd preferences. It's like having a personal assistant who knows exactly what your audience wants.
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-[var(--glass-border)] overflow-hidden glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-pink)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-[var(--neon-pink)]/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                      <Trophy className="w-8 h-8 text-[var(--neon-pink)]" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-white text-2xl">Guarantee Success</h3>
                      <p className="text-gray-400 text-sm">Build your reputation with confidence</p>
                    </div>
                  </div>
                  <p className="mb-4 text-gray-300 leading-relaxed">
                    Consistently successful events mean repeat bookings and word-of-mouth recommendations that build your brand.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    Stop worrying about reading the crowd wrong. Let data-driven insights give you the confidence to take your sets to the next level.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-[var(--glass-border)] border-[var(--neon-pink)]/30 glass-effect">
              <CardContent className="p-8">
                <h3 className="mb-6 text-white text-2xl text-center">Your DJ Dashboard Includes</h3>
                <div className="gap-6 grid md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-start gap-3 p-4 hover:border hover:border-[var(--neon-pink)]/30 rounded-lg transition-all glass-effect">
                    <CheckCircle className="flex-shrink-0 mt-1 w-5 h-5 text-[var(--neon-pink)]" />
                    <div>
                      <p className="mb-1 text-white">Smart Recommendations</p>
                      <p className="text-gray-400 text-sm">AI-powered track suggestions based on crowd taste</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 hover:border hover:border-[var(--neon-pink)]/30 rounded-lg transition-all glass-effect">
                    <CheckCircle className="flex-shrink-0 mt-1 w-5 h-5 text-[var(--neon-pink)]" />
                    <div>
                      <p className="mb-1 text-white">Live Crowd Analysis</p>
                      <p className="text-gray-400 text-sm">Real-time preference tracking and insights</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 hover:border hover:border-[var(--neon-pink)]/30 rounded-lg transition-all glass-effect">
                    <CheckCircle className="flex-shrink-0 mt-1 w-5 h-5 text-[var(--neon-pink)]" />
                    <div>
                      <p className="mb-1 text-white">Queue Management</p>
                      <p className="text-gray-400 text-sm">Seamless playlist control and organization</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 hover:border hover:border-[var(--neon-pink)]/30 rounded-lg transition-all glass-effect">
                    <CheckCircle className="flex-shrink-0 mt-1 w-5 h-5 text-[var(--neon-pink)]" />
                    <div>
                      <p className="mb-1 text-white">Vibe Analysis</p>
                      <p className="text-gray-400 text-sm">Understand energy levels and mood shifts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 hover:border hover:border-[var(--neon-pink)]/30 rounded-lg transition-all glass-effect">
                    <CheckCircle className="flex-shrink-0 mt-1 w-5 h-5 text-[var(--neon-pink)]" />
                    <div>
                      <p className="mb-1 text-white">Genre Insights</p>
                      <p className="text-gray-400 text-sm">See what styles resonate with your crowd</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 hover:border hover:border-[var(--neon-pink)]/30 rounded-lg transition-all glass-effect">
                    <CheckCircle className="flex-shrink-0 mt-1 w-5 h-5 text-[var(--neon-pink)]" />
                    <div>
                      <p className="mb-1 text-white">Performance Metrics</p>
                      <p className="text-gray-400 text-sm">Track your success and improve over time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Hosts Section */}
        <section id="for-hosts" className="mx-auto px-6 py-20 container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/5 p-4 rounded-full">
                  <Calendar className="w-10 h-10 text-[var(--neon-purple)]" />
                </div>
                <h2 className="text-white text-4xl md:text-5xl">For Hosts</h2>
              </div>
              <p className="mx-auto mb-4 max-w-3xl text-gray-300 text-xl">
                Stand out from the crowd. Keep guests coming back. Boost your bottom line.
              </p>
              <p className="mx-auto max-w-2xl text-gray-400 text-lg">
                Transform your venue into the hottest ticket in town
              </p>
            </div>

            <div className="gap-8 grid md:grid-cols-3 mb-12">
              <Card className="group border-[var(--glass-border)] hover:border-[var(--neon-purple)]/50 overflow-hidden transition-all glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8 text-center">
                  <div className="inline-flex justify-center items-center bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/5 mb-6 rounded-full w-16 h-16 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-8 h-8 text-[var(--neon-purple)]" />
                  </div>
                  <h3 className="mb-4 text-white text-2xl">Increase Revenue</h3>
                  <p className="text-gray-300 leading-relaxed">
                    When the vibe is right, guests stay longer, spend more on drinks and tickets, and keep coming back for more
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-[var(--glass-border)] hover:border-[var(--neon-purple)]/50 overflow-hidden transition-all glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8 text-center">
                  <div className="inline-flex justify-center items-center bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/5 mb-6 rounded-full w-16 h-16 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-[var(--neon-purple)]" />
                  </div>
                  <h3 className="mb-4 text-white text-2xl">Repeat Attendance</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Create unforgettable experiences that turn first-timers into regulars and build a loyal community
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-[var(--glass-border)] hover:border-[var(--neon-purple)]/50 overflow-hidden transition-all glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8 text-center">
                  <div className="inline-flex justify-center items-center bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/5 mb-6 rounded-full w-16 h-16 group-hover:scale-110 transition-transform">
                    <Star className="w-8 h-8 text-[var(--neon-purple)]" />
                  </div>
                  <h3 className="mb-4 text-white text-2xl">Stand Out</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Be the venue everyone talks about with cutting-edge AI music technology that sets you apart
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-[var(--glass-border)] border-[var(--neon-purple)]/30 glass-effect">
              <CardContent className="p-8">
                <h3 className="mb-6 text-white text-2xl text-center">Everything You Need to Succeed</h3>
                <div className="gap-6 grid md:grid-cols-2">
                  <div className="flex items-start gap-3 p-4 hover:border hover:border-[var(--neon-purple)]/30 rounded-lg transition-all glass-effect">
                    <CheckCircle className="flex-shrink-0 mt-1 w-5 h-5 text-[var(--neon-purple)]" />
                    <div>
                      <p className="mb-1 text-white">Event Analytics</p>
                      <p className="text-gray-400 text-sm">Track engagement, satisfaction, and revenue metrics in real-time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 hover:border hover:border-[var(--neon-purple)]/30 rounded-lg transition-all glass-effect">
                    <CheckCircle className="flex-shrink-0 mt-1 w-5 h-5 text-[var(--neon-purple)]" />
                    <div>
                      <p className="mb-1 text-white">Easy QR Setup</p>
                      <p className="text-gray-400 text-sm">Deploy in minutes, no technical knowledge required</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 hover:border hover:border-[var(--neon-purple)]/30 rounded-lg transition-all glass-effect">
                    <CheckCircle className="flex-shrink-0 mt-1 w-5 h-5 text-[var(--neon-purple)]" />
                    <div>
                      <p className="mb-1 text-white">Guest Insights</p>
                      <p className="text-gray-400 text-sm">Understand your crowd's demographics and music preferences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 hover:border hover:border-[var(--neon-purple)]/30 rounded-lg transition-all glass-effect">
                    <CheckCircle className="flex-shrink-0 mt-1 w-5 h-5 text-[var(--neon-purple)]" />
                    <div>
                      <p className="mb-1 text-white">Afterparty Summaries</p>
                      <p className="text-gray-400 text-sm">Beautiful, shareable event recaps for social proof and marketing</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Guests Section */}
        <section id="for-guests" className="mx-auto px-6 py-20 container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-[var(--neon-yellow)]/20 to-[var(--neon-yellow)]/5 p-4 rounded-full">
                  <PartyPopper className="w-10 h-10 text-[var(--neon-yellow)]" />
                </div>
                <h2 className="text-white text-4xl md:text-5xl">For Guests</h2>
              </div>
              <p className="mx-auto mb-4 max-w-3xl text-gray-300 text-xl">
                Your voice matters. Be part of the vibe. Dance to music you love.
              </p>
              <p className="mx-auto max-w-2xl text-gray-400 text-lg">
                Every party becomes your personal concert
              </p>
            </div>

            <div className="gap-8 grid lg:grid-cols-2 mb-12">
              <Card className="group border-[var(--glass-border)] overflow-hidden glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-yellow)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-[var(--neon-yellow)]/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                      <Radio className="w-8 h-8 text-[var(--neon-yellow)]" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-white text-2xl">From Listener to Co-Creator</h3>
                      <p className="text-gray-400 text-sm">Shape the music, shape the night</p>
                    </div>
                  </div>
                  <p className="mb-4 text-gray-300 leading-relaxed">
                    No more being a passive listener waiting for a song you like. With one QR scan, your music taste shapes the entire event.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    No awkward requests. No waiting it out. No leaving early. Just pure musical connection and the satisfaction of knowing you helped create the vibe.
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-[var(--glass-border)] overflow-hidden glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-yellow)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="z-10 relative p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-[var(--neon-yellow)]/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                      <Heart className="w-8 h-8 text-[var(--neon-yellow)]" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-white text-2xl">Feel the Connection</h3>
                      <p className="text-gray-400 text-sm">Belonging through music</p>
                    </div>
                  </div>
                  <p className="mb-4 text-gray-300 leading-relaxed">
                    When the music reflects the collective taste, something magical happens. You feel understood, engaged, and part of something bigger.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    This sense of contribution keeps you on the dance floor longer and creates a powerful sense of community and belonging that makes every event unforgettable.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Card className="inline-block border-[var(--glass-border)] border-[var(--neon-yellow)]/30 glass-effect">
                <CardContent className="p-8">
                  <div className="flex flex-wrap justify-center items-center gap-6 text-xl">
                    <div className="flex items-center gap-2">
                      <Clock className="w-6 h-6 text-[var(--neon-yellow)]" />
                      <span className="text-[var(--neon-yellow)]">Stay longer</span>
                    </div>
                    <div className="bg-[var(--glass-border)] w-px h-8"></div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-6 h-6 text-[var(--neon-cyan)]" />
                      <span className="text-[var(--neon-cyan)]">Dance harder</span>
                    </div>
                    <div className="bg-[var(--glass-border)] w-px h-8"></div>
                    <div className="flex items-center gap-2">
                      <Gift className="w-6 h-6 text-[var(--neon-pink)]" />
                      <span className="text-[var(--neon-pink)]">Come back again</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Demo Preview Section */}
        <section id="demo" className="mx-auto px-6 py-20 container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-white text-4xl md:text-5xl">
                See <span className="text-[var(--neon-cyan)]">QRate</span> in Action
              </h2>
              <p className="mx-auto max-w-3xl text-gray-300 text-xl">
                Experience the power of AI-driven music curation
              </p>
            </div>

            <div className="gap-8 grid lg:grid-cols-2">
              {/* QR Check-in Preview */}
              <Card className="group border-[var(--glass-border)] border-[var(--neon-pink)]/30 overflow-hidden glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-pink)]/5 to-transparent"></div>
                <CardContent className="z-10 relative p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[var(--neon-pink)]/10 p-3 rounded-xl">
                      <QrCode className="w-6 h-6 text-[var(--neon-pink)]" />
                    </div>
                    <h3 className="text-white text-xl">Guest Check-In</h3>
                  </div>
                  
                  <div className="bg-[var(--background)]/50 mb-4 p-6 border border-[var(--glass-border)] rounded-xl">
                    <div className="bg-white mx-auto mb-4 p-4 rounded-xl max-w-[200px] aspect-square">
                      <div className="flex justify-center items-center bg-gradient-to-br from-[var(--neon-pink)] to-[var(--neon-purple)] rounded-lg w-full h-full">
                        <QrCode className="w-24 h-24 text-white" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm text-center">Scan to join the party</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <CheckCircle className="w-4 h-4 text-[var(--neon-pink)]" />
                      <span>Instant Spotify connection</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <CheckCircle className="w-4 h-4 text-[var(--neon-pink)]" />
                      <span>Privacy-first data handling</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <CheckCircle className="w-4 h-4 text-[var(--neon-pink)]" />
                      <span>Seamless user experience</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DJ Dashboard Preview */}
              <Card className="group border-[var(--glass-border)] border-[var(--neon-cyan)]/30 overflow-hidden glass-effect">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-cyan)]/5 to-transparent"></div>
                <CardContent className="z-10 relative p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[var(--neon-cyan)]/10 p-3 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-[var(--neon-cyan)]" />
                    </div>
                    <h3 className="text-white text-xl">DJ Dashboard</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-[var(--background)]/50 p-4 border border-[var(--glass-border)] rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">Crowd Energy</span>
                        <span className="text-[var(--neon-cyan)]">High</span>
                      </div>
                      <div className="bg-[var(--background)] rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] rounded-full w-4/5 h-full"></div>
                      </div>
                    </div>

                    <div className="bg-[var(--background)]/50 p-4 border border-[var(--glass-border)] rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">Genre Match</span>
                        <span className="text-[var(--neon-pink)]">92%</span>
                      </div>
                      <div className="bg-[var(--background)] rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-yellow)] rounded-full w-[92%] h-full"></div>
                      </div>
                    </div>

                    <div className="bg-[var(--background)]/50 p-4 border border-[var(--glass-border)] rounded-xl">
                      <p className="mb-2 text-gray-400 text-sm">Top Recommendation</p>
                      <p className="mb-1 text-white">Purple Disco Machine - Emotion</p>
                      <p className="text-gray-500 text-xs">Matches 87% of crowd preferences</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto px-6 py-20 container">
          <div className="mx-auto max-w-4xl">
            <Card className="relative border-[var(--glass-border)] border-[var(--neon-cyan)]/50 overflow-hidden glass-effect">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-pink)]/10 via-[var(--neon-purple)]/10 to-[var(--neon-cyan)]/10"></div>
              <div className="absolute inset-0 overflow-hidden">
                <div className="top-0 right-0 absolute bg-[var(--neon-pink)]/20 blur-3xl rounded-full w-64 h-64 animate-float"></div>
                <div className="bottom-0 left-0 absolute bg-[var(--neon-cyan)]/20 blur-3xl rounded-full w-64 h-64 animate-float" style={{ animationDelay: '1s' }}></div>
              </div>
              <CardContent className="z-10 relative p-12 text-center">
                <h2 className="mb-6 text-white text-4xl md:text-5xl">
                  Ready to Transform Your Events?
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-gray-300 text-xl leading-relaxed">
                  Join the future of music curation. Give your crowd a voice and watch the magic happen.
                </p>
                <div className="flex sm:flex-row flex-col justify-center gap-4 mb-6">
                  <Button
                    onClick={onCreateEvent}
                    className="group bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-purple)] hover:opacity-90 shadow-[var(--neon-pink)]/25 shadow-lg px-8 py-6 rounded-xl text-white text-lg hover:scale-105 transition-all"
                  >
                    <Calendar className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Host Your First Event
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button
                    onClick={handleJoinParty}
                    variant="outline"
                    className="group hover:bg-[var(--neon-cyan)]/10 px-8 py-6 border-[var(--neon-cyan)] rounded-xl text-[var(--neon-cyan)] text-lg transition-all"
                  >
                    <QrCode className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    Join an Event
                  </Button>
                </div>
                <p className="text-gray-400 text-sm">
                  No credit card required • Setup in 5 minutes • Free to try
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="mx-auto px-6 py-12 border-[var(--glass-border)] border-t container">
          <div className="mx-auto max-w-6xl">
            <div className="gap-8 grid md:grid-cols-4 mb-8">
              <div>
                <div 
                  className="mb-4 text-2xl"
                  style={{
                    fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
                    background: 'linear-gradient(135deg, #ffffff, #e5e5e5, #c0c0c0, #909090)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
                  }}
                >
                  QRate
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  AI-powered music curation for unforgettable events. Transforming parties, one playlist at a time.
                </p>
              </div>

              <div>
                <h4 className="mb-4 text-white">Product</h4>
                <div className="space-y-2">
                  <button onClick={() => scrollToSection('how-it-works')} className="block text-gray-400 hover:text-white text-sm transition-colors">
                    How It Works
                  </button>
                  <button onClick={() => scrollToSection('for-djs')} className="block text-gray-400 hover:text-white text-sm transition-colors">
                    For DJs
                  </button>
                  <button onClick={() => scrollToSection('for-hosts')} className="block text-gray-400 hover:text-white text-sm transition-colors">
                    For Hosts
                  </button>
                  <button onClick={() => scrollToSection('for-guests')} className="block text-gray-400 hover:text-white text-sm transition-colors">
                    For Guests
                  </button>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-white">Company</h4>
                <div className="space-y-2">
                  <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                    About Us
                  </a>
                  <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                    Contact
                  </a>
                  <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                    Privacy Policy
                  </a>
                  <a href="#" className="block text-gray-400 hover:text-white text-sm transition-colors">
                    Terms of Service
                  </a>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-white">Get Started</h4>
                <div className="space-y-2">
                  <Button
                    onClick={onCreateEvent}
                    variant="outline"
                    className="justify-start border-[var(--glass-border)] hover:border-[var(--neon-pink)]/50 w-full text-gray-300 hover:text-white text-sm"
                  >
                    Host Event
                  </Button>
                  <Button
                    onClick={handleJoinParty}
                    variant="outline"
                    className="justify-start border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/50 w-full text-gray-300 hover:text-white text-sm"
                  >
                    Join Event
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-8 border-[var(--glass-border)] border-t text-center">
              <p className="mb-4 text-gray-400 text-sm">
                © 2025 QRate. All rights reserved.
              </p>
              {/* Developer Tools */}
              <div className="flex flex-wrap justify-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSpotifyTest(!showSpotifyTest)}
                  className="text-gray-500 hover:text-gray-400 text-xs"
                >
                  <Settings className="mr-1 w-3 h-3" />
                  {showSpotifyTest ? 'Hide' : 'Show'} Spotify Test
                </Button>
                
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Spotify Test Panel */}
      {showSpotifyTest && (
          <div className="right-4 bottom-4 z-50 fixed w-96 animate-slide-in">
            <Card className="shadow-2xl border-[var(--glass-border)] glass-effect">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white text-sm">Spotify Test</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSpotifyTest(false)}
                    className="p-0 w-6 h-6 text-gray-400 hover:text-white"
                  >
                    ×
                  </Button>
                </div>
                <p className="mb-3 text-white/80 text-xs">
                  Spotify integration is managed through the guest flow and DJ dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
});

export default LandingPage;
