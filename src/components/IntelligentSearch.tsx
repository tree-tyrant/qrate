import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Music, X, Loader2, AlertCircle } from 'lucide-react';
import { searchTracks, TrackSearchResult } from '../utils/djWorkflow';

interface IntelligentSearchProps {
  onTrackSelected: (track: TrackSearchResult) => void;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function IntelligentSearch({ 
  onTrackSelected, 
  onClose,
  placeholder = "Search for track...",
  autoFocus = true,
  className = '' 
}: IntelligentSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-focus input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);
  
  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      
      try {
        const searchResults = await searchTracks(query, 10);
        setResults(searchResults);
        setSelectedIndex(0);
        
        if (searchResults.length === 0) {
          setError('No tracks found. Try a different search.');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectTrack(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
  };
  
  const handleSelectTrack = (track: TrackSearchResult) => {
    console.log('🎵 Track selected:', track.name);
    onTrackSelected(track);
    setQuery('');
    setResults([]);
  };
  
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
    inputRef.current?.focus();
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Search input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-20 h-12 text-base bg-input/50 border-2 border-border hover:border-accent focus:border-accent transition-colors"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 px-3 hover:bg-muted"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
      
      {/* Search results dropdown */}
      {(results.length > 0 || error) && (
        <div className="fixed left-0 right-0 mt-2 z-[99999] glass-effect rounded-xl border-2 border-border shadow-2xl max-h-96 overflow-y-auto"
          style={{
            top: inputRef.current ? `${inputRef.current.getBoundingClientRect().bottom + 8}px` : '100%',
            left: inputRef.current ? `${inputRef.current.getBoundingClientRect().left}px` : '0',
            width: inputRef.current ? `${inputRef.current.getBoundingClientRect().width}px` : 'auto'
          }}
        >
          {error && (
            <div className="p-4 flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {results.map((track, index) => (
            <button
              key={track.trackId}
              onClick={() => handleSelectTrack(track)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full p-3 flex items-center gap-3 text-left transition-all
                hover:bg-accent/10 border-b border-border/50 last:border-b-0
                ${index === selectedIndex ? 'bg-accent/20' : ''}
              `}
            >
              {/* Album art */}
              <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted">
                {track.albumArt ? (
                  <img 
                    src={track.albumArt} 
                    alt={track.album}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Track info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {track.name}
                  </p>
                  {track.explicit && (
                    <Badge variant="destructive" className="h-4 px-1 text-xs">
                      E
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artist}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate">
                  {track.album}
                  {track.releaseYear && ` • ${track.releaseYear}`}
                </p>
              </div>
              
              {/* Selected indicator */}
              {index === selectedIndex && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Keyboard hints */}
      {results.length > 0 && (
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Esc</kbd>
            <span>Cancel</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for "Playing Off-Book?" button
 */
export function OffBookSearch({ onTrackSelected }: { onTrackSelected: (track: TrackSearchResult) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="border-2 border-dashed border-muted-foreground/30 hover:border-accent hover:bg-accent/10 transition-all"
      >
        <Search className="w-4 h-4 mr-2" />
        Playing Off-Book?
      </Button>
    );
  }
  
  return (
    <div className="p-4 glass-effect rounded-xl border-2 border-accent/30 animate-slide-in">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-accent" />
          <h4 className="font-semibold text-foreground">Search Current Track</h4>
        </div>
      </div>
      
      <IntelligentSearch
        onTrackSelected={(track) => {
          onTrackSelected(track);
          setIsOpen(false);
        }}
        onClose={() => setIsOpen(false)}
        placeholder="Type track name or artist..."
        autoFocus={true}
      />
      
      <p className="mt-2 text-xs text-muted-foreground">
        Find and log tracks not in the QRate recommendations
      </p>
    </div>
  );
}
