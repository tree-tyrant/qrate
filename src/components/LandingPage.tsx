import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Music, Sparkles, Users, Zap, ArrowRight, Star, Settings, Mic2, Calendar, TrendingUp, CheckCircle, XCircle, BarChart3, Radio, PartyPopper, QrCode, Headphones, Trophy, Play, Volume2, Heart, Shield, Clock, Gauge, Waves, Gift, ChevronRight } from 'lucide-react';
import MercuryTitle from './MercuryTitle';
import qrateLogo from 'figma:asset/54f8d65003d58fba8cfc584fe95b99de1fd368dc.png';

interface LandingPageProps {
  onCreateEvent: () => void;
  onJoinEvent: (eventCode: string) => void;
  onSpotifyDebug?: () => void;
  isLoading?: boolean;
}

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
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
}

function LandingPage({ onCreateEvent, onJoinEvent, onSpotifyDebug, isLoading = false }: LandingPageProps) {
  const [eventCode, setEventCode] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showSpotifyTest, setShowSpotifyTest] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleJoinEvent = () => {
    if (eventCode.trim()) {
      setIsAnimating(true);
      setTimeout(() => {
        onJoinEvent(eventCode);
      }, 300);
    }
  };

  const handleJoinParty = () => {
    setShowJoinInput(true);
  };

  // Scroll to section handler
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setScrollProgress((currentScroll / totalScroll) * 100);

      const sections = ['hero', 'stats', 'problem-solution', 'how-it-works', 'for-djs', 'for-hosts', 'for-guests', 'demo'];
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
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-[100]">
        <div 
          className="h-full bg-gradient-to-r from-[var(--neon-pink)] via-[var(--neon-purple)] to-[var(--neon-cyan)] transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent pt-1">
        <div className="container mx-auto px-8 py-1">
          <div className="flex items-center justify-between">
            <img 
              src={qrateLogo}
              alt="QRate"
              className="h-40 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => scrollToSection('hero')}
              style={{ marginLeft: '-2px' }}
            />
            
            <div className="hidden md:flex items-center gap-12" style={{ fontFamily: "'Lexend Tera', sans-serif", fontWeight: 300 }}>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-white hover:text-gray-300 transition-colors"
                style={{ fontSize: '13px' }}
              >
                How it Works
              </button>
              <button
                onClick={() => scrollToSection('for-djs')}
                className="text-white hover:text-gray-300 transition-colors"
                style={{ fontSize: '13px' }}
              >
                For DJs
              </button>
              <button
                onClick={() => scrollToSection('for-hosts')}
                className="text-white hover:text-gray-300 transition-colors"
                style={{ fontSize: '13px' }}
              >
                For Hosts & Venues
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onCreateEvent}
                className="px-8 py-2.5 rounded-full border-2 transition-all hover:opacity-80"
                style={{ 
                  fontFamily: "'Lexend Tera', sans-serif", 
                  fontWeight: 700,
                  borderColor: '#7F6C7C',
                  color: 'white',
                  fontSize: '13px'
                }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-20">
        {/* Hero Section */}
        <section id="hero" className="min-h-screen flex items-center relative overflow-hidden">
          <div className="container mx-auto relative z-10 mt-[0px] mr-[20px] mb-[0px] ml-[90px] px-[20px] px-[10px] py-[0px]">
            <div className="grid lg:grid-cols-[2fr_1fr] gap-32 items-center w-full" style={{ paddingTop: '5vh' }}>
              {/* Left Side - Hero Text */}
              <div className="animate-slide-in">
                <h1 
                  className="mb-0 text-white leading-none"
                  style={{ 
                    fontFamily: "'Lexend Tera', sans-serif", 
                    fontWeight: 400,
                    fontSize: '65px',
                    lineHeight: '0.95',
                    letterSpacing: '0em'
                  }}
                >
                  where words fail,<br />
                  music speaks.
                </h1>
                
                <div 
                  className="text-gray-400"
                  style={{ fontFamily: "'Lexend Tera', sans-serif", fontWeight: 300, fontSize: '13px' }}
                >
                  crowd generated / The playlist, perfected / your music, your night
                </div>
              </div>

              {/* Right Side - CTA */}
              <div className="animate-slide-in flex flex-col items-end" style={{animationDelay: '0.2s'}}>
                <div 
                  className="text-right mb-6"
                  style={{ fontFamily: "'Lexend Tera', sans-serif", fontWeight: 300, fontSize: '14px', lineHeight: '1.6' }}
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
                  className="bg-transparent border-2 border-gray-600 hover:border-gray-400 text-white px-7 py-3 rounded-full transition-all hover:opacity-80 disabled:opacity-50 group flex items-center gap-3"
                  style={{ fontFamily: "'Lexend Tera', sans-serif", fontWeight: 700, fontSize: '13px' }}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      Loading...
                    </div>
                  ) : (
                    <>
                      Get started for free
                      <ArrowRight className="right-0 w-5 h-5 inline-block group-hover:translate-x-1 transition-transform" style={{ color: 'var(--neon-pink)' }} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Join Party Input */}
          {showJoinInput && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-slide-in">
              <Card className="glass-effect border-[var(--glass-border)] border-[var(--neon-pink)]/50 shadow-2xl shadow-[var(--neon-pink)]/10 max-w-md w-full">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl mb-4 text-white">Enter Party Code</h3>
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter party code (e.g., ABC123)"
                      value={eventCode}
                      onChange={(e) => setEventCode(e.target.value)}
                      className="bg-[var(--input-background)] border-[var(--glass-border)] text-white placeholder-gray-400 focus:border-[var(--neon-cyan)] focus:ring-[var(--neon-cyan)] rounded-xl"
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinEvent()}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleJoinEvent}
                        disabled={!eventCode.trim() || isAnimating || isLoading}
                        className="flex-1 bg-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/80 text-black py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[var(--neon-cyan)]/25 disabled:opacity-50"
                      >
                        {isAnimating || isLoading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                            {isLoading ? 'Loading...' : 'Joining...'}
                          </div>
                        ) : (
                          <>
                            Join the Vibe
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => setShowJoinInput(false)}
                        variant="outline"
                        className="px-4 py-3 border-[var(--glass-border)] hover:border-[var(--neon-pink)]/50 text-gray-300 hover:text-white rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Star className="w-4 h-4 text-[var(--neon-yellow)]" />
                      <p className="text-xs text-gray-400">
                        Get party codes from your host or event organizer
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </section>

        {/* Problem / Solution Section */}
        <section id="problem-solution" className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl mb-6 text-white">
                No More <span className="text-[var(--neon-pink)]">Guessing Games</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Traditional event music curation is broken. QRate fixes it.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Problems */}
              <Card className="glass-effect border-[var(--glass-border)] border-red-500/30 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-red-500/10">
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-2xl text-white">The Old Way</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300"><span className="text-white">DJs guess</span> what the crowd wants – high risk, low reward</p>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300"><span className="text-white">Song requests</span> are disruptive and break the flow</p>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300"><span className="text-white">Guests leave early</span> when the vibe doesn't match</p>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300"><span className="text-white">Hosts lose business</span> when events fall flat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Solution */}
              <Card className="glass-effect border-[var(--glass-border)] border-[var(--neon-cyan)]/50 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-cyan)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-[var(--neon-cyan)]/10">
                      <CheckCircle className="w-8 h-8 text-[var(--neon-cyan)]" />
                    </div>
                    <h3 className="text-2xl text-white">The QRate Way</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 p-3 rounded-lg bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/40 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-[var(--neon-cyan)] mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300"><span className="text-white">One QR scan</span> – everyone's voice is heard automatically</p>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/40 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-[var(--neon-cyan)] mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300"><span className="text-white">AI analyzes</span> crowd preferences in real-time</p>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/40 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-[var(--neon-cyan)] mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300"><span className="text-white">Guests stay engaged</span> as co-creators of the vibe</p>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/40 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-[var(--neon-cyan)] mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300"><span className="text-white">Events thrive</span> with data-driven success</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <Card className="glass-effect border-[var(--glass-border)] border-[var(--neon-purple)]/30 inline-block">
                <CardContent className="p-6">
                  <p className="text-xl text-white">
                    <span className="text-[var(--neon-cyan)]">No more reading the room</span> – <span className="text-[var(--neon-pink)]">we read it for you</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl mb-6 text-white">
                Simple as <span className="text-[var(--neon-cyan)]">1-2-3</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Transform any gathering into a personalized concert in three steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="glass-effect border-[var(--glass-border)] hover:border-[var(--neon-pink)]/50 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-pink)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--neon-pink)]/20 to-[var(--neon-pink)]/5 mb-6 group-hover:scale-110 transition-transform">
                    <QrCode className="w-10 h-10 text-[var(--neon-pink)]" />
                  </div>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] mb-4 text-xl">1</div>
                  <h3 className="text-2xl mb-4 text-white">Scan QR Code</h3>
                  <p className="text-gray-300 leading-relaxed">Guests scan a QR code at the event entrance – quick, seamless, effortless</p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/50 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-cyan)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-cyan)]/5 mb-6 group-hover:scale-110 transition-transform">
                    <Music className="w-10 h-10 text-[var(--neon-cyan)]" />
                  </div>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] mb-4 text-xl">2</div>
                  <h3 className="text-2xl mb-4 text-white">Sync Spotify</h3>
                  <p className="text-gray-300 leading-relaxed">Connect Spotify to instantly share music preferences and listening history</p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-[var(--glass-border)] hover:border-[var(--neon-purple)]/50 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/5 mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-10 h-10 text-[var(--neon-purple)]" />
                  </div>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--neon-purple)]/20 text-[var(--neon-purple)] mb-4 text-xl">3</div>
                  <h3 className="text-2xl mb-4 text-white">AI Magic</h3>
                  <p className="text-gray-300 leading-relaxed">Our AI creates a crowd-powered playlist that evolves in real-time</p>
                </CardContent>
              </Card>
            </div>

            {/* Visual Flow */}
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--neon-pink)] via-[var(--neon-cyan)] to-[var(--neon-purple)] -translate-y-1/2 hidden lg:block"></div>
              <div className="grid lg:grid-cols-3 gap-4 relative z-10">
                <div className="glass-effect p-6 rounded-xl border border-[var(--neon-pink)]/30 text-center">
                  <p className="text-[var(--neon-pink)] mb-2">Guest Input</p>
                  <p className="text-sm text-gray-400">Spotify preferences collected</p>
                </div>
                <div className="glass-effect p-6 rounded-xl border border-[var(--neon-cyan)]/30 text-center">
                  <p className="text-[var(--neon-cyan)] mb-2">AI Processing</p>
                  <p className="text-sm text-gray-400">Machine learning analysis</p>
                </div>
                <div className="glass-effect p-6 rounded-xl border border-[var(--neon-purple)]/30 text-center">
                  <p className="text-[var(--neon-purple)] mb-2">Perfect Playlist</p>
                  <p className="text-sm text-gray-400">Real-time recommendations</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For DJs Section */}
        <section id="for-djs" className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="p-4 rounded-full bg-gradient-to-br from-[var(--neon-pink)]/20 to-[var(--neon-pink)]/5">
                  <Headphones className="w-10 h-10 text-[var(--neon-pink)]" />
                </div>
                <h2 className="text-4xl md:text-5xl text-white">For DJs</h2>
              </div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
                Stop guessing. Start mixing. Let AI be your personal assistant.
              </p>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Focus on your art while we handle the crowd intelligence
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              <Card className="glass-effect border-[var(--glass-border)] group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-pink)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-[var(--neon-pink)]/10 group-hover:scale-110 transition-transform">
                      <Mic2 className="w-8 h-8 text-[var(--neon-pink)]" />
                    </div>
                    <div>
                      <h3 className="text-2xl mb-2 text-white">Focus on Your Art</h3>
                      <p className="text-sm text-gray-400">Creative freedom meets data intelligence</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    No more frantic searching or risky guesses. QRate's AI analyzes the crowd and delivers track recommendations that match the vibe.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    You stay in creative flow while we handle crowd preferences. It's like having a personal assistant who knows exactly what your audience wants.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-[var(--glass-border)] group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-pink)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-[var(--neon-pink)]/10 group-hover:scale-110 transition-transform">
                      <Trophy className="w-8 h-8 text-[var(--neon-pink)]" />
                    </div>
                    <div>
                      <h3 className="text-2xl mb-2 text-white">Guarantee Success</h3>
                      <p className="text-sm text-gray-400">Build your reputation with confidence</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    Consistently successful events mean repeat bookings and word-of-mouth recommendations that build your brand.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    Stop worrying about reading the crowd wrong. Let data-driven insights give you the confidence to take your sets to the next level.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-effect border-[var(--glass-border)] border-[var(--neon-pink)]/30">
              <CardContent className="p-8">
                <h3 className="text-2xl mb-6 text-white text-center">Your DJ Dashboard Includes</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3 p-4 rounded-lg glass-effect hover:border hover:border-[var(--neon-pink)]/30 transition-all">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-pink)] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white mb-1">Smart Recommendations</p>
                      <p className="text-sm text-gray-400">AI-powered track suggestions based on crowd taste</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg glass-effect hover:border hover:border-[var(--neon-pink)]/30 transition-all">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-pink)] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white mb-1">Live Crowd Analysis</p>
                      <p className="text-sm text-gray-400">Real-time preference tracking and insights</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg glass-effect hover:border hover:border-[var(--neon-pink)]/30 transition-all">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-pink)] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white mb-1">Queue Management</p>
                      <p className="text-sm text-gray-400">Seamless playlist control and organization</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg glass-effect hover:border hover:border-[var(--neon-pink)]/30 transition-all">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-pink)] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white mb-1">Vibe Analysis</p>
                      <p className="text-sm text-gray-400">Understand energy levels and mood shifts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg glass-effect hover:border hover:border-[var(--neon-pink)]/30 transition-all">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-pink)] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white mb-1">Genre Insights</p>
                      <p className="text-sm text-gray-400">See what styles resonate with your crowd</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg glass-effect hover:border hover:border-[var(--neon-pink)]/30 transition-all">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-pink)] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white mb-1">Performance Metrics</p>
                      <p className="text-sm text-gray-400">Track your success and improve over time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Hosts Section */}
        <section id="for-hosts" className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="p-4 rounded-full bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/5">
                  <Calendar className="w-10 h-10 text-[var(--neon-purple)]" />
                </div>
                <h2 className="text-4xl md:text-5xl text-white">For Hosts</h2>
              </div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
                Stand out from the crowd. Keep guests coming back. Boost your bottom line.
              </p>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Transform your venue into the hottest ticket in town
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="glass-effect border-[var(--glass-border)] hover:border-[var(--neon-purple)]/50 transition-all group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/5 mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-8 h-8 text-[var(--neon-purple)]" />
                  </div>
                  <h3 className="text-2xl mb-4 text-white">Increase Revenue</h3>
                  <p className="text-gray-300 leading-relaxed">
                    When the vibe is right, guests stay longer, spend more on drinks and tickets, and keep coming back for more
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-[var(--glass-border)] hover:border-[var(--neon-purple)]/50 transition-all group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/5 mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-[var(--neon-purple)]" />
                  </div>
                  <h3 className="text-2xl mb-4 text-white">Repeat Attendance</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Create unforgettable experiences that turn first-timers into regulars and build a loyal community
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-[var(--glass-border)] hover:border-[var(--neon-purple)]/50 transition-all group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-purple)]/5 mb-6 group-hover:scale-110 transition-transform">
                    <Star className="w-8 h-8 text-[var(--neon-purple)]" />
                  </div>
                  <h3 className="text-2xl mb-4 text-white">Stand Out</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Be the venue everyone talks about with cutting-edge AI music technology that sets you apart
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-effect border-[var(--glass-border)] border-[var(--neon-purple)]/30">
              <CardContent className="p-8">
                <h3 className="text-2xl mb-6 text-white text-center">Everything You Need to Succeed</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3 p-4 rounded-lg glass-effect hover:border hover:border-[var(--neon-purple)]/30 transition-all">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-purple)] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white mb-1">Event Analytics</p>
                      <p className="text-sm text-gray-400">Track engagement, satisfaction, and revenue metrics in real-time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg glass-effect hover:border hover:border-[var(--neon-purple)]/30 transition-all">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-purple)] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white mb-1">Easy QR Setup</p>
                      <p className="text-sm text-gray-400">Deploy in minutes, no technical knowledge required</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg glass-effect hover:border hover:border-[var(--neon-purple)]/30 transition-all">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-purple)] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white mb-1">Guest Insights</p>
                      <p className="text-sm text-gray-400">Understand your crowd's demographics and music preferences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg glass-effect hover:border hover:border-[var(--neon-purple)]/30 transition-all">
                    <CheckCircle className="w-5 h-5 text-[var(--neon-purple)] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white mb-1">Afterparty Summaries</p>
                      <p className="text-sm text-gray-400">Beautiful, shareable event recaps for social proof and marketing</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Guests Section */}
        <section id="for-guests" className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="p-4 rounded-full bg-gradient-to-br from-[var(--neon-yellow)]/20 to-[var(--neon-yellow)]/5">
                  <PartyPopper className="w-10 h-10 text-[var(--neon-yellow)]" />
                </div>
                <h2 className="text-4xl md:text-5xl text-white">For Guests</h2>
              </div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
                Your voice matters. Be part of the vibe. Dance to music you love.
              </p>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Every party becomes your personal concert
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              <Card className="glass-effect border-[var(--glass-border)] group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-yellow)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-[var(--neon-yellow)]/10 group-hover:scale-110 transition-transform">
                      <Radio className="w-8 h-8 text-[var(--neon-yellow)]" />
                    </div>
                    <div>
                      <h3 className="text-2xl mb-2 text-white">From Listener to Co-Creator</h3>
                      <p className="text-sm text-gray-400">Shape the music, shape the night</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    No more being a passive listener waiting for a song you like. With one QR scan, your music taste shapes the entire event.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    No awkward requests. No waiting it out. No leaving early. Just pure musical connection and the satisfaction of knowing you helped create the vibe.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-[var(--glass-border)] group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-yellow)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-[var(--neon-yellow)]/10 group-hover:scale-110 transition-transform">
                      <Heart className="w-8 h-8 text-[var(--neon-yellow)]" />
                    </div>
                    <div>
                      <h3 className="text-2xl mb-2 text-white">Feel the Connection</h3>
                      <p className="text-sm text-gray-400">Belonging through music</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    When the music reflects the collective taste, something magical happens. You feel understood, engaged, and part of something bigger.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    This sense of contribution keeps you on the dance floor longer and creates a powerful sense of community and belonging that makes every event unforgettable.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Card className="glass-effect border-[var(--glass-border)] border-[var(--neon-yellow)]/30 inline-block">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center gap-6 flex-wrap text-xl">
                    <div className="flex items-center gap-2">
                      <Clock className="w-6 h-6 text-[var(--neon-yellow)]" />
                      <span className="text-[var(--neon-yellow)]">Stay longer</span>
                    </div>
                    <div className="w-px h-8 bg-[var(--glass-border)]"></div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-6 h-6 text-[var(--neon-cyan)]" />
                      <span className="text-[var(--neon-cyan)]">Dance harder</span>
                    </div>
                    <div className="w-px h-8 bg-[var(--glass-border)]"></div>
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
        <section id="demo" className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl mb-6 text-white">
                See <span className="text-[var(--neon-cyan)]">QRate</span> in Action
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Experience the power of AI-driven music curation
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* QR Check-in Preview */}
              <Card className="glass-effect border-[var(--glass-border)] border-[var(--neon-pink)]/30 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-pink)]/5 to-transparent"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-[var(--neon-pink)]/10">
                      <QrCode className="w-6 h-6 text-[var(--neon-pink)]" />
                    </div>
                    <h3 className="text-xl text-white">Guest Check-In</h3>
                  </div>
                  
                  <div className="bg-[var(--background)]/50 p-6 rounded-xl border border-[var(--glass-border)] mb-4">
                    <div className="aspect-square max-w-[200px] mx-auto mb-4 bg-white p-4 rounded-xl">
                      <div className="w-full h-full bg-gradient-to-br from-[var(--neon-pink)] to-[var(--neon-purple)] rounded-lg flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-white" />
                      </div>
                    </div>
                    <p className="text-center text-gray-400 text-sm">Scan to join the party</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-[var(--neon-pink)]" />
                      <span>Instant Spotify connection</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-[var(--neon-pink)]" />
                      <span>Privacy-first data handling</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-[var(--neon-pink)]" />
                      <span>Seamless user experience</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DJ Dashboard Preview */}
              <Card className="glass-effect border-[var(--glass-border)] border-[var(--neon-cyan)]/30 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-cyan)]/5 to-transparent"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-[var(--neon-cyan)]/10">
                      <BarChart3 className="w-6 h-6 text-[var(--neon-cyan)]" />
                    </div>
                    <h3 className="text-xl text-white">DJ Dashboard</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-[var(--background)]/50 p-4 rounded-xl border border-[var(--glass-border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Crowd Energy</span>
                        <span className="text-[var(--neon-cyan)]">High</span>
                      </div>
                      <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                        <div className="h-full w-4/5 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] rounded-full"></div>
                      </div>
                    </div>

                    <div className="bg-[var(--background)]/50 p-4 rounded-xl border border-[var(--glass-border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Genre Match</span>
                        <span className="text-[var(--neon-pink)]">92%</span>
                      </div>
                      <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                        <div className="h-full w-[92%] bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-yellow)] rounded-full"></div>
                      </div>
                    </div>

                    <div className="bg-[var(--background)]/50 p-4 rounded-xl border border-[var(--glass-border)]">
                      <p className="text-sm text-gray-400 mb-2">Top Recommendation</p>
                      <p className="text-white mb-1">Purple Disco Machine - Emotion</p>
                      <p className="text-xs text-gray-500">Matches 87% of crowd preferences</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <Card className="glass-effect border-[var(--glass-border)] border-[var(--neon-cyan)]/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-pink)]/10 via-[var(--neon-purple)]/10 to-[var(--neon-cyan)]/10"></div>
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--neon-pink)]/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--neon-cyan)]/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
              </div>
              <CardContent className="p-12 text-center relative z-10">
                <h2 className="text-4xl md:text-5xl mb-6 text-white">
                  Ready to Transform Your Events?
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Join the future of music curation. Give your crowd a voice and watch the magic happen.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <Button
                    onClick={onCreateEvent}
                    className="bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-purple)] hover:opacity-90 text-white px-8 py-6 rounded-xl shadow-lg shadow-[var(--neon-pink)]/25 transition-all hover:scale-105 text-lg group"
                  >
                    <Calendar className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Host Your First Event
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    onClick={handleJoinParty}
                    variant="outline"
                    className="border-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] px-8 py-6 rounded-xl text-lg group transition-all"
                  >
                    <QrCode className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Join an Event
                  </Button>
                </div>
                <p className="text-sm text-gray-400">
                  No credit card required • Setup in 5 minutes • Free to try
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 border-t border-[var(--glass-border)]">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div 
                  className="text-2xl mb-4"
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
                <h4 className="text-white mb-4">Product</h4>
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
                <h4 className="text-white mb-4">Company</h4>
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
                <h4 className="text-white mb-4">Get Started</h4>
                <div className="space-y-2">
                  <Button
                    onClick={onCreateEvent}
                    variant="outline"
                    className="w-full border-[var(--glass-border)] hover:border-[var(--neon-pink)]/50 text-gray-300 hover:text-white text-sm justify-start"
                  >
                    Host Event
                  </Button>
                  <Button
                    onClick={handleJoinParty}
                    variant="outline"
                    className="w-full border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/50 text-gray-300 hover:text-white text-sm justify-start"
                  >
                    Join Event
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-[var(--glass-border)] text-center">
              <p className="text-gray-400 text-sm mb-4">
                © 2025 QRate. All rights reserved.
              </p>
              {/* Developer Tools */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSpotifyTest(!showSpotifyTest)}
                  className="text-gray-500 hover:text-gray-400 text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  {showSpotifyTest ? 'Hide' : 'Show'} Spotify Test
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onSpotifyDebug || (() => window.location.hash = '#spotify-debug')}
                  className="text-gray-500 hover:text-gray-400 text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Debug Tool
                </Button>
              </div>
            </div>
          </div>
        </footer>

        {/* Spotify Test Panel */}
        {showSpotifyTest && (
          <div className="fixed bottom-4 right-4 w-96 z-50 animate-slide-in">
            <Card className="glass-effect border-[var(--glass-border)] shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-white">Spotify Test</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSpotifyTest(false)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    ×
                  </Button>
                </div>
                <p className="text-white/80 text-xs mb-3">
                  The Spotify test component has been moved to the debug tool.
                </p>
                <Button 
                  onClick={onSpotifyDebug || (() => window.location.hash = '#spotify-debug')}
                  className="w-full bg-primary hover:bg-primary/90 text-white text-sm"
                  size="sm"
                >
                  Open Debug Tool
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default LandingPage;
