import React from 'react';

interface StatusBarProps {
  crowd?: number;
  theme?: number;
}

export function StatusBar({ crowd, theme }: StatusBarProps) {
  const crowdValue = typeof crowd === 'number' ? Math.max(0, Math.min(100, crowd)) : undefined;
  const themeValue = typeof theme === 'number' ? Math.max(0, Math.min(100, theme)) : undefined;

  return (
    <div className="flex gap-2 items-center">
      {crowdValue !== undefined && (
        <div className="flex items-center gap-1 min-w-[120px]">
          <span className={`text-[10px] ${crowdValue < 30 ? 'text-red-400' : 'text-white/60'}`}>Crowd</span>
          <div className="h-2 flex-1 rounded bg-white/10 overflow-hidden">
            <div
              className={`h-full ${crowdValue < 30 ? 'bg-red-500' : 'bg-white/60'}`}
              style={{ width: `${crowdValue}%` }}
            />
          </div>
          <span className={`text-[10px] ${crowdValue < 30 ? 'text-red-400' : 'text-white/60'}`}>{crowdValue}%</span>
        </div>
      )}
      {themeValue !== undefined && (
        <div className="flex items-center gap-1 min-w-[120px]">
          <span className={`text-[10px] ${themeValue < 50 ? 'text-red-400' : 'text-white/60'}`}>Theme</span>
          <div className="h-2 flex-1 rounded bg-white/10 overflow-hidden">
            <div
              className={`h-full ${themeValue < 50 ? 'bg-red-500' : 'bg-white/60'}`}
              style={{ width: `${themeValue}%` }}
            />
          </div>
          <span className={`text-[10px] ${themeValue < 50 ? 'text-red-400' : 'text-white/60'}`}>{themeValue}%</span>
        </div>
      )}
    </div>
  );
}



