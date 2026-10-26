import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, UserStats, Flag } from '../types';
import { sounds } from '../utils/sound';
import { FlagImage } from './FlagImage';
import { FlagBunting } from './FlagBunting';
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
  Trophy,
  Play,
  Volume2,
  VolumeX,
  Compass,
  Sparkles,
  ChevronRight,
  Flame,
  RotateCcw,
  Settings,
  Smartphone,
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';

interface MainMenuProps {
  onSelectMode: (mode: GameMode) => void;
  userStats: UserStats;
  onOpenStats: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetStats?: () => void;
  onBackToSplash: () => void;
  allFlags: Flag[];
}

interface MenuItem {
  id: GameMode | 'records' | 'settings';
  index: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
  features: string[];
  sampleCodes: string[];
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onSelectMode,
  userStats,
  onOpenStats,
  soundEnabled,
  onToggleSound,
  onResetStats,
  onBackToSplash,
  allFlags,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'quiz',
      index: '01',
      title: 'Flag Quiz',
      subtitle: 'Classic 4-Choice & Reverse Mode',
      icon: <Target className="w-5 h-5 text-amber-400" />,
      badge: '10 Rounds',
      description:
        'Examine vector flags and deduce the correct sovereign nation or sub-region. Includes reverse mode to find the flag from its name!',
      features: ['Keyboard 1-4 shortcuts', 'Reverse Name➔Flag mode', 'Vexillology trivia cards'],
      sampleCodes: ['ch', 'us', 'fr', 'jp'],
    },
    {
      id: 'type',
      index: '02',
      title: 'Flag Typist',
      subtitle: 'Spelling & Knowledge Bee',
      icon: <Keyboard className="w-5 h-5 text-cyan-400" />,
      badge: 'Spelling Bee',
      description:
        'Type the exact country or state name. Features tiered hints for continent, capital city, and letter reveals with smart fuzzy matching.',
      features: ['Diacritic-tolerant matching', '3 tiers of hints', 'Autocomplete suggestions'],
      sampleCodes: ['np', 'br', 'de', 'ca'],
    },
    {
      id: 'blitz',
      index: '03',
      title: '60s Blitz Rush',
      subtitle: 'High-Tempo Streak Frenzy',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      badge: '60s Frenzy',
      description:
        'Race against the clock to identify as many flags as possible! Build rapid streaks to trigger 2x, 3x, and 4x combo multipliers.',
      features: ['60-second countdown', 'Up to 4x multiplier', 'Audio-paced frenzy'],
      sampleCodes: ['gb', 'au', 'kr', 'mx'],
    },
    {
      id: 'memory',
      index: '04',
      title: 'Memory Match',
      subtitle: 'Card Pair Flip & Concentration',
      icon: <Grid className="w-5 h-5 text-purple-400" />,
      badge: 'Pairs Game',
      description:
        'Test your visual memory by flipping and pairing flag visual cards with their respective country or province name cards.',
      features: ['12 or 16 card grids', 'Tactile 3D card flips', 'Move & timer tracker'],
      sampleCodes: ['va', 'es', 'jm', 'se'],
    },
    {
      id: 'zoom',
      index: '05',
      title: 'Detective Zoom',
      subtitle: 'Canton & Emblem Deduction',
      icon: <Search className="w-5 h-5 text-emerald-400" />,
      badge: 'Investigation',
      description:
        'Flags start zoomed in 400% on a specific canton, star, or crest. Deduce the flag before it fully unzooms to earn maximum score!',
      features: ['Progressive 15s reveal', 'Up to 1,000 pts per round', 'Eagle-eye examination'],
      sampleCodes: ['US-CA', 'US-OH', 'DE-BY', 'za'],
    },
    {
      id: 'streak',
      index: '06',
      title: 'Survival Streak',
      subtitle: 'Sudden Death 3-Lives Challenge',
      icon: <Heart className="w-5 h-5 text-rose-400" />,
      badge: 'Sudden Death',
      description:
        'You begin with 3 hearts. Every incorrect guess costs a life. Consecutive 5-streaks reward extra shields. How deep can you go?',
      features: ['3 Hearts pool', 'Bonus shield rewards', 'Endless flag gauntlet'],
      sampleCodes: ['gr', 'ar', 'eg', 'CA-QC'],
    },
    {
      id: 'color',
      index: '07',
      title: 'Flag Painter',
      subtitle: 'Colour-In & True Palette Studio',
      icon: <Palette className="w-5 h-5 text-pink-400" />,
      badge: 'Colour In',
      description:
        'Test your vexillological memory! Paint uncolored national flag outlines with the authentic national color palette and uncover deep color symbolism.',
      features: ['Interactive SVG painting', 'Official vexillology palettes', 'Color symbolism reveals'],
      sampleCodes: ['fr', 'de', 'za', 'br'],
    },
    {
      id: 'library',
      index: '08',
      title: 'Flag Encyclopedia',
      subtitle: '500 Flags, Search & Flashcards',
      icon: <BookOpen className="w-5 h-5 text-indigo-400" />,
      badge: 'Study Center',
      description:
        'Browse, search, and study all 500 flags across sovereign nations, world cities, empires, and territories in full vector SVG. Flip 3D flashcards or launch custom practice drills.',
      features: ['Real-time search', '3D study flashcards', 'Practice-this-flag drill'],
      sampleCodes: ['ch', 'va', 'np', 'US-TX'],
    },
    {
      id: 'records',
      index: '09',
      title: 'Hall of Fame',
      subtitle: 'High Scores & Vexillology Badges',
      icon: <Trophy className="w-5 h-5 text-amber-300" />,
      badge: 'Records',
      description:
        'View your overall accuracy percentage, best streaks, mode high scores, and unlock prestigious awards including the Dr. Sheldon Cooper Trophy.',
      features: ['Mode score leaderboards', '6 Vexillologist badges', 'Favorites collection'],
      sampleCodes: ['us', 'gb', 'fr', 'de'],
    },
    {
      id: 'settings',
      index: '10',
      title: 'Settings',
      subtitle: 'Audio, Haptics & App Preferences',
      icon: <Settings className="w-5 h-5 text-slate-300" />,
      badge: soundEnabled ? 'Audio On' : 'Muted',
      description:
        'Manage audio synthesizer sound effects, tactile haptic feedback, app preferences, and reset your game data.',
      features: ['Audio Synthesizer Toggle', 'Native Haptic Feedback', 'Reset Game Data'],
      sampleCodes: [],
    },
  ];

  const activeItem = menuItems[selectedIndex];

  const handleLaunch = useCallback(
    (item: MenuItem) => {
      sounds.playMenuSelect();
      if (item.id === 'records') {
        onOpenStats();
      } else if (item.id === 'settings') {
        setSettingsOpen(true);
      } else {
        onSelectMode(item.id as GameMode);
      }
    },
    [onOpenStats, onSelectMode]
  );

  // Navigate menu with keyboard arrows & Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sounds.playMenuMove();
        setSelectedIndex((prev) => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sounds.playMenuMove();
        setSelectedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleLaunch(activeItem);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, activeItem, menuItems.length, handleLaunch]);

  // Sample flags for the showcase stage
  const showcaseFlags = activeItem.sampleCodes
    .map((code) => allFlags.find((f) => f.code.toLowerCase() === code.toLowerCase()))
    .filter((f): f is Flag => Boolean(f));

  // Get high score for active mode
  const getHighScore = (id: string) => {
    if (id === 'quiz') return userStats.highScores.quiz || 0;
    if (id === 'type') return userStats.highScores.type || 0;
    if (id === 'blitz') return userStats.highScores.blitz || 0;
    if (id === 'memory') return userStats.highScores.memory || 0;
    if (id === 'zoom') return userStats.highScores.zoom || 0;
    if (id === 'streak') return userStats.highScores.streak || 0;
    if (id === 'color') return userStats.highScores.color || 0;
    return null;
  };

  const currentScore = getHighScore(activeItem.id);

  return (
    <div className="flex flex-col gap-5 py-2 min-h-full bg-slate-950 relative isolate">
      {/* Top Header - Centered Standalone Title Logo */}
      <div className="flex items-center justify-center py-2 sm:py-3 bg-slate-950 relative z-10">
        <button
          onClick={onBackToSplash}
          className="flex items-center justify-center group cursor-pointer transition-transform hover:scale-105 active:scale-95"
          title="Return to Intro Title"
        >
          <VexillumLogo className="h-14 sm:h-18 md:h-20 w-auto" />
        </button>
      </div>

      {/* Main Video Game 2-Column Select Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Vertical Menu Selection */}
        <div className="lg:col-span-5 flex flex-col gap-2 relative">
          {/* Festive Hanging Flag Bunting */}
          <div className="pt-0 pb-2">
            <FlagBunting allFlags={allFlags} count={9} />
          </div>

          <div className="flex flex-col gap-2">
            {menuItems.map((item, idx) => {
              const isSelected = selectedIndex === idx;

              return (
                <button
                  key={item.id}
                  onClick={() => handleLaunch(item)}
                  onMouseEnter={() => {
                    if (
                      typeof window !== 'undefined' &&
                      window.matchMedia('(hover: hover) and (pointer: fine)').matches
                    ) {
                      if (selectedIndex !== idx) {
                        setSelectedIndex(idx);
                        sounds.playMenuMove();
                      }
                    }
                  }}
                  className={`group relative text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Left Indicator & Number */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-black ${
                        isSelected ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    >
                      {item.index}
                    </span>

                    <div
                      className={`p-2 rounded-xl border transition-colors ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {item.icon}
                    </div>

                    <div>
                      <h3
                        className={`text-sm sm:text-base font-black tracking-tight leading-tight transition-colors ${
                          isSelected ? 'text-amber-300' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-[240px]">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right Status / Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        isSelected
                          ? 'bg-amber-500/30 text-amber-300 border-amber-400/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected
                          ? 'text-amber-400 translate-x-0.5'
                          : 'text-slate-600 opacity-40'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Game Mode Preview Stage (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Background Topographical / Compass Watermark */}
          <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full border border-slate-800/40 opacity-20 pointer-events-none flex items-center justify-center">
            <Compass className="w-56 h-56 text-amber-500/30" />
          </div>

          {/* Mode Title & Briefing */}
          <div className="relative z-10 flex flex-col gap-4">
            {currentScore !== null && currentScore > 0 && (
              <div className="flex justify-end">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Personal Best: <strong className="text-amber-400">{currentScore}</strong></span>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                {activeItem.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                {activeItem.description}
              </p>
            </div>

            {/* Feature bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              {activeItem.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-medium truncate">{feat}</span>
                </div>
              ))}
            </div>

            {/* Settings Quick Controls or Records or Showcase Flags Preview */}
            {activeItem.id === 'settings' ? (
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col gap-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                  Quick Audio & Haptic Controls:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          soundEnabled
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {soundEnabled ? (
                          <Volume2 className="w-5 h-5" />
                        ) : (
                          <VolumeX className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Audio SFX</div>
                        <div className="text-[10px] text-slate-400">
                          {soundEnabled ? 'Synthesizer Active' : 'Sound Muted'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onToggleSound}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                        soundEnabled
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {soundEnabled ? 'Active' : 'Muted'}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Haptic Feedback</div>
                        <div className="text-[10px] text-slate-400">Tactile button responses</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettingsOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ) : activeItem.id === 'records' ? (
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col gap-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                  Career Progress Snapshot:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Accuracy</span>
                    <span className="text-xl font-black text-amber-400">
                      {userStats.totalAttempts > 0
                        ? `${Math.round((userStats.totalCorrect / userStats.totalAttempts) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Best Streak</span>
                    <span className="text-xl font-black text-rose-400">{userStats.bestStreak}</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Games</span>
                    <span className="text-xl font-black text-cyan-400">{userStats.gamesPlayed}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Showcase Flags Preview */
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                  Sample Flags for this Mode:
                </span>
                <div className="grid grid-cols-4 gap-3">
                  {showcaseFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="h-20 sm:h-24 bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center hover:scale-105 transition-transform"
                      title={flag.name}
                    >
                      <FlagImage flag={flag} className="w-full h-full bg-transparent border-0" shadow={false} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Launch Button */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={() => handleLaunch(activeItem)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 cursor-pointer transform hover:scale-[1.02] active:scale-98 transition-all"
            >
              {activeItem.id === 'settings' ? (
                <Settings className="w-5 h-5" />
              ) : activeItem.id === 'records' ? (
                <Trophy className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              <span>
                {activeItem.id === 'library'
                  ? 'Open Library'
                  : activeItem.id === 'records'
                  ? 'View Records'
                  : activeItem.id === 'settings'
                  ? 'Open Settings'
                  : 'Select Difficulty'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onResetStats={onResetStats}
      />
    </div>
  );
};
