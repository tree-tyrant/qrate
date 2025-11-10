import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ArrowLeft, Plus, QrCode, Users, Music, Calendar, TrendingUp, Edit, Activity, Zap, Star, Clock, Radio, Copy, Check, Share2, ExternalLink, HelpCircle, Download, Trash2, Megaphone, CheckSquare, Settings, ChevronDown, MapPin, Search, SlidersHorizontal, Sparkles, BarChart3, ShieldCheck, LineChart, DollarSign } from 'lucide-react';
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
import synthwaveBg from '../assets/hostbackground.png';
import logoImage from '../assets/qrate_title.png';
import { getSupabaseClient, isSupabaseConfigured } from '@/supabase/client';
import { fetchMarketplaceProfiles, type MarketplaceFilterParams } from '@/services/marketplaceService';
import type { Event as QRateEvent } from '@/utils/types';

type DashboardEvent = QRateEvent & {
  name?: string;
  theme?: string;
  connectedPlaylist?: unknown;
  finalQueue?: unknown;
  insights?: unknown;
};

type PriceTier = 'entry' | 'mid' | 'premium';
type AvailabilityOption = 'Weekend' | 'Weeknight' | 'Short Notice';

type MarketplaceVibeSpecialization = {
  label: string;
  percent: number;
};

type MarketplaceHighlight = {
  title: string;
  detail: string;
};

type MarketplaceCrowdStats = {
  guestConnection: string;
  tipVolume: string;
  playlistScore: string;
};

interface MarketplaceDJProfile {
  id: string;
  name: string;
  location: string;
  priceTier: PriceTier;
  priceRange: string;
  vibeMatchScore: number;
  overallScore: number;
  engagementRating: number;
  vibeSpecializations: MarketplaceVibeSpecialization[];
  eventTypes: string[];
  demographicFocus: string[];
  availability: AvailabilityOption[];
  crowdStats: MarketplaceCrowdStats;
  featuredHighlights: MarketplaceHighlight[];
  vibeKeywords: string[];
  profileImage?: string;
  nextAvailable: string;
  responseTime: string;
}

const MARKETPLACE_DJS: MarketplaceDJProfile[] = [
  {
    id: 'dj-ember',
    name: 'DJ Ember',
    location: 'Atlanta, GA',
    priceTier: 'mid',
    priceRange: '$800 - $1,200',
    vibeMatchScore: 92,
    overallScore: 4.8,
    engagementRating: 4.7,
    vibeSpecializations: [
      { label: 'Modern Pop', percent: 38 },
      { label: 'R&B', percent: 27 },
      { label: 'Throwback Hits', percent: 20 },
      { label: 'House', percent: 15 }
    ],
    eventTypes: ['Corporate', 'College', 'Nightlife'],
    demographicFocus: ['College', '25-35 Young Professionals'],
    availability: ['Weekend', 'Weeknight'],
    crowdStats: {
      guestConnection: '68% of guests connect',
      tipVolume: 'Top 10% in tips',
      playlistScore: '4.7 / 5 playlist rating'
    },
    featuredHighlights: [
      { title: 'Alpha Chi Mixer', detail: 'Vibe Match 95 · Crowd Score 4.9' },
      { title: 'Tech Summit Afterparty', detail: 'Tip volume 2.3× market average' }
    ],
    vibeKeywords: ['High Energy', 'Interactive MC', 'Trend-Aware'],
    profileImage: 'https://images.unsplash.com/photo-1544785349-c4a5301826fd?auto=format&fit=crop&w=320&q=80',
    nextAvailable: 'Mar 22 · Weekend evenings',
    responseTime: 'Replies within 2 hours'
  },
  {
    id: 'dj-nova',
    name: 'DJ Nova',
    location: 'Charlotte, NC',
    priceTier: 'premium',
    priceRange: '$1,400 - $2,000',
    vibeMatchScore: 88,
    overallScore: 4.9,
    engagementRating: 4.8,
    vibeSpecializations: [
      { label: 'Deep House', percent: 32 },
      { label: 'Modern Pop', percent: 26 },
      { label: 'Future Bass', percent: 22 },
      { label: 'Alt R&B', percent: 20 }
    ],
    eventTypes: ['Corporate', 'Luxury Wedding', 'Brand Activations'],
    demographicFocus: ['25-35 Young Professionals', 'Executive Retreats'],
    availability: ['Weekend', 'Short Notice'],
    crowdStats: {
      guestConnection: '72% of guests connect',
      tipVolume: 'Top 5% in premium gigs',
      playlistScore: '4.9 / 5 curated sets'
    },
    featuredHighlights: [
      { title: 'Fortune 100 Tech Summit', detail: 'Engagement 96 · Dance floor active 3.5 hrs' },
      { title: 'Luxury Wedding (Napa)', detail: 'Vibe Match 90 · 62 curated requests' }
    ],
    vibeKeywords: ['Luxury Friendly', 'Seamless Transitions', 'Data-Driven Curation'],
    profileImage: 'https://images.unsplash.com/photo-1521337580396-0259d4d29b9b?auto=format&fit=crop&w=320&q=80',
    nextAvailable: 'Apr 6 · Select Fridays',
    responseTime: 'Replies within 4 hours'
  },
  {
    id: 'dj-rhythm',
    name: 'DJ Rhythm',
    location: 'Athens, GA',
    priceTier: 'entry',
    priceRange: '$450 - $700',
    vibeMatchScore: 84,
    overallScore: 4.6,
    engagementRating: 4.4,
    vibeSpecializations: [
      { label: '90s Hip-Hop', percent: 35 },
      { label: 'Throwback Party', percent: 30 },
      { label: 'Afrobeats', percent: 20 },
      { label: 'Latin Pop', percent: 15 }
    ],
    eventTypes: ['College', 'Greek Life', 'Community Events'],
    demographicFocus: ['College', 'Family-Friendly'],
    availability: ['Weeknight', 'Weekend'],
    crowdStats: {
      guestConnection: '61% of guests connect',
      tipVolume: 'Top 20% in college gigs',
      playlistScore: '4.5 / 5 vibe rating'
    },
    featuredHighlights: [
      { title: 'Fraternity Homecoming', detail: 'Vibe Match 88 · Requests responded in 90 sec' },
      { title: 'City Spring Fest', detail: 'Family-friendly + Afterhours remix set' }
    ],
    vibeKeywords: ['Budget Friendly', 'Crowd Requests', 'High Interaction'],
    profileImage: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=320&q=80',
    nextAvailable: 'Mar 15 · Weeknights open',
    responseTime: 'Replies within 1 hour'
  }
];

