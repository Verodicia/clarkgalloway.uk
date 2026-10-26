import React, { useState } from 'react';
import { sounds } from '../utils/sound';
import { nativeHaptics, isNative } from '../utils/native';
import {
  Volume2,
  VolumeX,
  Smartphone,
  RotateCcw,
  X,
  Sliders,
  CheckCircle2,
  Info,
  Sparkles,
  Play,
  ShieldAlert,
  User,
  ExternalLink,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetStats?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  onResetStats,
}) => {
  const [hapticsOn, setHapticsOn] = useState(nativeHaptics.isEnabled());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggleHaptics = () => {
    const next = nativeHaptics.toggle();
    setHapticsOn(next);
  };

  const handleTestSound = () => {
    sounds.playWin();
  };

  const handleTestHaptic = () => {
    nativeHaptics.medium();
  };

  const handleConfirmReset = () => {
    if (onResetStats) {
      onResetStats();
      setResetSuccess(true);
      setShowResetConfirm(false);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100 animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">App Settings</h2>
              <p className="text-xs text-slate-400">Audio, Haptics & Preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-5 flex flex-col gap-4 relative z-10 overflow-y-auto pr-1">
          {/* Audio Section */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl border ${
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
                  <h3 className="text-sm font-bold text-white">Audio Synthesizer</h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time procedural chimes, victory chords & timers
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={onToggleSound}
                className={`w-13 h-7 rounded-full p-1 transition-colors cursor-pointer relative ${
                  soundEnabled ? 'bg-amber-500' : 'bg-slate-800'
                }`}
                aria-label="Toggle Sound"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {soundEnabled && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400">Test Chime Output</span>
                <button
                  onClick={handleTestSound}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors font-medium text-xs cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Play Sound
                </button>
              </div>
            )}
          </div>

          {/* Haptic Feedback Section */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl border ${
                    hapticsOn
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Haptic Vibration</h3>
                    {isNative && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Native Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tactile pulses on correct answers and game buttons
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={handleToggleHaptics}
                className={`w-13 h-7 rounded-full p-1 transition-colors cursor-pointer relative ${
                  hapticsOn ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
                aria-label="Toggle Haptics"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    hapticsOn ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {hapticsOn && isNative && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400">Test Vibration Pulse</span>
                <button
                  onClick={handleTestHaptic}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors font-medium text-xs cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Pulse
                </button>
              </div>
            )}
          </div>

          {/* Reset Stats Section */}
          {onResetStats && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Game Statistics & Records</h3>
                  <p className="text-[11px] text-slate-400">
                    Accuracy, high scores, streaks and badges stored on device
                  </p>
                </div>

                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                ) : null}
              </div>

              {showResetConfirm && (
                <div className="mt-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex flex-col gap-2.5">
                  <div className="flex items-start gap-2 text-rose-300 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Are you sure? This will reset all high scores, accuracy, and streaks!</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmReset}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Yes, Reset All
                    </button>
                  </div>
                </div>
              )}

              {resetSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Statistics successfully reset!</span>
                </div>
              )}
            </div>
          )}

          {/* About Me Section */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-400 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <span>About Me</span>
                    <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Developed by Clark Galloway
                    </span>
                  </h3>
                </div>
              </div>

              <a
                href="https://clarkgalloway.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 hover:border-amber-500/50 border border-slate-700/80 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm group"
              >
                <span>clarkgalloway.uk</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
              I am an independent developer and would love any suggestions if you have requests for improvements or advancements for the app!
            </p>
          </div>

          {/* App Info Footer */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Clark Galloway's Vexillum • Vector SVG Edition</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-500">v1.0.0</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300">500 Flags</span>
            </div>
          </div>
        </div>

        {/* Modal Done Button */}
        <div className="pt-2 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
