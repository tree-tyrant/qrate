import { useEffect } from 'react';
import { AppMode } from '@/utils/types';
import { TIMEOUTS } from '@/utils/constants';

const preloadMap: Record<AppMode, string[]> = {
  'landing': ['@/components/LoginPage', '@/components/SignupPage'],
  'host-login': ['@/components/HostDashboard', '@/components/DJSignupLogin'],
  'signup': ['@/components/EventCreation'],
  'host-dashboard': ['@/components/EventCreation', '@/components/EventEditor', '@/components/HostGreeting', '@/components/DJDashboard'],
  'dj-login': ['@/components/DJGreeting', '@/components/DJGig'],
  'create-event': ['@/components/HostGreeting'],
  'edit-event': ['@/components/HostGreeting'],
  'guest-flow': [],
  'dj-greeting': ['@/components/DJGig', '@/components/QRCodeDisplay', '@/components/PlaylistConnection'],
  'host-greeting': ['@/components/DJGig', '@/components/QRCodeDisplay', '@/components/PlaylistConnection'],
  'dj-dashboard': ['@/components/DJDashboard'],
  'dj-gig': ['@/components/QRCodeDisplay', '@/components/PlaylistConnection', '@/components/GuestFlow'],
  'qr-display': [],
  'playlist-connection': []
};

export function useComponentPreloader(mode: AppMode) {
  useEffect(() => {
    const componentsToPreload = preloadMap[mode] || [];
    
    const timer = setTimeout(() => {
      componentsToPreload.forEach(path => {
        import(path).catch(() => {});
      });
    }, TIMEOUTS.PRELOAD_DELAY);

    return () => clearTimeout(timer);
  }, [mode]);
}
