import React, { useState, useEffect } from 'react';
import { GameMode, GameScope, DifficultyFilter } from '../types';
import { sounds } from '../utils/sound';
import { SCOPES } from './ScopeSelector';
import { VexillumLogo } from './VexillumLogo';
import {
  Target,
  Keyboard,
  Zap,
  Grid,
  Search,
  Heart,
  BookOpen,
  Palette,
  Home,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  currentMode: GameMode;
  currentScope?: GameScope | GameScope[];
  currentDifficulty?: DifficultyFilter;
  onOpenSetup?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenStats?: () => void;
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
  { id: 'library', label: 'Flag Library', icon: <BookOpen className="w-4 h-4" />, desc: '500 flags encyclopedia & flashcards' },
];

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  currentScope = 'all',
  onReturnToMenu,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const activeModeInfo = MODES.find((m) => m.id === currentMode) || MODES[0];

  const scopes = React.useMemo(() => {
    return Array.isArray(currentScope) ? currentScope : [currentScope || 'all'];
  }, [currentScope]);

  const poolLabel = React.useMemo(() => {
    if (scopes.includes('all')) return 'All World Flags';
    if (scopes.length === 1) {
      return SCOPES.find((s) => s.id === scopes[0])?.label || 'Custom Pool';
    }
    if (scopes.length === 2) {
      const name1 = SCOPES.find((s) => s.id === scopes[0])?.label.split(' ')[0] || scopes[0];
      const name2 = SCOPES.find((s) => s.id === scopes[1])?.label.split(' ')[0] || scopes[1];
      return `${name1} + ${name2}`;
    }
    return `${scopes.length} Pools`;
  }, [scopes]);

  const handleReturnClick = () => {
    sounds.playClick();
    if (currentMode === 'library') {
      onReturnToMenu();
    } else {
      setShowConfirmModal(true);
    }
  };

  useEffect(() => {
    if (!showConfirmModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowConfirmModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmModal]);

  return (
    <>
      <header className="border-b border-slate-800/80 pb-3 sm:pb-4">
        {/* Focused In-Game Header Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
          {/* Left: Brand Logo & In-Game Badges (Question Counter and Score stacked below title) */}
          <div className="flex flex-col items-start gap-1.5">
            <button
              onClick={handleReturnClick}
              className="flex items-center cursor-pointer shrink-0"
              title="Return to Main Menu"
            >
              <VexillumLogo size="sm" />
            </button>

            {/* In-Game Stats Portal (Question Counter, Score, Streak) placed directly below title */}
            <div id="header-stats-portal" className="flex items-center gap-1.5 sm:gap-2 flex-wrap empty:hidden" />
          </div>

          {/* Right: Flag Quiz Mode & Pool Info + Main Menu Button (Always right-aligned on small, medium & large screens) */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm text-right">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                {activeModeInfo.icon}
                {activeModeInfo.label}
              </span>
              {currentMode !== 'library' && (
                <span className="text-[11px] text-slate-400 font-medium">
                  • {poolLabel}
                </span>
              )}
            </div>

            <button
              onClick={handleReturnClick}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md shrink-0"
              title="Return to Main Menu"
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation Modal when Leaving an Active Game */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5 text-center">
            {/* Ambient Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl bg-amber-500/20 pointer-events-none" />

            {/* Warning Icon Badge */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>

            {/* Heading & Text */}
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white tracking-tight">
                Leave Game?
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Are you sure you want to return to the Main Menu? Your current round progress will be lost.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowConfirmModal(false);
                }}
                className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Stay & Play
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowConfirmModal(false);
                  onReturnToMenu();
                }}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Game</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
