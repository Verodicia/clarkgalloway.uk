import React from 'react';
import { GameScope, DifficultyFilter } from '../types';
import { Globe, MapPin, Sparkles, Filter } from 'lucide-react';

interface ScopeSelectorProps {
  currentScope: GameScope;
  onScopeChange: (scope: GameScope) => void;
  currentDifficulty: DifficultyFilter;
  onDifficultyChange: (diff: DifficultyFilter) => void;
  totalAvailable: number;
}

export interface ScopeOption {
  id: GameScope;
  label: string;
  icon: string;
  countDesc: string;
  category: 'region' | 'design';
}

export const REGION_SCOPES: ScopeOption[] = [
  { id: 'sovereign', label: 'All Sovereign Countries', icon: '🏛️', countDesc: 'All 197 sovereign nations (UN + Observers)', category: 'region' },
  { id: 'organizations', label: 'International Orgs', icon: '🌐', countDesc: '14 world bodies (UN, EU, NATO, EAC, etc.)', category: 'region' },
  { id: 'historical', label: 'Historical Empires', icon: '📜', countDesc: '29 former nations & empires (USSR, HRE, Persia, etc.)', category: 'region' },
  { id: 'cities', label: 'Famous World Cities', icon: '🏙️', countDesc: '25 iconic city flags (Chicago, Tokyo, NYC, etc.)', category: 'region' },
  { id: 'countries', label: 'Countries & Territories', icon: '🗺️', countDesc: '256 countries & overseas territories', category: 'region' },
  { id: 'all', label: 'All World Flags (Full)', icon: '🌍', countDesc: '500 flags across all categories', category: 'region' },
  { id: 'europe', label: 'Europe (All)', icon: '🏰', countDesc: 'European sovereign nations & regions', category: 'region' },
  { id: 'africa', label: 'Africa (All 54 Nations)', icon: '🦁', countDesc: 'Every African sovereign nation', category: 'region' },
  { id: 'asia', label: 'Asia (All Nations)', icon: '🏯', countDesc: 'Every Asian sovereign nation', category: 'region' },
  { id: 'americas', label: 'Americas (North & South)', icon: '🌎', countDesc: 'All American nations & territories', category: 'region' },
  { id: 'oceania', label: 'Oceania (Pacific)', icon: '🏝️', countDesc: 'Pacific island nations & territories', category: 'region' },
  { id: 'us-states', label: 'US 50 States & DC', icon: '🇺🇸', countDesc: '51 state flags', category: 'region' },
  { id: 'ca-provinces', label: 'Canadian Provinces', icon: '🇨🇦', countDesc: '13 provinces & territories', category: 'region' },
  { id: 'de-states', label: 'German States', icon: '🇩🇪', countDesc: '16 Bundesländer', category: 'region' },
  { id: 'au-states', label: 'Australian States', icon: '🇦🇺', countDesc: '8 states & territories', category: 'region' },
  { id: 'es-regions', label: 'Spanish Regions', icon: '🇪🇸', countDesc: '19 communities', category: 'region' },
  { id: 'uk-nations', label: 'UK Nations', icon: '🇬🇧', countDesc: '4 constituent nations', category: 'region' },
  { id: 'subdivisions', label: 'All States & Provinces', icon: '🏛️', countDesc: '176 sub-regions', category: 'region' },
];

export const DESIGN_SCOPES: ScopeOption[] = [
  { id: 'design-nordic', label: 'Nordic Crosses', icon: '✝️', countDesc: '7 Scandinavian & Nordic cross flags', category: 'design' },
  { id: 'design-crescents', label: 'Crescents & Moons', icon: '🌙', countDesc: '18 flags with crescent moons', category: 'design' },
  { id: 'design-suns', label: 'Radiant Suns', icon: '☀️', countDesc: '21 flags with blazing suns & solar discs', category: 'design' },
  { id: 'design-stars', label: 'Stars & Constellations', icon: '⭐', countDesc: '79 flags with stars & astral heraldry', category: 'design' },
  { id: 'design-animals', label: 'Animals & Dragons', icon: '🐉', countDesc: '35 flags with beasts, birds, eagles, lions', category: 'design' },
  { id: 'design-saltires', label: 'Saltires & X-Crosses', icon: '❌', countDesc: '11 diagonal cross & saltire flags', category: 'design' },
  { id: 'design-cantons', label: 'Canton Flags', icon: '📐', countDesc: '24 flags with distinct hoist cantons', category: 'design' },
  { id: 'design-tricolors', label: 'Tricolors & Tribands', icon: '🚩', countDesc: '64 vertical & horizontal tricolors', category: 'design' },
  { id: 'design-unique-shapes', label: 'Unique Shapes & Squares', icon: '✂️', countDesc: '5 non-standard shapes (Nepal, Swiss, Vatican...)', category: 'design' },
];

export const SCOPES: ScopeOption[] = [...REGION_SCOPES, ...DESIGN_SCOPES];

export const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  currentScope,
  onScopeChange,
  currentDifficulty,
  onDifficultyChange,
  totalAvailable,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-slate-800 shadow-lg">
      {/* Scope picker */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Filter className="w-4 h-4" />
          <span>Scope:</span>
        </div>
        <div className="relative">
          <select
            value={currentScope}
            onChange={(e) => onScopeChange(e.target.value as GameScope)}
            className="bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-100 text-sm font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors cursor-pointer"
          >
            <optgroup label="🌍 Geographical Regions & Entities">
              {REGION_SCOPES.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                  {s.icon} {s.label} ({s.countDesc})
                </option>
              ))}
            </optgroup>
            <optgroup label="🎨 Vexillological Design & Symbols">
              {DESIGN_SCOPES.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                  {s.icon} {s.label} ({s.countDesc})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50">
          {totalAvailable} flags available
        </span>
      </div>

      {/* Difficulty selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Level:
        </span>
        <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 1, label: 'Easy' },
              { id: 2, label: 'Medium' },
              { id: 3, label: 'Master' },
            ] as const
          ).map((diff) => (
            <button
              key={diff.id}
              onClick={() => onDifficultyChange(diff.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                currentDifficulty === diff.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {diff.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
