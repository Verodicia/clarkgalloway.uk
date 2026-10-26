import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { GameMode, GameScope, DifficultyFilter, UserStats, Flag } from '../types';
import { SCOPES, REGION_SCOPES, DESIGN_SCOPES } from './ScopeSelector';
import { filterFlags, filterColorFlags, getColorMatchingFlags } from '../utils/flags';
import { COLOR_FLAGS } from '../data/colorFlags';
import { sounds } from '../utils/sound';
import {
  Target,
  Keyboard,
  Zap,
  Grid,
  Search,
  Heart,
  BookOpen,
  ArrowLeft,
  Play,
  CheckCircle2,
  Globe,
  Compass,
  Timer,
  Hash,
  Palette,
  ArrowRightLeft,
  Layers,
} from 'lucide-react';

interface GameSetupPageProps {
  mode: GameMode;
  currentScopes?: GameScope[];
  onScopesChange?: (scopes: GameScope[]) => void;
  currentScope?: GameScope | GameScope[];
  onScopeChange?: (scope: GameScope) => void;
  currentDifficulty?: DifficultyFilter;
  onDifficultyChange?: (diff: DifficultyFilter) => void;
  roundCount: number | 'all';
  onRoundCountChange: (count: number | 'all') => void;
  quizDirection?: 'flag-to-name' | 'name-to-flag';
  onQuizDirectionChange?: (dir: 'flag-to-name' | 'name-to-flag') => void;
  onStartGame: () => void;
  onBackToMenu: () => void;
  userStats: UserStats;
  allFlags: Flag[];
}

interface RoundOption {
  id: number | 'all';
  label: string;
  sublabel: string;
  icon: string;
  description: string;
}

const ROUND_OPTIONS: RoundOption[] = [
  {
    id: 10,
    label: '10 Questions',
    sublabel: 'Quick Sprint',
    icon: '⚡',
    description: '~2 minutes of snappy vexillology action',
  },
  {
    id: 25,
    label: '25 Questions',
    sublabel: 'Standard Mission',
    icon: '🎯',
    description: '~5 minutes balanced test of geographic recall',
  },
  {
    id: 50,
    label: '50 Questions',
    sublabel: 'Marathon',
    icon: '🏅',
    description: '~10 minutes deep dive across territories',
  },
  {
    id: 'all',
    label: 'Full Gauntlet',
    sublabel: 'All in Pool',
    icon: '👑',
    description: 'Every single flag currently matching your pool selection',
  },
];

