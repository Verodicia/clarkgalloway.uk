import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Flag, GameScope, DifficultyFilter, UserStats } from '../../types';
import { filterFlags, generateQuestionOptions, shuffle, saveStoredStats } from '../../utils/flags';
import { FlagImage } from '../FlagImage';
import { sounds } from '../../utils/sound';
import { fireConfetti, fireStreakConfetti } from '../../utils/confetti';
import { Timer, Zap, Flame, Trophy, RotateCcw, Play, Check, X } from 'lucide-react';

interface BlitzModeProps {
  allFlags: Flag[];
  scope: GameScope;
  difficulty: DifficultyFilter;
  userStats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
}

export const BlitzMode: React.FC<BlitzModeProps> = ({
  allFlags,
  scope,
  difficulty,
  userStats,
  onUpdateStats,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [pool, setPool] = useState<Flag[]>([]);
  const [currentFlag, setCurrentFlag] = useState<Flag | null>(null);
  const [options, setOptions] = useState<Flag[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize pool
  const initGame = useCallback(() => {
    let filtered = filterFlags(allFlags, scope, difficulty);
    if (filtered.length < 4) filtered = filterFlags(allFlags, 'all', 'all');
    const shuffled = shuffle(filtered);
    setPool(shuffled);
    setCurrentFlag(shuffled[0]);
    setOptions(generateQuestionOptions(shuffled[0], filtered));
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setTotalCount(0);
    setGameOver(false);
    setIsPlaying(true);
    setFeedback(null);
  }, [allFlags, scope, difficulty]);

  // Timer countdown
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsPlaying(false);
          setGameOver(true);
          sounds.playWin();
          fireConfetti();
          return 0;
        }
        if (prev <= 10) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Save stats when game over
  useEffect(() => {
    if (gameOver) {
      const newStats: UserStats = {
        ...userStats,
        gamesPlayed: userStats.gamesPlayed + 1,
        totalCorrect: userStats.totalCorrect + correctCount,
        totalAttempts: userStats.totalAttempts + totalCount,
        bestStreak: Math.max(userStats.bestStreak, maxStreak),
        highScores: {
          ...userStats.highScores,
          blitz: Math.max(userStats.highScores.blitz || 0, score),
        },
      };
      onUpdateStats(newStats);
      saveStoredStats(newStats);
    }
  }, [gameOver]);

  const handleAnswer = (selected: Flag) => {
    if (!isPlaying || !currentFlag) return;

    setTotalCount((c) => c + 1);
    const isCorrect = selected.id === currentFlag.id;

    if (isCorrect) {
      sounds.playCorrect();
      setFeedback('correct');
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak((m) => Math.max(m, newStreak));
      setCorrectCount((c) => c + 1);

      // Multipliers
      let multiplier = 1;
      if (newStreak >= 10) multiplier = 4;
      else if (newStreak >= 6) multiplier = 3;
      else if (newStreak >= 3) multiplier = 2;

      setScore((s) => s + 100 * multiplier);

      if (newStreak % 5 === 0) fireStreakConfetti();
    } else {
      sounds.playWrong();
      setFeedback('wrong');
      setStreak(0);
    }

    // Flash feedback briefly and switch question instantly
    setTimeout(() => {
      setFeedback(null);
    }, 250);

    // Pick next question
    const nextIdx = (totalCount + 1) % pool.length;
    const nextFlag = pool[nextIdx];
    setCurrentFlag(nextFlag);
    setOptions(generateQuestionOptions(nextFlag, pool));
  };

  const getRank = (pts: number) => {
    if (pts >= 3500) return '🏅 Grand Vexillologist (Sheldon Tier)';
    if (pts >= 2500) return '🥇 Master Flag Expert';
    if (pts >= 1500) return '🥈 Flag Aficionado';
    if (pts >= 800) return '🥉 Flag Apprentice';
    return '🌱 Vexillology Novice';
  };

  // Multiplier badge calculation
  const multiplier = streak >= 10 ? 4 : streak >= 6 ? 3 : streak >= 3 ? 2 : 1;

  if (!isPlaying && !gameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl text-center space-y-6">
        <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/30">
          <Zap className="w-16 h-16 text-amber-400" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-white">60-Second Blitz Rush</h2>
          <p className="text-slate-400 mt-2 max-w-md text-sm">
            Answer as many flags as you can before the clock runs out! Build streaks to unlock massive 2x, 3x, and 4x combo multipliers!
          </p>
        </div>

        {userStats.highScores.blitz && (
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60 text-sm text-slate-300">
            High Score: <span className="font-bold text-amber-400">{userStats.highScores.blitz}</span>
          </div>
        )}

        <button
          onClick={initGame}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-lg font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>Start Blitz (60s)</span>
        </button>
      </div>
    );
  }

  if (gameOver) {
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl text-center space-y-6">
        <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/30">
          <Trophy className="w-16 h-16 text-amber-400 animate-bounce" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">Time's Up!</h2>
          <p className="text-amber-400 font-semibold mt-1">{getRank(score)}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Score</span>
            <p className="text-2xl font-black text-amber-400 mt-1">{score}</p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Flags</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{correctCount}</p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Accuracy</span>
            <p className="text-2xl font-black text-cyan-400 mt-1">{accuracy}%</p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Max Streak</span>
            <p className="text-2xl font-black text-purple-400 mt-1">🔥 {maxStreak}</p>
          </div>
        </div>

        <button
          onClick={initGame}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Play Blitz Again</span>
        </button>
      </div>
    );
  }

  if (!currentFlag) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      {/* Timer & Multiplier Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
            <span className={`text-2xl font-mono font-black ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="flex items-center gap-3">
            {multiplier > 1 && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-sm animate-pulse">
                ⚡ {multiplier}X MULTIPLIER
              </span>
            )}
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-semibold block">Score</span>
              <span className="text-xl font-black text-amber-400 leading-none">{score}</span>
            </div>
          </div>
        </div>

        {/* Progress timer bar */}
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 10 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
            }`}
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>
      </div>

      {/* Flag View with rapid feedback overlay */}
      <div className="relative flex flex-col items-center">
        <div className="w-full max-w-md h-56 sm:h-64 shadow-2xl relative rounded-2xl border border-slate-800 bg-slate-950/70 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <FlagImage flag={currentFlag} className="w-full h-full bg-transparent border-0" shadow={false} />

          {/* Feedback flash */}
          {feedback === 'correct' && (
            <div className="absolute inset-0 bg-emerald-500/40 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-100">
              <Check className="w-20 h-20 text-white drop-shadow-lg" />
            </div>
          )}
          {feedback === 'wrong' && (
            <div className="absolute inset-0 bg-rose-500/40 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-100">
              <X className="w-20 h-20 text-white drop-shadow-lg" />
            </div>
          )}
        </div>

        {/* Rapid 4 Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-5">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option)}
              className="p-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 border border-slate-800 hover:border-slate-700 rounded-xl text-left font-bold text-slate-100 transition-all cursor-pointer shadow-md flex items-center justify-between"
            >
              <span className="truncate">{option.name}</span>
              {option.parentCountry && (
                <span className="text-xs font-normal text-slate-400 shrink-0 ml-2">
                  {option.parentCountry}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
