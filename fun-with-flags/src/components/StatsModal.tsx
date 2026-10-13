import React from 'react';
import { UserStats } from '../types';
import { sounds } from '../utils/sound';
import {
  Trophy,
  Flame,
  Target,
  Gamepad2,
  X,
  Medal,
  Award,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface StatsModalProps {
  stats: UserStats;
  onClose: () => void;
  onResetStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  stats,
  onClose,
  onResetStats,
}) => {
  const accuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
      : 0;

  const achievements = [
    {
      id: 'first',
      title: 'First Ensign',
      desc: 'Answer your first flag correctly',
      unlocked: stats.totalCorrect >= 1,
      icon: '🚩',
    },
    {
      id: 'streak5',
      title: 'On Fire!',
      desc: 'Achieve a streak of 5 flags in a row',
      unlocked: stats.bestStreak >= 5,
      icon: '🔥',
    },
    {
      id: 'streak15',
      title: 'Master Vexillologist',
      desc: 'Achieve a streak of 15 flags in a row',
      unlocked: stats.bestStreak >= 15,
      icon: '👑',
    },
    {
      id: 'blitz1000',
      title: 'Speed Demon',
      desc: 'Score 1,000+ points in 60-Second Blitz',
      unlocked: (stats.highScores.blitz || 0) >= 1000,
      icon: '⚡',
    },
    {
      id: 'collector',
      title: 'Flag Collector',
      desc: 'Save 5 or more flags to favorites',
      unlocked: stats.favorites.length >= 5,
      icon: '⭐',
    },
    {
      id: 'artist',
      title: 'Vexillological Artist',
      desc: 'Score points in the Flag Painter colour-in studio',
      unlocked: (stats.highScores.color || 0) > 0,
      icon: '🎨',
    },
    {
      id: 'sheldon',
      title: 'Dr. Sheldon Cooper Award',
      desc: 'Answer over 50 flags correctly overall',
      unlocked: stats.totalCorrect >= 50,
      icon: '🏆',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Vexillology Hall of Fame</h3>
            <p className="text-xs text-slate-400">Track your stats, high scores, and milestones</p>
          </div>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400 font-medium uppercase block">Games</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{stats.gamesPlayed}</span>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400 font-medium uppercase block">Correct</span>
            <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{stats.totalCorrect}</span>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400 font-medium uppercase block">Accuracy</span>
            <span className="text-2xl font-black text-cyan-400 mt-0.5 block">{accuracy}%</span>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400 font-medium uppercase block">Best Streak</span>
            <span className="text-2xl font-black text-amber-400 mt-0.5 block">🔥 {stats.bestStreak}</span>
          </div>
        </div>

        {/* High Scores By Game Mode */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
            <Medal className="w-3.5 h-3.5" />
            Mode High Scores
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-750 flex justify-between items-center">
              <span className="text-slate-400">Quiz</span>
              <span className="font-bold text-amber-400">{stats.highScores.quiz || 0}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-750 flex justify-between items-center">
              <span className="text-slate-400">60s Blitz</span>
              <span className="font-bold text-amber-400">{stats.highScores.blitz || 0}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-750 flex justify-between items-center">
              <span className="text-slate-400">Flag Typist</span>
              <span className="font-bold text-amber-400">{stats.highScores.type || 0}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-750 flex justify-between items-center">
              <span className="text-slate-400">Memory</span>
              <span className="font-bold text-amber-400">{stats.highScores.memory || 0}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-750 flex justify-between items-center">
              <span className="text-slate-400">Detective Zoom</span>
              <span className="font-bold text-amber-400">{stats.highScores.zoom || 0}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-750 flex justify-between items-center">
              <span className="text-slate-400">Survival Streak</span>
              <span className="font-bold text-amber-400">{stats.highScores.streak || 0}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-750 flex justify-between items-center">
              <span className="text-slate-400">Flag Painter</span>
              <span className="font-bold text-amber-400">{stats.highScores.color || 0}</span>
            </div>
          </div>
        </div>

        {/* Badges / Achievements */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Achievements
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                  a.unlocked
                    ? 'bg-slate-800/80 border-amber-500/40 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800/60 opacity-40 text-slate-500'
                }`}
              >
                <span className="text-2xl">{a.icon}</span>
                <div className="min-w-0">
                  <h5 className="font-bold text-xs truncate">{a.title}</h5>
                  <p className="text-[10px] text-slate-400 truncate">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reset stats option */}
        <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">Stored locally in your browser</span>
          <button
            onClick={() => {
              if (window.confirm('Reset all user stats and high scores?')) {
                onResetStats();
                sounds.playClick();
              }
            }}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};