export const GameSetupPage: React.FC<GameSetupPageProps> = ({
  mode,
  currentScopes,
  onScopesChange,
  currentScope,
  onScopeChange,
  roundCount,
  onRoundCountChange,
  quizDirection = 'flag-to-name',
  onQuizDirectionChange,
  onStartGame,
  onBackToMenu,
  allFlags,
}) => {
  // Normalize active scopes to an array (no pools pre-selected by default)
  const activeScopes = useMemo(() => {
    if (currentScopes && Array.isArray(currentScopes)) {
      return currentScopes;
    }
    if (currentScope) {
      return Array.isArray(currentScope) ? currentScope : [currentScope];
    }
    return [] as GameScope[];
  }, [currentScopes, currentScope]);

  const setScopes = useCallback(
    (newScopes: GameScope[]) => {
      onScopesChange?.(newScopes);
      if (onScopeChange) {
        onScopeChange(newScopes.length > 0 ? newScopes[0] : ('all' as GameScope));
      }
    },
    [onScopesChange, onScopeChange]
  );

  const [scopeCategoryTab, setScopeCategoryTab] = useState<'region' | 'design'>(() => {
    return activeScopes.some((s) => s.startsWith('design-')) ? 'design' : 'region';
  });

  // Mode metadata
  const modeInfo = useMemo(() => {
    const roundLabel = roundCount === 'all' ? 'Full Gauntlet' : `${roundCount} Rounds`;
    switch (mode) {
      case 'quiz':
        return {
          title: 'Flag Quiz',
          icon: <Target className="w-6 h-6 text-amber-400" />,
          subtitle: 'Classic 4-Choice & Reverse Mode',
          format: roundLabel,
          scoreKey: 'quiz',
          isRoundBased: true,
        };
      case 'type':
        return {
          title: 'Flag Typist',
          icon: <Keyboard className="w-6 h-6 text-cyan-400" />,
          subtitle: 'Spelling & Typing Bee with Hints',
          format: roundLabel,
          scoreKey: 'type',
          isRoundBased: true,
        };
      case 'blitz':
        return {
          title: '60s Blitz Rush',
          icon: <Zap className="w-6 h-6 text-yellow-400" />,
          subtitle: 'High-Tempo Rapid Streak Frenzy',
          format: '60 Seconds Countdown',
          scoreKey: 'blitz',
          isRoundBased: false,
        };
      case 'memory':
        return {
          title: 'Memory Match',
          icon: <Grid className="w-6 h-6 text-purple-400" />,
          subtitle: 'Card Pair Flip & Concentration',
          format: 'Pairs Grid Match',
          scoreKey: 'memory',
          isRoundBased: false,
        };
      case 'zoom':
        return {
          title: 'Detective Zoom',
          icon: <Search className="w-6 h-6 text-emerald-400" />,
          subtitle: 'Identify from Magnified Canton',
          format: roundLabel,
          scoreKey: 'zoom',
          isRoundBased: true,
        };
      case 'streak':
        return {
          title: 'Survival Streak',
          icon: <Heart className="w-6 h-6 text-rose-400" />,
          subtitle: 'Sudden Death 3-Lives Challenge',
          format: '3 Lives Endurance',
          scoreKey: 'streak',
          isRoundBased: false,
        };
      case 'color':
        return {
          title: 'Flag Painter',
          icon: <Palette className="w-6 h-6 text-pink-400" />,
          subtitle: 'Colour In & True Palette Studio',
          format: roundLabel,
          scoreKey: 'color',
          isRoundBased: true,
        };
      default:
        return {
          title: 'Flag Explorer',
          icon: <BookOpen className="w-6 h-6 text-indigo-400" />,
          subtitle: 'Vexillology Exploration',
          format: 'Open Study',
          scoreKey: null,
          isRoundBased: false,
        };
    }
  }, [mode, roundCount]);

  // Filtered flag count across the union of all active pools
  const matchingFlags = useMemo(() => {
    if (mode === 'color') {
      return getColorMatchingFlags(allFlags, COLOR_FLAGS, activeScopes);
    }
    return filterFlags(allFlags, activeScopes);
  }, [allFlags, activeScopes, mode]);

  // Toggle a single pool in or out of activeScopes
  const handleToggleScope = (scopeId: GameScope) => {
    sounds.playClick();

    if (scopeId === 'all') {
      // Toggle all flags pool
      if (activeScopes.includes('all')) {
        setScopes([]);
      } else {
        setScopes(['all']);
      }
      return;
    }

    let next = activeScopes.filter((s) => s !== 'all');

    if (next.includes(scopeId)) {
      next = next.filter((s) => s !== scopeId);
    } else {
      next = [...next, scopeId];
    }

    setScopes(next);
  };

  // Quick preset shortcuts
  const selectOnlySovereign = () => {
    sounds.playClick();
    setScopes(['sovereign']);
  };

  const selectAllContinents = () => {
    sounds.playClick();
    setScopes(['europe', 'africa', 'asia', 'americas', 'oceania']);
  };

  const selectAllWorld = () => {
    sounds.playClick();
    setScopes(['all']);
  };

  const deselectAllPools = () => {
    sounds.playClick();
    setScopes([]);
  };

  // Keyboard navigation: Enter starts if valid, Esc returns to menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (activeScopes.length === 0 || matchingFlags.length === 0) return;
        e.preventDefault();
        sounds.playClick();
        onStartGame();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBackToMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, onBackToMenu, activeScopes.length, matchingFlags.length]);

  // Summary label of selected pools
  const selectedPoolsSummary = useMemo(() => {
    if (activeScopes.length === 0) return 'No pools selected';
    if (activeScopes.includes('all')) return 'All 500 World Flags';
    if (activeScopes.length === 1) {
      return SCOPES.find((s) => s.id === activeScopes[0])?.label || 'Custom Pool';
    }
    if (activeScopes.length === 2) {
      const name1 = SCOPES.find((s) => s.id === activeScopes[0])?.label.split(' ')[0] || activeScopes[0];
      const name2 = SCOPES.find((s) => s.id === activeScopes[1])?.label.split(' ')[0] || activeScopes[1];
      return `${name1} + ${name2}`;
    }
    return `${activeScopes.length} Selected Flag Pools`;
  }, [activeScopes]);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 py-2 sm:py-4">
      {/* Top Back Button */}
      <div>
        <button
          onClick={() => {
            sounds.playClick();
            onBackToMenu();
          }}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-800 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Main Menu</span>
        </button>
      </div>

      {/* 1. MULTI-POOL FLAG SELECTION SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-black text-white tracking-wide uppercase text-sm">
                Select Flag Pools
              </h3>
              <p className="text-[11px] text-slate-400">
                Select one or multiple pools to combine flags for this round
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Toggle Tabs */}
            <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700/80">
              <button
                onClick={() => {
                  sounds.playClick();
                  setScopeCategoryTab('region');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scopeCategoryTab === 'region'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🌍 Geography & Entities</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setScopeCategoryTab('design');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scopeCategoryTab === 'design'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>🎨 Vexillological Design</span>
              </button>
            </div>

            {/* Total Flags Counter Badge */}
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              {matchingFlags.length} {mode === 'color' ? 'painter flags' : 'flags'} loaded
            </span>
          </div>
        </div>

        {/* Quick Action Presets Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Quick Presets:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={selectOnlySovereign}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                activeScopes.length === 1 && activeScopes[0] === 'sovereign'
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                  : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              🏛️ 197 Sovereign
            </button>
            <button
              type="button"
              onClick={selectAllContinents}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                activeScopes.includes('europe') &&
                activeScopes.includes('africa') &&
                activeScopes.includes('asia')
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                  : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              🌍 All 5 Continents
            </button>
            <button
              type="button"
              onClick={selectAllWorld}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                activeScopes.includes('all')
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              🌟 All 500 Flags
            </button>
            {activeScopes.length > 0 && (
              <button
                type="button"
                onClick={deselectAllPools}
                className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-800/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 text-[11px] font-bold transition-all cursor-pointer"
              >
                ✕ Deselect All
              </button>
            )}
          </div>
        </div>

        {/* Grid of Selectable Flag Pools */}
        {scopeCategoryTab === 'region' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {REGION_SCOPES.map((scope) => {
              const isSelected = activeScopes.includes('all')
                ? scope.id === 'all'
                : activeScopes.includes(scope.id);

              const countDesc =
                mode === 'color'
                  ? `${filterColorFlags(allFlags, COLOR_FLAGS, scope.id).length} Painter Flags`
                  : scope.countDesc;

              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => handleToggleScope(scope.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/15 shadow-lg shadow-cyan-500/10 scale-[1.01] text-white'
                      : 'border-slate-800 bg-slate-850/60 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{scope.icon}</span>
                      <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {scope.label}
                      </span>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-700 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                    {countDesc}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DESIGN_SCOPES.map((scope) => {
              const isSelected = activeScopes.includes('all')
                ? false
                : activeScopes.includes(scope.id);

              const countDesc =
                mode === 'color'
                  ? `${filterColorFlags(allFlags, COLOR_FLAGS, scope.id).length} Painter Flags`
                  : scope.countDesc;

              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => handleToggleScope(scope.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10 scale-[1.01] text-white'
                      : 'border-slate-800 bg-slate-850/60 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{scope.icon}</span>
                      <div>
                        <h4 className={`text-sm font-bold ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                          {scope.label}
                        </h4>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {countDesc}
                        </span>
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-700 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* QUIZ QUESTION FORMAT SELECTION (Quiz Mode Only) */}
      {mode === 'quiz' && onQuizDirectionChange && (
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-black text-white tracking-wide uppercase text-sm">
                Question Format
              </h3>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              {quizDirection === 'name-to-flag' ? 'Name ➔ Flag' : 'Flag ➔ Name'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onQuizDirectionChange('flag-to-name');
              }}
              className={`group relative text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                quizDirection === 'flag-to-name'
                  ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10 scale-[1.01]'
                  : 'border-slate-800 bg-slate-850/60 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl sm:text-2xl">🏁</span>
                    <h4
                      className={`text-base font-black ${
                        quizDirection === 'flag-to-name' ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      Flag ➔ Name
                    </h4>
                  </div>
                  {quizDirection === 'flag-to-name' ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  ) : (
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                      Standard
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                See the country flag image, then identify the correct country name from 4 choices.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onQuizDirectionChange('name-to-flag');
              }}
              className={`group relative text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                quizDirection === 'name-to-flag'
                  ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10 scale-[1.01]'
                  : 'border-slate-800 bg-slate-850/60 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl sm:text-2xl">🔄</span>
                    <h4
                      className={`text-base font-black ${
                        quizDirection === 'name-to-flag' ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      Name ➔ Flag
                    </h4>
                  </div>
                  {quizDirection === 'name-to-flag' ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  ) : (
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                      Reverse
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Read the country name prompt, then tap the matching flag from 4 visual flag options.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* 2. QUESTION COUNT / MISSION LENGTH SECTION */}
      {modeInfo.isRoundBased ? (
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-black text-white tracking-wide uppercase text-sm">
                Question Count 
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {roundCount === 'all'
                ? `Full Gauntlet (${matchingFlags.length} Qs)`
                : `${roundCount} Questions`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROUND_OPTIONS.map((opt) => {
              const isSelected = roundCount === opt.id;
              const displayCount =
                opt.id === 'all'
                  ? `${matchingFlags.length} Flags`
                  : `${opt.id} Flags`;

              return (
                <button
                  key={String(opt.id)}
                  onClick={() => {
                    sounds.playClick();
                    onRoundCountChange(opt.id);
                  }}
                  className={`group relative text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10 scale-[1.02]'
                      : 'border-slate-800 bg-slate-850/60 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl">{opt.icon}</span>
                        <h4
                          className={`text-base font-black ${
                            isSelected ? 'text-amber-400' : 'text-slate-200'
                          }`}
                        >
                          {opt.label}
                        </h4>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      ) : (
                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          {displayCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-yellow-400" />
              <h3 className="text-base font-black text-white tracking-wide uppercase text-sm">
                Mode Mechanics & Rules
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              {modeInfo.format}
            </span>
          </div>

          <div className="p-4 bg-slate-850/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-slate-300 text-xs sm:text-sm">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shrink-0">
              {modeInfo.icon}
            </div>
            <div>
              {mode === 'blitz' && (
                <p>
                  <strong className="text-white">60 Seconds on the Clock:</strong> Rapidly identify flags before the countdown hits zero. Every consecutive answer increases your multiplier and awards +2 bonus seconds.
                </p>
              )}
              {mode === 'streak' && (
                <p>
                  <strong className="text-white">3 Lives Sudden Death:</strong> How long can you survive? One wrong answer takes away a heart. Keep your streak alive to beat your personal best!
                </p>
              )}
              {mode === 'memory' && (
                <p>
                  <strong className="text-white">Pairs Concentration:</strong> Flip face-down cards to discover matching flags and nation names. Finish in fewer turns to earn 3 stars.
                </p>
              )}
              {mode === 'color' && (
                <p>
                  <strong className="text-white">Flag Painter (Colour In):</strong> Test your memory of vexillological palettes! Choose from the paint bucket and tap each uncolored flag stripe or section to restore the nation's true colors.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. PREVIEW & MISSION LAUNCH */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
              {mode === 'color' ? 'Painter Studio Ready' : 'Pool Ready'}: {matchingFlags.length} Flags Loaded
            </span>
          </div>

          <p className="text-sm text-slate-300 max-w-md">
            {activeScopes.length === 0 || matchingFlags.length === 0 ? (
              <span className="text-amber-400 font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
                <span>⚠️</span>
                <span>Please select at least one flag pool above to enable Start Game.</span>
              </span>
            ) : (
              <>
                Ready to test your vexillological knowledge in{' '}
                <strong className="text-white">{modeInfo.title}</strong>{' '}
                {modeInfo.isRoundBased && (
                  <>
                    (
                    <strong className="text-amber-400">
                      {roundCount === 'all'
                        ? `Full Gauntlet - ${matchingFlags.length} Qs`
                        : `${roundCount} Questions`}
                    </strong>
                    ){' '}
                  </>
                )}
                across{' '}
                <strong className="text-amber-400">
                  {selectedPoolsSummary}
                </strong>.
              </>
            )}
          </p>
        </div>

        {/* Big Action Start Button */}
        <button
          onClick={() => {
            if (activeScopes.length === 0 || matchingFlags.length === 0) return;
            sounds.playClick();
            onStartGame();
          }}
          disabled={activeScopes.length === 0 || matchingFlags.length === 0}
          className={`w-full sm:w-auto px-10 py-4 font-black text-base sm:text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all shrink-0 ${
            activeScopes.length === 0 || matchingFlags.length === 0
              ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/60 shadow-none opacity-50'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 cursor-pointer transform hover:scale-[1.03] active:scale-98'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>START GAME (Enter)</span>
        </button>
      </div>
    </div>
  );
};
