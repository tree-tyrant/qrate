import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Settings, Filter, Zap, Music, Heart, Clock, UserX, Calendar, Volume2, Moon, PartyPopper, Home } from 'lucide-react';
import { eventApi } from '../utils/api';

interface SmartFiltersProps {
  eventCode: string;
  currentFilters: any;
  hostPreferences?: any;
  onFiltersUpdated: (filters: any) => void;
}

function SmartFilters({ eventCode, currentFilters, hostPreferences, onFiltersUpdated }: SmartFiltersProps) {
  // Initialize filters from host's vibe profile if available
  const getInitialFilters = () => {
    const baseFilters = {
      // Content Filter
      noExplicit: false,
      
      // Repetition Velocity Control
      preventArtistRepetition: true,
      artistCooldownMinutes: 30,
      
      // Eras Bias (decades)
      eraMinDecade: 1980,
      eraMaxDecade: 2020,
      eraFilterEnabled: false,
      
      // Energy & Vibe Controls
      minEnergy: 0,
      maxEnergy: 100,
      minDanceability: 0,
      maxDanceability: 100,
      minValence: 0,
      maxValence: 100,
      
      // Other filters
      vocalFocus: false,
      harmonicFlow: false, // Harmonic mixing feature
    };

    // If we have host preferences (vibeProfile), initialize from them
    if (hostPreferences) {
      // Map vibe profile to smart filters
      if (hostPreferences.allowExplicit === false) {
        baseFilters.noExplicit = true;
      }

      // Map energy range (0-1 to 0-100)
      if (hostPreferences.energy) {
        baseFilters.minEnergy = Math.round((hostPreferences.energy.min || 0) * 100);
        baseFilters.maxEnergy = Math.round((hostPreferences.energy.max || 1) * 100);
      }

      // Map danceability range
      if (hostPreferences.danceability) {
        baseFilters.minDanceability = Math.round((hostPreferences.danceability.min || 0) * 100);
        baseFilters.maxDanceability = Math.round((hostPreferences.danceability.max || 1) * 100);
      }

      // Map year range to era filter
      if (hostPreferences.yearRange) {
        if (hostPreferences.yearRange.min) {
          baseFilters.eraMinDecade = Math.floor(hostPreferences.yearRange.min / 10) * 10;
          baseFilters.eraFilterEnabled = true;
        }
        if (hostPreferences.yearRange.max) {
          baseFilters.eraMaxDecade = Math.floor(hostPreferences.yearRange.max / 10) * 10;
          baseFilters.eraFilterEnabled = true;
        }
      }
    }

    // Override with current filters if they exist (DJ has already customized)
    return { ...baseFilters, ...currentFilters };
  };

  const [filters, setFilters] = useState(getInitialFilters());
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Update filters when hostPreferences change (but only if DJ hasn't customized yet)
  useEffect(() => {
    if (hostPreferences && Object.keys(currentFilters).length === 0) {
      const newFilters = getInitialFilters();
      setFilters(newFilters);
    }
  }, [hostPreferences]);

  const updateFilter = async (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setIsUpdating(true);

    try {
      const response = await eventApi.updateSmartFilters(eventCode, newFilters);
      if (response.success) {
        onFiltersUpdated(newFilters);
      }
    } catch (error) {
      console.error('Failed to update smart filters:', error);
      // Revert on error
      setFilters(filters);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateMultipleFilters = async (newFilters: any) => {
    setFilters(newFilters);
    setIsUpdating(true);

    try {
      const response = await eventApi.updateSmartFilters(eventCode, newFilters);
      if (response.success) {
        onFiltersUpdated(newFilters);
      }
    } catch (error) {
      console.error('Failed to update smart filters:', error);
      setFilters(filters);
    } finally {
      setIsUpdating(false);
    }
  };

  const applyPreset = (preset: Partial<typeof filters>) => {
    const newFilters = { ...filters, ...preset };
    updateMultipleFilters(newFilters);
  };

  const activeFiltersCount = [
    filters.noExplicit,
    filters.preventArtistRepetition,
    filters.eraFilterEnabled,
    filters.minEnergy > 0 || filters.maxEnergy < 100,
    filters.minDanceability > 0 || filters.maxDanceability < 100,
    filters.minValence > 0 || filters.maxValence < 100,
    filters.vocalFocus,
    filters.harmonicFlow
  ].filter(Boolean).length;

  const decades = [1960, 1970, 1980, 1990, 2000, 2010, 2020];
  
  return (
    <div className="space-y-6">

      {/* Host Preferences - Show if available */}
      {hostPreferences && (
        <Card className="glass-effect border-[var(--neon-cyan)]/50 bg-gradient-to-br from-[var(--neon-cyan)]/10 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Home className="w-5 h-5 text-[var(--neon-cyan)]" />
              Host's Preferences
              <Badge className="ml-2 bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30 text-xs">
                Can Override
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              The host set these preferences when creating this event. You can manually adjust filters to override.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vibe Themes */}
            {hostPreferences.keywords && hostPreferences.keywords.length > 0 && (
              <div>
                <Label className="text-sm text-gray-300 mb-2 block">Vibe Themes</Label>
                <div className="flex flex-wrap gap-2">
                  {hostPreferences.keywords.map((keyword: string) => (
                    <Badge key={keyword} className="bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Allowed Genres */}
            {hostPreferences.allowedGenres && hostPreferences.allowedGenres.length > 0 && (
              <div>
                <Label className="text-sm text-gray-300 mb-2 block">Allowed Genres</Label>
                <div className="flex flex-wrap gap-2">
                  {hostPreferences.allowedGenres.map((genre: string) => (
                    <Badge key={genre} className="bg-[var(--neon-purple)]/20 text-[var(--neon-purple)] border-[var(--neon-purple)]/30">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Era Range */}
            {hostPreferences.yearRange && (hostPreferences.yearRange.min || hostPreferences.yearRange.max) && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-[var(--glass-border)]">
                <span className="text-sm text-gray-300">Era Range</span>
                <Badge className="bg-[var(--neon-yellow)]/20 text-[var(--neon-yellow)] border-[var(--neon-yellow)]/30">
                  {hostPreferences.yearRange.min || '1960'}s - {hostPreferences.yearRange.max || '2020'}s
                </Badge>
              </div>
            )}
            
            {/* Energy & Danceability */}
            <div className="grid grid-cols-2 gap-3">
              {hostPreferences.energy && (hostPreferences.energy.min !== undefined || hostPreferences.energy.max !== undefined) && (
                <div className="p-3 rounded-lg bg-black/20 border border-[var(--glass-border)]">
                  <Label className="text-xs text-gray-400 mb-1 block">Energy</Label>
                  <Badge className="bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] border-[var(--neon-pink)]/30 text-xs">
                    {Math.round((hostPreferences.energy.min || 0) * 100)}% - {Math.round((hostPreferences.energy.max || 1) * 100)}%
                  </Badge>
                </div>
              )}
              
              {hostPreferences.danceability && (hostPreferences.danceability.min !== undefined || hostPreferences.danceability.max !== undefined) && (
                <div className="p-3 rounded-lg bg-black/20 border border-[var(--glass-border)]">
                  <Label className="text-xs text-gray-400 mb-1 block">Danceability</Label>
                  <Badge className="bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] border-[var(--neon-pink)]/30 text-xs">
                    {Math.round((hostPreferences.danceability.min || 0) * 100)}% - {Math.round((hostPreferences.danceability.max || 1) * 100)}%
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Explicit Content */}
            {hostPreferences.allowExplicit !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-[var(--glass-border)]">
                <span className="text-sm text-gray-300">Explicit Content</span>
                <Badge className={hostPreferences.allowExplicit ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                  {hostPreferences.allowExplicit ? 'Allowed' : 'Blocked'}
                </Badge>
              </div>
            )}
            
            {/* Strictness */}
            {hostPreferences.strictness && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-[var(--glass-border)]">
                <span className="text-sm text-gray-300">Adherence Level</span>
                <Badge className="bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30 capitalize">
                  {hostPreferences.strictness}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator className="bg-[var(--glass-border)]" />

      {/* Quick Presets */}
      <Card className="glass-effect border-[var(--glass-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-[var(--neon-yellow)]" />
            Quick Presets
          </CardTitle>
          <CardDescription className="text-gray-400">
            One-click configurations for common scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset({
                noExplicit: true,
                preventArtistRepetition: true,
                artistCooldownMinutes: 45,
                eraFilterEnabled: false,
                minEnergy: 0,
                maxEnergy: 100,
                minDanceability: 0,
                maxDanceability: 100,
                minValence: 40,
                maxValence: 100,
                vocalFocus: false
              })}
              className="glass-effect border-[var(--neon-cyan)]/30 hover:border-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Family Friendly
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset({
                noExplicit: false,
                preventArtistRepetition: true,
                artistCooldownMinutes: 20,
                eraFilterEnabled: false,
                minEnergy: 70,
                maxEnergy: 100,
                minDanceability: 70,
                maxDanceability: 100,
                minValence: 0,
                maxValence: 100,
                vocalFocus: false
              })}
              className="glass-effect border-[var(--neon-pink)]/30 hover:border-[var(--neon-pink)] hover:bg-[var(--neon-pink)]/10 text-white"
            >
              <PartyPopper className="w-4 h-4 mr-2" />
              Peak Hour
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset({
                noExplicit: false,
                preventArtistRepetition: true,
                artistCooldownMinutes: 30,
                eraFilterEnabled: false,
                minEnergy: 0,
                maxEnergy: 50,
                minDanceability: 0,
                maxDanceability: 100,
                minValence: 20,
                maxValence: 60,
                vocalFocus: true
              })}
              className="glass-effect border-[var(--neon-purple)]/30 hover:border-[var(--neon-purple)] hover:bg-[var(--neon-purple)]/10 text-white"
            >
              <Moon className="w-4 h-4 mr-2" />
              Cool Down
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset({
                noExplicit: false,
                preventArtistRepetition: true,
                artistCooldownMinutes: 30,
                eraMinDecade: 1980,
                eraMaxDecade: 2000,
                eraFilterEnabled: true,
                minEnergy: 0,
                maxEnergy: 100,
                minDanceability: 0,
                maxDanceability: 100,
                minValence: 0,
                maxValence: 100,
                vocalFocus: false
              })}
              className="glass-effect border-[var(--neon-yellow)]/30 hover:border-[var(--neon-yellow)] hover:bg-[var(--neon-yellow)]/10 text-white"
            >
              <Clock className="w-4 h-4 mr-2" />
              Throwback Hour
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-[var(--glass-border)]" />

      {/* Content Filter */}
      <Card className="glass-effect border-[var(--glass-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Heart className="w-5 h-5 text-[var(--neon-cyan)]" />
            Content Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/30 transition-all">
            <div className="flex-1">
              <Label htmlFor="noExplicit" className="text-white cursor-pointer font-medium">
                Clean Lyrics Only
              </Label>
              <p className="text-sm text-gray-400 mt-1">
                Excludes any tracks flagged with explicit content warning
              </p>
            </div>
            <Switch
              id="noExplicit"
              checked={filters.noExplicit}
              onCheckedChange={(checked) => updateFilter('noExplicit', checked)}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[var(--neon-cyan)]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Repetition Velocity Control */}
      <Card className="glass-effect border-[var(--glass-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <UserX className="w-5 h-5 text-[var(--neon-purple)]" />
            Repetition Velocity Control
          </CardTitle>
          <CardDescription className="text-gray-400">
            Prevent artist fatigue by spacing out repeated artists
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-[var(--glass-border)] hover:border-[var(--neon-purple)]/30 transition-all">
            <div className="flex-1">
              <Label htmlFor="preventArtistRepetition" className="text-white cursor-pointer font-medium">
                Enable Artist Cooldown
              </Label>
              <p className="text-sm text-gray-400 mt-1">
                Temporarily hide tracks from recently played artists
              </p>
            </div>
            <Switch
              id="preventArtistRepetition"
              checked={filters.preventArtistRepetition}
              onCheckedChange={(checked) => updateFilter('preventArtistRepetition', checked)}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[var(--neon-purple)]"
            />
          </div>

          {filters.preventArtistRepetition && (
            <div className="p-4 rounded-lg bg-black/20 border border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white font-medium">
                  Cooldown Period
                </Label>
                <Badge className="bg-[var(--neon-purple)]/20 text-[var(--neon-purple)] border-[var(--neon-purple)]/30">
                  {filters.artistCooldownMinutes} min
                </Badge>
              </div>
              <Slider
                value={[filters.artistCooldownMinutes]}
                onValueChange={(value) => updateFilter('artistCooldownMinutes', value[0])}
                min={10}
                max={120}
                step={10}
                className="w-full"
                disabled={isUpdating}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>10 min</span>
                <span>2 hours</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eras Bias */}
      <Card className="glass-effect border-[var(--glass-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-[var(--neon-yellow)]" />
            Eras Bias
          </CardTitle>
          <CardDescription className="text-gray-400">
            Filter tracks by their release decade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-[var(--glass-border)] hover:border-[var(--neon-yellow)]/30 transition-all">
            <div className="flex-1">
              <Label htmlFor="eraFilterEnabled" className="text-white cursor-pointer font-medium">
                Enable Era Filter
              </Label>
              <p className="text-sm text-gray-400 mt-1">
                Only show tracks from selected decades
              </p>
            </div>
            <Switch
              id="eraFilterEnabled"
              checked={filters.eraFilterEnabled}
              onCheckedChange={(checked) => updateFilter('eraFilterEnabled', checked)}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[var(--neon-yellow)]"
            />
          </div>

          {filters.eraFilterEnabled && (
            <div className="p-4 rounded-lg bg-black/20 border border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white font-medium">
                  Decade Range
                </Label>
                <Badge className="bg-[var(--neon-yellow)]/20 text-[var(--neon-yellow)] border-[var(--neon-yellow)]/30">
                  {filters.eraMinDecade}s - {filters.eraMaxDecade}s
                </Badge>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-300 mb-2 block">From Decade</Label>
                  <div className="grid grid-cols-7 gap-1">
                    {decades.map((decade) => (
                      <Button
                        key={decade}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newMin = decade;
                          const newMax = Math.max(newMin, filters.eraMaxDecade);
                          updateFilter('eraMinDecade', newMin);
                          if (newMax !== filters.eraMaxDecade) {
                            updateFilter('eraMaxDecade', newMax);
                          }
                        }}
                        className={`text-xs px-2 ${
                          filters.eraMinDecade === decade
                            ? 'bg-[var(--neon-yellow)]/20 border-[var(--neon-yellow)] text-[var(--neon-yellow)]'
                            : 'glass-effect border-[var(--glass-border)] text-gray-400 hover:text-white'
                        }`}
                        disabled={isUpdating}
                      >
                        {decade}s
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-300 mb-2 block">To Decade</Label>
                  <div className="grid grid-cols-7 gap-1">
                    {decades.map((decade) => (
                      <Button
                        key={decade}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newMax = decade;
                          const newMin = Math.min(newMax, filters.eraMinDecade);
                          updateFilter('eraMaxDecade', newMax);
                          if (newMin !== filters.eraMinDecade) {
                            updateFilter('eraMinDecade', newMin);
                          }
                        }}
                        className={`text-xs px-2 ${
                          filters.eraMaxDecade === decade
                            ? 'bg-[var(--neon-yellow)]/20 border-[var(--neon-yellow)] text-[var(--neon-yellow)]'
                            : 'glass-effect border-[var(--glass-border)] text-gray-400 hover:text-white'
                        }`}
                        disabled={isUpdating || decade < filters.eraMinDecade}
                      >
                        {decade}s
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Energy & Vibe Controls */}
      <Card className="glass-effect border-[var(--glass-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-[var(--neon-pink)]" />
            Energy & Vibe Controls
          </CardTitle>
          <CardDescription className="text-gray-400">
            Fine-tune the energy and mood of recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Energy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white font-medium">Energy Level</Label>
              <Badge className="bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] border-[var(--neon-pink)]/30">
                {filters.minEnergy}% - {filters.maxEnergy}%
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-black/20 border border-[var(--glass-border)]">
              <Slider
                value={[filters.minEnergy, filters.maxEnergy]}
                onValueChange={(value) => {
                  updateFilter('minEnergy', value[0]);
                  updateFilter('maxEnergy', value[1]);
                }}
                min={0}
                max={100}
                step={5}
                className="w-full"
                disabled={isUpdating}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Calm</span>
                <span>High Energy</span>
              </div>
            </div>
          </div>

          {/* Danceability */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white font-medium">Danceability</Label>
              <Badge className="bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30">
                {filters.minDanceability}% - {filters.maxDanceability}%
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-black/20 border border-[var(--glass-border)]">
              <Slider
                value={[filters.minDanceability, filters.maxDanceability]}
                onValueChange={(value) => {
                  updateFilter('minDanceability', value[0]);
                  updateFilter('maxDanceability', value[1]);
                }}
                min={0}
                max={100}
                step={5}
                className="w-full"
                disabled={isUpdating}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Chill</span>
                <span>Dance Floor</span>
              </div>
            </div>
          </div>

          {/* Valence (Mood) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white font-medium">Mood (Valence)</Label>
              <Badge className="bg-[var(--neon-purple)]/20 text-[var(--neon-purple)] border-[var(--neon-purple)]/30">
                {filters.minValence}% - {filters.maxValence}%
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-black/20 border border-[var(--glass-border)]">
              <Slider
                value={[filters.minValence, filters.maxValence]}
                onValueChange={(value) => {
                  updateFilter('minValence', value[0]);
                  updateFilter('maxValence', value[1]);
                }}
                min={0}
                max={100}
                step={5}
                className="w-full"
                disabled={isUpdating}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Melancholic</span>
                <span>Uplifting</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vocal Focus */}
      <Card className="glass-effect border-[var(--glass-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Volume2 className="w-5 h-5 text-[var(--neon-cyan)]" />
            Audio Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/30 transition-all">
            <div className="flex-1">
              <Label htmlFor="vocalFocus" className="text-white cursor-pointer font-medium">
                Vocal Focus
              </Label>
              <p className="text-sm text-gray-400 mt-1">
                Prioritize tracks with strong vocal presence
              </p>
            </div>
            <Switch
              id="vocalFocus"
              checked={filters.vocalFocus}
              onCheckedChange={(checked) => updateFilter('vocalFocus', checked)}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[var(--neon-cyan)]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Harmonic Flow */}
      <Card className="glass-effect border-[var(--glass-border)] mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Music className="w-5 h-5 text-[var(--neon-purple)]" />
            Harmonic Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-[var(--glass-border)] hover:border-[var(--neon-purple)]/30 transition-all">
            <div className="flex-1">
              <Label htmlFor="harmonicFlow" className="text-white cursor-pointer font-medium">
                Harmonic Mixing
              </Label>
              <p className="text-sm text-gray-400 mt-1">
                Filter suggestions to harmonically compatible tracks when a song is selected
              </p>
            </div>
            <Switch
              id="harmonicFlow"
              checked={filters.harmonicFlow}
              onCheckedChange={(checked) => updateFilter('harmonicFlow', checked)}
              disabled={isUpdating}
              className="data-[state=checked]:bg-[var(--neon-purple)]"
            />
          </div>
        </CardContent>
      </Card>

      {isUpdating && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-[var(--neon-cyan)] text-sm">
            <div className="w-4 h-4 border-2 border-[var(--neon-cyan)] border-t-transparent rounded-full animate-spin"></div>
            Updating filters...
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartFilters;
