import React, { useState, useEffect, useCallback } from 'react';
import { Flag, GameScope, DifficultyFilter, UserStats } from '../../types';
import { filterFlags, shuffle, saveStoredStats } from '../../utils/flags';
import { FlagImage } from '../FlagImage';
import { sounds } from '../../utils/sound';
import { fireConfetti } from '../../utils/confetti';
import { RotateCcw, Trophy, Timer, Eye, Check } from 'lucide-react';

interface MemoryModeProps {
  allFlags: Flag[];
  scope: GameScope | GameScope[];
  difficulty?: DifficultyFilter;
  userStats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
}

interface MemoryCard {
  id: string; // unique card id
  flagId: string;
  type: 'flag' | 'name';
  flag: Flag;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryMode: React.FC<MemoryModeProps> = ({
  allFlags,
  scope,
  difficulty = 'all',
  userStats,
  onUpdateStats,
}) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MemoryCard[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [pairCount, setPairCount] = useState<6 | 8>(6);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const initGame = useCallback(() => {
    let filtered = filterFlags(allFlags, scope, difficulty);
    if (filtered.length < pairCount) filtered = filterFlags(allFlags, 'all', 'all');

    const chosenFlags = shuffle(filtered).slice(0, pairCount);
    const newCards: MemoryCard[] = [];

    chosenFlags.forEach((flag, idx) => {
      // Flag visual card
      newCards.push({
        id: `flag-${flag.id}-${idx}`,
        flagId: flag.id,
        type: 'flag',
        flag,
        isFlipped: false,
        isMatched: false,
      });
      // Name card
      newCards.push({
        id: `name-${flag.id}-${idx}`,
        flagId: flag.id,
        type: 'name',
        flag,
        isFlipped: false,
        isMatched: false,
      });
    });

    setCards(shuffle(newCards));
    setSelectedCards([]);
    setMoves(0);
    setMatches(0);
    setSeconds(0);
    setTimerActive(false);
    setGameOver(false);
  }, [allFlags, scope, difficulty, pairCount]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerActive && !gameOver) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, gameOver]);

  const handleCardClick = (card: MemoryCard) => {
    if (card.isFlipped || card.isMatched || selectedCards.length >= 2) return;

    if (!timerActive) {
      setTimerActive(true);
    }

    sounds.playClick();

    // Flip this card
    const updated = cards.map((c) =>
      c.id === card.id ? { ...c, isFlipped: true } : c
    );
    setCards(updated);

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [cardA, cardB] = newSelected;

      if (cardA.flagId === cardB.flagId) {
        // MATCH!
        sounds.playCorrect();
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.flagId === cardA.flagId ? { ...c, isMatched: true } : c
            )
          );
          setSelectedCards([]);
          setMatches((m) => {
            const nextMatches = m + 1;
            if (nextMatches === pairCount) {
              setGameOver(true);
              setTimerActive(false);
              sounds.playWin();
              fireConfetti();

              // Save stats
              const score = Math.max(100, 2000 - moves * 50 - seconds * 10);
              const newStats: UserStats = {
                ...userStats,
                gamesPlayed: userStats.gamesPlayed + 1,
                highScores: {
                  ...userStats.highScores,
                  memory: Math.max(userStats.highScores.memory || 0, score),
                },
              };
              onUpdateStats(newStats);
              saveStoredStats(newStats);
            }
            return nextMatches;
          });
        }, 500);
      } else {
        // MISMATCH
        setTimeout(() => {
          sounds.playWrong();
          setCards((prev) =>
            prev.map((c) =>
              c.id === cardA.id || c.id === cardB.id
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl text-center space-y-6">
        <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/30">
          <Trophy className="w-16 h-16 text-amber-400 animate-bounce" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-white">Memory Master!</h2>
          <p className="text-slate-400 mt-1">All {pairCount} flag pairs discovered!</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Moves</span>
            <p className="text-3xl font-black text-amber-400 mt-1">{moves}</p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Time</span>
            <p className="text-3xl font-black text-cyan-400 mt-1">{formatTime(seconds)}</p>
          </div>
        </div>

        <button
          onClick={initGame}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Play Memory Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Top Controls & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700/60 text-xs">
            <button
              onClick={() => {
                setPairCount(6);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                pairCount === 6 ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
              }`}
            >
              12 Cards (6 Pairs)
            </button>
            <button
              onClick={() => {
                setPairCount(8);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                pairCount === 8 ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
              }`}
            >
              16 Cards (8 Pairs)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span className="font-mono font-bold">{formatTime(seconds)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Eye className="w-4 h-4 text-purple-400" />
            <span>Moves: <strong className="text-white">{moves}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Matches: <strong className="text-emerald-400">{matches}</strong> / {pairCount}</span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div
        className={`grid gap-3 sm:gap-4 ${
          pairCount === 6 ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-4 sm:grid-cols-4'
        }`}
      >
        {cards.map((card) => {
          const isFlippedOrMatched = card.isFlipped || card.isMatched;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`h-28 sm:h-36 rounded-xl border transition-all cursor-pointer select-none perspective-1000 ${
                card.isMatched
                  ? 'border-emerald-500/80 bg-emerald-950/20 opacity-80'
                  : isFlippedOrMatched
                  ? 'border-amber-500/80 bg-slate-800'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:scale-[1.02]'
              }`}
            >
              {isFlippedOrMatched ? (
                <div className="w-full h-full p-2 flex flex-col items-center justify-center animate-in fade-in duration-200">
                  {card.type === 'flag' ? (
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <FlagImage flag={card.flag} className="w-full h-full bg-transparent border-0" shadow={false} />
                    </div>
                  ) : (
                    <div className="text-center p-1">
                      <span className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-tight">
                        {card.flag.name}
                      </span>
                      {card.flag.parentCountry && (
                        <span className="text-[10px] text-amber-300 block mt-0.5">
                          {card.flag.parentCountry}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 hover:text-amber-400 transition-colors">
                  <span className="text-2xl sm:text-3xl">🚩</span>
                  <span className="text-[10px] uppercase font-mono tracking-widest mt-1 opacity-60">
                    Match
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
