import React, { useRef, useEffect, useState } from 'react';
import {
  Download, Share2, Users, Music, TrendingUp, Star, Clock, MapPin, X,
  ExternalLink, Image as ImageIcon, MessageSquare, Target, ThumbsUp,
  ThumbsDown, Lightbulb, CheckCircle2, AlertCircle, UserPlus, UserCheck,
  ChevronRight, Disc3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { eventApi, utils } from '../utils/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import logoImage from '../assets/QRate_Title.png';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  MOCK_GUEST_FEEDBACK, 
  MOCK_PARTY_ANTHEMS,
  generateVibeTimeline,
  isTesterAccount,
  getMockPhotoAlbum,
  getMockGuestFeedback,
  getMockPartyAnthems
} from '../utils/mockEventData';

interface Event {
  id: string;
  eventName?: string;
  name?: string;
  eventTheme?: string;
  theme?: string;
  eventDescription?: string;
  code: string;
  date: string;
  time: string;
  location?: string;
  status: 'past' | 'live' | 'upcoming';
  guestCount: number;
  preferences: Array<{
    userId: string;
    artists: string[];
    genres: string[];
    recentTracks: string[];
  }>;
  connectedPlaylist?: any;
  finalQueue?: any[];
  insights?: any;
}

interface AfterpartySummaryProps {
  event: Event;
  onClose: () => void;
  currentUser?: string;
}

interface TopArtist {
  name: string;
  plays: number;
  image: string;
}

interface TopGenre {
  name: string;
  count: number;
  percentage: number;
}

// Mock data functions - only return data for tester account
function getMockRatingHistogram(username?: string) {
  return isTesterAccount(username) ? [
    { stars: '1★', count: 2 },
    { stars: '2★', count: 3 },
    { stars: '3★', count: 8 },
    { stars: '4★', count: 28 },
    { stars: '5★', count: 46 },
  ] : [];
}

function getMockAttendeeTypeData(username?: string) {
  return isTesterAccount(username) ? [
    { name: 'New Attendees', value: 34, color: '#00d9ff' },
    { name: 'Returning', value: 53, color: '#7b2cbf' },
  ] : [];
}

function getMockLikedMostWords(username?: string) {
  return isTesterAccount(username) ? [
    { text: 'Music Selection', value: 45 },
    { text: 'Energy', value: 38 },
    { text: 'Atmosphere', value: 35 },
    { text: 'DJ Skills', value: 32 },
    { text: 'Crowd Vibe', value: 28 },
    { text: 'Lighting', value: 24 },
    { text: 'Sound Quality', value: 22 },
    { text: 'Variety', value: 20 },
    { text: 'Flow', value: 18 },
    { text: 'Transitions', value: 15 },
  ] : [];
}

function getMockImproveWords(username?: string) {
  return isTesterAccount(username) ? [
    { text: 'More Space', value: 28 },
    { text: 'Better AC', value: 22 },
    { text: 'Longer Event', value: 18 },
    { text: 'Food Options', value: 15 },
    { text: 'Parking', value: 12 },
    { text: 'Earlier Start', value: 10 },
    { text: 'Lighting', value: 8 },
  ] : [];
}

function getMockTopGenres(username?: string): TopGenre[] {
  return isTesterAccount(username) ? [
    { name: 'Synthwave', count: 342, percentage: 32 },
    { name: 'Electronic Dance', count: 298, percentage: 28 },
    { name: 'Indie Pop', count: 256, percentage: 24 },
    { name: 'Retro Wave', count: 213, percentage: 20 },
    { name: 'Alt Rock', count: 187, percentage: 17 },
  ] : [];
}

