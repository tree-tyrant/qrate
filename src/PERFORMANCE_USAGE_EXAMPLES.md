# Performance Optimization Usage Examples

## Quick Start Guide for Using Performance Utilities

### 1. Using LRU Cache

```typescript
import { LRUCache } from './utils/performanceUtils';

// Create a cache with max 100 entries
const imageCache = new LRUCache<string, string>(100);

// Use it
function getImage(id: string): string {
  if (imageCache.has(id)) {
    return imageCache.get(id)!;
  }
  
  const image = expensiveImageOperation(id);
  imageCache.set(id, image);
  return image;
}
```

### 2. Memoizing Expensive Functions

```typescript
import { memoize } from './utils/performanceUtils';

// Memoize a pure function
const calculateComplexScore = memoize(
  (track: Track, preferences: Preferences) => {
    // ... expensive calculation
    return score;
  },
  { 
    maxSize: 50,
    getKey: (track, prefs) => `${track.id}-${prefs.version}`
  }
);

// Use it
const score = calculateComplexScore(track, userPreferences);
```

### 3. Using useMemo for Expensive Computations

```typescript
import { useMemo } from 'react';

function MyComponent({ tracks, filters }: Props) {
  // Only recalculate when tracks or filters change
  const filteredTracks = useMemo(() => {
    return tracks
      .filter(track => matchesFilters(track, filters))
      .sort((a, b) => b.score - a.score);
  }, [tracks, filters]);

  // Use filteredTracks in render
}
```

### 4. Using useCallback for Stable Functions

```typescript
import { useCallback } from 'react';

function MyComponent({ onTrackSelected }: Props) {
  // Function reference stays the same unless dependencies change
  const handleTrackClick = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    onTrackSelected(track);
  }, [tracks, onTrackSelected]);

  return (
    <TrackList onTrackClick={handleTrackClick} />
  );
}
```

### 5. Creating Lookup Maps for Fast Access

```typescript
import { createLookupMap } from './utils/performanceUtils';

function MyComponent({ tracks }: Props) {
  // Create a map for O(1) lookups
  const trackMap = useMemo(() => 
    createLookupMap(tracks, track => track.id),
    [tracks]
  );

  // Fast lookup
  const getTrack = (id: string) => trackMap.get(id);
}
```

### 6. Using Set for Membership Tests

```typescript
import { useMemo } from 'react';

function MyComponent({ selectedTrackIds, allTracks }: Props) {
  // Create a Set for O(1) membership tests
  const selectedSet = useMemo(() => 
    new Set(selectedTrackIds),
    [selectedTrackIds]
  );

  // Fast check
  const isSelected = (trackId: string) => selectedSet.has(trackId);

  return allTracks.map(track => (
    <Track 
      key={track.id}
      track={track}
      isSelected={isSelected(track.id)} // O(1) instead of O(n)
    />
  ));
}
```

### 7. Debouncing User Input

```typescript
import { useMemo } from 'react';
import { debounce } from './utils/performanceUtils';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce the expensive search operation
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      performExpensiveSearch(term);
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  return <input value={searchTerm} onChange={handleInputChange} />;
}
```

### 8. Throttling Scroll Handlers

```typescript
import { useEffect, useMemo } from 'react';
import { throttle } from './utils/performanceUtils';

function ScrollComponent() {
  const handleScroll = useMemo(
    () => throttle((e: Event) => {
      // Handle scroll event
      console.log('Scroll position:', window.scrollY);
    }, 100), // Max once per 100ms
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return <div>Scrollable content</div>;
}
```

### 9. Performance Monitoring

```typescript
import { PerformanceTimer } from './utils/performanceUtils';

function expensiveOperation() {
  const timer = new PerformanceTimer();
  timer.start();

  // Step 1
  loadData();
  timer.mark('Data loaded');

  // Step 2
  processData();
  timer.mark('Data processed');

  // Step 3
  renderResults();
  timer.mark('Render complete');

  // Log all marks
  timer.logMarks();
  // Output:
  // [Performance Marks]
  //   Data loaded: 45.23ms
  //   Data processed: 123.45ms
  //   Render complete: 178.90ms
}
```

### 10. Measuring Component Render Time

```typescript
import { useEffect } from 'react';
import { measureRender } from './utils/performanceUtils';

function MyComponent() {
  useEffect(() => {
    const endMeasure = measureRender('MyComponent');
    return endMeasure;
  });

  // Component logic
  return <div>...</div>;
}

// In development, logs if render takes > 16ms (60fps threshold)
// [Slow Render] MyComponent: 23.45ms
```

### 11. Optimizing Large Lists

```typescript
import { useMemo } from 'react';
import { createLookupMap } from './utils/performanceUtils';

function LargeTrackList({ tracks, selectedIds }: Props) {
  // Create lookup structures
  const trackMap = useMemo(() => 
    createLookupMap(tracks, t => t.id),
    [tracks]
  );

  const selectedSet = useMemo(() => 
    new Set(selectedIds),
    [selectedIds]
  );

  // Render optimized
  return (
    <div>
      {tracks.map(track => (
        <TrackItem
          key={track.id}
          track={track}
          isSelected={selectedSet.has(track.id)} // O(1)
        />
      ))}
    </div>
  );
}
```

