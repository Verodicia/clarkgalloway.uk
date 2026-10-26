import React, { useMemo } from 'react';
import { Flag } from '../types';
import { shuffle } from '../utils/flags';
import { sounds } from '../utils/sound';

interface FlagBuntingProps {
  allFlags: Flag[];
  count?: number;
  className?: string;
}

export const FlagBunting: React.FC<FlagBuntingProps> = ({
  allFlags,
  count = 9,
  className = '',
}) => {
  // Pick random flags with high visual diversity
  const buntingFlags = useMemo(() => {
    if (!allFlags || allFlags.length === 0) return [];
    return shuffle([...allFlags]).slice(0, count);
  }, [allFlags, count]);

  if (buntingFlags.length === 0) return null;

  // Precomputed gentle rotation angles for natural bunting drape
  const rotations = [-2.5, 2, -1.5, 2.5, -1, 1.8, -2, 2.2, -1.5, 2, -2.2, 1.5];

  return (
    <div className={`relative w-full select-none pt-0.5 pb-2 ${className}`}>
      {/* Overhead catenary bunting string with subtle festive sag */}
      <div className="relative w-full h-2.5">
        <svg
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible pointer-events-none"
        >
          {/* Braided cord path */}
          <path
            d="M 0 3 Q 50 11 100 3"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="0.8"
            strokeDasharray="2.5, 1"
            className="opacity-60"
          />
          {/* Gold celebratory thread woven into cord */}
          <path
            d="M 0 3 Q 50 11 100 3"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1"
            className="opacity-80"
          />
        </svg>
      </div>

      {/* The row of suspended flags directly on the cord */}
      <div className="flex items-start justify-between w-full px-1.5 -mt-2 relative z-10">
        {buntingFlags.map((flag, idx) => {
          const rotation = rotations[idx % rotations.length];
          // Parabolic sag calculation matching the string curve
          const progress = buntingFlags.length > 1 ? idx / (buntingFlags.length - 1) : 0.5;
          const sagY = Math.sin(progress * Math.PI) * 6.5;

          return (
            <div
              key={flag.id + '-' + idx}
              style={{
                transform: `translateY(${sagY}px) rotate(${rotation}deg)`,
                transformOrigin: 'top center',
              }}
              className="group relative transition-transform duration-200 cursor-pointer hover:z-30 hover:scale-125 hover:rotate-0"
              title={`${flag.name} (${flag.continent})`}
              onClick={() => sounds.playClick()}
            >
              {/* Knot / eyelet clip attaching the flag to the cord */}
              <div className="w-1.5 h-1.5 bg-amber-400 mx-auto -mb-0.5 rounded-full shadow-sm z-20 relative ring-1 ring-amber-600/40" />

              {/* The hanging flag itself: pure flag artwork, no window or padding */}
              <div className="relative w-8 h-[21px] sm:w-9 sm:h-[23px] rounded-[2px] overflow-hidden shadow-md shadow-black/80 ring-1 ring-white/25 group-hover:ring-amber-400 group-hover:shadow-amber-500/30 transition-all">
                <img
                  src={flag.svgPath}
                  alt={flag.name}
                  className="w-full h-full object-cover block select-none pointer-events-none"
                  loading="eager"
                />

                {/* Top binding fold along the cord */}
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-white/40 pointer-events-none" />

                {/* Subtle cloth lighting gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25 pointer-events-none" />
              </div>

              {/* Tooltip on hover */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-40 whitespace-nowrap">
                <div className="bg-slate-950/95 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-md border border-amber-500/40 shadow-xl backdrop-blur-md">
                  {flag.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
