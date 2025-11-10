import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { utils } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { VibeProfile, VibeStrictness } from '../utils/types';
import { createVibeProfileFromTheme, getVibeProfileDescription } from '../utils/vibeGate';
import { VibeGateDemo } from './VibeGateDemo';
import { Filter, Plus, X, Zap, Music, Calendar, Gauge, Activity, Sparkles, Ban, UserX } from 'lucide-react';

interface VibeGateConfiguratorProps {
  theme: string;
  eventName: string;
  vibeProfile?: VibeProfile;
  onChange: (profile: VibeProfile) => void;
  className?: string;
  selectedVibes?: string[];
  onVibeChange?: (vibes: string[]) => void;
}

const COMMON_GENRES = [
  'R&B', 'Hip-Hop', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Country', 
  'Latin', 'Dance', 'Funk', 'Soul', 'Reggae', 'Blues', 'Folk'
];

const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (item == null) {
        return '';
      }
      return String(item).trim();
    })
    .filter(Boolean);
};

const arraysEqual = (a: string[] = [], b: string[] = []) => {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const rangeEqual = (
  a?: { min?: number; max?: number },
  b?: { min?: number; max?: number }
) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.min === b.min && a.max === b.max;
};

const areProfilesEqual = (a: VibeProfile, b: VibeProfile) => {
  return (
    a.strictness === b.strictness &&
    a.allowExplicit === b.allowExplicit &&
    arraysEqual(a.allowedGenres, b.allowedGenres) &&
    arraysEqual(a.blockedGenres, b.blockedGenres) &&
    arraysEqual(a.blockedArtists, b.blockedArtists) &&
    arraysEqual(a.keywords, b.keywords) &&
    arraysEqual(a.excludeKeywords, b.excludeKeywords) &&
    rangeEqual(a.yearRange, b.yearRange) &&
    rangeEqual(a.tempoRange, b.tempoRange) &&
    rangeEqual(a.energy, b.energy) &&
    rangeEqual(a.danceability, b.danceability)
  );
};

function buildVibeProfile(
  theme: string,
  eventName: string,
  incoming?: Partial<VibeProfile> | null
): VibeProfile {
  const base = createVibeProfileFromTheme(theme, eventName);
  const merged = incoming ? { ...base, ...incoming } : base;

  return {
    ...merged,
    strictness: (merged.strictness as VibeStrictness) ?? 'loose',
    allowedGenres: sanitizeStringArray(merged.allowedGenres),
    blockedGenres: sanitizeStringArray(merged.blockedGenres),
    blockedArtists: sanitizeStringArray(merged.blockedArtists),
    keywords: sanitizeStringArray(merged.keywords),
    excludeKeywords: sanitizeStringArray(merged.excludeKeywords),
    allowExplicit: typeof merged.allowExplicit === 'boolean' ? merged.allowExplicit : true
  };
}

