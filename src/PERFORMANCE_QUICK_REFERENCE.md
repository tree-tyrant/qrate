# Performance Optimization Quick Reference Card

## 🚀 Instant Performance Wins

### 1. Use Set for Membership Tests
```typescript
// ❌ Slow: O(n)
if (array.includes(item)) { }

// ✅ Fast: O(1)
if (set.has(item)) { }
```

### 2. Use Map for Lookups
```typescript
// ❌ Slow: O(n)
const item = array.find(x => x.id === id);

// ✅ Fast: O(1)
const item = map.get(id);
```

### 3. Memoize Expensive Calculations
```typescript
// ❌ Recalculated every render
const result = expensiveCalc(data);

// ✅ Only when data changes
const result = useMemo(() => expensiveCalc(data), [data]);
```

### 4. Stabilize Function References
```typescript
// ❌ New function every render
onClick={() => handleClick(id)}

// ✅ Stable reference
const handleClick = useCallback((id) => {...}, []);
onClick={() => handleClick(id)}
```

### 5. Cache Deterministic Functions
```typescript
// ❌ Recalculated every call
const result = pureFunction(input);

// ✅ Cached with LRU
const cachedFn = memoize(pureFunction, { maxSize: 100 });
const result = cachedFn(input);
```

## 📦 Performance Utilities Cheat Sheet

### Import Everything
```typescript
import {
  LRUCache,
  memoize,
  debounce,
  throttle,
  PerformanceTimer,
  measureRender,
  createLookupMap,
  getCachedAlbumCover,
  getCachedHarmonicInfo,
  getCachedFilterResults
} from './utils/performanceUtils';
```

### LRU Cache
```typescript
const cache = new LRUCache<string, any>(100);
cache.set(key, value);
const value = cache.get(key);
```

### Memoize Function
```typescript
const optimized = memoize(expensiveFn, { 
  maxSize: 50,
  getKey: (...args) => JSON.stringify(args)
});
```

### Debounce (Search Input)
```typescript
const debouncedSearch = debounce(searchFn, 300);
```

### Throttle (Scroll Handler)
```typescript
const throttledScroll = throttle(scrollFn, 100);
```

### Performance Timer
```typescript
const timer = new PerformanceTimer();
timer.start();
timer.mark('Step 1');
timer.mark('Step 2');
timer.logMarks();
```

### Measure Render
```typescript
useEffect(() => {
  const end = measureRender('ComponentName');
  return end;
});
```

### Create Lookup Map
```typescript
const map = createLookupMap(items, item => item.id);
```

## 🎯 Common Patterns

### Pattern: Fast Filter with Set
```typescript
const excluded = useMemo(() => 
  new Set(excludedItems.map(i => i.id)),
  [excludedItems]
);

const filtered = useMemo(() =>
  items.filter(i => !excluded.has(i.id)),
  [items, excluded]
);
```

### Pattern: Fast Lookup with Map
```typescript
const itemMap = useMemo(() => 
  new Map(items.map(i => [i.id, i])),
  [items]
);

const getItem = useCallback((id: string) =>
  itemMap.get(id),
  [itemMap]
);
```

### Pattern: Debounced Input
```typescript
const debouncedFn = useMemo(() => 
  debounce((value: string) => {
    performExpensiveOperation(value);
  }, 300),
  []
);

<input onChange={(e) => debouncedFn(e.target.value)} />
```

### Pattern: Throttled Scroll
```typescript
const handleScroll = useMemo(() =>
  throttle(() => {
    console.log('Scroll:', window.scrollY);
  }, 100),
  []
);

useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [handleScroll]);
```

## 📊 Performance Impact

| Optimization | Complexity | Impact | Use When |
|-------------|-----------|--------|----------|
| **Set lookup** | Low | High | Membership tests |
| **Map lookup** | Low | High | ID-based access |
| **useMemo** | Low | Medium | Expensive calculations |
| **useCallback** | Low | Low | Prevent child re-renders |
| **memoize** | Low | High | Pure functions |
| **debounce** | Low | High | User input |
| **throttle** | Low | High | Scroll/resize |
| **LRU Cache** | Medium | High | Frequent lookups |
| **React.memo** | Low | Medium | Expensive components |

## ⚡ When to Use What

### Use **Set** when:
- ✅ Checking if item exists
- ✅ Filtering by exclusion list
- ✅ Deduplication

