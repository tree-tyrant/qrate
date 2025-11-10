import React from 'react';
import { TipSort } from '../../hooks/useTipJar';

interface SortSelectProps {
  value: TipSort;
  onChange: (v: TipSort) => void;
}

const OPTIONS: TipSort[] = ['Newest', 'Biggest', 'Crowd', 'Theme'];

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/60">Sort</span>
      <select
        aria-label="Sort tips"
        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#10b981]"
        value={value}
        onChange={(e) => onChange(e.target.value as TipSort)}
      >
        {OPTIONS.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}



