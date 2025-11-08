import { useEffect } from 'react';
import { AppMode } from '../utils/types';
import { TIMEOUTS } from '../utils/constants';

const preloadMap: Record<AppMode, string[]> = {
  'landing': ['./components/LoginPage', './components/SignupPage'],
  'host-login': ['./components/HostDashboard', './components/DJLogin'],
  'signup': ['./components/EventCreation'],
  'host-dashboard': ['./components/EventCreation', './components/EventEditor', './components/HostGreeting'],
  'dj-login': ['./components/DJGreeting', './components/DJDashboard'],
  'create-event': ['./components/HostGreeting'],
  'edit-event': ['./components/HostGreeting'],
  'guest-flow': [],
  'dj-greeting': ['./components/DJDashboard', './components/QRCodeDisplay', './components/PlaylistConnection'],
  'host-greeting': ['./components/DJDashboard', './components/QRCodeDisplay', './components/PlaylistConnection'],
  'dj-dashboard': ['./components/QRCodeDisplay', './components/PlaylistConnection', './components/GuestFlow'],
  'qr-display': [],
  'playlist-connection': [],
  'spotify-connection-test': []
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