### Use **Map** when:
- ✅ Looking up by ID
- ✅ Need key-value pairs
- ✅ Fast access to items

### Use **useMemo** when:
- ✅ Expensive calculations
- ✅ Creating arrays/objects
- ✅ Filtering/sorting large lists

### Use **useCallback** when:
- ✅ Passing functions to children
- ✅ Functions in dependency arrays
- ✅ Event handlers passed as props

### Use **memoize** when:
- ✅ Pure functions
- ✅ Frequently called
- ✅ Expensive computation

### Use **debounce** when:
- ✅ Search input
- ✅ Form validation
- ✅ API calls from input

### Use **throttle** when:
- ✅ Scroll handlers
- ✅ Resize handlers
- ✅ Mouse move tracking

### Use **React.memo** when:
- ✅ Expensive render
- ✅ Props change infrequently
- ✅ Pure component

## ❌ Common Mistakes

### Mistake 1: Memoizing Simple Operations
```typescript
// ❌ Don't do this
const doubled = useMemo(() => count * 2, [count]);

// ✅ Do this
const doubled = count * 2;
```

### Mistake 2: New Object in Dependencies
```typescript
// ❌ Creates new object every render
useMemo(() => calculate(data), [{ prop: value }]);

// ✅ Stable reference
const options = useMemo(() => ({ prop: value }), [value]);
useMemo(() => calculate(data), [options]);
```

### Mistake 3: Missing Dependencies
```typescript
// ❌ Missing dependency
useMemo(() => calculate(data, filters), [data]);

// ✅ All dependencies included
useMemo(() => calculate(data, filters), [data, filters]);
```

### Mistake 4: Inline Functions in Deps
```typescript
// ❌ New function every render
useEffect(() => {
  fetchData();
}, [() => fetchData()]);

// ✅ Stable reference
const fetchData = useCallback(() => {...}, []);
useEffect(() => {
  fetchData();
}, [fetchData]);
```

## 🎯 Decision Tree

```
Is it slow?
├─ No → Don't optimize
└─ Yes → Profile it
    ├─ Expensive calculation? → useMemo
    ├─ Frequent lookups? → Map/Set
    ├─ User input? → debounce
    ├─ Scroll/resize? → throttle
    ├─ Pure function? → memoize
    ├─ Expensive component? → React.memo
    └─ Frequent re-renders? → useCallback
```

## 📏 Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Initial Render | < 100ms | < 200ms |
| Re-render | < 16ms | < 50ms |
| User Input Response | < 100ms | < 300ms |
| List Rendering (100 items) | < 50ms | < 100ms |
| Filter Application | < 20ms | < 50ms |

## 🔍 Profiling Checklist

Before optimizing:
- [ ] Profile with React DevTools
- [ ] Measure with PerformanceTimer
- [ ] Check Chrome Performance tab
- [ ] Identify actual bottleneck
- [ ] Confirm it matters to users

After optimizing:
- [ ] Measure improvement
- [ ] Check memory usage
- [ ] Test on slower devices
- [ ] Verify no regressions
- [ ] Document changes

## 📚 Quick Links

- **Performance Utils**: `/utils/performanceUtils.ts`
- **Detailed Guide**: `/PERFORMANCE_OPTIMIZATIONS.md`
- **Examples**: `/PERFORMANCE_USAGE_EXAMPLES.md`
- **Summary**: `/PERFORMANCE_SUMMARY.md`

## 💡 One-Liners

```typescript
// Fast membership test
const has = new Set(items).has(item);

// Fast lookup
const item = new Map(items.map(i => [i.id, i])).get(id);

// Memoized calculation
const result = useMemo(() => calc(data), [data]);

// Stable function
const fn = useCallback(() => {...}, []);

// Debounced input
const search = useMemo(() => debounce(fn, 300), []);

// Throttled scroll
const scroll = useMemo(() => throttle(fn, 100), []);

// Cached function
const cached = memoize(fn, { maxSize: 100 });

// Performance check
const timer = new PerformanceTimer();
```

---

## 🎯 TL;DR

**Before any optimization:**
1. Profile first!
2. Identify bottleneck
3. Choose right tool
4. Measure improvement

**Top 3 wins:**
1. Set/Map for lookups → **O(1) instead of O(n)**
2. useMemo for calculations → **Only when changed**
3. debounce for input → **Avoid unnecessary work**

---

Keep this handy! 📌
