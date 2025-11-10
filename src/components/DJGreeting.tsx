import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Music, Timer, Users, ArrowRight, DollarSign, MapPin, Calendar, Clock, QrCode, Sparkles } from 'lucide-react';
import { utils } from '../utils/api';
import type { Event as QRateEvent } from '@/utils/types';

type DJGreetingEvent = QRateEvent & {
  name?: string;
  theme?: string;
};

interface DJGreetingProps {
  event: DJGreetingEvent;
  onContinue: () => void;
  onBack: () => void;
}

function DJGreeting({ event, onContinue, onBack }: DJGreetingProps) {
  const [timeToParty, setTimeToParty] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false });

  const eventName = event.eventName || event.name || 'Your Event';
  const eventTheme = event.eventTheme || event.theme || 'Custom Vibes';

  // Tip Jar toggle state
  const [tipJarEnabled, setTipJarEnabled] = useState(() => {
    // Load from settings or default to true
    const stored = utils.storage.get(`qrate_settings_dj_${event.id}`) as { features?: { tipJarEnabled?: boolean } } | null | undefined;
    const settings = stored || { features: {} };
    return (settings.features && typeof settings.features.tipJarEnabled === 'boolean')
      ? settings.features.tipJarEnabled
      : true;
  });

  // Save tip jar setting when it changes
  const handleTipJarToggle = (checked: boolean) => {
    setTipJarEnabled(checked);
    // Ensure settings is typed with a features property
    const settings = (utils.storage.get(`qrate_settings_dj_${event.id}`) as { features?: { tipJarEnabled?: boolean } }) ?? { features: {} };
    if (typeof settings.features !== 'object' || settings.features === null) {
      settings.features = {};
    }
    settings.features.tipJarEnabled = checked;
    utils.storage.set(`qrate_settings_dj_${event.id}`, settings);
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'upcoming':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'past':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const CountdownCard = ({ label, value }: { label: string; value: number }) => (
    <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 hover:shadow-lg hover:shadow-purple-500/20 backdrop-blur-sm p-4 border border-purple-500/20 hover:border-purple-500/40 rounded-xl overflow-hidden transition-all duration-300">
      <div className="z-10 relative">
        <div className="bg-clip-text bg-gradient-to-br from-purple-400 to-purple-600 mb-1 font-bold text-transparent text-3xl">
          {value.toString().padStart(2, '0')}
        </div>
        <div className="font-medium text-gray-400 text-xs uppercase tracking-wider">{label}</div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4 min-h-screen">
      <div className="w-full max-w-3xl">
        <Card className="bg-gray-900/95 shadow-2xl shadow-purple-900/20 backdrop-blur-xl border border-gray-800/50">
          <CardHeader className="space-y-6 pb-6 text-center">
            {/* Icon with purple glow */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 opacity-50 blur-xl rounded-2xl animate-pulse"></div>
                <div className="relative flex justify-center items-center bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-purple-500/30 border border-purple-500/50 rounded-2xl w-16 h-16">
                  <Music className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <CardTitle className="font-bold text-white text-4xl tracking-tight">
                Welcome to the Booth, DJ!
              </CardTitle>
              <CardDescription className="font-medium text-gray-300 text-lg">
                {eventName}
              </CardDescription>
            </div>

            {/* Event Info Grid */}
            <div className="gap-3 grid grid-cols-1 md:grid-cols-2 mt-6">
              {event.location && (
                <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2.5 border border-gray-700/50 rounded-lg">
                  <MapPin className="flex-shrink-0 w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 text-sm truncate">{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2.5 border border-gray-700/50 rounded-lg">
                <Calendar className="flex-shrink-0 w-4 h-4 text-purple-400" />
                <span className="text-gray-300 text-sm">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2.5 border border-gray-700/50 rounded-lg">
                <Clock className="flex-shrink-0 w-4 h-4 text-purple-400" />
                <span className="text-gray-300 text-sm">{event.time}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2.5 border border-gray-700/50 rounded-lg">
                <QrCode className="flex-shrink-0 w-4 h-4 text-purple-400" />
                <span className="font-mono text-gray-300 text-sm">{event.code}</span>
              </div>
            </div>

            {/* Status and Stats */}
            <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(event.status)} border font-medium px-3 py-1`}
              >
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Badge>
              <Badge 
                variant="outline" 
                className="bg-purple-500/20 px-3 py-1 border-purple-500/30 font-medium text-purple-400"
              >
                <Users className="mr-1.5 w-3.5 h-3.5" />
                {event.guestCount || event.preferences?.length || 0} {event.guestCount === 1 ? 'Guest' : 'Guests'}
              </Badge>
              <Badge 
                variant="outline" 
                className="bg-purple-500/20 px-3 py-1 border-purple-500/30 font-medium text-purple-400"
              >
                <Sparkles className="mr-1.5 w-3.5 h-3.5" />
                {eventTheme}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-6">
            {timeToParty.isLive ? (
              <div className="bg-gradient-to-r from-emerald-500/10 to-purple-500/10 py-6 border border-emerald-500/30 rounded-xl text-center">
                <div className="bg-clip-text bg-gradient-to-r from-emerald-400 to-purple-400 mb-3 font-bold text-transparent text-4xl">
                  🎉 IT'S PARTY TIME! 🎉
                </div>
                <p className="font-medium text-gray-300 text-lg">The crowd is ready - let's make some magic!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex justify-center items-center gap-2 mb-6">
                    <Timer className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white text-xl">Time Until Party Starts</h3>
                  </div>
                  
                  <div className="gap-4 grid grid-cols-4 mx-auto max-w-md">
                    <CountdownCard label="Days" value={timeToParty.days} />
                    <CountdownCard label="Hours" value={timeToParty.hours} />
                    <CountdownCard label="Minutes" value={timeToParty.minutes} />
                    <CountdownCard label="Seconds" value={timeToParty.seconds} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="space-y-3 bg-gradient-to-br from-gray-800/50 to-gray-800/30 p-5 border border-purple-500/20 rounded-xl">
              <h4 className="flex items-center gap-2 font-semibold text-white text-lg">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Quick Tips for Tonight
              </h4>
              <ul className="space-y-2.5 text-gray-300">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/50 shadow-sm mt-1.5 rounded-full w-2 h-2"></div>
                  <span className="text-sm leading-relaxed">Connect your playlist to add your favorite tracks to the queue</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/50 shadow-sm mt-1.5 rounded-full w-2 h-2"></div>
                  <span className="text-sm leading-relaxed">AI suggestions will adapt based on guest preferences</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/50 shadow-sm mt-1.5 rounded-full w-2 h-2"></div>
                  <span className="text-sm leading-relaxed">Show the QR code to let guests share their music taste</span>
                </li>
              </ul>
            </div>

            {/* Tip Jar Toggle */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-5 border border-purple-500/30 hover:border-purple-500/50 rounded-xl transition-all duration-300">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="flex justify-center items-center bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20 border border-purple-400/30 rounded-xl w-11 h-11">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="tip-jar-toggle" className="font-medium text-white cursor-pointer">
                      Enable Tip Jar
                    </Label>
                    <p className="mt-0.5 text-gray-400 text-xs">
                      Let guests send tips with messages & requests
                    </p>
                  </div>
                </div>
                <Switch
                  id="tip-jar-toggle"
                  checked={tipJarEnabled}
                  onCheckedChange={handleTipJarToggle}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
              {tipJarEnabled && (
                <div className="bg-purple-500/10 mt-3 p-2.5 border border-purple-500/20 rounded-lg">
                  <p className="flex items-center gap-1.5 font-medium text-purple-400 text-xs">
                    <span className="text-purple-500">✓</span> Tip Jar enabled
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="flex-1 bg-gray-800/50 hover:bg-gray-800 border-gray-700 text-gray-300 hover:text-white transition-all duration-200"
              >
                Back
              </Button>
              <Button 
                onClick={onContinue}
                className="flex-1 bg-gradient-to-r from-purple-600 hover:from-purple-500 to-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 border-0 font-semibold text-white transition-all duration-200"
              >
                Start Mixing
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DJGreeting;