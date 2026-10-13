import React, { useState, useEffect, useCallback } from 'react';
import { Flag, GameScope, DifficultyFilter, UserStats } from '../../types';
import { filterFlags, generateQuestionOptions, shuffle, saveStoredStats } from '../../utils/flags';
import { FlagImage } from '../FlagImage';
import { TriviaModal } from '../TriviaModal';
import { sounds } from '../../utils/sound';
import { fireConfetti, fireStreakConfetti } from '../../utils/confetti';
import { Heart, Flame, Trophy, RotateCcw, ShieldCheck } from 'lucide-react';

interface StreakModeProps {
  allFlags: Flag[];
  scope: GameScope;
  difficulty: DifficultyFilter;
  userStats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
}

export const StreakMode: React.FC<StreakModeProps> = ({
  allFlags,
  scope,
  difficulty,
  userStats,
  onUpdateStats,
}) => {
  const [pool, setPool] = useState<Flag[]>([]);
  const [currentFlag, setCurrentFlag] = useState<Flag | null>(null);
  const [options, setOptions] = useState<Flag[]>([]);
  const [selectedOption, setSelectedOption] = useState<Flag | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [showTrivia, setShowTrivia] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const initGame = useCallback(() => {
    let filtered = filterFlags(allFlags, scope, difficulty);
    if (filtered.length < 4) filtered = filterFlags(allFlags, 'all', 'all');
    const shuffled = shuffle(filtered);
    setPool(shuffled);
    setCurrentFlag(shuffled[0]);
    setOptions(generateQuestionOptions(shuffled[0], filtered));
    setSelectedOption(null);
    setIsAnswered(false);
    setShowTrivia(false);
    setLives(3);
    setStreak(0);
    setScore(0);
    setGameOver(false);
  }, [allFlags, scope, difficulty]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleSelect = (option: Flag) => {
    if (isAnswered || !currentFlag) return;
    setIsAnswered(true);
    setSelectedOption(option);

    const isCorrect = option.id === currentFlag.id;
    if (isCorrect) {
      sounds.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = 100 + newStreak * 25;
      setScore((s) => s + points);

      if (newStreak % 5 === 0) {
        fireStreakConfetti();
        // Bonus extra life if under 3!
        if (lives < 3) {
          setLives((l) => l + 1);
        }
      }

      const newStats: UserStats = {
        ...userStats,
        totalCorrect: userStats.totalCorrect + 1,
        totalAttempts: userStats.totalAttempts + 1,
        bestStreak: Math.max(userStats.bestStreak, newStreak),
      };
      onUpdateStats(newStats);
      saveStoredStats(newStats);

      setTimeout(() => {
        nextQuestion(true);
      }, 700);
    } else {
      sounds.playWrong();
      const newLives = lives - 1;
      setLives(newLives);

      const newStats: UserStats = {
        ...userStats,
        totalAttempts: userStats.totalAttempts + 1,
      };
      onUpdateStats(newStats);
      saveStoredStats(newStats);

      if (newLives <= 0) {
        setTimeout(() => {
          setGameOver(true);
          sounds.playWin();
          // Update high score
          const finalStats: UserStats = {
            ...newStats,
            gamesPlayed: userStats.gamesPlayed + 1,
            highScores: {
              ...userStats.highScores,
              streak: Math.max(userStats.highScores.streak || 0, streak),
            },
          };
          onUpdateStats(finalStats);
          saveStoredStats(finalStats);
        }, 800);
      } else {
        setTimeout(() => {
          setShowTrivia(true);
        }, 700);
      }
    }
  };

  const nextQuestion = (wasCorrect: boolean = false) => {
    setShowTrivia(false);
    setSelectedOption(null);
    setIsAnswered(false);

    const nextIdx = Math.floor(Math.random() * pool.length);
    const nextFlag = pool[nextIdx];
    setCurrentFlag(nextFlag);
    setOptions(generateQuestionOptions(nextFlag, pool));
  };

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl text-center space-y-6">
        <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/30">
          <Trophy className="w-16 h-16 text-amber-400 animate-bounce" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-white">Survival Ended!</h2>
          <p className="text-slate-400 mt-1">You ran out of lives!</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Streak Reached</span>
            <p className="text-4xl font-black text-amber-400 mt-1">🔥 {streak}</p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Points</span>
            <p className="text-4xl font-black text-cyan-400 mt-1">{score}</p>
          </div>
        </div>

        <button
          onClick={initGame}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Try Survival Again</span>
        </button>
      </div>
    );
  }

  if (!currentFlag) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Top Status */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((heartIndex) => (
            <Heart
              key={heartIndex}
              className={`w-6 h-6 transition-all ${
                heartIndex <= lives
                  ? 'text-rose-500 fill-rose-500 scale-100'
                  : 'text-slate-700 fill-slate-800 scale-90'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-black text-lg">
            <Flame className="w-5 h-5 fill-amber-400" />
            <span>Streak: {streak}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-semibold block">Score</span>
            <span className="text-lg font-black text-white leading-none">{score}</span>
          </div>
        </div>
      </div>

      {/* Flag View */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md h-56 sm:h-64 shadow-2xl bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-center p-3 sm:p-4">
          <FlagImage flag={currentFlag} className="w-full h-full bg-transparent border-0" shadow={false} />
        </div>

        {/* 4 Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6">
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
                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all font-semibold cursor-pointer shadow-md ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-xs font-mono text-slate-400 shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="block text-base leading-snug">{option.name}</span>
                    {option.parentCountry && (
                      <span className="text-xs text-slate-400 block font-normal">
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
          onNext={() => nextQuestion(false)}
          streak={streak}
        />
      )}
    </div>
  );
};
