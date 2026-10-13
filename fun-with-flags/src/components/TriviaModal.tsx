import React, { useEffect } from 'react';
import { Flag } from '../types';
import { FlagImage } from './FlagImage';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, MapPin, Building2, Globe2 } from 'lucide-react';

interface TriviaModalProps {
  flag: Flag;
  isCorrect: boolean;
  selectedName?: string;
  onNext: () => void;
  streak: number;
}

export const TriviaModal: React.FC<TriviaModalProps> = ({
  flag,
  isCorrect,
  selectedName,
  onNext,
  streak,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
        {/* Glow decoration */}
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 ${
            isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        {/* Status header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span className="font-bold text-lg text-emerald-400">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-rose-400" />
                <span className="font-bold text-lg text-rose-400">Not Quite!</span>
              </>
            )}
          </div>

          {streak > 1 && isCorrect && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              🔥 {streak} in a row!
            </span>
          )}
        </div>

        {/* Flag Visual & Identity */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
          <div className="w-36 h-28 shrink-0 bg-slate-950/70 rounded-xl border border-slate-700/60 flex items-center justify-center p-2">
            <FlagImage flag={flag} className="w-full h-full bg-transparent border-0" shadow={false} />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-white">{flag.name}</h3>
            {flag.parentCountry && (
              <p className="text-sm font-medium text-amber-300/90 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {flag.category} of {flag.parentCountry}
              </p>
            )}
            {!flag.parentCountry && (
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <Globe2 className="w-3.5 h-3.5" />
                {flag.continent}
              </p>
            )}
            {flag.capital && flag.capital !== 'N/A' && (
              <p className="text-xs text-slate-300 mt-1 flex items-center justify-center sm:justify-start gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Capital: <span className="font-semibold text-slate-200">{flag.capital}</span>
              </p>
            )}
          </div>
        </div>

        {!isCorrect && selectedName && (
          <p className="text-xs text-rose-300/90 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50">
            You selected: <span className="line-through font-medium">{selectedName}</span>
          </p>
        )}

        {/* Vexillology Trivia Fact */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-amber-200/90 text-sm">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
              Vexillology Fact
            </span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{flag.trivia}</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onNext}
          className="w-full mt-2 py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
          <span className="text-xs font-normal opacity-75 hidden sm:inline">(or press Space)</span>
        </button>
      </div>
    </div>
  );
};
