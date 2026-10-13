import React, { useEffect, useMemo } from 'react';
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
  Sparkles,
  Trophy,
  Flame,
  CheckCircle2,
  Globe,
  Compass,
  Timer,
  Hash,
  Palette,
} from 'lucide-react';

interface GameSetupPageProps {
  mode: GameMode;
  currentScope: GameScope;
  onScopeChange: (scope: GameScope) => void;
  currentDifficulty: DifficultyFilter;
  onDifficultyChange: (diff: DifficultyFilter) => void;
  roundCount: number | 'all';
  onRoundCountChange: (count: number | 'all') => void;
  onStartGame: () => void;
  onBackToMenu: () => void;
  userStats: UserStats;
  allFlags: Flag[];
}

interface DifficultyOption {
  id: DifficultyFilter;
  title: string;
  tag: string;
  color: string;
  borderColor: string;
  activeBg: string;
  description: string;
  icon: string;
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
    description: 'Every single flag currently matching your filters',
  },
];

const DIFFICULTIES: DifficultyOption[] = [
  {
    id: 1,
    title: 'Easy',
    tag: 'Iconic & Familiar',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    activeBg: 'bg-emerald-950/40',
    description: 'Prominent world nations and major state flags (e.g. US, UK, France, Japan, Germany, Canada, California).',
    icon: '🟢',
  },
  {
    id: 2,
    title: 'Medium',
    tag: 'Standard Challenge',
    color: 'text-amber-400',
    borderColor: 'border-amber-500',
    activeBg: 'bg-amber-950/40',
    description: 'Balanced mix of sovereign nations, states, and provinces from around the globe.',
    icon: '🟡',
  },
  {
    id: 3,
    title: 'Master',
    tag: 'Dr. Sheldon Cooper Tier',
    color: 'text-rose-400',
    borderColor: 'border-rose-500',
    activeBg: 'bg-rose-950/40',
    description: 'Challenging, obscure territories, autonomous regions, and rare historical sub-regions.',
    icon: '🔴',
  },
  {
    id: 'all',
    title: 'All Tiers',
    tag: 'Unrestricted Pool',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500',
    activeBg: 'bg-cyan-950/40',
    description: 'Completely unconstrained shuffle across all difficulty levels for maximum variety.',
    icon: '🌟',
  },
];

