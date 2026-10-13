import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flag, GameScope, DifficultyFilter, UserStats } from '../../types';
import { COLOR_FLAGS, ColorFlag, ColorSegment, ColorOption } from '../../data/colorFlags';
import { filterFlags, filterColorFlags, shuffle, saveStoredStats } from '../../utils/flags';
import { FlagImage } from '../FlagImage';
import { sounds } from '../../utils/sound';
import { fireConfetti } from '../../utils/confetti';
import {
  Palette,
  RotateCcw,
  Check,
  X,
  HelpCircle,
  Trophy,
  Flame,
  ArrowRight,
  Eye,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

interface ColorModeProps {
  allFlags: Flag[];
  scope: GameScope;
  difficulty: DifficultyFilter;
  userStats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
  roundCount?: number | 'all';
}

export const ColorMode: React.FC<ColorModeProps> = ({
  allFlags,
  scope,
  difficulty,
  userStats,
  onUpdateStats,
  roundCount = 10,
}) => {
  // Filtered pool of colorable flags matching exact mode scope & difficulty
  const flagPool = useMemo(() => {
    let pool = filterColorFlags(allFlags, COLOR_FLAGS, scope, difficulty);
    // If a user selected a specific scope that has 0 flags in painter mode, fallback to all painter flags
    if (pool.length === 0) {
      pool = COLOR_FLAGS;
    }
    return shuffle(pool);
  }, [allFlags, scope, difficulty]);

  const totalRounds = useMemo(() => {
    if (flagPool.length === 0) return 10;
    if (roundCount === 'all') return flagPool.length;
    if (typeof roundCount === 'number') return Math.min(roundCount, flagPool.length);
    return Math.min(10, flagPool.length);
  }, [roundCount, flagPool.length]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userPaintedColors, setUserPaintedColors] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    isAllCorrect: boolean;
    correctCount: number;
    totalCount: number;
  } | null>(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Current active flag
  const currentFlag: ColorFlag | undefined = flagPool[currentIndex];

  // Corresponding official Flag entity from allFlags
  const officialFlag = useMemo(() => {
    if (!currentFlag) return null;
    return (
      allFlags.find(
        (f) =>
          f.code.toLowerCase() === currentFlag.countryCode.toLowerCase() ||
          f.name.toLowerCase() === currentFlag.name.toLowerCase()
      ) || null
    );
  }, [allFlags, currentFlag]);

  // Set default active color when flag changes
  useEffect(() => {
    if (currentFlag && currentFlag.palette.length > 0) {
      setSelectedColor(currentFlag.palette[0].id);
      setUserPaintedColors({});
      setIsEvaluated(false);
      setEvaluationResult(null);
      setShowHint(false);
      setShowSolutionModal(false);
    }
  }, [currentIndex, currentFlag]);

  // Handle painting a segment
  const handlePaintSegment = (segmentId: string) => {
    if (isEvaluated && evaluationResult?.isAllCorrect) return;
    if (!selectedColor) return;

    sounds.playPaint();
    setUserPaintedColors((prev) => ({
      ...prev,
      [segmentId]: selectedColor,
    }));

    // If evaluated earlier, clear evaluation state on modification
    if (isEvaluated) {
      setIsEvaluated(false);
      setEvaluationResult(null);
    }
  };

  // Clear current canvas
  const handleClearCanvas = () => {
    sounds.playClick();
    setUserPaintedColors({});
    setIsEvaluated(false);
    setEvaluationResult(null);
  };

  // Check flag answer
  const handleVerifyFlag = () => {
    if (!currentFlag) return;

    sounds.playClick();
    const segments = currentFlag.segments;
    let correctCount = 0;

    segments.forEach((seg) => {
      if (userPaintedColors[seg.id] === seg.correctColor) {
        correctCount++;
      }
    });

    const isAllCorrect = correctCount === segments.length;
    setEvaluationResult({
      isAllCorrect,
      correctCount,
      totalCount: segments.length,
    });
    setIsEvaluated(true);

    if (isAllCorrect) {
      sounds.playCorrect();
      fireConfetti();

      const roundPoints = 500 + streak * 75;
      const nextStreak = streak + 1;
      const nextScore = score + roundPoints;

      setScore(nextScore);
      setStreak(nextStreak);
      setShowSolutionModal(true);

      // Update user stats
      const nextStats: UserStats = {
        ...userStats,
        totalCorrect: userStats.totalCorrect + 1,
        totalAttempts: userStats.totalAttempts + 1,
        bestStreak: Math.max(userStats.bestStreak, nextStreak),
        highScores: {
          ...userStats.highScores,
          color: Math.max(userStats.highScores.color || 0, nextScore),
        },
      };
      onUpdateStats(nextStats);
      saveStoredStats(nextStats);
    } else {
      sounds.playWrong();
      setStreak(0);

      // Record attempt
      const nextStats: UserStats = {
        ...userStats,
        totalAttempts: userStats.totalAttempts + 1,
      };
      onUpdateStats(nextStats);
      saveStoredStats(nextStats);
    }
  };

  // Reveal correct solution
  const handleRevealSolution = () => {
    if (!currentFlag) return;
    sounds.playClick();

    // Auto-fill all segments with correct colors
    const correctMap: Record<string, string> = {};
    currentFlag.segments.forEach((seg) => {
      correctMap[seg.id] = seg.correctColor;
    });
    setUserPaintedColors(correctMap);
    setIsEvaluated(true);
    setEvaluationResult({
      isAllCorrect: true,
      correctCount: currentFlag.segments.length,
      totalCount: currentFlag.segments.length,
    });
    setStreak(0);
    setShowSolutionModal(true);
  };

  // Advance to next flag
  const handleNextFlag = useCallback(() => {
    sounds.playClick();
    if (currentIndex + 1 >= totalRounds) {
      setGameOver(true);
      sounds.playWin();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalRounds]);

  // Restart game
  const handleRestart = () => {
    sounds.playClick();
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setGameOver(false);
    setUserPaintedColors({});
    setIsEvaluated(false);
    setEvaluationResult(null);
    setShowSolutionModal(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentFlag || gameOver) return;

      // Number keys 1-9 select color swatch
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= currentFlag.palette.length) {
        setSelectedColor(currentFlag.palette[num - 1].id);
        sounds.playClick();
      } else if (e.key === 'c' || e.key === 'C') {
        handleClearCanvas();
      } else if (e.key === 'Enter') {
        if (showSolutionModal) {
          handleNextFlag();
        } else if (!isEvaluated || !evaluationResult?.isAllCorrect) {
          handleVerifyFlag();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFlag, gameOver, showSolutionModal, isEvaluated, evaluationResult, handleNextFlag]);

  if (!currentFlag) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Loading flag painter studio...</p>
      </div>
    );
  }

  // Get hex color for a segment ID
  const getSegmentColor = (segment: ColorSegment) => {
    const paintedColorId = userPaintedColors[segment.id];
    if (paintedColorId) {
      const opt = currentFlag.palette.find((p) => p.id === paintedColorId);
      return opt ? opt.hex : '#334155';
    }
    // If not painted, return base uncolored canvas color
    return '#1e293b';
  };

  // Color lookup map
  const colorMap = useMemo(() => {
    const map = new Map<string, ColorOption>();
    currentFlag.palette.forEach((c) => map.set(c.id, c));
    return map;
  }, [currentFlag]);

  const activeColorObj = colorMap.get(selectedColor);
  const paintedSegmentsCount = Object.keys(userPaintedColors).length;
  const allSegmentsFilled = paintedSegmentsCount === currentFlag.segments.length;

  // 1. GAME OVER SUMMARY SCREEN
  if (gameOver) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center animate-fade-in">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 p-0.5 mx-auto mb-6 shadow-xl shadow-rose-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Palette className="w-10 h-10 text-amber-400" />
            </div>
          </div>

          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400 block mb-1">
            Studio Complete
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Master Vexillological Artist!
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
            You successfully colored and reconstructed world flags with authentic national palettes.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1">Final Score</span>
              <strong className="text-2xl sm:text-3xl font-black text-amber-400">
                {score.toLocaleString()}
              </strong>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1">Flags Completed</span>
              <strong className="text-2xl sm:text-3xl font-black text-emerald-400">
                {totalRounds}
              </strong>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1">Best Streak</span>
              <strong className="text-2xl sm:text-3xl font-black text-rose-400">
                {streak} 🔥
              </strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleRestart}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Paint Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 py-2 animate-fade-in">
      {/* Top Bar: Progress, Score & Streak */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-xl text-pink-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 block leading-tight">
              Flag {currentIndex + 1} of {totalRounds}
            </span>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <span>{currentFlag.name}</span>
              {officialFlag?.capital && (
                <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                  • Cap: {officialFlag.capital}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-xl text-xs font-black text-rose-400">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{streak} Streak</span>
            </div>
          )}

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Score
            </span>
            <strong className="text-base sm:text-lg font-black text-amber-400">
              {score.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Target Mission Title & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/80">
            Difficulty: Tier {currentFlag.difficulty}
          </span>
          <span className="text-xs text-slate-400">
            Painted {paintedSegmentsCount} of {currentFlag.segments.length} sections
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-amber-500/60 text-slate-300 hover:text-amber-300 text-xs font-bold transition-all cursor-pointer"
            title="Toggle color hints"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>{showHint ? 'Hide Hint' : 'Color Hint'}</span>
          </button>

          <button
            onClick={handleClearCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
            title="Clear canvas (Key: C)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset (C)</span>
          </button>

          <button
            onClick={handleRevealSolution}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
            title="Give up & reveal true flag"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Reveal</span>
          </button>
        </div>
      </div>

      {/* Optional Hint Banner */}
      {showHint && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-amber-300 animate-fade-in">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5">Vexillological Color Clue:</strong>
            <p className="text-slate-300">{currentFlag.trivia}</p>
          </div>
        </div>
      )}

      {/* Main Interactive Flag Canvas Stage */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* The Clickable SVG Flag */}
        <div className="relative z-10 w-full max-w-xl aspect-[3/2] flex items-center justify-center filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
          <svg
            viewBox={currentFlag.viewBox}
            className="w-full h-full rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 cursor-pointer select-none transition-all duration-200"
          >
            {currentFlag.segments.map((segment) => {
              const fillColor = getSegmentColor(segment);
              const isHovered = hoveredSegment === segment.id;
              const isPainted = Boolean(userPaintedColors[segment.id]);
              const previewHoverColor = activeColorObj?.hex || '#38BDF8';

              // Evaluation state for segment
              const isWrong =
                isEvaluated &&
                isPainted &&
                userPaintedColors[segment.id] !== segment.correctColor;
              const isRight =
                isEvaluated &&
                isPainted &&
                userPaintedColors[segment.id] === segment.correctColor;

              // Shared SVG props
              const elementProps = {
                key: segment.id,
                ...segment.props,
                fill: isHovered && !isPainted ? previewHoverColor : fillColor,
                fillOpacity: isHovered && !isPainted ? 0.45 : 1,
                stroke: isWrong
                  ? '#EF4444'
                  : isRight
                  ? '#10B981'
                  : isHovered
                  ? previewHoverColor
                  : '#475569',
                strokeWidth: isHovered || isWrong || isRight ? '3' : '1.5',
                strokeDasharray: !isPainted ? '4,4' : undefined,
                className:
                  'transition-all duration-150 cursor-pointer hover:filter hover:brightness-110',
                onClick: () => handlePaintSegment(segment.id),
                onMouseEnter: () => setHoveredSegment(segment.id),
                onMouseLeave: () => setHoveredSegment(null),
              };

              if (segment.shape === 'rect') {
                return <rect {...elementProps} />;
              }
              if (segment.shape === 'circle') {
                return <circle {...elementProps} />;
              }
              if (segment.shape === 'polygon') {
                return <polygon {...elementProps} />;
              }
              if (segment.shape === 'path') {
                return <path {...elementProps} />;
              }
              return null;
            })}
          </svg>
        </div>

        {/* Hover segment indicator pill */}
        <div className="relative z-10 mt-3 text-xs text-slate-400 flex items-center gap-2">
          {hoveredSegment ? (
            <span className="font-mono text-slate-200 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700">
              Target:{' '}
              {currentFlag.segments.find((s) => s.id === hoveredSegment)?.name || 'Section'}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">
              Click any section to paint with your active color
            </span>
          )}
        </div>
      </div>

      {/* Paint Palette Tray */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="uppercase tracking-wider">Paint Palette (Keys 1 - {currentFlag.palette.length})</span>
          {activeColorObj && (
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: activeColorObj.hex }}
              />
              Active: {activeColorObj.name}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
          {currentFlag.palette.map((color, idx) => {
            const isSelected = selectedColor === color.id;

            return (
              <button
                key={color.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedColor(color.id);
                }}
                className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
                title={`Select ${color.name} (Shortcut: ${idx + 1})`}
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/30 shadow-inner group-hover:scale-110 transition-transform flex items-center justify-center"
                  style={{ backgroundColor: color.hex }}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-slate-950/70 border border-white shadow-sm" />
                  )}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-200 block leading-tight">
                    {color.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">[{idx + 1}]</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Verification Footer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          {isEvaluated && !evaluationResult?.isAllCorrect ? (
            <span className="text-rose-400 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>
                {evaluationResult?.correctCount} of {evaluationResult?.totalCount} sections correct.
                Fix the outlined sections and try again!
              </span>
            </span>
          ) : (
            <span>
              {allSegmentsFilled
                ? 'All sections painted! Ready to verify your flag.'
                : `${currentFlag.segments.length - paintedSegmentsCount} sections remaining.`}
            </span>
          )}
        </div>

        <button
          onClick={handleVerifyFlag}
          disabled={paintedSegmentsCount === 0}
          className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer ${
            paintedSegmentsCount === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 transform hover:scale-[1.02] active:scale-98'
          }`}
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>CHECK FLAG (Enter)</span>
        </button>
      </div>

      {/* Success / Reveal Drawer Modal */}
      {showSolutionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 max-w-xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-emerald-400 block leading-tight">
                    Flag Solved!
                  </span>
                  <h3 className="text-xl font-black text-white">{currentFlag.name}</h3>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Streak</span>
                <strong className="text-lg font-black text-rose-400">{streak} 🔥</strong>
              </div>
            </div>

            {/* Official Flag Comparison */}
            {officialFlag && (
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
                <div className="w-32 h-20 shrink-0 flex items-center justify-center bg-slate-900 rounded-xl border border-slate-800 p-1">
                  <FlagImage flag={officialFlag} className="w-full h-full object-contain" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block text-sm mb-1">{officialFlag.officialName}</strong>
                  <p className="text-slate-400">{currentFlag.trivia}</p>
                </div>
              </div>
            )}

            {/* Color Symbolism Breakdown */}
            {currentFlag.colorMeaning.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Vexillological Color Symbolism:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {currentFlag.colorMeaning.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200 block">{item.color}</strong>
                        <span className="text-slate-400">{item.meaning}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Flag Button */}
            <button
              onClick={handleNextFlag}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 cursor-pointer transform hover:scale-[1.02] active:scale-98 transition-all"
            >
              <span>{currentIndex + 1 >= totalRounds ? 'Finish Game (Enter)' : 'Next Flag (Enter)'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