export const VibeGateConfigurator = memo(function VibeGateConfigurator({ 
  theme, 
  eventName, 
  vibeProfile, 
  onChange,
  className = '',
  selectedVibes = [],
  onVibeChange
}: VibeGateConfiguratorProps) {
  const [profile, setProfile] = useState<VibeProfile>(() => 
    buildVibeProfile(theme, eventName, vibeProfile)
  );
  const [genreInput, setGenreInput] = useState('');
  const [blockedGenreInput, setBlockedGenreInput] = useState('');
  const [blockedArtistInput, setBlockedArtistInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [excludeKeywordInput, setExcludeKeywordInput] = useState('');

  // Persistence key per event (best available identifier during creation)
  const persistenceKey = useMemo(() => `qrate_vibe_gate_${eventName || 'new'}`, [eventName]);

  // Load saved configuration (profile + selectedVibes)
  useEffect(() => {
    const saved = utils.storage.get(persistenceKey) as { profile?: VibeProfile; selectedVibes?: string[] } | null;
    if (!saved) return;
    if (saved.profile) {
      const hydratedProfile = buildVibeProfile(theme, eventName, saved.profile);
      setProfile(hydratedProfile);
      // also notify parent to stay in sync
      onChange(hydratedProfile);
    }
    if (saved.selectedVibes && Array.isArray(saved.selectedVibes) && onVibeChange) {
      onVibeChange(saved.selectedVibes);
    }
  }, [persistenceKey, onChange, onVibeChange, theme, eventName]);

  // Auto-generate profile when theme changes - Memoized to prevent unnecessary recalculations
  const autoProfile = useMemo(() => {
    if (!vibeProfile && (theme || eventName)) {
      return buildVibeProfile(theme, eventName);
    }
    return null;
  }, [vibeProfile, theme, eventName]);

  useEffect(() => {
    if (autoProfile) {
      setProfile(autoProfile);
      onChange(autoProfile);
    }
  }, [autoProfile, onChange]);

  // Notify parent of changes - Only when profile actually changes
  useEffect(() => {
    if (profile !== vibeProfile) {
      onChange(profile);
    }
  }, [profile, vibeProfile, onChange]);

  // Persist changes (profile + selectedVibes)
  useEffect(() => {
    utils.storage.set(persistenceKey, { profile, selectedVibes });
  }, [persistenceKey, profile, selectedVibes]);

  const updateProfile = useCallback((updates: Partial<VibeProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    const hydratedProfile = buildVibeProfile(theme, eventName, vibeProfile);
    setProfile(prev => (areProfilesEqual(prev, hydratedProfile) ? prev : hydratedProfile));
  }, [theme, eventName, vibeProfile]);

  const addGenre = useCallback((genre: string) => {
    if (genre && !profile.allowedGenres.includes(genre)) {
      updateProfile({ allowedGenres: [...profile.allowedGenres, genre] });
      setGenreInput('');
    }
  }, [profile.allowedGenres, updateProfile]);

  const removeGenre = useCallback((genre: string) => {
    updateProfile({ allowedGenres: profile.allowedGenres.filter(g => g !== genre) });
  }, [profile.allowedGenres, updateProfile]);

  const addBlockedGenre = useCallback((genre: string) => {
    const normalized = genre.trim();
    if (normalized && !profile.blockedGenres.includes(normalized)) {
      updateProfile({ blockedGenres: [...profile.blockedGenres, normalized] });
    }
    setBlockedGenreInput('');
  }, [profile.blockedGenres, updateProfile]);

  const removeBlockedGenre = useCallback((genre: string) => {
    updateProfile({ blockedGenres: profile.blockedGenres.filter(g => g !== genre) });
  }, [profile.blockedGenres, updateProfile]);

  const addBlockedArtist = useCallback((artist: string) => {
    const normalized = artist.trim();
    if (
      normalized &&
      !profile.blockedArtists.some(existing => existing.toLowerCase() === normalized.toLowerCase())
    ) {
      updateProfile({ blockedArtists: [...profile.blockedArtists, normalized] });
    }
    setBlockedArtistInput('');
  }, [profile.blockedArtists, updateProfile]);

  const removeBlockedArtist = useCallback((artist: string) => {
    updateProfile({ blockedArtists: profile.blockedArtists.filter(a => a !== artist) });
  }, [profile.blockedArtists, updateProfile]);

  const addKeyword = useCallback((keyword: string) => {
    if (keyword && !profile.keywords.includes(keyword)) {
      updateProfile({ keywords: [...profile.keywords, keyword] });
      setKeywordInput('');
    }
  }, [profile.keywords, updateProfile]);

  const removeKeyword = useCallback((keyword: string) => {
    updateProfile({ keywords: profile.keywords.filter(k => k !== keyword) });
  }, [profile.keywords, updateProfile]);

  const addExcludeKeyword = useCallback((keyword: string) => {
    if (keyword && !profile.excludeKeywords.includes(keyword)) {
      updateProfile({ excludeKeywords: [...profile.excludeKeywords, keyword] });
      setExcludeKeywordInput('');
    }
  }, [profile.excludeKeywords, updateProfile]);

  const removeExcludeKeyword = useCallback((keyword: string) => {
    updateProfile({ excludeKeywords: profile.excludeKeywords.filter(k => k !== keyword) });
  }, [profile.excludeKeywords, updateProfile]);

  const vibeThemes = useMemo(() => [
    { value: 'chill', label: 'Chill', color: 'from-green-500 to-teal-500' },
    { value: 'rave', label: 'Rave', color: 'from-purple-500 to-pink-600' },
    { value: 'energetic', label: 'Energetic', color: 'from-orange-500 to-red-500' },
    { value: 'romantic', label: 'Romantic', color: 'from-pink-400 to-rose-500' },
    { value: 'groovy', label: 'Groovy', color: 'from-yellow-500 to-orange-500' },
    { value: 'euphoric', label: 'Euphoric', color: 'from-cyan-500 to-blue-600' },
    { value: 'intimate', label: 'Intimate', color: 'from-purple-400 to-pink-400' },
    { value: 'upbeat', label: 'Upbeat', color: 'from-blue-500 to-cyan-500' },
    { value: 'mellow', label: 'Mellow', color: 'from-indigo-400 to-purple-400' },
    { value: 'wild', label: 'Wild', color: 'from-red-500 to-pink-600' },
    { value: 'classy', label: 'Classy', color: 'from-amber-600 to-yellow-600' },
    { value: 'retro', label: 'Retro', color: 'from-pink-500 to-purple-600' }
  ], []);

  const toggleVibe = useCallback((vibe: string) => {
    if (!onVibeChange) return;
    if (selectedVibes.includes(vibe)) {
      onVibeChange(selectedVibes.filter(v => v !== vibe));
    } else {
      onVibeChange([...selectedVibes, vibe]);
    }
  }, [selectedVibes, onVibeChange]);

  return (
    <Card className={`glass-effect border-border ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Filter className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-white">Vibe Gate Configuration</CardTitle>
            <CardDescription>
              Pre-filter tracks to maintain event vibe • {getVibeProfileDescription(profile)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Vibe Theme Selection */}
        {onVibeChange && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <Label>Select Vibe Theme</Label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {vibeThemes.map((vibe) => (
                <Button
                  key={vibe.value}
                  onClick={() => toggleVibe(vibe.value)}
                  variant={selectedVibes.includes(vibe.value) ? "default" : "outline"}
                  className={`
                    text-xs h-7 px-2.5
                    ${selectedVibes.includes(vibe.value) 
                      ? `bg-gradient-to-r ${vibe.color} border-none text-white shadow-lg` 
                      : 'glass-effect border-purple-500/30 hover:border-purple-500/60'
                    }
                  `}
                  size="sm"
                >
                  {vibe.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Strictness Control */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <Label>Strictness Level</Label>
          </div>
          <Select 
            value={profile.strictness} 
            onValueChange={(value: VibeStrictness) => updateProfile({ strictness: value })}
          >
            <SelectTrigger className="bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strict">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Strict</span>
                  <span className="text-muted-foreground text-xs">90%+ match required - Pure thematic focus</span>
                </div>
              </SelectItem>
              <SelectItem value="loose">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Loose</span>
                  <span className="text-muted-foreground text-xs">60%+ match required - Balanced filtering</span>
                </div>
              </SelectItem>
              <SelectItem value="open">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Open</span>
                  <span className="text-muted-foreground text-xs">30%+ match required - Flexible vibe</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Allowed Genres */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-primary" />
            <Label>Allowed Genres</Label>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add genre..."
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addGenre(genreInput);
                }
              }}
              className="bg-input border-border"
            />
            <Button 
              onClick={() => addGenre(genreInput)}
              size="icon"
              variant="secondary"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick add common genres */}
          <div className="flex flex-wrap gap-2">
            {COMMON_GENRES.filter(g => !profile.allowedGenres.includes(g)).map(genre => (
              <Badge
                key={genre}
                variant="outline"
                className="hover:bg-primary/20 cursor-pointer"
                onClick={() => addGenre(genre)}
              >
                + {genre}
              </Badge>
            ))}
          </div>
          
          {/* Selected genres */}
          {profile.allowedGenres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.allowedGenres.map(genre => (
                <Badge key={genre} variant="default" className="gap-1">
                  {genre}
                  <X 
                    className="w-3 h-3 hover:text-destructive cursor-pointer" 
                    onClick={() => removeGenre(genre)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Blocked Genres */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-destructive" />
            <Label>Blocked Genres</Label>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Block genre..."
              value={blockedGenreInput}
              onChange={(e) => setBlockedGenreInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addBlockedGenre(blockedGenreInput);
                }
              }}
              className="bg-input border-border"
            />
            <Button 
              onClick={() => addBlockedGenre(blockedGenreInput)}
              size="icon"
              variant="secondary"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {COMMON_GENRES.filter(g => !profile.blockedGenres.includes(g)).map(genre => (
              <Badge
                key={genre}
                variant="outline"
                className="hover:bg-destructive/20 cursor-pointer"
                onClick={() => addBlockedGenre(genre)}
              >
                + {genre}
              </Badge>
            ))}
          </div>

          {profile.blockedGenres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.blockedGenres.map(genre => (
                <Badge key={genre} variant="destructive" className="gap-1">
                  {genre}
                  <X 
                    className="w-3 h-3 hover:text-background cursor-pointer" 
                    onClick={() => removeBlockedGenre(genre)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Blocked Artists */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-destructive" />
            <Label>Blocked Artists</Label>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Explicit Content Artist..."
              value={blockedArtistInput}
              onChange={(e) => setBlockedArtistInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addBlockedArtist(blockedArtistInput);
                }
              }}
              className="bg-input border-border"
            />
            <Button 
              onClick={() => addBlockedArtist(blockedArtistInput)}
              size="icon"
              variant="secondary"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {profile.blockedArtists.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.blockedArtists.map(artist => (
                <Badge key={artist} variant="destructive" className="gap-1">
                  {artist}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeBlockedArtist(artist)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Eras */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <Label>Eras (Optional)</Label>
          </div>
          
          {/* Era quick select buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: '70s', min: 1970, max: 1979 },
              { label: '80s', min: 1980, max: 1989 },
              { label: '90s', min: 1990, max: 1999 },
              { label: '2000s', min: 2000, max: 2009 },
              { label: '2010s', min: 2010, max: 2019 },
              { label: '2020s', min: 2020, max: 2029 }
            ].map(era => {
              const isSelected = profile.yearRange?.min === era.min && profile.yearRange?.max === era.max;
              return (
                <Badge
                  key={era.label}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer ${isSelected ? 'bg-primary' : 'hover:bg-primary/20'}`}
                  onClick={() => updateProfile({
                    yearRange: isSelected ? {} : { min: era.min, max: era.max }
                  })}
                >
                  {era.label}
                </Badge>
              );
            })}
          </div>
          
          {/* Custom year range */}
          <div className="gap-3 grid grid-cols-2">
            <div>
              <Label className="text-muted-foreground text-xs">From Year</Label>
              <Input
                type="number"
                placeholder="1990"
                value={profile.yearRange?.min || ''}
                onChange={(e) => updateProfile({
                  yearRange: { 
                    ...profile.yearRange, 
                    min: e.target.value ? parseInt(e.target.value) : undefined 
                  }
                })}
                className="bg-input border-border"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">To Year</Label>
              <Input
                type="number"
                placeholder="1999"
                value={profile.yearRange?.max || ''}
                onChange={(e) => updateProfile({
                  yearRange: { 
                    ...profile.yearRange, 
                    max: e.target.value ? parseInt(e.target.value) : undefined 
                  }
                })}
                className="bg-input border-border"
              />
            </div>
          </div>
        </div>

        {/* Energy Range */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <Label>Energy Range</Label>
            </div>
            <span className="text-muted-foreground text-xs">
              {((profile.energy?.min || 0) * 100).toFixed(0)}% - {((profile.energy?.max || 1) * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[
              (profile.energy?.min || 0) * 100,
              (profile.energy?.max || 1) * 100
            ]}
            onValueChange={([min, max]: [number, number]) => updateProfile({
              energy: { min: min / 100, max: max / 100 }
            })}
            className="w-full"
          />
        </div>

        {/* Danceability Range */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-accent" />
              <Label>Danceability Range</Label>
            </div>
            <span className="text-muted-foreground text-xs">
              {((profile.danceability?.min || 0) * 100).toFixed(0)}% - {((profile.danceability?.max || 1) * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[
              (profile.danceability?.min || 0) * 100,
              (profile.danceability?.max || 1) * 100
            ]}
            onValueChange={([min, max]: [number, number]) => updateProfile({
              danceability: { min: min / 100, max: max / 100 }
            })}
            className="w-full"
          />
        </div>

        {/* Keywords */}
        <div className="space-y-3">
          <Label>Desired Keywords (Bonus Points)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., summer, sunset, beach..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword(keywordInput);
                }
              }}
              className="bg-input border-border"
            />
            <Button 
              onClick={() => addKeyword(keywordInput)}
              size="icon"
              variant="secondary"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {profile.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.keywords.map(keyword => (
                <Badge key={keyword} variant="secondary" className="gap-1">
                  {keyword}
                  <X 
                    className="w-3 h-3 hover:text-destructive cursor-pointer" 
                    onClick={() => removeKeyword(keyword)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Exclude Keywords */}
        <div className="space-y-3">
          <Label>Blocked Keywords (Hard Filter)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., explicit, christmas..."
              value={excludeKeywordInput}
              onChange={(e) => setExcludeKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addExcludeKeyword(excludeKeywordInput);
                }
              }}
              className="bg-input border-border"
            />
            <Button 
              onClick={() => addExcludeKeyword(excludeKeywordInput)}
              size="icon"
              variant="secondary"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {profile.excludeKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.excludeKeywords.map(keyword => (
                <Badge key={keyword} variant="destructive" className="gap-1">
                  {keyword}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeExcludeKeyword(keyword)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Explicit Content */}
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <Label>Allow Explicit Content</Label>
            <p className="text-muted-foreground text-xs">
              Allow songs with explicit lyrics
            </p>
          </div>
          <Switch
            checked={profile.allowExplicit}
            onCheckedChange={(checked: boolean) => updateProfile({ allowExplicit: checked })}
          />
        </div>

        {/* Live Demo */}
        <VibeGateDemo vibeProfile={profile} guestCount={25} />
      </CardContent>
    </Card>
  );
});
