import React, { useEffect, useState, useMemo } from 'react';
import { Flag } from '../types';
import { sounds } from '../utils/sound';
import { Sparkles, Compass, Volume2, VolumeX, Globe } from 'lucide-react';

interface SplashScreenProps {
  allFlags: Flag[];
  onStart: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

interface FloatingFlag {
  id: string;
  flag: Flag;
  x: number; // percentage across screen
  y: number; // percentage down screen
  z: number; // 3D depth in px (-300 to 200)
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  speed: number;
  delay: number;
  blur: number;
  opacity: number;
}

const base = import.meta.env.BASE_URL || './';
const cleanBase = base.endsWith('/') ? base : `${base}/`;

export const SplashScreen: React.FC<SplashScreenProps> = ({
  allFlags,
  onStart,
  soundEnabled,
  onToggleSound,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isStarting, setIsStarting] = useState(false);

  // Generate 24 floating flags in 3D space
  const floatingFlags = useMemo<FloatingFlag[]>(() => {
    // Pick diverse showcase flags (Switzerland square, Nepal pennant, big nations, states)
    const featuredCodes = [
      'ch', 'np', 'va', 'us', 'jp', 'fr', 'br', 'gb', 'ca', 'de', 
      'za', 'mx', 'au', 'gr', 'se', 'ar', 'es', 'jm', 'kr', 'it', 
      'US-CA', 'US-TX', 'DE-BY', 'CA-QC'
    ];

    const pool = featuredCodes
      .map((code) => allFlags.find((f) => f.code.toLowerCase() === code.toLowerCase()))
      .filter((f): f is Flag => Boolean(f));

    // Fallback to random flags if any missing
    const selected = pool.length >= 18 ? pool : allFlags.slice(0, 24);

    return selected.map((flag, idx) => {
      // Deterministic layout grid with jitter for natural floating field
      const col = idx % 6;
      const row = Math.floor(idx / 6);
      const baseX = (col / 5) * 88 + 6 + (Math.sin(idx * 1.5) * 5);
      const baseY = (row / 3) * 80 + 10 + (Math.cos(idx * 2) * 5);
      const z = -250 + ((idx * 67) % 400); // depth: -250 to 150
      const scale = 0.55 + ((z + 250) / 400) * 0.45; // scale by depth
      const blur = z < -100 ? 1.5 : 0; // depth of field blur

      return {
        id: `float-${flag.id}-${idx}`,
        flag,
        x: baseX,
        y: baseY,
        z,
        rotX: -15 + ((idx * 13) % 30),
        rotY: -20 + ((idx * 17) % 40),
        rotZ: -10 + ((idx * 7) % 20),
        scale,
        speed: 4 + (idx % 4) * 1.5,
        delay: (idx * 0.4) % 3,
        blur,
        opacity: z < -150 ? 0.35 : z < 0 ? 0.6 : 0.85,
      };
    });
  }, [allFlags]);

  // Mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 30; // -15 to +15 deg
      const y = (e.clientY / innerHeight - 0.5) * -30; // -15 to +15 deg
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle start on tap or any key
  const handleStart = () => {
    if (isStarting) return;
    setIsStarting(true);
    sounds.playSplashStart();
    setTimeout(() => {
      onStart();
    }, 400);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarting]);