function getMockTopArtists(username?: string): TopArtist[] {
  return isTesterAccount(username) ? [
    { 
      name: 'The Weeknd', 
      plays: 28, 
      image: 'https://images.unsplash.com/photo-1744057848001-9eda40757ed6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGUlMjB3ZWVrbmQlMjBwb3J0cmFpdCUyMHNpbmdlcnxlbnwxfHx8fDE3NjEwNzU0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'Dua Lipa', 
      plays: 24, 
      image: 'https://images.unsplash.com/photo-1697510364485-e900c2fe7524?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdWElMjBsaXBhJTIwc2luZ2VyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYxMDc1NDAwfDA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'Daft Punk', 
      plays: 22, 
      image: 'https://images.unsplash.com/photo-1595507290691-53f7ac0179c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYWZ0JTIwcHVuayUyMGVsZWN0cm9uaWMlMjBtdXNpY3xlbnwxfHx8fDE3NjEwNzU0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'MGMT', 
      plays: 19, 
      image: 'https://images.unsplash.com/photo-1619378448971-816e2b298f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMGJhbmQlMjBtdXNpY2lhbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MTA3NTQwMXww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'Tame Impala', 
      plays: 17, 
      image: 'https://images.unsplash.com/photo-1602928800314-e71b9abe350c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW1lJTIwaW1wYWxhJTIwcHN5Y2hlZGVsaWMlMjBtdXNpY2lhbnxlbnwxfHx8fDE3NjEwNzU0MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
  ] : [];
}

// Photo captions for polaroid photos
const photoDescriptions = [
  'Dance Floor Vibes',
  'Friends Forever',
  'Epic DJ Moment',
  'Crowd Goes Wild',
  'Perfect Night',
  'Best Memories',
  'Party Energy',
  'Unforgettable',
  'Good Times'
];

// Helper function to render feedback with bold keywords
const renderFeedbackWithBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export function AfterpartySummary({ event, onClose, currentUser }: AfterpartySummaryProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const isTester = isTesterAccount(currentUser);

  console.log('🎉 AfterpartySummary component mounted for event:', event.eventName || event.name);

  // Get mock data based on current user - only tester account gets mock data
  const photoAlbum = getMockPhotoAlbum(currentUser);
  const guestFeedback = getMockGuestFeedback(currentUser);
  const partyAnthems = getMockPartyAnthems(currentUser);
  const ratingHistogramData = getMockRatingHistogram(currentUser);
  const attendeeTypeData = getMockAttendeeTypeData(currentUser);
  const likedMostWords = getMockLikedMostWords(currentUser);
  const improveWords = getMockImproveWords(currentUser);
  const mockTopGenres = getMockTopGenres(currentUser);
  const mockTopArtists = getMockTopArtists(currentUser);

  // Fetch real insights for normal accounts
  useEffect(() => {
    if (!isTester && event.code) {
      setLoadingInsights(true);
      eventApi.getInsights(event.code)
        .then((response: any) => {
          if (response.success && response.data?.insights) {
            setInsights(response.data.insights);
          }
        })
        .catch((error) => {
          console.error('Error fetching insights:', error);
        })
        .finally(() => {
          setLoadingInsights(false);
        });
    } else {
      setLoadingInsights(false);
    }
  }, [event.code, isTester]);

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPhoto) {
          setSelectedPhoto(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, selectedPhoto]);

  // Use real data from insights API or mock data for tester
  const topGenres: TopGenre[] = isTester 
    ? mockTopGenres 
    : (insights?.topGenres || []).map((g: any) => ({
        name: g.name,
        count: g.count,
        percentage: g.percentage || Math.round((g.count / (insights?.totalGuests || 1)) * 100)
      }));

  const topArtists: TopArtist[] = isTester
    ? mockTopArtists
    : (insights?.topArtists || []).map((a: any, index: number) => ({
        name: a.name,
        plays: a.count || 0,
        image: `https://images.unsplash.com/photo-${1500000000000 + index}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080` // Placeholder
      }));

  // Calculate metrics - use real data where available, mock for tester
  const finalAttendance = event.guestCount || 0;
  const estimatedRSVPs = isTester ? 150 : finalAttendance; // For normal accounts, use actual attendance
  const peakTime = isTester ? '11:30 PM' : null; // Not tracked yet
  const djScore = isTester ? 92 : 0; // Not collected yet
  const overallEventRating = isTester ? 88 : 0; // Not collected yet
  const avgAttendanceLength = isTester ? 3.2 : 0; // Not tracked yet
  const typicalLength = 2.5; // hours
  const percentLonger = avgAttendanceLength > 0 
    ? Math.round(((avgAttendanceLength - typicalLength) / typicalLength) * 100)
    : 0;
  
  // Generate vibe timeline - use mock for tester, empty for normal accounts
  const vibeTimelineData = isTester ? [
    { time: '8:00 PM', guestCount: 12, crowdCohesion: 45 },
    { time: '8:30 PM', guestCount: 28, crowdCohesion: 58 },
    { time: '9:00 PM', guestCount: 45, crowdCohesion: 68 },
    { time: '9:30 PM', guestCount: 63, crowdCohesion: 75 },
    { time: '10:00 PM', guestCount: 62, crowdCohesion: 93, label: 'Highest Crowd Energy' },
    { time: '10:30 PM', guestCount: 85, crowdCohesion: 88 },
    { time: '11:00 PM', guestCount: 87, crowdCohesion: 92 },
    { time: '11:30 PM', guestCount: 92, crowdCohesion: 83, label: 'Peak Attendance' },
    { time: '12:00 AM', guestCount: 82, crowdCohesion: 90 },
    { time: '12:30 AM', guestCount: 74, crowdCohesion: 85 },
    { time: '1:00 AM', guestCount: 58, crowdCohesion: 78 },
    { time: '1:30 AM', guestCount: 35, crowdCohesion: 70 },
  ] : generateVibeTimeline(240, currentUser); // Use helper function which returns empty for non-tester

  // Playlist URL - use connected playlist if available
  const playlistUrl = event.connectedPlaylist?.external_urls?.spotify || 
    (isTester ? 'https://open.spotify.com/playlist/retro-night-2024' : null);

  // Simplified Gauge Chart Component with value on top and animation
  const GaugeChart = ({ value, title, subtitle }: { value: number; title: string; subtitle?: string }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    const [animatedAngle, setAnimatedAngle] = useState(-90);
    
    useEffect(() => {
      // Animate the value and needle over 2 seconds
      const duration = 2000;
      const startTime = Date.now();
      const targetAngle = -90 + (value / 100) * 180;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);
        
        setAnimatedValue(Math.round(value * easedProgress));
        setAnimatedAngle(-90 + easedProgress * (targetAngle + 90));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }, [value]);
    
    const getColor = (val: number) => {
      if (val >= 80) return '#00ff88';
      if (val >= 60) return '#ffd60a';
      return '#ff006e';
    };
    const color = getColor(animatedValue);
    
    return (
      <div className="text-center">
        <h4 className="mb-2 text-white/80 text-sm">{title}</h4>
        {/* Value text on top */}
        <div className="mb-2 font-bold text-white text-3xl">{animatedValue}%</div>
        <div className="relative flex justify-center items-center h-32">
          <svg width="180" height="100" viewBox="0 0 180 100" className="overflow-visible">
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#ff006e', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#ffd60a', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#00ff88', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            
            {/* Background arc */}
            <path
              d="M 30 80 A 60 60 0 0 1 150 80"
              fill="none"
              stroke="#ffffff20"
              strokeWidth="14"
              strokeLinecap="round"
            />
            
            {/* Colored arc */}
            <path
              d="M 30 80 A 60 60 0 0 1 150 80"
              fill="none"
              stroke={`url(#gradient-${title.replace(/\s/g, '')})`}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${(animatedValue / 100) * 188.5} 188.5`}
              style={{ transition: 'stroke-dasharray 0.1s ease-out' }}
            />
            
            {/* Needle with arrow */}
            <g transform={`translate(90, 80)`}>
              <g transform={`rotate(${animatedAngle})`} style={{ transition: 'transform 0.1s ease-out' }}>
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-50"
                  stroke={color}
                  strokeWidth="2.5"
                />
                <polygon
                  points="0,-50 -4,-45 4,-45"
                  fill={color}
                />
              </g>
              <circle cx="0" cy="0" r="5" fill={color} />
            </g>
          </svg>
        </div>
        {subtitle && <p className="mt-1 text-white/50 text-xs">{subtitle}</p>}
      </div>
    );
  };

  // Word Cloud Component - More cloud-like scattered layout
  const WordCloud = ({ words, colors }: { words: typeof likedMostWords, colors: string[] }) => {
    const sortedWords = [...words].sort((a, b) => b.value - a.value);
    
    return (
      <div className="flex flex-wrap justify-center items-center gap-2 p-4">
        {sortedWords.map((word, idx) => {
          const fontSize = 10 + (word.value / 5);
          const color = colors[idx % colors.length];
          return (
            <span
              key={idx}
              className="inline-block px-3 py-1.5 rounded-full hover:scale-110 transition-all cursor-default"
              style={{
                fontSize: `${fontSize}px`,
                color: color,
                fontWeight: idx < 3 ? 'bold' : 'normal',
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="z-[9999] fixed inset-0 bg-black/95 backdrop-blur-sm overflow-y-auto" 
        onClick={(e) => {
          if (e.target === e.currentTarget && !selectedPhoto) {
            onClose();
          }
        }}
      >
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="top-4 right-4 z-10 fixed flex justify-center items-center hover:bg-white/10 border border-white/20 hover:border-white/40 rounded-full w-10 h-10 transition-all glass-effect"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Report Content */}
        <div className="bg-[rgb(0,0,0)] mx-auto px-6 py-8 max-w-6xl">
          {/* Centered QRate Logo */}
          <div className="flex justify-center mb-6">
            <ImageWithFallback 
              src={logoImage} 
              alt="QRate" 
              className="w-auto h-30 object-contain"
            />
          </div>

          {/* Main Container with Header */}
          <div className="bg-linear-to-br from-purple-900/10 to-pink-900/10 p-6 border border-purple-500/30 rounded-2xl glass-effect">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="font-bold text-[32px] text-xl md:text-2xl uppercase tracking-wide gradient-text">
                Afterparty Summary
              </h1>
              <p className="mt-1 text-white/60 text-sm">
                {event.eventName || event.name} - {new Date(event.date).toLocaleDateString()}
              </p>
            </div>

            <div ref={reportRef} className="space-y-6">

            {/* Performance Metrics - 3 columns */}
            <div className="gap-6 grid grid-cols-1 md:grid-cols-3 mt-[0px] mr-[0px] mb-[24px] ml-[0px]">
              {/* DJ Performance */}
              <Card className="border-purple-500/30 glass-effect">
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-col items-center gap-2 text-purple-400 text-sm">
                    <Disc3 className="w-4 h-4" />
                    <span>DJ Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GaugeChart value={djScore} title="" subtitle="Based on guest feedback" />
                </CardContent>
              </Card>
              
              {/* Overall Event Rating */}
              <Card className="border-purple-500/30 glass-effect">
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-col items-center gap-2 text-purple-400 text-sm">
                    <Star className="w-4 h-4" />
                    <span>Overall Event Rating</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GaugeChart value={overallEventRating} title="" subtitle={overallEventRating > 0 ? "Aggregate satisfaction score" : "Not available yet"} />
                </CardContent>
              </Card>

              {/* Attendee Type Distribution */}
              <Card className="border-purple-500/30 glass-effect">
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-col items-center gap-2 text-purple-400 text-sm">
                    <UserPlus className="w-4 h-4" />
                    <span>Attendee Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40">
                    {attendeeTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={attendeeTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {attendeeTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0];
                              const isReturning = data.name === 'Returning';
                              return (
                                <div 
                                  className="p-2 border rounded-lg"
                                  style={{
                                    backgroundColor: isReturning ? '#4c1d95' : '#1e3a8a',
                                    borderColor: isReturning ? '#7c3aed' : '#3b82f6',
                                    color: '#ffffff'
                                  }}
                                >
                                  <p className="font-medium">{data.name}: {data.value}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    ) : (
                      <div className="text-white/50 text-sm">No attendee data available</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    {attendeeTypeData.map((item, idx) => (
                      <div key={idx} className="flex justify-center items-center gap-1.5">
                        <div className="rounded-full w-2.5 h-2.5" style={{ backgroundColor: item.color }}></div>
                        <span className="text-white/70 text-xs">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Shared Photo Album - Moved above What Guests Are Saying, Polaroid style */}
            <Card className="border-purple-500/30 glass-effect">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-400 text-xl">
                  <ImageIcon className="w-5 h-5" />
                  Shared Photo Album
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-white/70 text-sm">
                  {photoAlbum.length} photos from the night
                </p>
                {photoAlbum.length > 0 ? (
                <div className="space-y-4">
                  {/* Top row - 4 photos */}
                  <div className="gap-4 grid grid-cols-4">
                    {photoAlbum.slice(0, 4).map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPhoto(photo)}
                        className="group relative bg-white shadow-lg hover:shadow-2xl p-3 rounded-sm hover:-rotate-1 hover:scale-105 transition-all"
                        style={{
                          transform: `rotate(${index % 2 === 0 ? -1 : 1}deg)`
                        }}
                      >
                        <div className="bg-gray-200 aspect-square overflow-hidden">
                          <ImageWithFallback
                            src={photo}
                            alt={`Party photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex justify-center items-center mt-2 h-12">
                          <span className="text-black text-lg leading-tight" style={{ fontFamily: 'Permanent Marker, cursive' }}>
                            {photoDescriptions[index]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Bottom row - 3 photos in first 3 cols, See More button below 4th photo */}
                  <div className="gap-4 grid grid-cols-4">
                    {/* Photos 5, 6, 7 */}
                    {[4, 5, 6].map((photoIndex) => (
                      <button
                        key={photoIndex}
                        onClick={() => setSelectedPhoto(photoAlbum[photoIndex])}
                        className="group relative bg-white shadow-lg hover:shadow-2xl p-3 rounded-sm hover:-rotate-1 hover:scale-105 transition-all"
                        style={{
                          transform: `rotate(${photoIndex % 2 === 0 ? -1 : 1}deg)`
                        }}
                      >
                        <div className="bg-gray-200 aspect-square overflow-hidden">
                          <ImageWithFallback
                            src={photoAlbum[photoIndex]}
                            alt={`Party photo ${photoIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex justify-center items-center mt-2 h-12">
                          <span className="text-black text-lg leading-tight" style={{ fontFamily: 'Permanent Marker, cursive' }}>
                            {photoDescriptions[photoIndex]}
                          </span>
                        </div>
                      </button>
                    ))}
                    
                    {/* See More Photos Button - Polaroid style - in the 4th column */}
                    <button
                      className="group relative bg-white shadow-lg hover:shadow-2xl p-3 rounded-sm hover:rotate-1 hover:scale-105 transition-all"
                      style={{ transform: 'rotate(1deg)' }}
                    >
                      <div className="flex flex-col justify-center items-center bg-linear-to-br from-purple-100 to-pink-100 aspect-square">
                        <ImageIcon className="mb-2 w-10 h-10 text-purple-500" />
                        <span className="font-medium text-purple-700 text-sm">+10 more</span>
                      </div>
                      <div className="flex justify-center items-center mt-2 h-12">
                        <span className="text-black text-lg leading-tight" style={{ fontFamily: 'Permanent Marker, cursive' }}>
                          See More
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
                ) : (
                  <div className="py-8 text-white/50 text-sm text-center">
                    No photos available yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What Guests Are Saying - With Rating Distribution, 4 reviews in 2x2 */}
            <Card className="border-pink-500/30 glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-400 text-xl">
                  <MessageSquare className="w-5 h-5" />
                  What Guests Are Saying
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
                  {/* Left side - Guest reviews (2 columns, 4 reviews) */}
                  <div className="gap-4 grid grid-cols-1 md:grid-cols-2 md:col-span-2">
                    {guestFeedback.length > 0 ? guestFeedback.map((feedback, index) => (
                      <div 
                        key={index}
                        className="p-4 border border-pink-400/20 rounded-lg glass-effect"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className="border-2 border-pink-500/30 rounded-full w-10 h-10 overflow-hidden shrink-0">
                            <ImageWithFallback
                              src={feedback.photo}
                              alt={feedback.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 font-medium text-white text-sm">{feedback.name}</div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: feedback.rating }).map((_, i) => (
                                <Star key={i} className="fill-yellow-400 w-3 h-3 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-white/70 text-sm italic">"{feedback.feedback}"</p>
                      </div>
                    )) : (
                      <div className="col-span-2 py-8 text-white/50 text-sm text-center">
                        No guest feedback available yet
                      </div>
                    )}
                  </div>
                  
                  {/* Right side - Rating Distribution */}
                  <div className="flex flex-col">
                    <div className="flex flex-col flex-1 justify-center items-center p-4 border border-yellow-500/30 rounded-lg glass-effect">
                      <h4 className="mb-3 text-white/80 text-center">Rating Distribution</h4>
                      <div className="flex justify-center items-center w-full h-40">
                        {ratingHistogramData.length > 0 ? (
                          <ResponsiveContainer width="90%" height="100%">
                            <BarChart data={ratingHistogramData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis 
                              dataKey="stars" 
                              stroke="#ffffff60"
                              style={{ fontSize: '10px' }}
                            />
                            <YAxis 
                              stroke="#ffffff60"
                              style={{ fontSize: '10px' }}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid #00d9ff40',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                            />
                            <Bar dataKey="count" fill="#ffd60a" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        ) : (
                          <div className="text-white/50 text-sm">No rating data available</div>
                        )}
                      </div>
                    </div>
                    
                    {/* See More Reviews Button */}
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="border-pink-500/40 hover:border-pink-400/60 w-full text-white glass-effect"
                      >
                        See 12 More Reviews
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vibe Timeline - With metrics on the right */}
            <Card className="border-cyan-500/30 glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400 text-xl">
                  <TrendingUp className="w-5 h-5" />
                  Vibe Timeline
                </CardTitle>
                <p className="mt-2 text-white/60 text-sm">
                  Guest arrivals and crowd music cohesion throughout the night
                </p>
              </CardHeader>
              <CardContent>
                <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
                  {/* Left - Timeline chart (2 columns) */}
                  <div className="md:col-span-2">
                    <div className="h-64">
                      {vibeTimelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vibeTimelineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis 
                              dataKey="time" 
                              stroke="#ffffff60"
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                              yAxisId="left"
                              stroke="#ffffff60"
                              style={{ fontSize: '12px' }}
                              label={{ value: 'Guests', angle: -90, position: 'insideLeft', fill: '#ffffff60' }}
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              stroke="#ffffff60"
                              style={{ fontSize: '12px' }}
                              domain={[0, 100]}
                              label={{ value: 'Cohesion %', angle: 90, position: 'insideRight', fill: '#ffffff60' }}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid #00d9ff40',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-[#1a1a2e] p-3 border border-cyan-500/40 rounded-lg glass-effect">
                                      <p className="mb-2 font-bold text-white">{data.time}</p>
                                      {data.label && (
                                        <p className="mb-2 font-bold text-yellow-400 text-sm">🎉 {data.label}</p>
                                      )}
                                      <p className="text-cyan-400 text-sm">Guests: {data.guestCount}</p>
                                      <p className="text-pink-400 text-sm">Cohesion: {data.crowdCohesion}%</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend 
                              wrapperStyle={{ color: '#fff' }}
                            />
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="guestCount" 
                              stroke="#00d9ff" 
                              strokeWidth={3}
                              name="# of Guests Connected"
                              dot={{ fill: '#00d9ff', r: 4 }}
                            />
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="crowdCohesion" 
                              stroke="#ff006e" 
                              strokeWidth={3}
                              name="Crowd Music Cohesion %"
                              dot={{ fill: '#ff006e', r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-white/50 text-sm">No timeline data available</div>
                      )}
                    </div>
                  </div>

                  {/* Right - Metrics (1 column) - Smaller/Compact */}
                  <div className="space-y-3">
                    <div className="p-3 border border-blue-500/30 rounded-lg text-center glass-effect">
                      <Users className="mx-auto mb-1 w-5 h-5 text-blue-400" />
                      <div className="mb-1 font-bold text-white text-xl">{finalAttendance}</div>
                      <div className="mb-1 text-white/60 text-xs">Final Attendance</div>
                      <div className="text-blue-300/60 text-xs">vs. {estimatedRSVPs} RSVPs ({Math.round((finalAttendance/estimatedRSVPs)*100)}%)</div>
                      <div className="mt-2 pt-2 border-blue-500/20 border-t">
                        <Clock className="mx-auto mb-1 w-4 h-4 text-cyan-400" />
                        <div className="mb-1 font-bold text-lg gradient-text">{avgAttendanceLength}h</div>
                        <div className="mb-1 text-white/60 text-xs">Avg. Length</div>
                        <div className="text-cyan-300/60 text-xs">Stayed {percentLonger}% longer</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Music Insights (formerly Memories Package) */}
            <div className="bg-[#0f1a2e] p-6 border border-white rounded-2xl glass-effect">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex justify-center items-center rounded-lg w-10 h-10">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-normal text-white text-base">Music Insights</h2>
              </div>

              {/* Top 3 Party Anthems, Artists, and Genres - All in one row */}
              <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
                {/* Top 3 Party Anthems - Left column */}
                <Card className="border-yellow-500/30 glass-effect">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-yellow-400 text-base">
                      <TrendingUp className="w-4 h-4" />
                      Top 3 Party Anthems
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-3">
                      {partyAnthems.length > 0 ? partyAnthems.slice(0, 3).map((anthem, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-2 p-2 border border-yellow-400/20 rounded-lg glass-effect"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
                            index === 0 ? 'bg-linear-to-br from-yellow-500 to-orange-500' :
                            index === 1 ? 'bg-linear-to-br from-yellow-600 to-orange-600' :
                            'bg-linear-to-br from-yellow-700 to-orange-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-xs truncate">{anthem.name}</div>
                            <div className="text-white/50 text-xs truncate">{anthem.artist}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-400 text-sm">{anthem.aps}%</div>
                          </div>
                        </div>
                      )) : (
                        <div className="py-4 text-white/50 text-sm text-center">
                          No party anthems data available yet
                        </div>
                      )}
                    </div>
                    
                    {/* Official Playlist - Compact */}
                    {playlistUrl && (
                    <div 
                      className="flex items-center gap-2 hover:bg-white/5 p-2 rounded-lg transition-all cursor-pointer"
                      onClick={() => window.open(playlistUrl, '_blank')}
                    >
                      <div className="flex justify-center items-center rounded-lg w-7 h-7 shrink-0">
                        <Music className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-xs truncate">See the official playlist</div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-green-400 shrink-0" />
                    </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top 5 Artists - Middle column - Darker blue badges */}
                <Card className="border-cyan-500/30 glass-effect">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-cyan-400 text-base">
                      <Users className="w-4 h-4" />
                      Top 5 Artists
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Top 3 Artists - Larger */}
                    {topArtists.length > 0 ? (
                    <div className="flex justify-around mb-4">
                      {topArtists.slice(0, 3).map((artist: TopArtist, index: number) => (
                        <div key={index} className="flex flex-col items-center gap-1.5">
                          <div className="group relative">
                            <div className="border-2 border-cyan-400/40 group-hover:border-cyan-400/80 rounded-full w-16 h-16 overflow-hidden transition-all">
                              <ImageWithFallback
                                src={artist.image}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div 
                              className="-top-1 -right-1 absolute flex justify-center items-center bg-blue-700 border-2 border-white/20 rounded-full w-5 h-5 font-bold text-white text-xs"
                            >
                              {index + 1}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-white text-xs">{artist.name}</div>
                            <div className="text-white/50 text-xs">{artist.plays} plays</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    ) : (
                      <div className="mb-4 py-8 text-white/50 text-sm text-center">
                        No artist data available yet
                      </div>
                    )}
                    
                    {/* #4 and #5 Artists - Smaller */}
                    {topArtists.length > 3 && (
                    <div className="flex justify-around">
                      {topArtists.slice(3, 5).map((artist: TopArtist, index: number) => (
                        <div key={index} className="flex flex-col items-center gap-1.5">
                          <div className="group relative">
                            <div className="border-2 border-cyan-400/30 group-hover:border-cyan-400/60 rounded-full w-12 h-12 overflow-hidden transition-all">
                              <ImageWithFallback
                                src={artist.image}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div 
                              className="-top-1 -right-1 absolute flex justify-center items-center bg-blue-700 border-2 border-white/20 rounded-full w-4 h-4 font-bold text-white text-xs"
                            >
                              {index + 4}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-white text-xs">{artist.name}</div>
                            <div className="text-white/50 text-xs">{artist.plays} plays</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top 5 Genres - Right column - Changed to purple */}
                <Card className="border-purple-500/30 glass-effect">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-purple-400 text-base">
                      <Disc3 className="w-4 h-4" />
                      Top 5 Genres
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topGenres.map((genre: TopGenre, index: number) => (
                      <div key={index} className="relative">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span 
                              className="flex justify-center items-center bg-purple-500 rounded-full w-5 h-5 font-bold text-white text-xs"
                            >
                              {index + 1}
                            </span>
                            <span className="font-medium text-white text-xs">{genre.name}</span>
                          </div>
                          <span className="text-white/60 text-xs">{genre.count}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="bg-white/10 rounded-full w-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-purple-500 rounded-full h-full transition-all duration-500"
                            style={{ 
                              width: `${genre.percentage * 3}%`,
                              boxShadow: '0 0 8px rgba(168, 85, 247, 0.5)'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Key Takeaways & Recommendations - 3 Tabs */}
            <Card className="bg-linear-to-br from-green-900/10 to-emerald-900/10 border-green-500/30 glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400 text-xl">
                  <Target className="w-5 h-5" />
                  Key Takeaways & Recommendations
                </CardTitle>
                <p className="mt-2 text-white/60 text-sm">
                  Actionable insights for future events
                </p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="recommendations" className="w-full">
                  <TabsList className="grid grid-cols-3 border border-white/20 w-full glass-effect">
                    <TabsTrigger value="recommendations" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                      Actionable Recommendations
                    </TabsTrigger>
                    <TabsTrigger value="worked" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                      What Worked Well
                    </TabsTrigger>
                    <TabsTrigger value="didnt-work" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                      What Didn't Work
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Actionable Recommendations */}
                  <TabsContent value="recommendations" className="mt-6">
                    <div className="p-5 border border-cyan-500/30 rounded-lg glass-effect">
                      <h3 className="flex items-center gap-2 mb-3 font-bold text-cyan-400">
                        <Lightbulb className="w-5 h-5" />
                        Actionable Recommendations
                      </h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-white/80 text-sm">
                          <span className="mt-1 text-cyan-400">→</span>
                          <span><strong className="text-white">RSVP Management:</strong> Implement automated SMS/email reminders 48 hours and 24 hours before events to improve attendance accuracy.</span>
                        </li>
                        <li className="flex items-start gap-2 text-white/80 text-sm">
                          <span className="mt-1 text-cyan-400">→</span>
                          <span><strong className="text-white">Venue Selection:</strong> Scout venues with 25% more capacity (110-120 people) to accommodate space concerns while maintaining intimate atmosphere.</span>
                        </li>
                        <li className="flex items-start gap-2 text-white/80 text-sm">
                          <span className="mt-1 text-cyan-400">→</span>
                          <span><strong className="text-white">Music Strategy:</strong> Based on 96% APS for "Blinding Lights", increase 80s-inspired tracks and synth-heavy music in playlists by 20%.</span>
                        </li>
                        <li className="flex items-start gap-2 text-white/80 text-sm">
                          <span className="mt-1 text-cyan-400">→</span>
                          <span><strong className="text-white">Guest Experience:</strong> 18 guests wanted "Longer Event". Consider extending by 1 hour or offering optional late-night session for engaged attendees.</span>
                        </li>
                        <li className="flex items-start gap-2 text-white/80 text-sm">
                          <span className="mt-1 text-cyan-400">→</span>
                          <span><strong className="text-white">Retention Strategy:</strong> 61% of attendees were returning guests. Create a loyalty program or early-access system to reward repeat attendees.</span>
                        </li>
                      </ul>
                    </div>
                  </TabsContent>

                  {/* Tab 2: What Worked Well - 2 columns */}
                  <TabsContent value="worked" className="mt-6">
                    <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                      <div className="p-5 border border-green-500/30 rounded-lg glass-effect">
                        <h3 className="flex items-center gap-2 mb-3 font-bold text-green-400">
                          <CheckCircle2 className="w-5 h-5" />
                          What Worked Well
                        </h3>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="mt-1 text-green-400">•</span>
                            <span><strong className="text-white">Peak Hour Energy:</strong> The 10:30 PM - 12:00 AM window showed 95% crowd music cohesion. Continue focusing high-energy tracks during this period.</span>
                          </li>
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="mt-1 text-green-400">•</span>
                            <span><strong className="text-white">Guest Retention:</strong> Average attendance was 3.2 hours - 25% longer than typical events. The music selection and atmosphere kept guests engaged.</span>
                          </li>
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="mt-1 text-green-400">•</span>
                            <span><strong className="text-white">DJ Performance:</strong> 92% satisfaction score indicates excellent track selection and mixing. Continue current style and song transitions.</span>
                          </li>
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="mt-1 text-green-400">•</span>
                            <span><strong className="text-white">Top Party Anthems:</strong> "Blinding Lights" (96% APS) was the night's biggest hit. More 80s-inspired modern tracks resonated well.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Word Cloud - What guests liked most - No border/fill */}
                      <div className="p-6">
                        <h4 className="flex justify-center items-center gap-2 mb-4 font-bold text-cyan-400">
                          <ThumbsUp className="w-4 h-4" />
                          What did you like most?
                        </h4>
                        {likedMostWords.length > 0 ? (
                          <WordCloud 
                            words={likedMostWords} 
                            colors={['#00d9ff', '#ff006e', '#7b2cbf', '#00f5ff', '#ffd60a']}
                          />
                        ) : (
                          <div className="py-8 text-white/50 text-sm text-center">
                            No feedback analysis available yet
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 3: What Didn't Work - 2 columns */}
                  <TabsContent value="didnt-work" className="mt-6">
                    <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                      <div className="p-5 border border-orange-500/30 rounded-lg glass-effect">
                        <h3 className="flex items-center gap-2 mb-3 font-bold text-orange-400">
                          <AlertCircle className="w-5 h-5" />
                          What Didn't Work
                        </h3>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="mt-1 text-orange-400">•</span>
                            <span><strong className="text-white">RSVP Accuracy:</strong> Only 58% of RSVPs attended (87 of 150). Consider sending reminder messages 24 hours before the event.</span>
                          </li>
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="mt-1 text-orange-400">•</span>
                            <span><strong className="text-white">Venue Capacity:</strong> 28 guests mentioned "More Space" as an improvement. Consider larger venue for next event or cap attendance.</span>
                          </li>
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="mt-1 text-orange-400">•</span>
                            <span><strong className="text-white">Climate Control:</strong> 22 guests mentioned "Better AC" in feedback. Work with venue on improved cooling systems.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Word Cloud - What could be improved - No border/fill */}
                      <div className="p-6">
                        <h4 className="flex justify-center items-center gap-2 mb-4 font-bold text-orange-400">
                          <Lightbulb className="w-4 h-4" />
                          What could be improved?
                        </h4>
                        <WordCloud 
                          words={improveWords} 
                          colors={['#ff006e', '#00d9ff', '#7b2cbf', '#ffd60a', '#00f5ff']}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button
                onClick={() => alert('Downloading report...')}
                variant="outline"
                className="border-cyan-500/40 hover:border-cyan-400/60 text-white glass-effect"
              >
                <Download className="mr-2 w-4 h-4" />
                Download Full Report
              </Button>
              <Button
                onClick={() => alert('Sharing...')}
                variant="outline"
                className="border-purple-500/40 hover:border-purple-400/60 text-white glass-effect"
              >
                <Share2 className="mr-2 w-4 h-4" />
                Share Summary
              </Button>
            </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="z-[10000] fixed inset-0 flex justify-center items-center bg-black/98 backdrop-blur-sm p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="top-4 right-4 absolute flex justify-center items-center hover:bg-white/10 border border-white/20 hover:border-white/40 rounded-full w-10 h-10 transition-all glass-effect"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="w-full max-w-4xl">
            <ImageWithFallback
              src={selectedPhoto}
              alt="Party photo full size"
              className="rounded-lg w-full h-auto"
            />
          </div>
        </motion.div>
      )}
    </>
  );
}
