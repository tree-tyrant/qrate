import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ArrowLeft, Plus, QrCode, Users, Music, Calendar, TrendingUp, Edit, Activity, Zap, Star, Clock, Radio, Copy, Check, Share2, ExternalLink, HelpCircle, Download, Trash2, Megaphone, CheckSquare, Settings, ChevronDown, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { AfterpartySummary } from './AfterpartySummary';
import { UpcomingEventMetrics } from './UpcomingEventMetrics';
import { LiveEventMetrics, LiveCrowdAnalytics } from './LiveEventMetrics';
import { TotalUpcomingMetrics } from './TotalUpcomingMetrics';
import TrashedEventsModal from './TrashedEventsModal';
import PromotionModal from './PromotionModal';
import EventChecklistWidget from './EventChecklistWidget';
import SettingsDialog from './SettingsDialog';
import { utils } from '../utils/api';
import { getTopGenres } from '../utils/mockEventData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import synthwaveBg from 'figma:asset/fcb084a313022ebabc4cdd3135dee3f74873b3fe.png';
import logoImage from 'figma:asset/08d0d06dd14cd5a887d78962b507773b63dedad4.png';

interface Event {
  id: string;
  eventName?: string; // Add eventName from backend
  name?: string; // Keep name for compatibility
  eventTheme?: string; // Add eventTheme from backend  
  theme?: string; // Keep theme for compatibility
  eventDescription?: string;
  code: string;
  date: string;
  time: string;
  location?: string;
  status: 'past' | 'live' | 'upcoming';
  guestCount?: number;
  preferences?: Array<{
    userId: string;
    artists: string[];
    genres: string[];
    recentTracks: string[];
  }>;
  connectedPlaylist?: any;
  finalQueue?: any[];
  insights?: any;
  trashedAt?: string;
  eventImage?: string;
}

interface HostDashboardProps {
  currentUser: string;
  userEvents: Event[];
  trashedEvents?: Event[];
  onLogout: () => void;
  onCreateEvent: () => void;
  onViewEvent: (event: Event) => void;
  onEnterDJBooth: (event: Event) => void;
  onEditEvent?: (event: Event) => void;
  onTrashEvent?: (event: Event) => void;
  onRestoreEvent?: (event: Event) => void;
  onPermanentlyDeleteEvent?: (event: Event) => void;
  isLoading?: boolean;
  onRefreshEvents?: () => void;
}