  return (
    <div
      onClick={handleStart}
      className={`fixed inset-0 z-50 overflow-hidden bg-slate-950 flex flex-col items-center justify-between p-6 cursor-pointer select-none transition-opacity duration-500 ${
        isStarting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Bar with Return to Portfolio and Sound Toggle */}
      <div className="relative z-20 w-full flex items-center justify-between pointer-events-auto max-w-5xl mx-auto">
        <a
          href="../../index.html#card-flags"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.location.href = window.location.pathname.includes('/dist')
              ? '../../index.html#card-flags'
              : '../index.html#card-flags';
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 hover:border-amber-400 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-md no-underline"
          title="Return to Clark's Portfolio"
        >
          <span className="text-amber-400">←</span>
          <span>Portfolio</span>
        </a>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSound();
          }}
          className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-amber-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* 3D Perspective Universe */}
      <div
        className="absolute inset-0 pointer-events-none perspective-1000 overflow-hidden"
        style={{ perspective: '1100px' }}
      >
        {/* Subtle World Map / Latitude-Longitude Grid Backdrop */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(245, 158, 11, 0.15) 0%, transparent 70%),
              linear-gradient(to right, rgba(51, 65, 85, 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51, 65, 85, 0.2) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 60px 60px, 60px 60px',
            transform: `rotateX(${mousePos.y * 0.3}deg) rotateY(${mousePos.x * 0.3}deg)`,
            transition: 'transform 0.2s ease-out',
          }}
        />

        {/* 3D Floating Flags Field */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `rotateX(${mousePos.y * 0.5}deg) rotateY(${mousePos.x * 0.5}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {floatingFlags.map((item) => (
            <div
              key={item.id}
              className="absolute transition-transform duration-1000 ease-out will-change-transform"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate3d(-50%, -50%, ${item.z}px) rotateX(${item.rotX}deg) rotateY(${item.rotY}deg) rotateZ(${item.rotZ}deg) scale(${item.scale})`,
                opacity: item.opacity,
                filter: item.blur > 0 ? `blur(${item.blur}px)` : 'none',
                animation: `floatDrift ${item.speed}s ease-in-out infinite alternate ${item.delay}s`,
              }}
            >
              <div className="w-28 sm:w-36 h-20 sm:h-24 p-2 bg-slate-900/60 rounded-xl border border-slate-700/50 shadow-2xl backdrop-blur-xs flex items-center justify-center transform hover:scale-110 transition-transform">
                <img
                  src={item.flag.svgPath}
                  alt={item.flag.name}
                  className="max-w-full max-h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Centerpiece: funwithflags.png & Tap to Start */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto my-auto text-center px-4">
        {/* Glow behind logo */}
        <div className="absolute -inset-10 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 rounded-full blur-3xl opacity-75 pointer-events-none animate-pulse-subtle" />

        {/* The funwithflags.png Artwork */}
        <div className="relative transform hover:scale-[1.02] transition-transform duration-300 drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]">
          <img
            src={`${cleanBase}funwithflags.png`}
            alt="Fun with Flags"
            className="w-full max-w-lg sm:max-w-xl md:max-w-2xl object-contain pointer-events-none select-none"
          />
        </div>

        {/* Subtitle / Vexillological tagline */}
        <p className="mt-4 text-xs sm:text-sm md:text-base font-medium text-slate-300 tracking-wide flex items-center justify-center gap-2 drop-shadow-md">
          <Compass className="w-4 h-4 text-amber-400" />
          <span>The Ultimate Vexillology Quiz & Interactive Flag Experience</span>
          <Compass className="w-4 h-4 text-amber-400" />
        </p>

        {/* Arcade "TAP TO START" Button */}
        <div className="mt-10 sm:mt-12 flex flex-col items-center gap-2">
          <div className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-base sm:text-lg tracking-widest uppercase shadow-2xl shadow-amber-500/30 border-2 border-amber-300/80 animate-bounce cursor-pointer hover:brightness-110 active:scale-95 transition-all">
            <Sparkles className="w-5 h-5 text-slate-950 animate-spin" />
            <span>Tap to Start</span>
            <Sparkles className="w-5 h-5 text-slate-950 animate-spin" />
          </div>

          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase mt-2 opacity-80">
            or press Space / Enter
          </span>
        </div>
      </div>

      {/* Bottom Footer credits */}
      <div className="relative z-10 text-[11px] text-slate-500 tracking-wide text-center"></div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes floatDrift {
          0% {
            transform: translate3d(-50%, -50%, var(--tw-translate-z, 0)) translateY(0px) rotateX(0deg);
          }
          100% {
            transform: translate3d(-50%, -50%, var(--tw-translate-z, 0)) translateY(-18px) rotateX(8deg);
          }
        }
      `}</style>
    </div>
  );
};
