/**
 * Performance Utilities
 * Caching, memoization, and performance monitoring utilities
 */

// ============================================================================
// CACHING UTILITIES
// ============================================================================

/**
 * Simple LRU (Least Recently Used) Cache implementation
 * Automatically evicts least recently used items when capacity is reached
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly capacity: number;

  constructor(capacity: number = 100) {
    this.cache = new Map();
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // Delete if exists to reinsert at end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Memoize expensive function calls with configurable cache
 */
export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  options: {
    maxSize?: number;
    getKey?: (...args: Args) => string;
  } = {}
): (...args: Args) => Result {
  const cache = new LRUCache<string, Result>(options.maxSize || 100);
  const getKey = options.getKey || ((...args: Args) => JSON.stringify(args));

  return (...args: Args): Result => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Simple performance timer
 */
export class PerformanceTimer {
  private startTime: number = 0;
  private marks: Map<string, number> = new Map();

  start(): void {
    this.startTime = performance.now();
    this.marks.clear();
  }

  mark(label: string): void {
    this.marks.set(label, performance.now() - this.startTime);
  }

  end(label?: string): number {
    const elapsed = performance.now() - this.startTime;
    if (label) {
      console.log(`[Performance] ${label}: ${elapsed.toFixed(2)}ms`);
    }
    return elapsed;
  }

  getMarks(): Map<string, number> {
    return new Map(this.marks);
  }

  logMarks(): void {
    console.log('[Performance Marks]');
    this.marks.forEach((time, label) => {
      console.log(`  ${label}: ${time.toFixed(2)}ms`);
    });
  }
}

/**
 * Measure component render time (for debugging)
 */
export function measureRender(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    return () => {
      const elapsed = performance.now() - startTime;
      if (elapsed > 16) { // Log if slower than 60fps
        console.warn(`[Slow Render] ${componentName}: ${elapsed.toFixed(2)}ms`);
      }
    };
  }
  return () => {}; // No-op in production
}

// ============================================================================
// DATA STRUCTURE UTILITIES
// ============================================================================

/**
 * Create a fast lookup map from an array
 * O(1) lookups instead of O(n)
 */
export function createLookupMap<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T> {
  const map = new Map<K, T>();
  for (const item of items) {
    map.set(keyFn(item), item);
  }
  return map;
}

/**
 * Create an index for multiple keys
 * Useful for filtering by multiple criteria
 */
export function createMultiIndex<T, K extends string | number>(
  items: T[],
  keyFns: Array<(item: T) => K>
): Map<K, T[]> {
  const index = new Map<K, T[]>();
  
  for (const item of items) {
    for (const keyFn of keyFns) {
      const key = keyFn(item);
      const existing = index.get(key) || [];
      existing.push(item);
      index.set(key, existing);
    }
  }
  
  return index;
}

/**
 * Batch updates to avoid multiple re-renders
 */
export function batchUpdates<T>(
  updates: Array<() => T>
): T[] {
  // In React 18+, updates are automatically batched
  // This is a helper for explicit batching if needed
  return updates.map(update => update());
}

// ============================================================================
// SPECIFIC CACHING INSTANCES
// ============================================================================

// Album cover cache - never evict, these are deterministic
const albumCoverCache = new Map<string, string>();

export function getCachedAlbumCover(
  songId: string,
  generator: (id: string) => string
): string {
  if (!albumCoverCache.has(songId)) {
    albumCoverCache.set(songId, generator(songId));
  }
  return albumCoverCache.get(songId)!;
}

// Harmonic key compatibility cache
const harmonicCache = new LRUCache<string, any>(50);

export function getCachedHarmonicInfo(
  key1: string,
  key2: string,
  calculator: (k1: string, k2: string) => any
): any {
  const cacheKey = `${key1}:${key2}`;
  
  if (!harmonicCache.has(cacheKey)) {
    harmonicCache.set(cacheKey, calculator(key1, key2));
  }
  
  return harmonicCache.get(cacheKey);
}

// Filter results cache - clear when filters change
let filterCacheKey = '';
const filterCache = new Map<string, any[]>();

export function getCachedFilterResults<T>(
  items: T[],
  filters: any,
  filterFn: (items: T[], filters: any) => T[]
): T[] {
  const newCacheKey = JSON.stringify(filters);
  
  // Clear cache if filters changed
  if (newCacheKey !== filterCacheKey) {
    filterCache.clear();
    filterCacheKey = newCacheKey;
  }
  
  const itemsKey = items.map((item: any) => item.id).join(',');
  
  if (!filterCache.has(itemsKey)) {
    filterCache.set(itemsKey, filterFn(items, filters));
  }
  
  return filterCache.get(itemsKey)!;
}

// ============================================================================
// PERFORMANCE BEST PRACTICES
// ============================================================================

/**
 * Check if an object has changed (shallow comparison)
 * Useful for preventing unnecessary re-renders
 */
export function hasChanged<T extends Record<string, any>>(
  prev: T,
  next: T,
  keys?: (keyof T)[]
): boolean {
  const keysToCheck = keys || Object.keys(next) as (keyof T)[];
  
  for (const key of keysToCheck) {
    if (prev[key] !== next[key]) {
      return true;
    }
  }
  
  return false;
}

/**
 * Deep equality check (use sparingly, expensive)
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * Virtualization helper - calculate visible items
 */
export function getVisibleItems<T>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  overscan: number = 3
): {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  offsetY: number;
} {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const perfUtils = {
  LRUCache,
  memoize,
  debounce,
  throttle,
  PerformanceTimer,
  measureRender,
  createLookupMap,
  createMultiIndex,
  batchUpdates,
  getCachedAlbumCover,
  getCachedHarmonicInfo,
  getCachedFilterResults,
  hasChanged,
  deepEqual,
  getVisibleItems
};

export default perfUtils;