// Generate QR codes dynamically for any event code
function getQRCodeUrl(code: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '?code=' + code)}`;
}

// REMOVED: Demo events are now stored in user accounts via constants.ts
// This prevents duplication and ensures data persistence

function HostDashboard({ currentUser, userEvents, trashedEvents = [], onLogout, onCreateEvent, onViewEvent, onEnterDJBooth, onEditEvent, onTrashEvent, onRestoreEvent, onPermanentlyDeleteEvent, isLoading, onRefreshEvents }: HostDashboardProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedEventForQR, setSelectedEventForQR] = useState<Event | null>(null);
  const [copied, setCopied] = useState(false);
  const [reportEvent, setReportEvent] = useState<Event | null>(null);
  const [trashedModalOpen, setTrashedModalOpen] = useState(false);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [selectedEventForPromotion, setSelectedEventForPromotion] = useState<Event | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'past'>('live');
  
  console.log('🏠 HostDashboard render - reportEvent:', reportEvent?.eventName || reportEvent?.name || 'null');
  console.log('🏠 HostDashboard - currentUser:', currentUser);
  console.log('🏠 HostDashboard - userEvents count:', userEvents?.length || 0);
  console.log('🏠 HostDashboard - userEvents:', userEvents);
  
  // All events now come from user accounts (via constants.ts initialization)
  // No more hardcoded demo events - everything is persisted
  const events = userEvents;

  console.log('🏠 Total events to display:', events?.length || 0);
  console.log('🏠 Events list:', events?.map(e => ({ name: e.eventName || e.name, status: e.status, code: e.code })));

  const pastEvents = events.filter(e => e.status === 'past');
  const liveEvents = events.filter(e => e.status === 'live');
  
  // Sort upcoming events by date (soonest first)
  const upcomingEventsSorted = events
    .filter(e => e.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Limit upcoming events display to 3 initially
  const upcomingEvents = showAllUpcoming ? upcomingEventsSorted : upcomingEventsSorted.slice(0, 3);
  const hasMoreUpcoming = upcomingEventsSorted.length > 3;
  
  console.log('🏠 Past events:', pastEvents.length);
  console.log('🏠 Live events:', liveEvents.length);
  console.log('🏠 Upcoming events (total):', upcomingEventsSorted.length);
  console.log('🏠 Upcoming events (showing):', upcomingEvents.length);

  // Auto-select the most relevant tab based on event availability
  useEffect(() => {
    if (events.length > 0) {
      if (liveEvents.length > 0 && activeTab !== 'live') {
        setActiveTab('live');
      } else if (liveEvents.length === 0 && activeTab === 'live') {
        // If we're on live tab but no live events, switch to upcoming or past
        if (upcomingEventsSorted.length > 0) {
          setActiveTab('upcoming');
        } else if (pastEvents.length > 0) {
          setActiveTab('past');
        }
      }
    } else {
      // No events at all - default to upcoming tab for new users
      if (activeTab !== 'upcoming') {
        setActiveTab('upcoming');
      }
    }
  }, [liveEvents.length, upcomingEventsSorted.length, pastEvents.length, events.length]);

  const handleShowQRCode = (event: Event) => {
    setSelectedEventForQR(event);
    setQrDialogOpen(true);
  };

  const handleCopyUrl = async (eventCode: string) => {
    const guestUrl = `${window.location.origin}?code=${eventCode}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(guestUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = guestUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert(`Copy this URL: ${guestUrl}`);
    }
  };

  const handleShare = async (event: Event) => {
    const guestUrl = `${window.location.origin}?code=${event.code}`;
    try {
      if (navigator.share && navigator.canShare) {
        await navigator.share({
          title: `Join ${event.eventName || event.name}`,
          text: `Share your music preferences for ${event.eventName || event.name}!`,
          url: guestUrl,
        });
      } else {
        await handleCopyUrl(event.code);
      }
    } catch (error) {
      console.error('Share failed:', error);
      await handleCopyUrl(event.code);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'from-green-500 to-emerald-400';
      case 'upcoming': return 'from-blue-500 to-cyan-400';
      case 'past': return 'from-gray-500 to-slate-400';
      default: return 'from-gray-500 to-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'Live Now';
      case 'upcoming': return 'Upcoming';
      case 'past': return 'Past Event';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return <Activity className="w-4 h-4" />;
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'past': return <TrendingUp className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  // Get status-based styling
  const getEventStyling = (status: string) => {
    switch (status) {
      case 'live':
        return {
          container: "group relative overflow-hidden bg-gradient-to-br from-green-900/40 via-green-800/30 to-emerald-900/40 backdrop-blur-sm border-green-500/30 hover:border-green-400/60 hover:bg-gradient-to-br hover:from-green-800/50 hover:via-green-700/40 hover:to-emerald-800/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-slide-in",
          text: "text-white",
          subtext: "text-green-200/80",
          label: "text-green-200/70",
          iconPrimary: "text-emerald-400",
          iconSecondary: "text-green-400",
          codeBox: "bg-green-800/40 backdrop-blur-sm border-green-400/40",
          codeText: "text-green-200/80",
          statGradient: "from-green-500 to-emerald-400",
          buttonOutline: "bg-green-800/40 border-green-400/50 text-white hover:border-green-300/70 hover:bg-green-700/50 backdrop-blur-sm",
          buttonSolid: "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white transition-all duration-300"
        };
      case 'past':
        return {
          container: "group relative overflow-hidden bg-gradient-to-br from-gray-900/40 via-gray-800/30 to-slate-900/40 backdrop-blur-sm border-gray-500/30 hover:border-gray-400/60 hover:bg-gradient-to-br hover:from-gray-800/50 hover:via-gray-700/40 hover:to-slate-800/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-slide-in",
          text: "text-white",
          subtext: "text-gray-200/80",
          label: "text-gray-200/70",
          iconPrimary: "text-slate-400",
          iconSecondary: "text-gray-400",
          codeBox: "bg-gray-800/40 backdrop-blur-sm border-gray-400/40",
          codeText: "text-gray-200/80",
          statGradient: "from-gray-500 to-slate-400",
          buttonOutline: "bg-gray-800/40 border-gray-400/50 text-white hover:border-gray-300/70 hover:bg-gray-700/50 backdrop-blur-sm",
          buttonSolid: "bg-gradient-to-r from-gray-600 to-slate-500 hover:from-gray-700 hover:to-slate-600 text-white transition-all duration-300"
        };
      default: // upcoming
        return {
          container: "group relative overflow-hidden bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-cyan-900/40 backdrop-blur-sm border-blue-500/30 hover:border-blue-400/60 hover:bg-gradient-to-br hover:from-blue-800/50 hover:via-blue-700/40 hover:to-cyan-800/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-slide-in",
          text: "text-white",
          subtext: "text-blue-200/80",
          label: "text-blue-200/70",
          iconPrimary: "text-cyan-400",
          iconSecondary: "text-blue-400",
          codeBox: "bg-blue-800/40 backdrop-blur-sm border-blue-400/40",
          codeText: "text-blue-200/80",
          statGradient: "from-blue-500 to-cyan-400",
          buttonOutline: "bg-blue-800/40 border-blue-400/50 text-white hover:border-blue-300/70 hover:bg-blue-700/50 backdrop-blur-sm",
          buttonSolid: "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white transition-all duration-300"
        };
    }
  };

  const EventCard = ({ event }: { event: Event }) => {
    const styling = getEventStyling(event.status);
    
    return (
    <Card className={`${styling.container} relative`}>
      {/* Status indicator glow - pointer-events none so it doesn't block clicks */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getStatusColor(event.status)} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`} />
      
      <CardHeader onClick={() => onViewEvent(event)} className="pb-[16px] relative z-10 pt-[24px] pr-[24px] pl-[24px]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex gap-4 flex-1">
            {event.eventImage && (
              <div className="flex-shrink-0">
                <ImageWithFallback 
                  src={event.eventImage} 
                  alt={event.eventName || event.name} 
                  className="w-22 h-22 rounded-lg object-cover border border-white/20"
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h3 className={`${styling.text} text-xl font-semibold tracking-tight`}>
                  {event.eventName || event.name}
                </h3>
              {event.status === 'live' && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-400 text-white animate-pulse-neon">
                  <Activity className="w-3 h-3 mr-1" />
                  Live Now
                </Badge>
              )}
            </div>
            
            <div className={`flex items-center gap-2 text-sm ${styling.subtext}`}>
              <Music className={`w-4 h-4 ${styling.iconPrimary}`} />
              <span>{event.eventTheme || event.theme}</span>
            </div>
            
            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 text-sm ${styling.subtext}`}>
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${styling.iconSecondary}`} />
                <span>{new Date(event.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</span>
                <span>at {utils.time.to12Hour(event.time)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1">
                  <span className="text-xs">📍 {event.location}</span>
                </div>
              )}
            </div>
            </div>
          </div>
          
          {/* Event Code */}
          <div className={`${styling.codeBox} p-3 rounded-lg border text-center`}>
            <div className={`text-xs ${styling.codeText} mb-1`}>Event Code</div>
            <div className={`font-mono text-lg font-bold ${styling.text}`}>{event.code}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${styling.statGradient} flex items-center justify-center`}>
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className={`text-sm font-medium ${styling.text}`}>{event.guestCount || 0}</div>
                <div className={`text-xs ${styling.label}`}>Guests</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${styling.statGradient.split(' ').reverse().join(' ')} flex items-center justify-center`}>
                <Music className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className={`text-sm font-medium ${styling.text}`}>{event.preferences?.length || 0}</div>
                <div className={`text-xs ${styling.label}`}>Preferences</div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {event.status === 'past' ? (
              // Past events get Event Summary and Trash buttons
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  className={styling.buttonSolid}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('📊 Event Summary button clicked for event:', event.eventName || event.name);
                    setReportEvent(event);
                  }}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Afterparty Summary
                </Button>
                
                {onTrashEvent && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={styling.buttonOutline}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrashEvent(event);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Trash
                  </Button>
                )}
              </div>
            ) : (
              // Live and upcoming events get full controls in 2x2 grid
              <div className="grid grid-cols-2 gap-2 w-fit">
                {/* Top Row: Promote only */}
                {(event.status === 'upcoming' || event.status === 'live') && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="glass-effect border-pink-500/40 hover:border-pink-400/60 hover:bg-pink-500/10 text-white col-span-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEventForPromotion(event);
                      setPromotionModalOpen(true);
                    }}
                  >
                    <Megaphone className="w-4 h-4 mr-2" />
                    Promote
                  </Button>
                )}
                
                {/* Bottom Row: Edit, DJ Booth */}
                {onEditEvent && (
                  <Button 
                    size="sm" 
                    className="bg-[var(--create-button-purple)] hover:bg-[var(--create-button-purple)]/90 transition-all duration-300 shadow-lg shadow-[var(--create-button-purple)]/20 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  className={styling.buttonSolid}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnterDJBooth(event);
                  }}
                >
                  <Radio className="w-4 h-4 mr-2" />
                  DJ Booth
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Synthwave background image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${synthwaveBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Dark overlay for better readability */}
      <div className="fixed inset-0 z-0 bg-black/60" />
      
      {/* Logo - Top Left - Clickable */}
      <button 
        onClick={onLogout}
        className="fixed top-4 sm:top-8 left-4 sm:left-6 z-20 transition-all duration-300 hover:scale-105 group"
      >
        <img 
          src={logoImage} 
          alt="QRate Logo" 
          className="h-10 sm:h-14 w-auto group-hover:drop-shadow-[0_0_10px_rgba(255,0,110,0.5)]"
        />
      </button>

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Header with enhanced design */}
        <div className="border-b border-border/50 bg-gradient-to-r from-background/60 via-background/50 to-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6 ml-16 sm:ml-20 lg:ml-32 mt-2 sm:mt-0">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--host-title-blue)]">
                  Host Dashboard
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Welcome back, <span className="text-accent font-medium">{currentUser}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                variant="outline"
                onClick={() => setHelpOpen(true)}
                className="glass-effect border-border/30 hover:border-[var(--neon-yellow)]/50 transition-all duration-300"
                size="lg"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setSettingsOpen(true)}
                className="glass-effect border-border/30 hover:border-accent/50 transition-all duration-300"
                size="lg"
              >
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
              
              <Button 
                onClick={onCreateEvent} 
                className="bg-[var(--create-button-purple)] hover:bg-[var(--create-button-purple)]/90 transition-all duration-300 shadow-lg shadow-[var(--create-button-purple)]/20 text-white"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            </div>
          </div>
        </div>
      </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8 px-[24px] py-[0px]">
          <div className="grid grid-cols-1 gap-8">
            {/* Main Events */}
            <div className="space-y-8">

        {/* Enhanced Stats Overview - Only show for Past Events */}
        {activeTab === 'past' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Card className="relative glass-effect border-primary/30 hover:border-primary/60 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div className="text-xs uppercase tracking-wider text-primary/70">All Time</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{events.length}</div>
                    <div className="text-xs text-muted-foreground">Total Events</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Card className="relative glass-effect border-green-500/30 hover:border-green-500/60 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    <div className="text-xs uppercase tracking-wider text-green-400/70">Active Now</div>
                  </div>
                  <div className="space-y-1">
                    <div className="relative inline-block">
                      <div className="text-3xl font-bold text-green-400">{liveEvents.length}</div>
                      {liveEvents.length > 0 && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />}
                    </div>
                    <div className="text-xs text-muted-foreground">Live Events</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-cyan-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Card className="relative glass-effect border-accent/30 hover:border-accent/60 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Users className="w-5 h-5 text-accent" />
                    <div className="text-xs uppercase tracking-wider text-accent/70">All Events</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-accent">{events.reduce((sum, e) => sum + (e.guestCount || 0), 0)}</div>
                    <div className="text-xs text-muted-foreground">Total Guests</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Card className="relative glass-effect border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div className="text-xs uppercase tracking-wider text-blue-400/70">Scheduled</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-blue-400">{upcomingEventsSorted.length}</div>
                    <div className="text-xs text-muted-foreground">Upcoming</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Empty State - Show when no events in current tab (above tabs, not on past tab) */}
        {(activeTab === 'live' && liveEvents.length === 0 || activeTab === 'upcoming' && upcomingEventsSorted.length === 0) && (
          <Card className="bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-cyan-900/40 backdrop-blur-sm border-dashed border-blue-400/40 mb-6">
            <CardContent className="text-center py-8">
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center animate-float">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Create Your First Event</h3>
                  <p className="text-blue-200/80 max-w-md mx-auto">
                    Start your musical journey by creating an event. Let your guests share their preferences and create the perfect playlist together.
                  </p>
                </div>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white transition-all duration-300 mt-4"
                  onClick={onCreateEvent}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Event
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Upcoming Metrics - Show when on Upcoming tab with upcoming events */}
        {activeTab === 'upcoming' && upcomingEventsSorted.length > 0 && (
          <div className="mb-6">
            <TotalUpcomingMetrics events={upcomingEventsSorted} />
          </div>
        )}

        {/* Events Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'live' | 'upcoming' | 'past')}
          className="space-y-6"
        >
          <TabsList className="glass-effect border-border/50 p-1 grid w-full grid-cols-3">
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Live
              {liveEvents.length > 0 && (
                <Badge className="ml-2 bg-green-400 text-black">{liveEvents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <Clock className="w-4 h-4 mr-2" />
              Upcoming
              {upcomingEventsSorted.length > 0 && (
                <Badge className="ml-2 bg-blue-400 text-black">{upcomingEventsSorted.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="past"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-600 data-[state=active]:to-slate-500 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Past
              {pastEvents.length > 0 && (
                <Badge className="ml-2 bg-gray-400 text-black">{pastEvents.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Live Events Tab */}
          <TabsContent value="live" className="space-y-4 m-0">
            {liveEvents.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Events List - Left Side */}
                <div className="lg:col-span-2 space-y-4">
                  {liveEvents.map((event, index) => (
                    <div key={event.id} style={{ animationDelay: `${index * 0.1}s` }}>
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>

                {/* Live Crowd Profile - Right Side */}
                <div className="lg:col-span-1">
                  <Card className="glass-effect border-purple-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-purple-400 text-base flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Live Crowd Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-purple-200/60 mb-3">
                        Top 3 genres currently represented at the event
                      </p>
                      
                      {(() => {
                        const topGenres = getTopGenres(liveEvents[0].preferences || [], 3);
                        return topGenres.map((genre, index) => (
                          <div 
                            key={genre}
                            className="flex items-center gap-3 p-2.5 rounded-lg glass-effect border border-purple-400/20 hover:border-purple-400/40 transition-all"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                              index === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                              'bg-gradient-to-br from-blue-500 to-cyan-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">{genre}</div>
                              <div className="text-xs text-purple-200/50">
                                {index === 0 ? 'Most popular' : index === 1 ? 'Strong presence' : 'Growing'}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="glass-effect border-border/50">
                <CardContent className="text-center py-12">
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">No Live Events</h3>
                      <p className="text-sm text-muted-foreground">
                        Your active events will appear here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Upcoming Events Tab */}
          <TabsContent value="upcoming" className="space-y-4 m-0">
            {upcomingEventsSorted.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Upcoming Events List - Left Side */}
                  <div className="lg:col-span-2 space-y-4">
                    {upcomingEvents.map((event, index) => (
                      <div key={event.id} style={{ animationDelay: `${index * 0.1}s` }}>
                        <EventCard event={event} />
                      </div>
                    ))}
                  </div>

                  {/* Soonest Upcoming Event Metrics - Right Side */}
                  <div className="lg:col-span-1">
                    <UpcomingEventMetrics event={upcomingEventsSorted[0]} />
                  </div>
                </div>
                
                {/* Load More Button */}
                {hasMoreUpcoming && !showAllUpcoming && (
                  <div className="flex justify-center pt-2">
                    <Button
                      onClick={() => setShowAllUpcoming(true)}
                      variant="outline"
                      className="glass-effect border-blue-400/40 hover:border-blue-400/60 hover:bg-blue-400/10 text-blue-400"
                    >
                      Load More ({upcomingEventsSorted.length - 3} more)
                    </Button>
                  </div>
                )}
                
                {/* Show Less Button */}
                {showAllUpcoming && hasMoreUpcoming && (
                  <div className="flex justify-center pt-2">
                    <Button
                      onClick={() => setShowAllUpcoming(false)}
                      variant="outline"
                      className="glass-effect border-blue-400/40 hover:border-blue-400/60 hover:bg-blue-400/10 text-blue-400"
                    >
                      Show Less
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="glass-effect border-border/50">
                <CardContent className="text-center py-12">
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">No Upcoming Events</h3>
                      <p className="text-sm text-muted-foreground">
                        Create your next event to get started
                      </p>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white transition-all duration-300 mt-4"
                      onClick={onCreateEvent}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Past Events Tab */}
          <TabsContent value="past" className="space-y-4 m-0">
            {pastEvents.length > 0 ? (
              <div className="space-y-4">
                {pastEvents.map((event, index) => (
                  <div key={event.id} style={{ animationDelay: `${index * 0.1}s` }}>
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="glass-effect border-border/50">
                <CardContent className="text-center py-12">
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">No Past Events</h3>
                      <p className="text-sm text-muted-foreground">
                        Your completed events will appear here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Trashed Events Link */}
        {trashedEvents.length > 0 && (
          <div className="text-center mt-8 pb-4">
            <button
              onClick={() => setTrashedModalOpen(true)}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors duration-200 flex items-center gap-2 mx-auto group"
            >
              <Trash2 className="w-4 h-4 group-hover:animate-pulse" />
              <span className="underline underline-offset-2">
                Trashed Events ({trashedEvents.length})
              </span>
            </button>
          </div>
        )}
        {/* End Events Tabs */}
            </div>
            {/* End Left Column */}

            {/* Right Column - Removed Toolkit */}
            
          </div>
        </div>
      </div>

      {/* QR Code Dialog - Enhanced DJ Dashboard Style */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="glass-effect border-primary/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text text-3xl mb-2">Event QR Code</DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              Share this QR code with guests to join{' '}
              {selectedEventForQR && (selectedEventForQR.eventName || selectedEventForQR.name)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEventForQR && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-4">
              {/* Left Column - Event Info & QR Code */}
              <div className="space-y-6">
                {/* Event Header */}
                <div className="space-y-4">
                  <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                    Event Code: {selectedEventForQR.code}
                  </Badge>
                  
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-primary" />
                      <span>{selectedEventForQR.eventTheme || selectedEventForQR.theme}</span>
                    </div>
                    {selectedEventForQR.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span>
                          {new Date(selectedEventForQR.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                          {selectedEventForQR.time && ` at ${selectedEventForQR.time}`}
                        </span>
                      </div>
                    )}
                    {selectedEventForQR.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{selectedEventForQR.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Card */}
                <Card className="glass-effect border-primary/30 hover:border-primary/60 transition-all duration-300 overflow-hidden relative group">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardHeader className="text-center relative z-10">
                    <CardTitle className="text-white flex items-center justify-center gap-2">
                      <QrCode className="w-5 h-5 text-primary" />
                      Guest QR Code
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Guests scan this to share their music preferences
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 relative z-10">
                    {/* QR Code */}
                    <div className="bg-white p-6 rounded-xl mx-auto w-fit">
                      <img 
                        src={mockQRCodes[selectedEventForQR.code] || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '?code=' + selectedEventForQR.code)}`}
                        alt="Event QR Code" 
                        className="w-64 h-64 mx-auto"
                      />
                    </div>
                    
                    {/* Share Link Section */}
                    <div className="space-y-4">
                      <p className="text-sm text-center text-muted-foreground">
                        Or share this link directly:
                      </p>
                      
                      <div className="glass-effect p-3 rounded-lg border border-border/30">
                        <p className="text-xs text-foreground/90 break-all font-mono text-center">
                          {window.location.origin}?code={selectedEventForQR.code}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleCopyUrl(selectedEventForQR.code)}
                          variant="outline" 
                          className="flex-1 glass-effect border-primary/40 text-white hover:bg-primary/20 hover:border-primary/60 transition-all duration-300"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          onClick={() => handleShare(selectedEventForQR)}
                          variant="outline" 
                          className="flex-1 glass-effect border-accent/40 text-white hover:bg-accent/20 hover:border-accent/60 transition-all duration-300"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Instructions & Stats */}
              <div className="space-y-6">
                {/* Instructions Card */}
                <Card className="glass-effect border-accent/30 hover:border-accent/60 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-white">How Guests Use This</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Simple steps for your guests
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                          1
                        </div>
                        <div>
                          <p className="text-white font-medium">Scan QR Code</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Use phone camera to scan the code above
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                          2
                        </div>
                        <div>
                          <p className="text-white font-medium">Connect Account</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Link Spotify or enter preferences manually
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                          3
                        </div>
                        <div>
                          <p className="text-white font-medium">Share Preferences</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Tell us about their music taste
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                          4
                        </div>
                        <div>
                          <p className="text-white font-medium">Enjoy the Party!</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            AI creates the perfect playlist for everyone
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Card */}
                <Card className="glass-effect border-border/30">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl gradient-text mb-1">
                          {selectedEventForQR.guestCount || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Guests Joined</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl gradient-text mb-1">
                          {selectedEventForQR.preferences?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Preferences</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips Card */}
                <div className="glass-effect p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                  <p className="text-sm text-muted-foreground">
                    💡 <span className="font-semibold text-white">Pro Tip:</span> Display this QR code at your venue entrance and on tables for maximum guest participation!
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Afterparty Summary Modal */}
      {reportEvent && (
        <AfterpartySummary 
          event={reportEvent} 
          onClose={() => {
            console.log('🎉 Closing afterparty summary');
            setReportEvent(null);
          }} 
        />
      )}

      {/* Trashed Events Modal */}
      <TrashedEventsModal
        open={trashedModalOpen}
        onClose={() => setTrashedModalOpen(false)}
        trashedEvents={trashedEvents}
        onRestoreEvent={(event) => {
          if (onRestoreEvent) {
            onRestoreEvent(event);
            setTrashedModalOpen(false);
          }
        }}
        onPermanentDelete={onPermanentlyDeleteEvent}
      />

      {/* Promotion Modal */}
      <PromotionModal
        open={promotionModalOpen}
        onClose={() => setPromotionModalOpen(false)}
        event={selectedEventForPromotion}
      />

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="glass-effect border-[var(--neon-yellow)]/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--neon-yellow)]/20 to-[var(--neon-yellow)]/10">
                <HelpCircle className="w-6 h-6 text-[var(--neon-yellow)]" />
              </div>
              Tips for a Successful Event
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Make the most out of QRate for your events
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="glass-effect p-4 rounded-lg border border-border/30">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-purple)] flex items-center justify-center text-white flex-shrink-0 text-xs">1</div>
                  <div>
                    <div className="font-semibold text-white mb-1">Promote Early</div>
                    <p className="text-sm text-muted-foreground">Share your event link and QR code ahead of time to collect more guest preferences before the event starts.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] flex items-center justify-center text-white flex-shrink-0 text-xs">2</div>
                  <div>
                    <div className="font-semibold text-white mb-1">Use QR Codes Everywhere</div>
                    <p className="text-sm text-muted-foreground">Display QR code flyers on tables, posters, and entrance areas for easy guest access.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] flex items-center justify-center text-white flex-shrink-0 text-xs">3</div>
                  <div>
                    <div className="font-semibold text-white mb-1">Connect Spotify Early</div>
                    <p className="text-sm text-muted-foreground">Link your Spotify playlist before the event to enable seamless music integration in the DJ Booth.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-cyan)] flex items-center justify-center text-white flex-shrink-0 text-xs">4</div>
                  <div>
                    <div className="font-semibold text-white mb-1">Monitor the DJ Booth</div>
                    <p className="text-sm text-muted-foreground">Check real-time recommendations and guest analytics in the DJ Booth to keep the energy high.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="glass-effect p-3 rounded-lg border border-[var(--neon-yellow)]/20 bg-[var(--neon-yellow)]/5">
              <p className="text-xs text-center text-muted-foreground">
                <span className="text-[var(--neon-yellow)] font-semibold">Pro Tip:</span> The more guests that share their preferences, the better QRate's AI can personalize the playlist!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userType="host"
        username={currentUser}
        onLogout={onLogout}
      />
    </div>
  );
}

export default HostDashboard;