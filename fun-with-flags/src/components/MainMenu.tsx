import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, UserStats, Flag } from '../types';
import { sounds } from '../utils/sound';
import { FlagImage } from './FlagImage';
import { FlagBunting } from './FlagBunting';
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
} from 'lucide-react';

interface MainMenuProps {
  onSelectMode: (mode: GameMode) => void;
  userStats: UserStats;
  onOpenStats: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackToSplash: () => void;
  allFlags: Flag[];
}

interface MenuItem {
  id: GameMode | 'records';
  index: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
  features: string[];
  sampleCodes: string[];
}

const base = import.meta.env.BASE_URL || './';
const cleanBase = base.endsWith('/') ? base : `${base}/`;

export const MainMenu: React.FC<MainMenuProps> = ({
  onSelectMode,
  userStats,
  onOpenStats,
  soundEnabled,
  onToggleSound,
  onBackToSplash,
  allFlags,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

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
  ];

  const activeItem = menuItems[selectedIndex];

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
  }, [selectedIndex, activeItem]);

  const handleLaunch = useCallback(
    (item: MenuItem) => {
      sounds.playMenuSelect();
      if (item.id === 'records') {
        onOpenStats();
      } else {
        onSelectMode(item.id as GameMode);
      }
    },
    [onOpenStats, onSelectMode]
  );

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
    <div className="flex flex-col gap-5 py-2">
      {/* Top Video Game Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSplash}
            className="flex items-center group cursor-pointer"
            title="Return to Intro Title"
          >
            <img
              src={`${cleanBase}funwithflags2.png`}
              alt="Clark Galloway's Fun with Flags"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Hall of Fame records shortcut */}
          <button
            onClick={onOpenStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/60 text-slate-200 hover:text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Records</span>
          </button>

          {/* Portfolio Link */}
          <a
            href="../../index.html#card-flags"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = window.location.pathname.includes('/dist')
                ? '../../index.html#card-flags'
                : '../index.html#card-flags';
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/60 text-slate-200 hover:text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-md no-underline"
            title="Return to Clark Galloway's Portfolio"
          >
            <span className="text-amber-400">←</span>
            <span className="hidden sm:inline">Portfolio</span>
          </a>
        </div>
      </div>

      {/* Main Video Game 2-Column Select Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Vertical Menu Selection */}
        <div className="lg:col-span-5 flex flex-col gap-2 relative">
          {/* Festive Hanging Flag Bunting */}
          <FlagBunting allFlags={allFlags} count={9} className="mb-0.5" />

          <div className="text-[11px] font-mono tracking-widest uppercase text-slate-400 mb-1 px-1 flex items-center justify-between">
            <span>
              Select Game Mode <span className="hidden sm:inline">(▲ / ▼ to navigate)</span>
            </span>
            <span className="text-amber-400 font-semibold hidden sm:inline">Press Enter to Start</span>
            <span className="text-amber-400 font-semibold sm:hidden">Tap to Select</span>
          </div>

          <div className="flex flex-col gap-2">
            {menuItems.map((item, idx) => {
              const isSelected = selectedIndex === idx;

              return (
                <button
                  key={item.id}
                  onClick={() => handleLaunch(item)}
                  onMouseEnter={() => {
                    if (selectedIndex !== idx) {
                      setSelectedIndex(idx);
                      sounds.playMenuMove();
                    }
                  }}
                  className={`group relative text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-amber-500 shadow-xl shadow-amber-500/10 translate-x-2'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
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
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
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
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Background Topographical / Compass Watermark */}
          <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full border border-slate-800/40 opacity-20 pointer-events-none flex items-center justify-center">
            <Compass className="w-56 h-56 text-amber-500/30" />
          </div>

          {/* Mode Title & Briefing */}
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mode Preview • {activeItem.index}
              </span>

              {currentScore !== null && currentScore > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Personal Best: <strong className="text-amber-400">{currentScore}</strong></span>
                </div>
              )}
            </div>

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

            {/* Showcase Flags Preview */}
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Sample Flags for this Mode:
              </span>
              <div className="grid grid-cols-4 gap-3">
                {showcaseFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className="h-20 sm:h-24 bg-slate-950/70 rounded-xl border border-slate-800 p-2 flex items-center justify-center hover:scale-105 transition-transform"
                    title={flag.name}
                  >
                    <FlagImage flag={flag} className="w-full h-full bg-transparent border-0" shadow={false} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Launch Button */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 text-center sm:text-left flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Difficulty, region & round count are selected next</span>
            </div>

            <button
              onClick={() => handleLaunch(activeItem)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 cursor-pointer transform hover:scale-[1.02] active:scale-98 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {activeItem.id === 'library'
                  ? 'Open Library (Enter)'
                  : activeItem.id === 'records'
                  ? 'View Records (Enter)'
                  : 'Select Difficulty & Start (Enter)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
