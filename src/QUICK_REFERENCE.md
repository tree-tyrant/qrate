# DJDashboard Refactor - Quick Reference Guide

## 🎯 Quick Start

To use the refactored version immediately:

```bash
# Replace the original with refactored version
mv components/DJDashboard.tsx components/DJDashboard.old.tsx
mv components/DJDashboard.refactored.tsx components/DJDashboard.tsx

# Test the application
# (run your normal dev server)

# If everything works, clean up
rm components/DJDashboard.old.tsx
```

## 📁 File Map - Where to Find Things

### Need to modify STATE? 
→ `/hooks/useDJDashboardState.ts`

### Need to modify QUEUE operations?
→ `/hooks/useQueueManagement.ts`

### Need to modify AI RECOMMENDATIONS logic?
→ `/hooks/useEventInsightsManagement.ts`

### Need to modify DISCOVERY QUEUE?
→ `/hooks/useDiscoveryQueue.ts`

### Need to modify TIP JAR monitoring?
→ `/hooks/useTipManagement.ts`

### Need to modify FILTERS logic?
→ `/hooks/useSmartFilters.ts`

### Need to modify the HEADER?
→ `/components/dj-dashboard/DashboardHeader.tsx`

### Need to modify ACTION BUTTONS?
→ `/components/dj-dashboard/DashboardActions.tsx`

### Need to modify QUEUE SIDEBAR?
→ `/components/dj-dashboard/QueueSidebar.tsx`

### Need to modify RECOMMENDATIONS TAB?
→ `/components/dj-dashboard/RecommendationsTabContent.tsx`

### Need to modify DISCOVERY TAB?
→ `/components/dj-dashboard/DiscoveryTabContent.tsx`

### Need to modify CROWD INSIGHTS?
→ `/components/dj-dashboard/CrowdInsightsCard.tsx`

### Need to modify UTILITY FUNCTIONS?
→ `/utils/djDashboardHelpers.ts`

### Need to modify the MAIN COMPONENT?
→ `/components/DJDashboard.tsx` (or `.refactored.tsx`)

## 🔍 Common Tasks

### Adding a New State Variable
1. Go to `/hooks/useDJDashboardState.ts`
2. Add useState call
3. Add to return object
4. Update TypeScript interface if needed

### Adding a New Queue Operation
1. Go to `/hooks/useQueueManagement.ts`
2. Create new function
3. Export it in return object
4. Use it in main component

### Adding a New UI Section
1. Create new component in `/components/dj-dashboard/`
2. Import in main component
3. Place in appropriate tab or section

### Adding a New Utility Function
1. Add to `/utils/djDashboardHelpers.ts`
2. Export it
3. Import where needed

## 📊 Architecture Overview

```
DJDashboard (Main Component)
├── Custom Hooks (Business Logic)
│   ├── useDJDashboardState (State Management)
│   ├── useQueueManagement (Queue Operations)
│   ├── useEventInsightsManagement (AI Recommendations)
│   ├── useDiscoveryQueue (Discovery Queue)
│   ├── useTipManagement (Tips Monitoring)
│   └── useSmartFilters (Filter Logic)
│
├── UI Components (Presentation)
│   ├── DashboardHeader
│   ├── DashboardActions
│   ├── QueueSidebar
│   ├── RecommendationsTabContent
│   ├── DiscoveryTabContent
│   └── CrowdInsightsCard
│
└── Utilities (Helpers)
    └── djDashboardHelpers
```

## 🎨 Component Props Quick Reference

### DashboardHeader
```typescript
{
  eventName: string;
  eventCode: string;
  totalGuests: number;
  onBack: () => void;
  onShowQRCode: () => void;
  isLoading?: boolean;
}
```

### DashboardActions
```typescript
{
  totalTipAmount: number;
  hasNewTips: boolean;
  onOpenFilters: () => void;
  onOpenTipJar: () => void;
  onOpenSettings: () => void;
  isLoading?: boolean;
}
```

