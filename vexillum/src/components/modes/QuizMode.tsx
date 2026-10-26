import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Flag, GameScope, DifficultyFilter, UserStats } from '../../types';
import { filterFlags, generateQuestionOptions, shuffle, saveStoredStats } from '../../utils/flags';
import { FlagImage } from '../FlagImage';
import { TriviaModal } from '../TriviaModal';
import { sounds } from '../../utils/sound';
import { fireConfetti, fireStreakConfetti } from '../../utils/confetti';
import { Flame, RotateCcw, Trophy, Check, X, HelpCircle } from 'lucide-react';
import { HeaderStatsPortal } from '../HeaderStatsPortal';

interface QuizModeProps {
  allFlags: Flag[];
  scope: GameScope | GameScope[];
  difficulty?: DifficultyFilter;
  userStats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
  drillFlag?: Flag | null;
  onClearDrill?: () => void;
  roundCount?: number | 'all';
  quizDirection?: 'flag-to-name' | 'name-to-flag';
  onPlayAgain?: () => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({
  allFlags,
  scope,
  difficulty = 'all',
  userStats,
  onUpdateStats,
  drillFlag,
  onClearDrill,
  roundCount = 10,
  quizDirection = 'flag-to-name',
  onPlayAgain,
}) => {
  const isReverse = quizDirection === 'name-to-flag';
  const [pool, setPool] = useState<Flag[]>([]);
  const [currentFlag, setCurrentFlag] = useState<Flag | null>(null);
  const [options, setOptions] = useState<Flag[]>([]);
  const [selectedOption, setSelectedOption] = useState<Flag | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [showTrivia, setShowTrivia] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const effectiveTotalRounds = useMemo(() => {
    if (pool.length === 0) return 10;
    if (roundCount === 'all') return pool.length;
    if (typeof roundCount === 'number') return Math.min(roundCount, pool.length);
    return Math.min(10, pool.length);
  }, [roundCount, pool.length]);

  // Initialize pool
  useEffect(() => {
    let filtered = filterFlags(allFlags, scope, difficulty);
    if (filtered.length < 4) {
      filtered = filterFlags(allFlags, 'all', 'all');
    }
    const shuffled = shuffle(filtered);
    setPool(shuffled);
    setRound(1);
    setScore(0);
    setStreak(0);
    setGameOver(false);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowTrivia(false);

    if (drillFlag) {
      setCurrentFlag(drillFlag);
      setOptions(generateQuestionOptions(drillFlag, filtered));
    } else if (shuffled.length > 0) {
      const first = shuffled[0];
      setCurrentFlag(first);
      setOptions(generateQuestionOptions(first, filtered));
    }
  }, [allFlags, scope, difficulty, drillFlag]);

  const nextQuestion = useCallback(() => {
    setShowTrivia(false);
    setSelectedOption(null);
    setIsAnswered(false);

    if (round >= effectiveTotalRounds) {
      setGameOver(true);
      sounds.playWin();
      fireConfetti();
      // Record stats
      const newStats: UserStats = {
        ...userStats,
        gamesPlayed: userStats.gamesPlayed + 1,
        bestStreak: Math.max(userStats.bestStreak, streak),
        highScores: {
          ...userStats.highScores,
          quiz: Math.max(userStats.highScores.quiz || 0, score),
        },
      };
      onUpdateStats(newStats);
      saveStoredStats(newStats);
      if (onClearDrill) onClearDrill();
      return;
    }

    setRound((r) => r + 1);
    const nextIndex = round % pool.length;
    const nextFlag = pool[nextIndex];
    setCurrentFlag(nextFlag);
    setOptions(generateQuestionOptions(nextFlag, pool));
  }, [round, effectiveTotalRounds, pool, streak, score, userStats, onUpdateStats, onClearDrill]);

  const handleSelect = useCallback(
    (option: Flag) => {
      if (isAnswered || !currentFlag) return;
      setIsAnswered(true);
      setSelectedOption(option);

      const isCorrect = option.id === currentFlag.id;
      if (isCorrect) {
        sounds.playCorrect();
        const newStreak = streak + 1;
        setStreak(newStreak);
        setScore((s) => s + 100 + (newStreak > 1 ? (newStreak - 1) * 20 : 0));
        if (newStreak % 5 === 0) {
          fireStreakConfetti();
        }

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

      // Small delay before opening trivia modal
      setTimeout(() => {
        setShowTrivia(true);
      }, 700);
    },
    [isAnswered, currentFlag, streak, userStats, onUpdateStats]
  );

  // Keyboard navigation 1-4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered || showTrivia || gameOver) return;
      const key = e.key;
      if (['1', '2', '3', '4'].includes(key)) {
        const index = parseInt(key, 10) - 1;
        if (options[index]) {
          handleSelect(options[index]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, showTrivia, gameOver, options, handleSelect]);

  const restartQuiz = () => {
    let filtered = filterFlags(allFlags, scope, difficulty);
    if (filtered.length < 4) filtered = filterFlags(allFlags, 'all', 'all');
    const shuffled = shuffle(filtered);
    setPool(shuffled);
    setRound(1);
    setScore(0);
    setStreak(0);
    setGameOver(false);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowTrivia(false);
    if (shuffled.length > 0) {
      setCurrentFlag(shuffled[0]);
      setOptions(generateQuestionOptions(shuffled[0], filtered));
    }
    sounds.playClick();
  };

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl text-center space-y-6">
        <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/30">
          <Trophy className="w-16 h-16 text-amber-400 animate-bounce" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-white">Quiz Complete!</h2>
          <p className="text-slate-400 mt-1">Excellent vexillological examination!</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Final Score</span>
            <p className="text-3xl font-black text-amber-400 mt-1">{score}</p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 uppercase font-semibold">Best Streak</span>
            <p className="text-3xl font-black text-emerald-400 mt-1">🔥 {streak}</p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            if (onPlayAgain) {
              onPlayAgain();
            } else {
              restartQuiz();
            }
          }}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Play Again</span>
        </button>
      </div>
    );
  }

  if (!currentFlag) {
    return (
      <div className="text-center p-12 text-slate-400">
        Loading quiz pool...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Portaled Header Badges (Positioned beside Main Menu button in top Header) */}
      <HeaderStatsPortal>
        <span className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-sm">
          Question {round} / {effectiveTotalRounds}
        </span>
        {streak > 1 && (
          <div className="flex items-center gap-1 text-xs font-bold text-amber-400 animate-pulse bg-amber-500/10 border border-amber-500/20 px-2 sm:px-2.5 py-1.5 rounded-xl">
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{streak}x streak</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Score</span>
          <span className="text-xs sm:text-sm font-black text-amber-400 leading-none">{score}</span>
        </div>
      </HeaderStatsPortal>

      {/* Question Card */}
      {!isReverse ? (
        // Standard Mode: Flag is shown, choose name
        <div className="flex flex-col items-center w-full">
          <div className="w-full h-[21rem] sm:h-[27rem] md:h-[30rem] shadow-2xl transition-transform hover:scale-[1.005] bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-center p-4 sm:p-6">
            <FlagImage flag={currentFlag} className="w-full h-full bg-transparent border-0" shadow={false} spyglass={true} />
          </div>

          <p className="mt-3 text-slate-300 text-sm font-medium">
            Which sovereign country or province does this flag belong to?
          </p>

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

                  {isAnswered && isCorrectTarget && (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 ml-1.5" />
                  )}
                  {isAnswered && isSelected && !isCorrectTarget && (
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // Reverse Mode: Name is shown, choose from 4 Flag cards
        <div className="flex flex-col items-center">
          <div className="text-center bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Find the Flag
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {currentFlag.name}
            </h2>
            {currentFlag.parentCountry && (
              <p className="text-xs text-slate-400 mt-1">
                {currentFlag.category} of {currentFlag.parentCountry}
              </p>
            )}
          </div>

          {/* 4 Flag Cards */}
          <div className="grid grid-cols-2 gap-4 w-full mt-6">
            {options.map((option, idx) => {
              const isSelected = selectedOption?.id === option.id;
              const isCorrectTarget = option.id === currentFlag.id;

              let cardBorder = 'border-slate-800 hover:border-amber-500/70';
              if (isAnswered) {
                if (isCorrectTarget) cardBorder = 'border-emerald-500 ring-4 ring-emerald-500/40';
                else if (isSelected) cardBorder = 'border-rose-500 ring-4 ring-rose-500/40';
                else cardBorder = 'border-slate-800 opacity-40';
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  disabled={isAnswered}
                  className={`relative p-2 bg-slate-900 rounded-xl border transition-all cursor-pointer shadow-lg group ${cardBorder}`}
                >
                  <span className="absolute top-3 left-3 z-10 w-6 h-6 rounded-md bg-slate-900/90 backdrop-blur-sm border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                    {idx + 1}
                  </span>
                  <div className="w-full h-32 sm:h-36 flex items-center justify-center p-2 bg-slate-950/60 rounded-lg">
                    <FlagImage flag={option} className="w-full h-full bg-transparent border-0" shadow={false} spyglass={true} spyglassSize={125} />
                  </div>
                  {isAnswered && (
                    <div className="text-center mt-2 text-xs font-semibold text-slate-300 truncate">
                      {option.name}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Trivia popup after answering */}
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
