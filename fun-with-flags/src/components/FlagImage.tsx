import React, { useState } from 'react';
import { Flag } from '../types';

interface FlagImageProps {
  flag: Flag;
  className?: string;
  imgClassName?: string;
  aspect?: 'video' | '4/3' | 'square' | 'auto' | 'none';
  shadow?: boolean;
  flagShadow?: boolean;
  altText?: string;
  zoomable?: boolean;
  fit?: 'contain' | 'cover';
}

export const FlagImage: React.FC<FlagImageProps> = ({
  flag,
  className = '',
  imgClassName = '',
  aspect = 'none',
  shadow = true,
  flagShadow = true,
  altText,
  zoomable = false,
  fit = 'contain',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const aspectClass =
    aspect === '4/3'
      ? 'aspect-4/3'
      : aspect === 'video'
      ? 'aspect-video'
      : aspect === 'square'
      ? 'aspect-square'
      : '';

  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-slate-900/60 border border-slate-700/50 p-1.5 ${
        shadow ? 'shadow-md shadow-black/40' : ''
      } ${aspectClass} ${className}`}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 animate-pulse text-slate-500 text-xs">
          Loading flag...
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 p-2 text-center text-slate-400 text-xs">
          <span>🚩</span>
          <span className="mt-1 font-mono">{flag.name}</span>
        </div>
      ) : (
        <img
          src={flag.svgPath}
          alt={altText || `Flag of ${flag.name}`}
          className={`max-w-full max-h-full ${fitClass} ${
            flagShadow ? 'drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)]' : ''
          } transition-transform duration-300 ${
            zoomable ? 'hover:scale-105 cursor-pointer' : ''
          } ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      )}
    </div>
  );
};