### QueueSidebar
```typescript
{
  currentQueue: Track[];
  currentSongIndex: number;
  trashedSongs: Track[];
  setCurrentQueue: (queue: Track[]) => void;
  setTrashedSongs: (songs: Track[]) => void;
  onPlaySong: (index: number) => void;
  onRemoveFromQueue: (songId: string) => void;
  onReturnToList: (songId: string, source) => void;
  onMoveItem: (dragIndex: number, hoverIndex: number) => void;
  onExport: () => void;
  getSourceBadge: (source: string) => JSX.Element | null;
  DraggableQueueItem: any;
}
```

### RecommendationsTabContent
```typescript
{
  filteredRecommendations: Track[];
  totalGuests: number;
  loadingInsights: boolean;
  refreshing: boolean;
  hasNewUpdates: boolean;
  showAllRecommendations: boolean;
  addedSongs: Set<string>;
  harmonicFlowEnabled: boolean;
  selectedSong: Track | null;
  onRefresh: () => void;
  onSetShowAll: (showAll: boolean) => void;
  onAddToQueue: (song: Track) => void;
  onSongSelect: (song: Track | null) => void;
  getSourceBadge: (source: string) => JSX.Element | null;
  RecommendationCard: any;
}
```

### DiscoveryTabContent
```typescript
{
  loadingDiscovery: boolean;
  discoveryQueue: { anthems: Track[] };
  insights: any;
  showAllAnthems: boolean;
  addedSongs: Set<string>;
  onSearchTrackSelected: (track: any) => void;
  onSetShowAllAnthems: (showAll: boolean) => void;
  onAddToQueue: (song: Track) => void;
}
```

### CrowdInsightsCard
```typescript
{
  insights: any; // Contains topGenres, topDecades, audienceProfile
}
```

## 🔧 Hook Return Values

### useDJDashboardState
Returns object with all state variables and setters (40+ items)

### useQueueManagement
```typescript
{
  addToQueue: (song: Track) => void;
  removeFromQueue: (songId: string) => void;
  returnToList: (songId: string, source) => void;
  skipToNext: () => void;
  playSong: (index: number) => void;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
}
```

### useEventInsightsManagement
```typescript
{
  loadEventInsights: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
}
```

### useDiscoveryQueue
```typescript
{
  loadDiscoveryQueue: () => Promise<void>;
}
```

### useTipManagement
No return value (side effects only)

### useSmartFilters
```typescript
{
  applySmartFilters: (tracks: Track[]) => Track[];
  applyHarmonicFlow: (tracks: Track[]) => Track[];
}
```

## 🐛 Debugging Tips

### State not updating?
- Check `/hooks/useDJDashboardState.ts` for correct setter
- Ensure you're using the setter, not modifying state directly

### Queue operation not working?
- Check `/hooks/useQueueManagement.ts`
- Verify props passed to hook

### Filters not applying?
- Check `/hooks/useSmartFilters.ts`
- Verify smartFilters state

### Component not rendering?
- Check import path
- Verify props being passed
- Check for TypeScript errors

## 📝 Code Style Guidelines

1. **State Management**: Always use hooks, never setState in components
2. **Props**: Always type props with TypeScript interfaces
3. **Functions**: Extract business logic to hooks, keep components simple
4. **Naming**: Use descriptive names (e.g., `handleSearchTrackSelected` not `handleSearch`)
5. **Comments**: Add JSDoc comments to exported functions
6. **File Organization**: Group related items together

## ⚡ Performance Tips

- Most expensive operations are in `useEventInsightsManagement`
- Queue operations use `useMemo` for filtered lists
- Animation performance handled by `motion/react`
- Consider virtualizing queue if > 100 items

## 🚀 Future Enhancements

Potential areas for improvement:
1. Add unit tests for hooks
2. Add Storybook stories for components
3. Extract RecommendationCard to separate file
4. Extract DraggableQueueItem to separate file
5. Add Context API for deeply nested props
6. Consider Zustand for complex state management
7. Add performance monitoring
8. Implement code splitting

## 📞 Need Help?

1. Check `/REFACTOR_SUMMARY.md` for detailed explanation
2. Check `/IMPLEMENTATION_COMPLETE.md` for full implementation details
3. Read this Quick Reference for fast answers
4. Check TypeScript interfaces for prop requirements
5. Look at existing code patterns in similar files

---

Happy coding! 🎉