type PriceFilterOption = 'any' | PriceTier;
type AvailabilityFilterOption = 'any' | AvailabilityOption;
type EngagementFilterOption = 'any' | '4.0+' | '4.5+' | '4.8+';

interface MarketplaceFilters {
  location: string;
  price: PriceFilterOption;
  availability: AvailabilityFilterOption;
  eventType: string;
  vibe: string;
  engagement: EngagementFilterOption;
  demographic: string;
  vibeMatch: number;
}

const INITIAL_MARKETPLACE_FILTERS: MarketplaceFilters = {
  location: '',
  price: 'any',
  availability: 'any',
  eventType: 'any',
  vibe: 'any',
  engagement: 'any',
  demographic: 'any',
  vibeMatch: 75,
};

interface HostDashboardProps {
  currentUser: string;
  userEvents: DashboardEvent[];
  trashedEvents?: DashboardEvent[];
  onLogout: () => void;
  onCreateEvent: () => void;
  onViewEvent: (event: QRateEvent) => void;
  onEnterDJBooth: (event: QRateEvent) => void;
  onEditEvent?: (event: QRateEvent) => void;
  onTrashEvent?: (event: QRateEvent) => void;
  onRestoreEvent?: (event: QRateEvent) => void;
  onPermanentlyDeleteEvent?: (event: QRateEvent) => void;
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
  const [selectedEventForQR, setSelectedEventForQR] = useState<DashboardEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const [reportEvent, setReportEvent] = useState<DashboardEvent | null>(null);
  const [trashedModalOpen, setTrashedModalOpen] = useState(false);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [selectedEventForPromotion, setSelectedEventForPromotion] = useState<DashboardEvent | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'past'>('live');
  const [dashboardView, setDashboardView] = useState<'events' | 'find-djs'>('events');
  const [marketplaceFilters, setMarketplaceFilters] = useState<MarketplaceFilters>(INITIAL_MARKETPLACE_FILTERS);
  const [liveMarketplace, setLiveMarketplace] = useState<MarketplaceDJProfile[] | null>(null);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  
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
    if (dashboardView !== 'events') {
      return;
    }

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
  }, [dashboardView, liveEvents.length, upcomingEventsSorted.length, pastEvents.length, events.length, activeTab]);

  const eventTypeOptions = useMemo(() => Array.from(new Set(MARKETPLACE_DJS.flatMap(dj => dj.eventTypes))).sort(), []);
  const vibeOptions = useMemo(() => Array.from(new Set(MARKETPLACE_DJS.flatMap(dj => dj.vibeSpecializations.map(v => v.label)))).sort(), []);
  const demographicOptions = useMemo(() => Array.from(new Set(MARKETPLACE_DJS.flatMap(dj => dj.demographicFocus))).sort(), []);
  const availabilityOptions = useMemo(() => Array.from(new Set(MARKETPLACE_DJS.flatMap(dj => dj.availability))), []);

  const filteredMarketplaceDJs = useMemo(() => {
    const source = (liveMarketplace && liveMarketplace.length > 0) ? liveMarketplace : MARKETPLACE_DJS;
    return source.filter(dj => {
      if (marketplaceFilters.location && !dj.location.toLowerCase().includes(marketplaceFilters.location.toLowerCase())) {
        return false;
      }
      if (marketplaceFilters.price !== 'any' && dj.priceTier !== marketplaceFilters.price) {
        return false;
      }
      if (marketplaceFilters.eventType !== 'any' && !dj.eventTypes.includes(marketplaceFilters.eventType)) {
        return false;
      }
      if (marketplaceFilters.vibe !== 'any' && !dj.vibeSpecializations.some(v => v.label === marketplaceFilters.vibe)) {
        return false;
      }
      if (marketplaceFilters.demographic !== 'any' && !dj.demographicFocus.includes(marketplaceFilters.demographic)) {
        return false;
      }
      if (marketplaceFilters.availability !== 'any' && !dj.availability.includes(marketplaceFilters.availability as AvailabilityOption)) {
        return false;
      }
      if (dj.vibeMatchScore < marketplaceFilters.vibeMatch) {
        return false;
      }
      if (marketplaceFilters.engagement !== 'any') {
        const threshold = parseFloat(marketplaceFilters.engagement);
        if (dj.engagementRating < threshold) {
          return false;
        }
      }
      return true;
    });
  }, [marketplaceFilters, liveMarketplace]);

  const marketplaceMatches = filteredMarketplaceDJs.length;
  const topMarketplaceMatch = filteredMarketplaceDJs.reduce<MarketplaceDJProfile | null>((best, current) => {
    if (!best || current.vibeMatchScore > best.vibeMatchScore) {
      return current;
    }
    return best;
  }, null);
  const averageMarketplaceEngagement = filteredMarketplaceDJs.length
    ? filteredMarketplaceDJs.reduce((sum, dj) => sum + dj.engagementRating, 0) / filteredMarketplaceDJs.length
    : 0;

  const updateMarketplaceFilter = <K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) => {
    setMarketplaceFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetMarketplaceFilters = () => setMarketplaceFilters(INITIAL_MARKETPLACE_FILTERS);
  const priceOptions: Array<{ value: PriceFilterOption; label: string }> = [
    { value: 'any', label: 'Any budget' },
    { value: 'entry', label: 'Entry · $400 - $750' },
    { value: 'mid', label: 'Mid · $750 - $1,200' },
    { value: 'premium', label: 'Premium · $1.2k+' }
  ];
  const engagementOptions: EngagementFilterOption[] = ['any', '4.0+', '4.5+', '4.8+'];

  const handleShowQRCode = (event: DashboardEvent) => {
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

  const handleShare = async (event: DashboardEvent) => {
    const guestUrl = `${window.location.origin}?code=${event.code}`;
    const shareData = {
      title: `Join ${event.eventName || event.name}`,
      text: `Share your music preferences for ${event.eventName || event.name}!`,
      url: guestUrl,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
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

  const EventCard = ({ event }: { event: DashboardEvent }) => {
    const styling = getEventStyling(event.status);
    
    return (
    <Card className={`${styling.container} relative`}>
      {/* Status indicator glow - pointer-events none so it doesn't block clicks */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getStatusColor(event.status)} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`} />
      
      <CardHeader onClick={() => onViewEvent(event)} className="z-10 relative pt-[24px] pr-[24px] pb-[16px] pl-[24px]">
        <div className="flex sm:flex-row flex-col justify-between sm:items-start gap-4">
          <div className="flex flex-1 gap-4">
            {event.eventImage && (
              <div className="flex-shrink-0">
                <ImageWithFallback 
                  src={event.eventImage} 
                  alt={event.eventName || event.name} 
                  className="border border-white/20 rounded-lg w-22 h-22 object-cover"
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
                  <Activity className="mr-1 w-3 h-3" />
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
      
      <CardContent className="z-10 relative">
        <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-4">
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
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    console.log('📊 Event Summary button clicked for event:', event.eventName || event.name);
                    setReportEvent(event);
                  }}
                >
                  <TrendingUp className="mr-2 w-4 h-4" />
                  Afterparty Summary
                </Button>
                
                {onTrashEvent && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={styling.buttonOutline}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      onTrashEvent(event);
                    }}
                  >
                    <Trash2 className="mr-2 w-4 h-4" />
                    Trash
                  </Button>
                )}
              </div>
            ) : (
              // Live and upcoming events get full controls in 2x2 grid
              <div className="gap-2 grid grid-cols-2 w-fit">
                {/* Top Row: Promote only */}
                {(event.status === 'upcoming' || event.status === 'live') && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="col-span-2 hover:bg-pink-500/10 border-pink-500/40 hover:border-pink-400/60 text-white glass-effect"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      setSelectedEventForPromotion(event);
                      setPromotionModalOpen(true);
                    }}
                  >
                    <Megaphone className="mr-2 w-4 h-4" />
                    Promote
                  </Button>
                )}
                
                {/* Bottom Row: Edit, DJ Booth */}
                {onEditEvent && (
                  <Button 
                    size="sm" 
                    className="bg-[var(--create-button-purple)] hover:bg-[var(--create-button-purple)]/90 shadow-[var(--create-button-purple)]/20 shadow-lg text-white transition-all duration-300"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                  >
                    <Edit className="mr-2 w-4 h-4" />
                    Edit
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  className={styling.buttonSolid}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    onEnterDJBooth(event);
                  }}
                >
                  <Radio className="mr-2 w-4 h-4" />
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Synthwave background image */}
      <div 
        className="z-0 fixed inset-0"
        style={{
          backgroundImage: `url(${synthwaveBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Dark overlay for better readability */}
      <div className="z-0 fixed inset-0 bg-black/60" />
      
      {/* Logo - Top Left - Clickable */}
      <button 
        onClick={onLogout}
        className="group top-4 sm:top-8 left-4 sm:left-6 z-20 fixed hover:scale-105 transition-all duration-300"
      >
        <img 
          src={logoImage} 
          alt="QRate Logo" 
          className="group-hover:drop-shadow-[0_0_10px_rgba(255,0,110,0.5)] w-auto h-10 sm:h-14"
        />
      </button>

      {/* Content wrapper */}
      <div className="z-10 relative">
        {/* Header with enhanced design */}
        <div className="bg-gradient-to-r from-background/60 via-background/50 to-background/60 backdrop-blur-sm border-border/50 border-b">
        <div className="mx-auto px-4 sm:px-6 py-4 sm:py-6 container">
          <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 sm:gap-6 mt-2 sm:mt-0 ml-16 sm:ml-20 lg:ml-32">
              <div className="space-y-1">
                <h1 className="font-bold text-[var(--host-title-blue)] text-xl sm:text-2xl lg:text-3xl">
                  Host Dashboard
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Welcome back, <span className="font-medium text-accent">{currentUser}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                variant="outline"
                onClick={() => setHelpOpen(true)}
                className="border-border/30 hover:border-[var(--neon-yellow)]/50 transition-all duration-300 glass-effect"
                size="lg"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setSettingsOpen(true)}
                className="border-border/30 hover:border-accent/50 transition-all duration-300 glass-effect"
                size="lg"
              >
                <Settings className="mr-2 w-5 h-5" />
                Settings
              </Button>
              
              <Button 
                onClick={onCreateEvent} 
                className="bg-[var(--create-button-purple)] hover:bg-[var(--create-button-purple)]/90 shadow-[var(--create-button-purple)]/20 shadow-lg text-white transition-all duration-300"
                size="lg"
              >
                <Plus className="mr-2 w-5 h-5" />
                Create Event
              </Button>
            </div>
          </div>
        </div>
      </div>

        <div className="mx-auto px-[24px] px-6 py-[0px] py-8 container">
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 mb-8">
            <div className="inline-flex bg-background/60 p-1 border border-border/50 rounded-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDashboardView('events')}
                className={`rounded-full px-4 text-sm transition-colors ${dashboardView === 'events' ? 'bg-primary text-black hover:bg-primary/90' : 'text-muted-foreground hover:text-white'}`}
              >
                My Events
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDashboardView('find-djs')}
                className={`rounded-full px-4 text-sm transition-colors ${dashboardView === 'find-djs' ? 'bg-primary text-black hover:bg-primary/90' : 'text-muted-foreground hover:text-white'}`}
              >
                Find DJs
              </Button>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {dashboardView === 'find-djs'
                ? 'Browse verified QRate DJs with live performance data.'
                : 'Monitor your events, engagement metrics, and guest activity.'}
            </p>
          </div>

          <div className={`${dashboardView === 'find-djs' ? '' : 'hidden'} space-y-6`}>
            <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-primary/30 glass-effect">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-1 text-primary/80 text-xs">
                    <span>Matches</span>
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-white text-3xl">{marketplaceMatches}</div>
                  <p className="mt-1 text-muted-foreground text-xs">Marketplace DJs fit your filters</p>
                </CardContent>
              </Card>
              <Card className="border-accent/30 glass-effect">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-1 text-accent/80 text-xs">
                    <span>Avg. Engagement</span>
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-white text-3xl">{averageMarketplaceEngagement.toFixed(1)}</div>
                  <p className="mt-1 text-muted-foreground text-xs">Average crowd rating across matches</p>
                </CardContent>
              </Card>
              <Card className="border-purple-400/40 glass-effect">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-1 text-purple-200 text-xs">
                    <span>Top vibe match</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-white text-3xl">
                    {topMarketplaceMatch ? `${topMarketplaceMatch.vibeMatchScore}%` : '--'}
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {topMarketplaceMatch ? `${topMarketplaceMatch.name} · ${topMarketplaceMatch.priceRange}` : 'Adjust filters to surface additional matches.'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="gap-6 grid lg:grid-cols-[320px_1fr]">
              <Card className="border-border/40 glass-effect">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    Marketplace filters
                  </CardTitle>
                  <CardDescription>Use QRate analytics to pinpoint the right DJ for your crowd.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="filter-location">Location</Label>
                    <Input
                      id="filter-location"
                      placeholder="City, region, or keyword"
                      value={marketplaceFilters.location}
                      onChange={(event) => updateMarketplaceFilter('location', event.target.value)}
                    />
                  </div>

                  <div className="gap-4 grid sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Price range</Label>
                      <Select value={marketplaceFilters.price} onValueChange={(value: string) => updateMarketplaceFilter('price', value as PriceFilterOption)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any budget" />
                        </SelectTrigger>
                        <SelectContent>
                          {priceOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Availability</Label>
                      <Select value={marketplaceFilters.availability} onValueChange={(value: string) => updateMarketplaceFilter('availability', value as AvailabilityFilterOption)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any availability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any availability</SelectItem>
                          {availabilityOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="gap-4 grid sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Event type</Label>
                      <Select value={marketplaceFilters.eventType} onValueChange={(value: string) => updateMarketplaceFilter('eventType', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any event type</SelectItem>
                          {eventTypeOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Target demographic</Label>
                      <Select value={marketplaceFilters.demographic} onValueChange={(value: string) => updateMarketplaceFilter('demographic', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any audience</SelectItem>
                          {demographicOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Vibe specialization</Label>
                    <Select value={marketplaceFilters.vibe} onValueChange={(value: string) => updateMarketplaceFilter('vibe', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any vibe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any vibe</SelectItem>
                        {vibeOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Crowd engagement rating</Label>
                    <Select value={marketplaceFilters.engagement} onValueChange={(value: string) => updateMarketplaceFilter('engagement', value as EngagementFilterOption)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All ratings" />
                      </SelectTrigger>
                      <SelectContent>
                        {engagementOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option === 'any' ? 'All ratings' : `${option} crowd engagement`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Minimum vibe match score</Label>
                    <Slider
                      value={[marketplaceFilters.vibeMatch]}
                      min={60}
                      max={100}
                      step={1}
                      onValueChange={(value: number[]) => updateMarketplaceFilter('vibeMatch', Math.round(value[0]))}
                    />
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>60%</span>
                      <span>{marketplaceFilters.vibeMatch}%+</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    QRate verifies crowd data after every gig — hosts see proof, not promises.
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-primary/10 border border-border/40 hover:border-primary/40 w-full text-muted-foreground"
                    onClick={resetMarketplaceFilters}
                  >
                    Reset filters
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {filteredMarketplaceDJs.map(dj => (
                  <Card key={dj.id} className="border-border/40 glass-effect">
                    <CardHeader className="flex md:flex-row flex-col md:justify-between md:items-start gap-4">
                      <div className="flex items-start gap-4">
                        <ImageWithFallback
                          src={dj.profileImage}
                          alt={dj.name}
                          className="hidden sm:block border border-border/40 rounded-xl w-16 h-16 object-cover"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-white text-xl">{dj.name}</CardTitle>
                            <Badge variant="outline" className="flex items-center gap-1 border-primary/40 text-primary text-xs">
                              <Sparkles className="w-3 h-3" />
                              {dj.overallScore.toFixed(1)} QRate
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4" />
                            {dj.location}
                            <span className="text-border/40">•</span>
                            <DollarSign className="w-4 h-4" />
                            {dj.priceRange}
                            <span className="text-border/40">•</span>
                            <LineChart className="w-4 h-4 text-emerald-400" />
                            {dj.responseTime}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {dj.eventTypes.map(type => (
                              <Badge key={type} variant="outline" className="border-border/40 text-muted-foreground text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-muted-foreground text-sm">
                        <div><span className="text-muted-foreground/70">Next availability:</span> <span className="text-white">{dj.nextAvailable}</span></div>
                        <div><span className="text-muted-foreground/70">Audience focus:</span> <span className="text-white">{dj.demographicFocus.join(' · ')}</span></div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="gap-3 grid sm:grid-cols-3">
                        <div className="bg-primary/10 p-3 border border-primary/30 rounded-lg">
                          <div className="flex justify-between items-center text-primary/70 text-xs">
                            <span>Vibe Match</span>
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="mt-2 font-semibold text-white text-2xl">{dj.vibeMatchScore}%</div>
                          <p className="mt-1 text-primary/70 text-xs">Event-vibe alignment</p>
                        </div>
                        <div className="bg-accent/10 p-3 border border-accent/30 rounded-lg">
                          <div className="flex justify-between items-center text-accent/80 text-xs">
                            <span>Engagement</span>
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="mt-2 font-semibold text-white text-2xl">{dj.engagementRating.toFixed(1)}</div>
                          <p className="mt-1 text-accent/80 text-xs">Crowd rating (1-5)</p>
                        </div>
                        <div className="bg-blue-500/10 p-3 border border-blue-400/40 rounded-lg">
                          <div className="flex justify-between items-center text-blue-200 text-xs">
                            <span>Overall Score</span>
                            <Star className="w-4 h-4" />
                          </div>
                          <div className="mt-2 font-semibold text-white text-2xl">{dj.overallScore.toFixed(1)}</div>
                          <p className="mt-1 text-blue-200/80 text-xs">QRate performance index</p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-muted-foreground text-xs uppercase tracking-wide">Vibe Specialization</p>
                        <div className="gap-2 grid sm:grid-cols-2 lg:grid-cols-4">
                          {dj.vibeSpecializations.map(vibe => (
                            <div key={vibe.label}>
                              <div className="flex justify-between text-muted-foreground text-xs">
                                <span>{vibe.label}</span>
                                <span>{vibe.percent}%</span>
                              </div>
                              <div className="mt-1 bg-border/40 rounded-full w-full h-1.5 overflow-hidden">
                                <div className="bg-primary/80 rounded-full h-full" style={{ width: `${vibe.percent}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {dj.vibeKeywords.map(keyword => (
                          <Badge key={keyword} variant="secondary" className="bg-primary/10 border-primary/30 text-primary text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">Featured QRate Events</p>
                        <div className="gap-2 grid md:grid-cols-2">
                          {dj.featuredHighlights.map(highlight => (
                            <div key={highlight.title} className="p-3 border border-border/30 rounded-lg text-muted-foreground text-sm glass-effect">
                              <div className="font-medium text-white">{highlight.title}</div>
                              <div className="mt-1 text-muted-foreground text-xs">{highlight.detail}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex md:flex-row flex-col md:justify-between md:items-center gap-3">
                      <div className="text-muted-foreground text-xs">
                        {dj.crowdStats.guestConnection} · {dj.crowdStats.tipVolume} · {dj.crowdStats.playlistScore}
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-primary/80 hover:bg-primary">
                          Request Booking
                        </Button>
                        <Button variant="outline">
                          View Profile
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                {filteredMarketplaceDJs.length === 0 && (
                  <Card className="bg-muted/10 border-border/40 border-dashed">
                    <CardContent className="py-12 text-muted-foreground text-sm text-center">
                      No DJs match these filters yet. Adjust filters to discover more marketplace profiles.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-8 ${dashboardView === 'find-djs' ? 'hidden' : ''}`}>
            {/* Main Events */}
            <div className="space-y-8">

        {/* Enhanced Stats Overview - Only show for Past Events */}
        {activeTab === 'past' && (
          <div className="gap-4 grid grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 blur-xl rounded-xl transition-opacity duration-300" />
              <Card className="relative border-primary/30 hover:border-primary/60 overflow-hidden transition-all duration-300 glass-effect">
                <div className="top-0 right-0 absolute bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full w-20 h-20" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div className="text-primary/70 text-xs uppercase tracking-wider">All Time</div>
                  </div>
                  <div className="space-y-1">
                    <div className="bg-clip-text bg-gradient-to-r from-primary to-accent font-bold text-transparent text-3xl">{events.length}</div>
                    <div className="text-muted-foreground text-xs">Total Events</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 blur-xl rounded-xl transition-opacity duration-300" />
              <Card className="relative border-green-500/30 hover:border-green-500/60 overflow-hidden transition-all duration-300 glass-effect">
                <div className="top-0 right-0 absolute bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full w-20 h-20" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    <div className="text-green-400/70 text-xs uppercase tracking-wider">Active Now</div>
                  </div>
                  <div className="space-y-1">
                    <div className="inline-block relative">
                      <div className="font-bold text-green-400 text-3xl">{liveEvents.length}</div>
                      {liveEvents.length > 0 && <div className="-top-1 -right-1 absolute bg-green-400 rounded-full w-2 h-2 animate-ping" />}
                    </div>
                    <div className="text-muted-foreground text-xs">Live Events</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 blur-xl rounded-xl transition-opacity duration-300" />
              <Card className="relative border-accent/30 hover:border-accent/60 overflow-hidden transition-all duration-300 glass-effect">
                <div className="top-0 right-0 absolute bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full w-20 h-20" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Users className="w-5 h-5 text-accent" />
                    <div className="text-accent/70 text-xs uppercase tracking-wider">All Events</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-accent text-3xl">{events.reduce((sum, e) => sum + (e.guestCount || 0), 0)}</div>
                    <div className="text-muted-foreground text-xs">Total Guests</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 blur-xl rounded-xl transition-opacity duration-300" />
              <Card className="relative border-blue-500/30 hover:border-blue-500/60 overflow-hidden transition-all duration-300 glass-effect">
                <div className="top-0 right-0 absolute bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full w-20 h-20" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div className="text-blue-400/70 text-xs uppercase tracking-wider">Scheduled</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-blue-400 text-3xl">{upcomingEventsSorted.length}</div>
                    <div className="text-muted-foreground text-xs">Upcoming</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Empty State - Show when no events in current tab (above tabs, not on past tab) */}
        {(activeTab === 'live' && liveEvents.length === 0 || activeTab === 'upcoming' && upcomingEventsSorted.length === 0) && (
          <Card className="bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-cyan-900/40 backdrop-blur-sm mb-6 border-blue-400/40 border-dashed">
            <CardContent className="py-8 text-center">
              <div className="space-y-3">
                <div className="flex justify-center items-center bg-gradient-to-r from-blue-600 to-cyan-500 mx-auto rounded-full w-12 h-12 animate-float">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-white text-xl">Create Your First Event</h3>
                  <p className="mx-auto max-w-md text-blue-200/80">
                    Start your musical journey by creating an event. Let your guests share their preferences and create the perfect playlist together.
                  </p>
                </div>
                <Button 
                  className="bg-gradient-to-r from-blue-600 hover:from-blue-700 to-cyan-500 hover:to-cyan-600 mt-4 text-white transition-all duration-300"
                  onClick={onCreateEvent}
                >
                  <Plus className="mr-2 w-5 h-5" />
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
          onValueChange={(value: string) => setActiveTab(value as 'live' | 'upcoming' | 'past')}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-3 p-1 border-border/50 w-full glass-effect">
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
            >
              <Activity className="mr-2 w-4 h-4" />
              Live
              {liveEvents.length > 0 && (
                <Badge className="bg-green-400 ml-2 text-black">{liveEvents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <Clock className="mr-2 w-4 h-4" />
              Upcoming
              {upcomingEventsSorted.length > 0 && (
                <Badge className="bg-blue-400 ml-2 text-black">{upcomingEventsSorted.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="past"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-600 data-[state=active]:to-slate-500 data-[state=active]:text-white"
            >
              <TrendingUp className="mr-2 w-4 h-4" />
              Past
              {pastEvents.length > 0 && (
                <Badge className="bg-gray-400 ml-2 text-black">{pastEvents.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Live Events Tab */}
          <TabsContent value="live" className="space-y-4 m-0">
            {liveEvents.length > 0 ? (
              <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
                {/* Live Events List - Left Side */}
                <div className="space-y-4 lg:col-span-2">
                  {liveEvents.map((event, index) => (
                    <div key={event.id} style={{ animationDelay: `${index * 0.1}s` }}>
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>

                {/* Live Crowd Profile - Right Side */}
                <div className="lg:col-span-1">
                  <Card className="border-purple-500/30 glass-effect">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-purple-400 text-base">
                        <Music className="w-4 h-4" />
                        Live Crowd Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="mb-3 text-purple-200/60 text-xs">
                        Top 3 genres currently represented at the event
                      </p>
                      
                      {(() => {
                        const topGenres = getTopGenres(liveEvents[0].preferences || [], 3);
                        return topGenres.map((genre, index) => (
                          <div 
                            key={genre}
                            className="flex items-center gap-3 p-2.5 border border-purple-400/20 hover:border-purple-400/40 rounded-lg transition-all glass-effect"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                              index === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                              'bg-gradient-to-br from-blue-500 to-cyan-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm">{genre}</div>
                              <div className="text-purple-200/50 text-xs">
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
              <Card className="border-border/50 glass-effect">
                <CardContent className="py-12 text-center">
                  <div className="space-y-3">
                    <div className="flex justify-center items-center bg-green-500/20 mx-auto rounded-full w-12 h-12">
                      <Activity className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">No Live Events</h3>
                      <p className="text-muted-foreground text-sm">
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
                <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
                  {/* Upcoming Events List - Left Side */}
                  <div className="space-y-4 lg:col-span-2">
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
                      className="hover:bg-blue-400/10 border-blue-400/40 hover:border-blue-400/60 text-blue-400 glass-effect"
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
                      className="hover:bg-blue-400/10 border-blue-400/40 hover:border-blue-400/60 text-blue-400 glass-effect"
                    >
                      Show Less
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-border/50 glass-effect">
                <CardContent className="py-12 text-center">
                  <div className="space-y-3">
                    <div className="flex justify-center items-center bg-blue-500/20 mx-auto rounded-full w-12 h-12">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">No Upcoming Events</h3>
                      <p className="text-muted-foreground text-sm">
                        Create your next event to get started
                      </p>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 hover:from-blue-700 to-cyan-500 hover:to-cyan-600 mt-4 text-white transition-all duration-300"
                      onClick={onCreateEvent}
                    >
                      <Plus className="mr-2 w-4 h-4" />
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
              <Card className="border-border/50 glass-effect">
                <CardContent className="py-12 text-center">
                  <div className="space-y-3">
                    <div className="flex justify-center items-center bg-gray-500/20 mx-auto rounded-full w-12 h-12">
                      <TrendingUp className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">No Past Events</h3>
                      <p className="text-muted-foreground text-sm">
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
          <div className="mt-8 pb-4 text-center">
            <button
              onClick={() => setTrashedModalOpen(true)}
              className="group flex items-center gap-2 mx-auto text-muted-foreground hover:text-destructive text-sm transition-colors duration-200"
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
        <DialogContent className="border-primary/30 max-w-4xl max-h-[90vh] overflow-y-auto text-white glass-effect">
          <DialogHeader>
            <DialogTitle className="mb-2 text-3xl gradient-text">Event QR Code</DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              Share this QR code with guests to join{' '}
              {selectedEventForQR && (selectedEventForQR.eventName || selectedEventForQR.name)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEventForQR && (
            <div className="gap-6 lg:gap-8 grid grid-cols-1 lg:grid-cols-2 mt-4">
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
                <Card className="group relative border-primary/30 hover:border-primary/60 overflow-hidden transition-all duration-300 glass-effect">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardHeader className="z-10 relative text-center">
                    <CardTitle className="flex justify-center items-center gap-2 text-white">
                      <QrCode className="w-5 h-5 text-primary" />
                      Guest QR Code
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Guests scan this to share their music preferences
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="z-10 relative space-y-6">
                    {/* QR Code */}
                    <div className="bg-white mx-auto p-6 rounded-xl w-fit">
                      <img 
                        src={getQRCodeUrl(selectedEventForQR.code)}
                        alt="Event QR Code" 
                        className="mx-auto w-64 h-64"
                      />
                    </div>
                    
                    {/* Share Link Section */}
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-sm text-center">
                        Or share this link directly:
                      </p>
                      
                      <div className="p-3 border border-border/30 rounded-lg glass-effect">
                        <p className="font-mono text-foreground/90 text-xs text-center break-all">
                          {window.location.origin}?code={selectedEventForQR.code}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleCopyUrl(selectedEventForQR.code)}
                          variant="outline" 
                          className="flex-1 hover:bg-primary/20 border-primary/40 hover:border-primary/60 text-white transition-all duration-300 glass-effect"
                        >
                          {copied ? (
                            <>
                              <Check className="mr-2 w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 w-4 h-4" />
                              Copy Link
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          onClick={() => handleShare(selectedEventForQR)}
                          variant="outline" 
                          className="flex-1 hover:bg-accent/20 border-accent/40 hover:border-accent/60 text-white transition-all duration-300 glass-effect"
                        >
                          <Share2 className="mr-2 w-4 h-4" />
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
                <Card className="border-accent/30 hover:border-accent/60 transition-all duration-300 glass-effect">
                  <CardHeader>
                    <CardTitle className="text-white">How Guests Use This</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Simple steps for your guests
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-r from-primary to-accent rounded-full w-8 h-8 font-bold text-white">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-white">Scan QR Code</p>
                          <p className="mt-1 text-muted-foreground text-sm">
                            Use phone camera to scan the code above
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-r from-primary to-accent rounded-full w-8 h-8 font-bold text-white">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-white">Connect Account</p>
                          <p className="mt-1 text-muted-foreground text-sm">
                            Link Spotify or enter preferences manually
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-r from-primary to-accent rounded-full w-8 h-8 font-bold text-white">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-white">Share Preferences</p>
                          <p className="mt-1 text-muted-foreground text-sm">
                            Tell us about their music taste
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-r from-primary to-accent rounded-full w-8 h-8 font-bold text-white">
                          4
                        </div>
                        <div>
                          <p className="font-medium text-white">Enjoy the Party!</p>
                          <p className="mt-1 text-muted-foreground text-sm">
                            AI creates the perfect playlist for everyone
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Card */}
                <Card className="border-border/30 glass-effect">
                  <CardContent className="p-6">
                    <div className="gap-4 grid grid-cols-2">
                      <div className="text-center">
                        <div className="mb-1 text-3xl gradient-text">
                          {selectedEventForQR.guestCount || 0}
                        </div>
                        <div className="text-muted-foreground text-sm">Guests Joined</div>
                      </div>
                      <div className="text-center">
                        <div className="mb-1 text-3xl gradient-text">
                          {selectedEventForQR.preferences?.length || 0}
                        </div>
                        <div className="text-muted-foreground text-sm">Preferences</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips Card */}
                <div className="bg-yellow-500/5 p-4 border border-yellow-500/30 rounded-lg glass-effect">
                  <p className="text-muted-foreground text-sm">
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
          currentUser={currentUser}
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
          if (onRestoreEvent && event.eventName) {
            onRestoreEvent(event as QRateEvent);
            setTrashedModalOpen(false);
          }
        }}
        onPermanentDelete={onPermanentlyDeleteEvent ? (event) => {
          if (event.eventName) {
            onPermanentlyDeleteEvent(event as QRateEvent);
          }
        } : undefined}
      />

      {/* Promotion Modal */}
      <PromotionModal
        open={promotionModalOpen}
        onClose={() => setPromotionModalOpen(false)}
        event={selectedEventForPromotion}
      />

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="border-[var(--neon-yellow)]/30 max-w-md text-white glass-effect">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="bg-gradient-to-br from-[var(--neon-yellow)]/20 to-[var(--neon-yellow)]/10 p-2 rounded-lg">
                <HelpCircle className="w-6 h-6 text-[var(--neon-yellow)]" />
              </div>
              Tips for a Successful Event
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Make the most out of QRate for your events
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 border border-border/30 rounded-lg glass-effect">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-purple)] mt-1 rounded-full w-6 h-6 text-white text-xs">1</div>
                  <div>
                    <div className="mb-1 font-semibold text-white">Promote Early</div>
                    <p className="text-muted-foreground text-sm">Share your event link and QR code ahead of time to collect more guest preferences before the event starts.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] mt-1 rounded-full w-6 h-6 text-white text-xs">2</div>
                  <div>
                    <div className="mb-1 font-semibold text-white">Use QR Codes Everywhere</div>
                    <p className="text-muted-foreground text-sm">Display QR code flyers on tables, posters, and entrance areas for easy guest access.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] mt-1 rounded-full w-6 h-6 text-white text-xs">3</div>
                  <div>
                    <div className="mb-1 font-semibold text-white">Connect Spotify Early</div>
                    <p className="text-muted-foreground text-sm">Link your Spotify playlist before the event to enable seamless music integration in the DJ Booth.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-cyan)] mt-1 rounded-full w-6 h-6 text-white text-xs">4</div>
                  <div>
                    <div className="mb-1 font-semibold text-white">Monitor the DJ Booth</div>
                    <p className="text-muted-foreground text-sm">Check real-time recommendations and guest analytics in the DJ Booth to keep the energy high.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-[var(--neon-yellow)]/5 p-3 border border-[var(--neon-yellow)]/20 rounded-lg glass-effect">
              <p className="text-muted-foreground text-xs text-center">
                <span className="font-semibold text-[var(--neon-yellow)]">Pro Tip:</span> The more guests that share their preferences, the better QRate's AI can personalize the playlist!
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