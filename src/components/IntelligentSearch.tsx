import React, { useState, useEffect, useRef, memo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Music, X, Loader2, AlertCircle } from 'lucide-react';
import { searchTracks, TrackSearchResult } from '../utils/djWorkflow';
import { log } from '../utils/logger';

interface IntelligentSearchProps {
  onTrackSelected: (track: TrackSearchResult) => void;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export const IntelligentSearch = memo(function IntelligentSearch({ 
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
        log.error('Search error', err, 'IntelligentSearch');
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
    log.debug('Track selected', { trackName: track.name, trackId: track.trackId }, 'IntelligentSearch');
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
        <div className="top-1/2 left-3 absolute -translate-y-1/2 pointer-events-none">
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
          className="bg-input/50 pr-20 pl-10 border-2 border-border hover:border-accent focus:border-accent h-12 text-base transition-colors"
          aria-label="Search for tracks"
          aria-expanded={results.length > 0}
          aria-haspopup="listbox"
          role="combobox"
        />
        
        <div className="top-1/2 right-2 absolute flex items-center gap-1 -translate-y-1/2">
          {query && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="hover:bg-muted p-0 w-8 h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="hover:bg-muted px-3 h-8"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
      
      {/* Search results dropdown */}
      {(results.length > 0 || error) && (
        <div 
          className="right-0 left-0 z-99999 fixed shadow-2xl mt-2 border-2 border-border rounded-xl max-h-96 overflow-y-auto glass-effect"
          role="listbox"
          aria-label="Search results"
          style={{
            top: inputRef.current ? `${inputRef.current.getBoundingClientRect().bottom + 8}px` : '100%',
            left: inputRef.current ? `${inputRef.current.getBoundingClientRect().left}px` : '0',
            width: inputRef.current ? `${inputRef.current.getBoundingClientRect().width}px` : 'auto'
          }}
        >
          {error && (
            <div className="flex items-center gap-3 p-4 text-muted-foreground">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {results.map((track, index) => (
            <button
              key={track.trackId}
              onClick={() => handleSelectTrack(track)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
              className={`
                w-full p-3 flex items-center gap-3 text-left transition-all
                hover:bg-accent/10 border-b border-border/50 last:border-b-0
                ${index === selectedIndex ? 'bg-accent/20' : ''}
              `}
            >
              {/* Album art */}
              <div className="bg-muted rounded-md w-12 h-12 overflow-hidden shrink-0">
                {track.albumArt ? (
                  <img 
                    src={track.albumArt} 
                    alt={track.album}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex justify-center items-center w-full h-full">
                    <Music className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Track info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {track.name}
                  </p>
                  {track.explicit && (
                    <Badge variant="destructive" className="px-1 h-4 text-xs">
                      E
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs truncate">
                  {track.artist}
                </p>
                <p className="text-muted-foreground/70 text-xs truncate">
                  {track.album}
                  {track.releaseYear && ` • ${track.releaseYear}`}
                </p>
              </div>
              
              {/* Selected indicator */}
              {index === selectedIndex && (
                <div className="bg-accent rounded-full w-2 h-2 animate-pulse shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Keyboard hints */}
      {results.length > 0 && (
        <div className="flex items-center gap-4 mt-2 text-muted-foreground text-xs">
          <div className="flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 border border-border rounded">↑</kbd>
            <kbd className="bg-muted px-1.5 py-0.5 border border-border rounded">↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 border border-border rounded">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 border border-border rounded">Esc</kbd>
            <span>Cancel</span>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Compact version for "Playing Off-Book?" button
 */
export const OffBookSearch = memo(function OffBookSearch({ onTrackSelected }: { onTrackSelected: (track: TrackSearchResult) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="hover:bg-accent/10 border-2 border-muted-foreground/30 hover:border-accent border-dashed transition-all"
      >
        <Search className="mr-2 w-4 h-4" />
        Playing Off-Book?
      </Button>
    );
  }
  
  return (
    <div className="p-4 border-2 border-accent/30 rounded-xl animate-slide-in glass-effect">
      <div className="flex justify-between items-center mb-3">
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
      
      <p className="mt-2 text-muted-foreground text-xs">
        Find and log tracks not in the QRate recommendations
      </p>
    </div>
  );
});
