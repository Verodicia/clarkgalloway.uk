import React, { useState, useEffect, useRef } from 'react';
import { Flag, GameScope, DifficultyFilter, UserStats } from '../../types';
import { filterFlags, shuffle, saveStoredStats } from '../../utils/flags';
import { FlagImage } from '../FlagImage';
import { TriviaModal } from '../TriviaModal';
import { sounds } from '../../utils/sound';
import { fireConfetti, fireStreakConfetti } from '../../utils/confetti';
import { Flame, Lightbulb, SkipForward, ArrowRight, Check, Trophy, RotateCcw } from 'lucide-react';

interface TypeModeProps {
  allFlags: Flag[];
  scope: GameScope;
  difficulty: DifficultyFilter;
  userStats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
  roundCount?: number | 'all';
}

// Normalize strings for matching (strips diacritics, lowercase, removes non-alphanumeric)
function normalizeName(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export const TypeMode: React.FC<TypeModeProps> = ({
  allFlags,
  scope,
  difficulty,
  userStats,
  onUpdateStats,
  roundCount = 10,
}) => {
  const [pool, setPool] = useState<Flag[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [hintLevel, setHintLevel] = useState(0); // 0: None, 1: Continent, 2: Capital, 3: First letter
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [showTrivia, setShowTrivia] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const effectiveTotalRounds = React.useMemo(() => {
    if (pool.length === 0) return 10;
    if (roundCount === 'all') return pool.length;
    if (typeof roundCount === 'number') return Math.min(roundCount, pool.length);
    return Math.min(10, pool.length);
  }, [roundCount, pool.length]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let filtered = filterFlags(allFlags, scope, difficulty);
    if (filtered.length < 5) filtered = filterFlags(allFlags, 'all', 'all');
    const shuffled = shuffle(filtered);
    setPool(shuffled);
    setCurrentIndex(0);
    setRound(1);
    setScore(0);
    setStreak(0);
    setHintLevel(0);
    setInputValue('');
    setGameOver(false);
    setShowTrivia(false);
  }, [allFlags, scope, difficulty]);

  useEffect(() => {
    if (!showTrivia && !gameOver) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentIndex, showTrivia, gameOver]);

  const currentFlag = pool[currentIndex];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentFlag || showTrivia || gameOver) return;

    const typed = normalizeName(inputValue.trim());
    const target = normalizeName(currentFlag.name);

    // Common aliases check
    let match = typed === target;
    if (!match) {
      if (currentFlag.code.toLowerCase() === 'us' && ['usa', 'us', 'america', 'unitedstatesofamerica'].includes(typed)) match = true;
      if (currentFlag.code.toLowerCase() === 'gb' && ['uk', 'britain', 'greatbritain'].includes(typed)) match = true;
      if (currentFlag.code.toLowerCase() === 'ae' && ['uae', 'emirates'].includes(typed)) match = true;
      if (currentFlag.code.toLowerCase() === 'cz' && ['czechia', 'czechrepublic'].includes(typed)) match = true;
      if (currentFlag.code.toLowerCase() === 'kr' && ['korea', 'southkorea'].includes(typed)) match = true;
      if (currentFlag.code.toLowerCase() === 'cd' && ['drc', 'congodrc'].includes(typed)) match = true;
    }

    if (match) {
      sounds.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = Math.max(30, 150 - hintLevel * 30 + (newStreak > 1 ? (newStreak - 1) * 20 : 0));
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
      setIsAnswerCorrect(true);
    } else {
      sounds.playWrong();
      setStreak(0);
      const newStats: UserStats = {
        ...userStats,
        totalAttempts: userStats.totalAttempts + 1,
      };
      onUpdateStats(newStats);
      saveStoredStats(newStats);
      setIsAnswerCorrect(false);
    }

    setShowTrivia(true);
  };

  const handleSkip = () => {
    sounds.playClick();
    setStreak(0);
    setIsAnswerCorrect(false);
    setShowTrivia(true);
  };

  const nextQuestion = () => {
    setShowTrivia(false);
    setInputValue('');
    setHintLevel(0);

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
          type: Math.max(userStats.highScores.type || 0, score),
        },
      };
      onUpdateStats(newStats);
      saveStoredStats(newStats);
      return;
    }

    setRound((r) => r + 1);
    setCurrentIndex((i) => (i + 1) % pool.length);
  };

  // Autocomplete matching list (top 4 matches)
  const suggestions = React.useMemo(() => {
    const val = inputValue.trim().toLowerCase();
    if (val.length < 2) return [];
    return allFlags
      .filter((f) => f.name.toLowerCase().includes(val))
      .slice(0, 4);
  }, [inputValue, allFlags]);

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto shadow-2xl text-center space-y-6">
        <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/30">
          <Trophy className="w-16 h-16 text-amber-400 animate-bounce" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-white">Typing Bee Complete!</h2>
          <p className="text-slate-400 mt-1">Superb spelling accuracy!</p>
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
            const filtered = shuffle(filterFlags(allFlags, scope, difficulty));
            setPool(filtered);
            setCurrentIndex(0);
            setRound(1);
            setScore(0);
            setStreak(0);
            setHintLevel(0);
            setInputValue('');
            setGameOver(false);
          }}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Play Again</span>
        </button>
      </div>
    );
  }

  if (!currentFlag) {
    return <div className="text-center p-12 text-slate-400">Loading flags...</div>;
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {/* Top Status */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/60">
          Question {round} / {effectiveTotalRounds}
        </span>

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

      {/* Flag View */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md h-56 sm:h-64 shadow-2xl bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-center p-3 sm:p-4">
          <FlagImage flag={currentFlag} className="w-full h-full bg-transparent border-0" shadow={false} />
        </div>

        {/* Hints Display */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 min-h-[32px]">
          {hintLevel >= 1 && (
            <span className="text-xs bg-slate-800/90 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
              📍 Region: {currentFlag.continent}
            </span>
          )}
          {hintLevel >= 2 && currentFlag.capital && currentFlag.capital !== 'N/A' && (
            <span className="text-xs bg-slate-800/90 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30">
              🏛️ Capital: {currentFlag.capital}
            </span>
          )}
          {hintLevel >= 3 && (
            <span className="text-xs bg-slate-800/90 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 font-mono">
              🔤 Starts with: {currentFlag.name[0]}... ({currentFlag.name.length} letters)
            </span>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full mt-4 flex flex-col gap-3 relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type the country or state name..."
              className="w-full bg-slate-900 border-2 border-slate-700 focus:border-amber-500 text-white text-lg font-semibold px-4 py-3.5 rounded-xl outline-none transition-all placeholder:text-slate-600 shadow-inner"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Submit</span>
            </button>
          </div>

          {/* Autocomplete Quick Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    setInputValue(s.name);
                    inputRef.current?.focus();
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-2.5 py-1 rounded-md border border-slate-700/60 cursor-pointer transition-colors"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* Hint & Skip Controls */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                if (hintLevel < 3) {
                  setHintLevel((h) => h + 1);
                  sounds.playClick();
                }
              }}
              disabled={hintLevel >= 3}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-40 font-medium px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Get Hint ({3 - hintLevel} left)</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip Question</span>
            </button>
          </div>
        </form>
      </div>

      {showTrivia && (
        <TriviaModal
          flag={currentFlag}
          isCorrect={isAnswerCorrect}
          selectedName={inputValue.trim() || 'Skipped'}
          onNext={nextQuestion}
          streak={streak}
        />
      )}
    </div>
  );
};