### 12. React.memo for Component Optimization

```typescript
import React from 'react';

// Prevent re-render if props haven't changed
const TrackItem = React.memo(({ track, isSelected }: Props) => {
  return (
    <div className={isSelected ? 'selected' : ''}>
      {track.name} - {track.artist}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison (optional)
  return prevProps.track.id === nextProps.track.id &&
         prevProps.isSelected === nextProps.isSelected;
});
```

### 13. Batching State Updates

```typescript
import { useState, useTransition } from 'react';

function MyComponent() {
  const [isPending, startTransition] = useTransition();
  const [urgentState, setUrgentState] = useState(0);
  const [nonUrgentState, setNonUrgentState] = useState(0);

  const handleClick = () => {
    // Urgent update (e.g., input value)
    setUrgentState(prev => prev + 1);

    // Non-urgent update (e.g., filtering)
    startTransition(() => {
      setNonUrgentState(prev => prev + 1);
    });
  };

  return <button onClick={handleClick}>Update</button>;
}
```

### 14. Virtualization for Very Long Lists

```typescript
import { getVisibleItems } from './utils/performanceUtils';
import { useState } from 'react';

function VirtualizedList({ items }: Props) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 600;
  const itemHeight = 50;

  const { visibleItems, offsetY } = getVisibleItems(
    items,
    scrollTop,
    containerHeight,
    itemHeight,
    3 // overscan
  );

  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={item.id} style={{ height: itemHeight }}>
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Cache + Memoize
```typescript
// For frequently called, expensive pure functions
const expensiveCalc = memoize(
  (input: ComplexInput) => {
    // expensive calculation
  },
  { maxSize: 100 }
);

// Use in component
const result = useMemo(() => 
  expensiveCalc(complexInput),
  [complexInput]
);
```

### Pattern 2: Set + Filter
```typescript
// Fast filtering with Set lookups
const excludedIds = useMemo(() => 
  new Set(itemsToExclude.map(i => i.id)),
  [itemsToExclude]
);

const filtered = useMemo(() =>
  allItems.filter(item => !excludedIds.has(item.id)),
  [allItems, excludedIds]
);
```

### Pattern 3: Map + Lookup
```typescript
// Fast lookups with Map
const itemMap = useMemo(() =>
  new Map(items.map(item => [item.id, item])),
  [items]
);

const getItem = useCallback((id: string) =>
  itemMap.get(id),
  [itemMap]
);
```

## Performance Checklist

Before optimizing, ask:
- [ ] Is this actually slow? (Profile first!)
- [ ] Is the optimization worth the complexity?
- [ ] Will this benefit users?

When optimizing:
- [ ] Use appropriate data structures (Set, Map)
- [ ] Memoize expensive computations
- [ ] Cache deterministic functions
- [ ] Use useCallback for functions passed as props
- [ ] Use React.memo for expensive components
- [ ] Debounce user input
- [ ] Throttle scroll/resize handlers
- [ ] Consider virtualization for long lists

## Common Mistakes to Avoid

### ❌ Over-memoization
```typescript
// Don't memoize simple operations
const doubled = useMemo(() => count * 2, [count]); // Overkill!

// Do this instead
const doubled = count * 2; // Fast enough!
```

### ❌ Wrong Dependencies
```typescript
// Missing dependency
const result = useMemo(() => {
  return calculate(data, filters); // filters not in deps!
}, [data]);

// Correct
const result = useMemo(() => {
  return calculate(data, filters);
}, [data, filters]);
```

### ❌ Memoizing Everything
```typescript
// Don't memoize unless necessary
const name = useMemo(() => user.name, [user]); // Wasteful!
```

### ❌ Creating New Objects in Dependencies
```typescript
// New object every render - useMemo is useless!
const result = useMemo(() => {
  return expensive(data);
}, [{ prop: value }]); // New object reference!

// Correct - stable reference
const options = useMemo(() => ({ prop: value }), [value]);
const result = useMemo(() => {
  return expensive(data);
}, [options]);
```

## Profiling Tools

### React DevTools Profiler
1. Open React DevTools
2. Go to Profiler tab
3. Click Record
4. Interact with app
5. Stop recording
6. Analyze flame graph

### Chrome Performance Tab
1. Open DevTools
2. Go to Performance tab
3. Click Record
4. Interact with app
5. Stop recording
6. Analyze timeline

### Console Timing
```typescript
console.time('operation');
expensiveOperation();
console.timeEnd('operation');
// Output: operation: 123.45ms
```

## Resources

- [React Performance Docs](https://react.dev/learn/render-and-commit)
- [useMemo Guide](https://react.dev/reference/react/useMemo)
- [useCallback Guide](https://react.dev/reference/react/useCallback)
- [React.memo Guide](https://react.dev/reference/react/memo)
- [Web Performance](https://web.dev/performance/)

---

**Remember**: Premature optimization is the root of all evil. Profile first, optimize what matters! 🚀