export const GameSetupPage: React.FC<GameSetupPageProps> = ({
  mode,
  currentScope,
  onScopeChange,
  currentDifficulty,
  onDifficultyChange,
  roundCount,
  onRoundCountChange,
  onStartGame,
  onBackToMenu,
  userStats,
  allFlags,
}) => {
  const [scopeCategoryTab, setScopeCategoryTab] = React.useState<'region' | 'design'>(() => {
    return currentScope.startsWith('design-') ? 'design' : 'region';
  });

  useEffect(() => {
    if (currentScope.startsWith('design-') && scopeCategoryTab !== 'design') {
      setScopeCategoryTab('design');
    } else if (!currentScope.startsWith('design-') && scopeCategoryTab !== 'region') {
      setScopeCategoryTab('region');
    }
  }, [currentScope, scopeCategoryTab]);

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
          subtitle: 'Canton & Emblem Deduction',
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

  // Filtered flag count (mode-specific)
  const matchingFlags = useMemo(() => {
    if (mode === 'color') {
      return getColorMatchingFlags(allFlags, COLOR_FLAGS, currentScope, currentDifficulty);
    }
    return filterFlags(allFlags, currentScope, currentDifficulty);
  }, [allFlags, currentScope, currentDifficulty, mode]);

  // Keyboard navigation: Enter starts, Esc returns to menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sounds.playClick();
        onStartGame();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        sounds.playClick();
        onBackToMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, onBackToMenu]);

  const highScore = modeInfo.scoreKey
    ? userStats.highScores[modeInfo.scoreKey as keyof typeof userStats.highScores] || 0
    : 0;

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 py-2 sm:py-4">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-md">
        <button
          onClick={() => {
            sounds.playClick();
            onBackToMenu();
          }}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-3 py-2 rounded-xl border border-slate-700/80 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Main Menu (Esc)</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-xl border border-slate-700/80">
            {modeInfo.icon}
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-400 block leading-tight">
              Pre-Game Briefing
            </span>
            <h2 className="text-base sm:text-lg font-black text-white leading-tight">
              {modeInfo.title}
            </h2>
          </div>
        </div>

        {highScore > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Best:</span>
            <strong className="text-amber-400">{highScore}</strong>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            {modeInfo.format}
          </div>
        )}
      </div>

      {/* 1. DIFFICULTY SELECTION SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-black text-white tracking-wide uppercase text-sm">
              Step 1: Select Difficulty Level
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {DIFFICULTIES.find((d) => d.id === currentDifficulty)?.tag}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DIFFICULTIES.map((diff) => {
            const isSelected = currentDifficulty === diff.id;

            return (
              <button
                key={String(diff.id)}
                onClick={() => {
                  sounds.playClick();
                  onDifficultyChange(diff.id);
                }}
                className={`group relative text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${diff.borderColor} ${diff.activeBg} shadow-lg shadow-black/40 scale-[1.02]`
                    : 'border-slate-800 bg-slate-850/60 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{diff.icon}</span>
                    {isSelected && (
                      <CheckCircle2 className={`w-5 h-5 ${diff.color}`} />
                    )}
                  </div>

                  <h4 className={`text-base font-black ${diff.color}`}>
                    {diff.title}
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                    {mode === 'color'
                      ? `${filterColorFlags(allFlags, COLOR_FLAGS, currentScope, diff.id).length} Painter Flags`
                      : diff.tag}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {diff.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. REGION OR VEXILLOLOGICAL DESIGN SCOPE SECTION */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-black text-white tracking-wide uppercase text-sm">
              Step 2: Choose Scope & Flag Pool
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Toggle Tabs */}
            <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700/80">
              <button
                onClick={() => {
                  sounds.playClick();
                  setScopeCategoryTab('region');
                  if (currentScope.startsWith('design-')) {
                    onScopeChange('sovereign');
                  }
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
                  if (!currentScope.startsWith('design-')) {
                    onScopeChange('design-stars');
                  }
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

            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
              {matchingFlags.length} {mode === 'color' ? 'painter flags' : 'flags'} loaded
            </span>
          </div>
        </div>

        {/* Grid of scopes based on active tab */}
        {scopeCategoryTab === 'region' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {REGION_SCOPES.map((scope) => {
              const isSelected = currentScope === scope.id;
              const countDesc =
                mode === 'color'
                  ? `${filterColorFlags(allFlags, COLOR_FLAGS, scope.id, currentDifficulty).length} Painter Flags`
                  : scope.countDesc;

              return (
                <button
                  key={scope.id}
                  onClick={() => {
                    sounds.playClick();
                    onScopeChange(scope.id);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/15 shadow-md shadow-cyan-500/10 text-white'
                      : 'border-slate-800 bg-slate-850/50 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{scope.icon}</span>
                    <span className="text-xs font-bold truncate leading-tight">
                      {scope.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block truncate">
                    {countDesc}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DESIGN_SCOPES.map((scope) => {
              const isSelected = currentScope === scope.id;
              const countDesc =
                mode === 'color'
                  ? `${filterColorFlags(allFlags, COLOR_FLAGS, scope.id, currentDifficulty).length} Painter Flags`
                  : scope.countDesc;

              return (
                <button
                  key={scope.id}
                  onClick={() => {
                    sounds.playClick();
                    onScopeChange(scope.id);
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/15 text-white scale-[1.01]'
                      : 'border-slate-800 bg-slate-850/60 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{scope.icon}</span>
                      <span className="text-sm font-black leading-tight">
                        {scope.label}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {countDesc}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. QUESTION COUNT / FORMAT SECTION */}
      {modeInfo.isRoundBased ? (
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-black text-white tracking-wide uppercase text-sm">
                Step 3: Question Count / Mission Length
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
                      <span className="text-2xl">{opt.icon}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      ) : (
                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          {displayCount}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-base font-black ${
                        isSelected ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                      {opt.sublabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
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
                Step 3: Mode Mechanics & Rules
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

      {/* 4. PREVIEW & MISSION LAUNCH */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
              {mode === 'color' ? 'Painter Studio Ready' : 'Pool Ready'}: {matchingFlags.length} Flags Loaded
            </span>
          </div>

          <p className="text-sm text-slate-300 max-w-md">
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
            with{' '}
            <strong className="text-amber-400">
              {DIFFICULTIES.find((d) => d.id === currentDifficulty)?.title} difficulty
            </strong>{' '}
            across{' '}
            <strong className="text-amber-400">
              {SCOPES.find((s) => s.id === currentScope)?.label}
            </strong>.
          </p>
        </div>

        {/* Big Action Start Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onStartGame();
          }}
          className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base sm:text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-amber-500/25 cursor-pointer transform hover:scale-[1.03] active:scale-98 transition-all shrink-0"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>START GAME (Enter)</span>
        </button>
      </div>
    </div>
  );
};
