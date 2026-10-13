import React from 'react';
import { GameMode, GameScope, DifficultyFilter } from '../types';
import { sounds } from '../utils/sound';
import { SCOPES } from './ScopeSelector';
import {
  Trophy,
  Volume2,
  VolumeX,
  Target,
  Keyboard,
  Zap,
  Grid,
  Search,
  Heart,
  BookOpen,
  Palette,
  Home,
  SlidersHorizontal,
} from 'lucide-react';

interface HeaderProps {
  currentMode: GameMode;
  currentScope?: GameScope;
  currentDifficulty?: DifficultyFilter;
  onOpenSetup?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenStats: () => void;
  onReturnToMenu: () => void;
}

export const MODES: { id: GameMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'quiz', label: 'Flag Quiz', icon: <Target className="w-4 h-4" />, desc: 'Classic 4 choices & reverse mode' },
  { id: 'type', label: 'Flag Typist', icon: <Keyboard className="w-4 h-4" />, desc: 'Type & spell the flag name' },
  { id: 'blitz', label: '60s Blitz', icon: <Zap className="w-4 h-4" />, desc: 'Fast frenzy with combo multiplier' },
  { id: 'memory', label: 'Memory Match', icon: <Grid className="w-4 h-4" />, desc: 'Flip and match flag pairs' },
  { id: 'zoom', label: 'Detective Zoom', icon: <Search className="w-4 h-4" />, desc: 'Identify from zoomed-in canton' },
  { id: 'streak', label: 'Survival Streak', icon: <Heart className="w-4 h-4" />, desc: '3 lives sudden death challenge' },
  { id: 'color', label: 'Flag Painter', icon: <Palette className="w-4 h-4" />, desc: 'Colour in & paint flags with their true palette' },
  { id: 'library', label: 'Flag Library', icon: <BookOpen className="w-4 h-4" />, desc: '440+ flags encyclopedia & flashcards' },
];

const base = import.meta.env.BASE_URL || './';
const cleanBase = base.endsWith('/') ? base : `${base}/`;

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  currentScope = 'all',
  currentDifficulty = 'all',
  onOpenSetup,
  soundEnabled,
  onToggleSound,
  onOpenStats,
  onReturnToMenu,
}) => {
  const activeModeInfo = MODES.find((m) => m.id === currentMode) || MODES[0];
  const activeScopeInfo = SCOPES.find((s) => s.id === currentScope) || SCOPES[0];

  const difficultyLabel =
    currentDifficulty === 1
      ? 'Easy'
      : currentDifficulty === 2
      ? 'Medium'
      : currentDifficulty === 3
      ? 'Master'
      : 'All Tiers';

  return (
    <header className="border-b border-slate-800/80 pb-4">
      {/* Focused In-Game Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Active Mode Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-3 text-left group cursor-pointer"
            title="Return to Main Menu"
          >
            <img
              src={`${cleanBase}funwithflags2.png`}
              alt="Clark Galloway's Fun with Flags"
              className="h-8 sm:h-10 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="border-l border-slate-800 pl-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  {activeModeInfo.icon}
                  {activeModeInfo.label}
                </span>
                {currentMode !== 'library' && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    • {difficultyLabel} • {activeScopeInfo.label}
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Right: Focused Game Actions */}
        <div className="flex items-center gap-2">
          {/* Setup / Difficulty Changer */}
          {onOpenSetup && currentMode !== 'library' && (
            <button
              onClick={onOpenSetup}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              title="Change Difficulty & Region"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Difficulty</span>
            </button>
          )}

          {/* Main Menu Button */}
          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            title="Return to Main Menu"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>Main Menu</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Stats Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenStats();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 text-slate-200 hover:text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Records</span>
          </button>

          {/* Portfolio link */}
          <a
            href="../../index.html#card-flags"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = window.location.pathname.includes('/dist')
                ? '../../index.html#card-flags'
                : '../index.html#card-flags';
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md no-underline"
            title="Return to Clark's Portfolio"
          >
            <span className="text-amber-400">←</span>
            <span className="hidden sm:inline">Portfolio</span>
          </a>
        </div>
      </div>
    </header>
  );
};
