import image_148c46099e7d3e82d248f6523b35c4189abeab70 from 'figma:asset/148c46099e7d3e82d248f6523b35c4189abeab70.png';
import { useRef, useEffect, useState } from 'react';
import { Download, Share2, Users, Music, TrendingUp, Star, Clock, MapPin, X, ExternalLink, Image as ImageIcon, MessageSquare, Target, ThumbsUp, ThumbsDown, Lightbulb, CheckCircle2, AlertCircle, UserPlus, UserCheck, ChevronRight, Disc3 } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { utils } from '../utils/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import logoImage from 'figma:asset/08d0d06dd14cd5a887d78962b507773b63dedad4.png';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  MOCK_PHOTO_ALBUM, 
  MOCK_GUEST_FEEDBACK, 
  MOCK_PARTY_ANTHEMS,
  generateVibeTimeline 
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
}

// Mock data for new visualizations
const ratingHistogramData = [
  { stars: '1★', count: 2 },
  { stars: '2★', count: 3 },
  { stars: '3★', count: 8 },
  { stars: '4★', count: 28 },
  { stars: '5★', count: 46 },
];

const attendeeTypeData = [
  { name: 'New Attendees', value: 34, color: '#00d9ff' },
  { name: 'Returning', value: 53, color: '#7b2cbf' },
];

const likedMostWords = [
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
];

const improveWords = [
  { text: 'More Space', value: 28 },
  { text: 'Better AC', value: 22 },
  { text: 'Longer Event', value: 18 },
  { text: 'Food Options', value: 15 },
  { text: 'Parking', value: 12 },
  { text: 'Earlier Start', value: 10 },
  { text: 'Lighting', value: 8 },
];

const topGenres = [
  { name: 'Synthwave', count: 342, percentage: 32 },
  { name: 'Electronic Dance', count: 298, percentage: 28 },
  { name: 'Indie Pop', count: 256, percentage: 24 },
  { name: 'Retro Wave', count: 213, percentage: 20 },
  { name: 'Alt Rock', count: 187, percentage: 17 },
];

const topArtists = [
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
];

