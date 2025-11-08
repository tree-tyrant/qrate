import { memo } from 'react';

interface ComponentLoaderProps {
  componentName?: string;
}

export const ComponentLoader = memo(({ componentName }: ComponentLoaderProps) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="glass-effect p-8 rounded-xl border border-border">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-accent border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <div className="text-center">
          <h3 className="gradient-text text-lg font-medium mb-2">Loading {componentName || 'Component'}</h3>
          <p className="text-muted-foreground text-sm">Preparing your experience...</p>
        </div>
      </div>
    </div>
  </div>
));

ComponentLoader.displayName = 'ComponentLoader';
