import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Settings, Bell, Music, Palette, Zap, Volume2, Eye, Save, RefreshCw, LogOut, DollarSign } from 'lucide-react';
import { utils } from '../utils/api';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'host' | 'dj';
  username?: string;
  onLogout?: () => void;
}

export default function SettingsDialog({ isOpen, onClose, userType, username, onLogout }: SettingsDialogProps) {
  // Load settings from localStorage or use defaults
  const loadSettings = () => {
    const saved = utils.storage.get(`qrate_settings_${userType}_${username || 'default'}`);
    return saved || {
      notifications: {
        guestJoins: true,
        eventReminders: true,
        playlistUpdates: true,
        soundEffects: true
      },
      features: {
        tipJarEnabled: true
      },
      display: {
        theme: 'synthwave',
        animationsEnabled: true,
        compactMode: false,
        showGuestNames: true
      },
      audio: {
        volume: 80,
        autoPlay: false,
        crossfade: true
      },
      performance: {
        reducedMotion: false,
        lowDataMode: false
      }
    };
  };

  const [settings, setSettings] = useState(loadSettings());
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    utils.storage.set(`qrate_settings_${userType}_${username || 'default'}`, settings);
    setHasChanges(false);
    
    // Apply performance settings immediately
    if (settings.performance.reducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
    }
    
    onClose();
  };

  const resetSettings = () => {
    const defaults = {
      notifications: {
        guestJoins: true,
        eventReminders: true,
        playlistUpdates: true,
        soundEffects: true
      },
      features: {
        tipJarEnabled: true
      },
      display: {
        theme: 'synthwave',
        animationsEnabled: true,
        compactMode: false,
        showGuestNames: true
      },
      audio: {
        volume: 80,
        autoPlay: false,
        crossfade: true
      },
      performance: {
        reducedMotion: false,
        lowDataMode: false
      }
    };
    setSettings(defaults);
    setHasChanges(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-border/50 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center bg-[rgba(0,0,0,0.97)]">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div className="bg-[rgba(0,0,0,0)]">
              <DialogTitle className="gradient-text text-2xl">
                {userType === 'host' ? 'Host Settings' : 'DJ Booth Settings'}
              </DialogTitle>
              <DialogDescription>
                Customize your QRate experience
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Notifications</h3>
            </div>
            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="guest-joins">Guest Joins</Label>
                  <p className="text-sm text-muted-foreground">Get notified when guests check in</p>
                </div>
                <Switch
                  id="guest-joins"
                  checked={settings.notifications.guestJoins}
                  onCheckedChange={(checked) => updateSetting('notifications', 'guestJoins', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="event-reminders">Event Reminders</Label>
                  <p className="text-sm text-muted-foreground">Reminders for upcoming events</p>
                </div>
                <Switch
                  id="event-reminders"
                  checked={settings.notifications.eventReminders}
                  onCheckedChange={(checked) => updateSetting('notifications', 'eventReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="playlist-updates">Playlist Updates</Label>
                  <p className="text-sm text-muted-foreground">New song recommendations</p>
                </div>
                <Switch
                  id="playlist-updates"
                  checked={settings.notifications.playlistUpdates}
                  onCheckedChange={(checked) => updateSetting('notifications', 'playlistUpdates', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-effects">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">UI interaction sounds</p>
                </div>
                <Switch
                  id="sound-effects"
                  checked={settings.notifications.soundEffects}
                  onCheckedChange={(checked) => updateSetting('notifications', 'soundEffects', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Features Section - DJ Only */}
          {userType === 'dj' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold">Features</h3>
                </div>
                <div className="space-y-3 pl-7">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="tip-jar">Tip Jar</Label>
                      <p className="text-sm text-muted-foreground">Allow guests to send tips with messages</p>
                    </div>
                    <Switch
                      id="tip-jar"
                      checked={settings.features?.tipJarEnabled ?? true}
                      onCheckedChange={(checked) => updateSetting('features', 'tipJarEnabled', checked)}
                    />
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Display Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold">Display</h3>
            </div>
            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme">Theme</Label>
                  <p className="text-sm text-muted-foreground">Choose your visual style</p>
                </div>
                <Select
                  value={settings.display.theme}
                  onValueChange={(value) => updateSetting('display', 'theme', value)}
                >
                  <SelectTrigger id="theme" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="synthwave">
                      Synthwave <Badge className="ml-2">Default</Badge>
                    </SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="midnight">Midnight Blue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="animations">Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable smooth transitions</p>
                </div>
                <Switch
                  id="animations"
                  checked={settings.display.animationsEnabled}
                  onCheckedChange={(checked) => updateSetting('display', 'animationsEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Denser information display</p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={settings.display.compactMode}
                  onCheckedChange={(checked) => updateSetting('display', 'compactMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-guest-names">Show Guest Names</Label>
                  <p className="text-sm text-muted-foreground">Display who suggested songs</p>
                </div>
                <Switch
                  id="show-guest-names"
                  checked={settings.display.showGuestNames}
                  onCheckedChange={(checked) => updateSetting('display', 'showGuestNames', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Audio Section - DJ Only */}
          {userType === 'dj' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold">Audio</h3>
                </div>
                <div className="space-y-3 pl-7">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="volume">Preview Volume</Label>
                      <span className="text-sm text-muted-foreground">{settings.audio.volume}%</span>
                    </div>
                    <input
                      id="volume"
                      type="range"
                      min="0"
                      max="100"
                      value={settings.audio.volume}
                      onChange={(e) => updateSetting('audio', 'volume', parseInt(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-play">Auto-play Next</Label>
                      <p className="text-sm text-muted-foreground">Automatically play next track</p>
                    </div>
                    <Switch
                      id="auto-play"
                      checked={settings.audio.autoPlay}
                      onCheckedChange={(checked) => updateSetting('audio', 'autoPlay', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="crossfade">Crossfade</Label>
                      <p className="text-sm text-muted-foreground">Smooth transitions between tracks</p>
                    </div>
                    <Switch
                      id="crossfade"
                      checked={settings.audio.crossfade}
                      onCheckedChange={(checked) => updateSetting('audio', 'crossfade', checked)}
                    />
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Performance Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold">Performance</h3>
            </div>
            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduced-motion">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">Minimize animations for better performance</p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={settings.performance.reducedMotion}
                  onCheckedChange={(checked) => updateSetting('performance', 'reducedMotion', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="low-data-mode">Low Data Mode</Label>
                  <p className="text-sm text-muted-foreground">Reduce data usage</p>
                </div>
                <Switch
                  id="low-data-mode"
                  checked={settings.performance.lowDataMode}
                  onCheckedChange={(checked) => updateSetting('performance', 'lowDataMode', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Account Section */}
        {onLogout && (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-destructive" />
                <h3 className="text-lg font-semibold">Account</h3>
              </div>
              <div className="pl-7">
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="glass-effect border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={resetSettings}
            className="glass-effect border-muted-foreground/30 hover:border-destructive/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="glass-effect"
            >
              Cancel
            </Button>
            <Button
              onClick={saveSettings}
              disabled={!hasChanges}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