// Additional mock reviews with profile photos
const allGuestFeedback = [
  {
    name: 'Sarah Mitchell',
    rating: 5,
    feedback: 'Absolutely **amazing night!** The DJ knew exactly what the **crowd wanted**.',
    photo: 'https://images.unsplash.com/photo-1690444963408-9573a17a8058?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NjEwNTgwMTB8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    name: 'Mike Chen',
    rating: 5,
    feedback: '**Best party** I\'ve been to this year. The **vibe** was **perfect** from start to finish!',
    photo: 'https://images.unsplash.com/photo-1614917752523-3e61c00e5e68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMHNtaWxpbmd8ZW58MXx8fHwxNzYxMDY4MTMwfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    name: 'Alex Rodriguez',
    rating: 4,
    feedback: '**Great music choices** throughout the night. Would love more **variety** in the first hour next time.',
    photo: 'https://images.unsplash.com/photo-1656582117510-3a177bf866c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBwb3J0cmFpdCUyMGhhcHB5fGVufDF8fHx8MTc2MTA4OTU2NXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    name: 'Jessica Park',
    rating: 4,
    feedback: 'The **energy** was incredible and the DJ **read the crowd perfectly**. **Fantastic experience** overall!',
    photo: 'https://images.unsplash.com/photo-1675705444858-97005ce93298?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZmFjZXxlbnwxfHx8fDE3NjEwNjQzOTh8MA&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

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
      return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export function AfterpartySummary({ event, onClose }: AfterpartySummaryProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  console.log('🎉 AfterpartySummary component mounted for event:', event.eventName || event.name);

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

  // Calculate metrics
  const estimatedRSVPs = 150;
  const finalAttendance = event.guestCount || 87;
  const peakTime = '11:30 PM';
  const djScore = 92;
  const overallEventRating = 88;
  const avgAttendanceLength = 3.2; // hours
  const typicalLength = 2.5; // hours
  const percentLonger = Math.round(((avgAttendanceLength - typicalLength) / typicalLength) * 100);
  
  // Generate vibe timeline with guest count instead of energy
  const vibeTimelineData = [
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
  ];

  // Mock playlist URL
  const playlistUrl = 'https://open.spotify.com/playlist/retro-night-2024';

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
        <h4 className="text-sm text-white/80 mb-2">{title}</h4>
        {/* Value text on top */}
        <div className="text-3xl font-bold text-white mb-2">{animatedValue}%</div>
        <div className="relative h-32 flex items-center justify-center">
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
        {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
      </div>
    );
  };

  // Word Cloud Component - More cloud-like scattered layout
  const WordCloud = ({ words, colors }: { words: typeof likedMostWords, colors: string[] }) => {
    const sortedWords = [...words].sort((a, b) => b.value - a.value);
    
    return (
      <div className="flex flex-wrap gap-2 justify-center items-center p-4">
        {sortedWords.map((word, idx) => {
          const fontSize = 10 + (word.value / 5);
          const color = colors[idx % colors.length];
          return (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-full hover:scale-110 transition-all cursor-default inline-block"
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
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm overflow-y-auto" 
        onClick={(e) => {
          if (e.target === e.currentTarget && !selectedPhoto) {
            onClose();
          }
        }}
      >
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-10 w-10 h-10 rounded-full glass-effect border border-white/20 flex items-center justify-center hover:border-white/40 hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Report Content */}
        <div className="max-w-6xl mx-auto px-6 py-8 bg-[rgb(0,0,0)]">
          {/* Centered QRate Logo */}
          <div className="flex justify-center mb-6">
            <ImageWithFallback 
              src={image_148c46099e7d3e82d248f6523b35c4189abeab70} 
              alt="QRate" 
              className="h-30 w-auto object-contain"
            />
          </div>

          {/* Main Container with Header */}
          <div className="glass-effect border border-purple-500/30 rounded-2xl p-6 bg-gradient-to-br from-purple-900/10 to-pink-900/10">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-xl md:text-2xl font-bold gradient-text uppercase tracking-wide text-[32px]">
                Afterparty Summary
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {event.eventName || event.name} - {new Date(event.date).toLocaleDateString()}
              </p>
            </div>

            <div ref={reportRef} className="space-y-6">

            {/* Performance Metrics - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-[0px] mr-[0px] mb-[24px] ml-[0px]">
              {/* DJ Performance */}
              <Card className="glass-effect border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-400 text-sm flex flex-col items-center gap-2">
                    <Disc3 className="w-4 h-4" />
                    <span>DJ Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GaugeChart value={djScore} title="" subtitle="Based on guest feedback" />
                </CardContent>
              </Card>
              
              {/* Overall Event Rating */}
              <Card className="glass-effect border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-400 text-sm flex flex-col items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span>Overall Event Rating</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GaugeChart value={overallEventRating} title="" subtitle="Aggregate satisfaction score" />
                </CardContent>
              </Card>

              {/* Attendee Type Distribution */}
              <Card className="glass-effect border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-400 text-sm flex flex-col items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Attendee Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40">
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
                                  className="rounded-lg p-2 border"
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
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    {attendeeTypeData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs text-white/70">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Shared Photo Album - Moved above What Guests Are Saying, Polaroid style */}
            <Card className="glass-effect border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-purple-400 text-xl flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Shared Photo Album
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70 mb-4">
                  {MOCK_PHOTO_ALBUM.length} photos from the night
                </p>
                <div className="space-y-4">
                  {/* Top row - 4 photos */}
                  <div className="grid grid-cols-4 gap-4">
                    {MOCK_PHOTO_ALBUM.slice(0, 4).map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPhoto(photo)}
                        className="group relative bg-white p-3 rounded-sm shadow-lg hover:shadow-2xl transition-all hover:-rotate-1 hover:scale-105"
                        style={{
                          transform: `rotate(${index % 2 === 0 ? -1 : 1}deg)`
                        }}
                      >
                        <div className="aspect-square overflow-hidden bg-gray-200">
                          <ImageWithFallback
                            src={photo}
                            alt={`Party photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mt-2 h-12 flex items-center justify-center">
                          <span className="text-black text-lg leading-tight" style={{ fontFamily: 'Permanent Marker, cursive' }}>
                            {photoDescriptions[index]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Bottom row - 3 photos in first 3 cols, See More button below 4th photo */}
                  <div className="grid grid-cols-4 gap-4">
                    {/* Photos 5, 6, 7 */}
                    {[4, 5, 6].map((photoIndex) => (
                      <button
                        key={photoIndex}
                        onClick={() => setSelectedPhoto(MOCK_PHOTO_ALBUM[photoIndex])}
                        className="group relative bg-white p-3 rounded-sm shadow-lg hover:shadow-2xl transition-all hover:-rotate-1 hover:scale-105"
                        style={{
                          transform: `rotate(${photoIndex % 2 === 0 ? -1 : 1}deg)`
                        }}
                      >
                        <div className="aspect-square overflow-hidden bg-gray-200">
                          <ImageWithFallback
                            src={MOCK_PHOTO_ALBUM[photoIndex]}
                            alt={`Party photo ${photoIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mt-2 h-12 flex items-center justify-center">
                          <span className="text-black text-lg leading-tight" style={{ fontFamily: 'Permanent Marker, cursive' }}>
                            {photoDescriptions[photoIndex]}
                          </span>
                        </div>
                      </button>
                    ))}
                    
                    {/* See More Photos Button - Polaroid style - in the 4th column */}
                    <button
                      className="group relative bg-white p-3 rounded-sm shadow-lg hover:shadow-2xl transition-all hover:rotate-1 hover:scale-105"
                      style={{ transform: 'rotate(1deg)' }}
                    >
                      <div className="aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                        <ImageIcon className="w-10 h-10 text-purple-500 mb-2" />
                        <span className="text-sm text-purple-700 font-medium">+10 more</span>
                      </div>
                      <div className="mt-2 h-12 flex items-center justify-center">
                        <span className="text-black text-lg leading-tight" style={{ fontFamily: 'Permanent Marker, cursive' }}>
                          See More
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What Guests Are Saying - With Rating Distribution, 4 reviews in 2x2 */}
            <Card className="glass-effect border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-pink-400 text-xl flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  What Guests Are Saying
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left side - Guest reviews (2 columns, 4 reviews) */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allGuestFeedback.map((feedback, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-lg glass-effect border border-pink-400/20"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-pink-500/30">
                            <ImageWithFallback
                              src={feedback.photo}
                              alt={feedback.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white mb-1">{feedback.name}</div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: feedback.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-white/70 italic">"{feedback.feedback}"</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Right side - Rating Distribution */}
                  <div className="flex flex-col">
                    <div className="glass-effect border border-yellow-500/30 rounded-lg p-4 flex-1 flex flex-col items-center justify-center">
                      <h4 className="text-white/80 mb-3 text-center">Rating Distribution</h4>
                      <div className="h-40 w-full flex items-center justify-center">
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
                      </div>
                    </div>
                    
                    {/* See More Reviews Button */}
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="w-full glass-effect border-pink-500/40 hover:border-pink-400/60 text-white"
                      >
                        See 12 More Reviews
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vibe Timeline - With metrics on the right */}
            <Card className="glass-effect border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Vibe Timeline
                </CardTitle>
                <p className="text-sm text-white/60 mt-2">
                  Guest arrivals and crowd music cohesion throughout the night
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left - Timeline chart (2 columns) */}
                  <div className="md:col-span-2">
                    <div className="h-64">
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
                                  <div className="glass-effect border border-cyan-500/40 rounded-lg p-3 bg-[#1a1a2e]">
                                    <p className="text-white font-bold mb-2">{data.time}</p>
                                    {data.label && (
                                      <p className="text-yellow-400 text-sm font-bold mb-2">🎉 {data.label}</p>
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
                    </div>
                  </div>

                  {/* Right - Metrics (1 column) - Smaller/Compact */}
                  <div className="space-y-3">
                    <div className="glass-effect border border-blue-500/30 rounded-lg p-3 text-center">
                      <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <div className="text-xl font-bold text-white mb-1">{finalAttendance}</div>
                      <div className="text-xs text-white/60 mb-1">Final Attendance</div>
                      <div className="text-xs text-blue-300/60">vs. {estimatedRSVPs} RSVPs ({Math.round((finalAttendance/estimatedRSVPs)*100)}%)</div>
                      <div className="border-t border-blue-500/20 mt-2 pt-2">
                        <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                        <div className="text-lg font-bold gradient-text mb-1">{avgAttendanceLength}h</div>
                        <div className="text-xs text-white/60 mb-1">Avg. Length</div>
                        <div className="text-xs text-cyan-300/60">Stayed {percentLonger}% longer</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Music Insights (formerly Memories Package) */}
            <div className="glass-effect border border-white rounded-2xl p-6 bg-[#0f1a2e]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-white text-base font-normal">Music Insights</h2>
              </div>

              {/* Top 3 Party Anthems, Artists, and Genres - All in one row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Top 3 Party Anthems - Left column */}
                <Card className="glass-effect border-yellow-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-yellow-400 text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Top 3 Party Anthems
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-3">
                      {MOCK_PARTY_ANTHEMS.slice(0, 3).map((anthem, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg glass-effect border border-yellow-400/20"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-br from-yellow-600 to-orange-600' :
                            'bg-gradient-to-br from-yellow-700 to-orange-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate">{anthem.name}</div>
                            <div className="text-xs text-white/50 truncate">{anthem.artist}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-400">{anthem.aps}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Official Playlist - Compact */}
                    <div 
                      className="flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer hover:bg-white/5"
                      onClick={() => window.open(playlistUrl, '_blank')}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">See the official playlist</div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-green-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                {/* Top 5 Artists - Middle column - Darker blue badges */}
                <Card className="glass-effect border-cyan-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-cyan-400 text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Top 5 Artists
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Top 3 Artists - Larger */}
                    <div className="flex justify-around mb-4">
                      {topArtists.slice(0, 3).map((artist, index) => (
                        <div key={index} className="flex flex-col items-center gap-1.5">
                          <div className="relative group">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400/40 group-hover:border-cyan-400/80 transition-all">
                              <ImageWithFallback
                                src={artist.image}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div 
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white/20 bg-blue-700"
                            >
                              {index + 1}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-white font-medium">{artist.name}</div>
                            <div className="text-xs text-white/50">{artist.plays} plays</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* #4 and #5 Artists - Smaller */}
                    <div className="flex justify-around">
                      {topArtists.slice(3, 5).map((artist, index) => (
                        <div key={index} className="flex flex-col items-center gap-1.5">
                          <div className="relative group">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-400/30 group-hover:border-cyan-400/60 transition-all">
                              <ImageWithFallback
                                src={artist.image}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div 
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white/20 bg-blue-700"
                            >
                              {index + 4}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-white font-medium">{artist.name}</div>
                            <div className="text-xs text-white/50">{artist.plays} plays</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top 5 Genres - Right column - Changed to purple */}
                <Card className="glass-effect border-purple-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-purple-400 text-base flex items-center gap-2">
                      <Disc3 className="w-4 h-4" />
                      Top 5 Genres
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topGenres.map((genre, index) => (
                      <div key={index} className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-purple-500"
                            >
                              {index + 1}
                            </span>
                            <span className="text-xs text-white font-medium">{genre.name}</span>
                          </div>
                          <span className="text-xs text-white/60">{genre.count}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500 bg-purple-500"
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
            <Card className="glass-effect border-green-500/30 bg-gradient-to-br from-green-900/10 to-emerald-900/10">
              <CardHeader>
                <CardTitle className="text-green-400 text-xl flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Key Takeaways & Recommendations
                </CardTitle>
                <p className="text-sm text-white/60 mt-2">
                  Actionable insights for future events
                </p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="recommendations" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 glass-effect border border-white/20">
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
                    <div className="glass-effect border border-cyan-500/30 rounded-lg p-5">
                      <h3 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Actionable Recommendations
                      </h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-white/80 text-sm">
                          <span className="text-cyan-400 mt-1">→</span>
                          <span><strong className="text-white">RSVP Management:</strong> Implement automated SMS/email reminders 48 hours and 24 hours before events to improve attendance accuracy.</span>
                        </li>
                        <li className="flex items-start gap-2 text-white/80 text-sm">
                          <span className="text-cyan-400 mt-1">→</span>
                          <span><strong className="text-white">Venue Selection:</strong> Scout venues with 25% more capacity (110-120 people) to accommodate space concerns while maintaining intimate atmosphere.</span>
                        </li>
                        <li className="flex items-start gap-2 text-white/80 text-sm">
                          <span className="text-cyan-400 mt-1">→</span>
                          <span><strong className="text-white">Music Strategy:</strong> Based on 96% APS for "Blinding Lights", increase 80s-inspired tracks and synth-heavy music in playlists by 20%.</span>
                        </li>
                        <li className="flex items-start gap-2 text-white/80 text-sm">
                          <span className="text-cyan-400 mt-1">→</span>
                          <span><strong className="text-white">Guest Experience:</strong> 18 guests wanted "Longer Event". Consider extending by 1 hour or offering optional late-night session for engaged attendees.</span>
                        </li>
                        <li className="flex items-start gap-2 text-white/80 text-sm">
                          <span className="text-cyan-400 mt-1">→</span>
                          <span><strong className="text-white">Retention Strategy:</strong> 61% of attendees were returning guests. Create a loyalty program or early-access system to reward repeat attendees.</span>
                        </li>
                      </ul>
                    </div>
                  </TabsContent>

                  {/* Tab 2: What Worked Well - 2 columns */}
                  <TabsContent value="worked" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-effect border border-green-500/30 rounded-lg p-5">
                        <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          What Worked Well
                        </h3>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="text-green-400 mt-1">•</span>
                            <span><strong className="text-white">Peak Hour Energy:</strong> The 10:30 PM - 12:00 AM window showed 95% crowd music cohesion. Continue focusing high-energy tracks during this period.</span>
                          </li>
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="text-green-400 mt-1">•</span>
                            <span><strong className="text-white">Guest Retention:</strong> Average attendance was 3.2 hours - 25% longer than typical events. The music selection and atmosphere kept guests engaged.</span>
                          </li>
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="text-green-400 mt-1">•</span>
                            <span><strong className="text-white">DJ Performance:</strong> 92% satisfaction score indicates excellent track selection and mixing. Continue current style and song transitions.</span>
                          </li>
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="text-green-400 mt-1">•</span>
                            <span><strong className="text-white">Top Party Anthems:</strong> "Blinding Lights" (96% APS) was the night's biggest hit. More 80s-inspired modern tracks resonated well.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Word Cloud - What guests liked most - No border/fill */}
                      <div className="p-6">
                        <h4 className="text-cyan-400 font-bold mb-4 flex items-center justify-center gap-2">
                          <ThumbsUp className="w-4 h-4" />
                          What did you like most?
                        </h4>
                        <WordCloud 
                          words={likedMostWords} 
                          colors={['#00d9ff', '#ff006e', '#7b2cbf', '#00f5ff', '#ffd60a']}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 3: What Didn't Work - 2 columns */}
                  <TabsContent value="didnt-work" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-effect border border-orange-500/30 rounded-lg p-5">
                        <h3 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          What Didn't Work
                        </h3>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="text-orange-400 mt-1">•</span>
                            <span><strong className="text-white">RSVP Accuracy:</strong> Only 58% of RSVPs attended (87 of 150). Consider sending reminder messages 24 hours before the event.</span>
                          </li>
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="text-orange-400 mt-1">•</span>
                            <span><strong className="text-white">Venue Capacity:</strong> 28 guests mentioned "More Space" as an improvement. Consider larger venue for next event or cap attendance.</span>
                          </li>
                          <li className="flex items-start gap-2 text-white/80 text-sm">
                            <span className="text-orange-400 mt-1">•</span>
                            <span><strong className="text-white">Climate Control:</strong> 22 guests mentioned "Better AC" in feedback. Work with venue on improved cooling systems.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Word Cloud - What could be improved - No border/fill */}
                      <div className="p-6">
                        <h4 className="text-orange-400 font-bold mb-4 flex items-center justify-center gap-2">
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
            <div className="flex flex-wrap gap-3 justify-center pt-4">
              <Button
                onClick={() => alert('Downloading report...')}
                variant="outline"
                className="glass-effect border-cyan-500/40 hover:border-cyan-400/60 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Full Report
              </Button>
              <Button
                onClick={() => alert('Sharing...')}
                variant="outline"
                className="glass-effect border-purple-500/40 hover:border-purple-400/60 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
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
          className="fixed inset-0 z-[10000] bg-black/98 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full glass-effect border border-white/20 flex items-center justify-center hover:border-white/40 hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="max-w-4xl w-full">
            <ImageWithFallback
              src={selectedPhoto}
              alt="Party photo full size"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </motion.div>
      )}
    </>
  );
}
