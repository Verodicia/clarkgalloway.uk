import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Flag, GameScope, DifficultyFilter, UserStats } from '../../types';
import { filterFlags, generateQuestionOptions, shuffle, saveStoredStats } from '../../utils/flags';
import { FlagImage } from '../FlagImage';
import { TriviaModal } from '../TriviaModal';
import { sounds } from '../../utils/sound';
import { fireConfetti, fireStreakConfetti } from '../../utils/confetti';
import { Search, Flame, Trophy, RotateCcw, ZoomIn, Eye } from 'lucide-react';

interface ZoomModeProps {
  allFlags: Flag[];
  scope: GameScope | GameScope[];
  difficulty?: DifficultyFilter;
  userStats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
  roundCount?: number | 'all';
}

export const ZoomMode: React.FC<ZoomModeProps> = ({
  allFlags,
  scope,
  difficulty = 'all',
  userStats,
  onUpdateStats,
  roundCount = 8,
}) => {
  const [pool, setPool] = useState<Flag[]>([]);
  const [currentFlag, setCurrentFlag] = useState<Flag | null>(null);
  const [options, setOptions] = useState<Flag[]>([]);
  const [selectedOption, setSelectedOption] = useState<Flag | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showTrivia, setShowTrivia] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const effectiveTotalRounds = React.useMemo(() => {
    if (pool.length === 0) return 8;
    if (roundCount === 'all') return pool.length;
    if (typeof roundCount === 'number') return Math.min(roundCount, pool.length);
    return Math.min(8, pool.length);
  }, [roundCount, pool.length]);

  // Zoom parameters: zoomFactor from 4.0 (super zoomed) down to 1.0 (full view)
  const [zoomLevel, setZoomLevel] = useState(4.0);
  const [zoomOrigin, setZoomOrigin] = useState<'center' | 'top left' | 'top right' | 'bottom left'>('center');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Origins for diverse zoom perspectives
  const origins = ['center', 'top left', 'top right', 'bottom left'] as const;

  const initRound = useCallback(
    (flag: Flag, poolList: Flag[]) => {
      setCurrentFlag(flag);
      setOptions(generateQuestionOptions(flag, poolList));
      setSelectedOption(null);
      setIsAnswered(false);
      setShowTrivia(false);
      setZoomLevel(4.0);
      setZoomOrigin(origins[Math.floor(Math.random() * origins.length)]);
    },
    []
  );

  useEffect(() => {
    let filtered = filterFlags(allFlags, scope, difficulty);
    if (filtered.length < 4) filtered = filterFlags(allFlags, 'all', 'all');
    const shuffled = shuffle(filtered);
    setPool(shuffled);
    setRound(1);
    setScore(0);
    setStreak(0);
    setGameOver(false);
    if (shuffled.length > 0) {
      initRound(shuffled[0], filtered);
    }
  }, [allFlags, scope, difficulty]);

  // Gradually zoom out over 15 seconds
  useEffect(() => {
    if (isAnswered || gameOver || showTrivia) return;

    timerRef.current = setInterval(() => {
      setZoomLevel((prev) => {
        if (prev <= 1.05) {
          return 1.0;
        }
        return Math.max(1.0, prev - 0.2);
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAnswered, gameOver, showTrivia]);

  const handleSelect = (option: Flag) => {
    if (isAnswered || !currentFlag) return;
    setIsAnswered(true);
    setSelectedOption(option);
    setZoomLevel(1.0); // Immediately reveal full flag

    const isCorrect = option.id === currentFlag.id;
    if (isCorrect) {
      sounds.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Points based on how zoomed in it was (earlier guess = more points!)
      const points = Math.round(300 + (zoomLevel - 1.0) * 230);
      setScore((s) => s + points);

      if (newStreak % 5 === 0) fireStreakConfetti();

      const newStats: UserStats = {
        ...userStats,
        totalCorrect: userStats.totalCorrect + 1,
        totalAttempts: userStats.totalAttempts + 1,
        bestStreak: Math.max(userStats.bestStreak, newStreak),
      };
      onUpdateStats(newStats);
      saveStoredStats(newStats);
    } else {
      sounds.playWrong();
      setStreak(0);
      const newStats: UserStats = {
        ...userStats,
        totalAttempts: userStats.totalAttempts + 1,
      };
      onUpdateStats(newStats);
      saveStoredStats(newStats);
    }

    setTimeout(() => {
      setShowTrivia(true);
    }, 800);
  };

  const nextQuestion = () => {
    setShowTrivia(false);

    if (round >= effectiveTotalRounds) {
      setGameOver(true);
      sounds.playWin();
      fireConfetti();
      const newStats: UserStats = {
        ...userStats,
        gamesPlayed: userStats.gamesPlayed + 1,
        bestStreak: Math.max(userStats.bestStreak, streak),
        highScores: {
          ...userStats.highScores,
          zoom: Math.max(userStats.highScores.zoom || 0, score),
        },
      };
      onUpdateStats(newStats);
      saveStoredStats(newStats);
      return;
    }

    const nextR = round + 1;
    setRound(nextR);
    const nextFlag = pool[nextR % pool.length];
    initRound(nextFlag, pool);
  };

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl text-center space-y-6">
        <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/30">
          <Trophy className="w-16 h-16 text-amber-400 animate-bounce" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-white">Investigation Complete!</h2>
          <p className="text-slate-400 mt-1">Eagle-eyed vexillological deduction!</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Score</span>
            <p className="text-3xl font-black text-amber-400 mt-1">{score}</p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Best Streak</span>
            <p className="text-3xl font-black text-emerald-400 mt-1">🔥 {streak}</p>
          </div>
        </div>

        <button
          onClick={() => {
            const filtered = shuffle(filterFlags(allFlags, scope, difficulty));
            setPool(filtered);
            setRound(1);
            setScore(0);
            setStreak(0);
            setGameOver(false);
            if (filtered.length > 0) initRound(filtered[0], filtered);
          }}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Investigate Again</span>
        </button>
      </div>
    );
  }

  if (!currentFlag) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Top Status */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/60">
            Mystery {round} / {effectiveTotalRounds}
          </span>
          <span className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
            <ZoomIn className="w-3.5 h-3.5" />
            Zoom: {zoomLevel.toFixed(1)}x
          </span>
        </div>

        <div className="flex items-center gap-4">
          {streak > 1 && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 animate-pulse">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{streak}x streak</span>
            </div>
          )}
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-semibold block">Score</span>
            <span className="text-lg font-black text-amber-400 leading-none">{score}</span>
          </div>
        </div>
      </div>

      {/* Zoom Container */}
      <div className="flex flex-col items-center w-full">
        <div className="relative w-full h-[21rem] sm:h-[27rem] md:h-[30rem] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          {/* Zoomed Flag Viewport */}
          <div
            className="w-full h-full transition-transform duration-700 ease-out"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: zoomOrigin,
            }}
          >
            <FlagImage flag={currentFlag} className="w-full h-full bg-transparent border-0" shadow={false} />
          </div>

          {/* Crosshair / Magnifying glass overlay when zoomed */}
          {zoomLevel > 1.2 && !isAnswered && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
              <div className="w-16 h-16 border-2 border-dashed border-amber-400 rounded-full" />
            </div>
          )}
        </div>

        {/* Reveal speed control */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => {
              setZoomLevel((z) => Math.max(1.0, z - 0.8));
              sounds.playClick();
            }}
            disabled={zoomLevel <= 1.0 || isAnswered}
            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Reveal More (Lowers Bonus)</span>
          </button>
        </div>

        {/* 4 Choices */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full mt-6">
          {options.map((option, idx) => {
            const isSelected = selectedOption?.id === option.id;
            const isCorrectTarget = option.id === currentFlag.id;

            let btnStyle =
              'bg-slate-900 hover:bg-slate-850 hover:border-slate-600 text-slate-200 border-slate-800';

            if (isAnswered) {
              if (isCorrectTarget) {
                btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50';
              } else if (isSelected && !isCorrectTarget) {
                btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/50';
              } else {
                btnStyle = 'bg-slate-900/50 border-slate-800/50 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                disabled={isAnswered}
                className={`p-3 sm:p-4 rounded-xl border text-left flex items-center justify-between transition-all font-semibold cursor-pointer shadow-md ${btnStyle}`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px] sm:text-xs font-mono text-slate-400 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs sm:text-base leading-snug truncate sm:whitespace-normal">{option.name}</span>
                    {option.parentCountry && (
                      <span className="text-[10px] sm:text-xs text-slate-400 block font-normal truncate">
                        {option.category} • {option.parentCountry}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showTrivia && (
        <TriviaModal
          flag={currentFlag}
          isCorrect={selectedOption?.id === currentFlag.id}
          selectedName={selectedOption?.name}
          onNext={nextQuestion}
          streak={streak}
        />
      )}
    </div>
  );
};
