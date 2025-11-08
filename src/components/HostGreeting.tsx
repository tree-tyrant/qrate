import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Crown, Timer, Users, ArrowRight, QrCode, Music, Megaphone } from 'lucide-react';
import PromotionModal from './PromotionModal';

interface HostGreetingProps {
  event: {
    id: string;
    eventName?: string;
    name?: string;
    eventTheme?: string;
    theme?: string;
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
  };
  currentUser: string;
  onContinue: () => void;
  onBack: () => void;
}

export function HostGreeting({ event, currentUser, onContinue, onBack }: HostGreetingProps) {
  const [timeToParty, setTimeToParty] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false });
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);

  const eventName = event.eventName || event.name || 'Event';
  const eventTheme = event.eventTheme || event.theme || '';

  useEffect(() => {
    const calculateTimeToParty = () => {
      // Create event datetime from event date and time
      const eventDateTime = new Date(`${event.date}T${event.time}`);
      const now = new Date().getTime();
      const partyTime = eventDateTime.getTime();
      const difference = partyTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeToParty({ days, hours, minutes, seconds, isLive: false });
      } else {
        setTimeToParty({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true });
      }
    };

    calculateTimeToParty();
    const timer = setInterval(calculateTimeToParty, 1000);

    return () => clearInterval(timer);
  }, [event.date, event.time]);

  // Determine theme gradient colors
  const getThemeGradient = (theme: string) => {
    const themeLower = theme.toLowerCase();
    if (themeLower.includes('chill') || themeLower.includes('mellow')) {
      return 'from-green-900 via-teal-900 to-emerald-900';
    } else if (themeLower.includes('rave') || themeLower.includes('wild') || themeLower.includes('euphoric')) {
      return 'from-purple-900 via-pink-900 to-fuchsia-900';
    } else if (themeLower.includes('energetic') || themeLower.includes('upbeat')) {
      return 'from-orange-900 via-red-900 to-pink-900';
    } else if (themeLower.includes('romantic') || themeLower.includes('intimate')) {
      return 'from-pink-900 via-rose-900 to-purple-900';
    } else if (themeLower.includes('groovy') || themeLower.includes('retro')) {
      return 'from-yellow-900 via-orange-900 to-red-900';
    } else if (themeLower.includes('classy')) {
      return 'from-amber-900 via-yellow-900 to-orange-900';
    } else {
      return 'from-emerald-900 via-teal-900 to-cyan-900';
    }
  };

  const CountdownCard = ({ label, value }: { label: string; value: number }) => (
    <Card className="text-center glass-effect border-white/20">
      <CardContent className="p-3">
        <div className="text-3xl font-bold gradient-text">{value.toString().padStart(2, '0')}</div>
        <div className="text-xs text-white/70 uppercase tracking-wide">{label}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getThemeGradient(eventTheme)} flex items-center justify-center p-4`}>
      <div className="w-full max-w-2xl">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <CardTitle className="text-3xl text-white mb-2">
                Welcome back, {currentUser}!
              </CardTitle>
              <CardDescription className="text-xl text-emerald-100">
                {eventName}
                {event.location && (
                  <>
                    <br />
                    <span className="text-lg text-emerald-200">
                      📍 {event.location}
                    </span>
                  </>
                )}
              </CardDescription>
            </div>

            {/* Event Theme Badge */}
            {eventTheme && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none text-base px-4 py-1">
                <Music className="w-4 h-4 mr-2" />
                {eventTheme}
              </Badge>
            )}

            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Users className="w-4 h-4 mr-1" />
                {event.preferences?.length || 0} guests checked in
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Code: {event.code}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {timeToParty.isLive && event.status === 'live' ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">🎉 YOUR EVENT IS LIVE! 🎉</div>
                <p className="text-xl text-white">Time to host the perfect party!</p>
              </div>
            ) : event.status === 'past' ? (
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400 mb-2">📊 Event Completed</div>
                <p className="text-lg text-white">Review your event metrics and insights</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Timer className="w-5 h-5 text-teal-300" />
                    <h3 className="text-xl text-white">Event Starts In</h3>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
                    <CountdownCard label="Days" value={timeToParty.days} />
                    <CountdownCard label="Hours" value={timeToParty.hours} />
                    <CountdownCard label="Minutes" value={timeToParty.minutes} />
                    <CountdownCard label="Seconds" value={timeToParty.seconds} />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/10 rounded-lg p-4 space-y-3">
              <h4 className="text-lg font-semibold text-white">Host Checklist:</h4>
              <ul className="space-y-2 text-emerald-100">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full mt-2 flex-shrink-0"></div>
                  Share your event QR code for guest check-ins
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full mt-2 flex-shrink-0"></div>
                  Monitor real-time playlist recommendations
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full mt-2 flex-shrink-0"></div>
                  Connect your music streaming service for custom tracks
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full mt-2 flex-shrink-0"></div>
                  Use AI insights to keep the crowd engaged
                </li>
              </ul>
            </div>

            {/* Promotion Toolkit Button */}
            <Button
              onClick={() => setPromotionModalOpen(true)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white border-0"
              size="lg"
            >
              <Megaphone className="w-5 h-5 mr-2" />
              Promote Your Event
            </Button>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Back to Dashboard
              </Button>
              <Button 
                onClick={onContinue}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
              >
                Enter DJ Mode
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        open={promotionModalOpen}
        onClose={() => setPromotionModalOpen(false)}
        event={event}
      />
    </div>
  );
}

export default HostGreeting;
