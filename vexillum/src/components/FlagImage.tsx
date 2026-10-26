import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flag } from '../types';
import { nativeHaptics } from '../utils/native';

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
  spyglass?: boolean;
  spyglassZoom?: number;
  spyglassSize?: number;
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
  spyglass = false,
  spyglassZoom = 2.8,
  spyglassSize = 160,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Spyglass magnifier state
  const [isSpyglassActive, setIsSpyglassActive] = useState(false);
  const [lensPos, setLensPos] = useState({
    targetX: 0,
    targetY: 0,
    lensX: 0,
    lensY: 0,
    imgX: 0,
    imgY: 0,
    enlargedW: 0,
    enlargedH: 0,
    effectiveSize: spyglassSize,
    pointerOffsetX: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      setIsSpyglassActive(false);
    };
  }, []);

  const aspectClass =
    aspect === '4/3'
      ? 'aspect-4/3'
      : aspect === 'video'
      ? 'aspect-video'
      : aspect === 'square'
      ? 'aspect-square'
      : '';

  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  // Calculate spyglass position and zoom mapping
  const updateSpyglass = useCallback(
    (clientX: number, clientY: number, isTouch = false) => {
      if (!containerRef.current || !imgRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const imgRect = imgRef.current.getBoundingClientRect();

      // Grace margin around container before deactivating (touch gets a generous buffer during dragging)
      const buffer = isTouch ? 60 : 15;
      if (
        clientX < containerRect.left - buffer ||
        clientX > containerRect.right + buffer ||
        clientY < containerRect.top - buffer ||
        clientY > containerRect.bottom + buffer
      ) {
        setIsSpyglassActive(false);
        return;
      }

      // Normalised coordinates [0, 1] relative to the actual rendered flag image
      const rawNormX = imgRect.width > 0 ? (clientX - imgRect.left) / imgRect.width : 0.5;
      const rawNormY = imgRect.height > 0 ? (clientY - imgRect.top) / imgRect.height : 0.5;
      const normX = Math.max(0, Math.min(1, rawNormX));
      const normY = Math.max(0, Math.min(1, rawNormY));

      const Z = spyglassZoom;

      // Vertical clearance gap above the touch/cursor point so finger never obscures lens
      const gap = isTouch ? 38 : 28;

      // Dynamically adapt lens size if viewport space above touch point is constrained
      const spaceAbove = clientY - 12;
      const maxAllowedSize = Math.max(90, spaceAbove - gap);
      const D = Math.max(90, Math.min(spyglassSize, maxAllowedSize));

      // Magnified dimensions of the flag image
      const enlargedW = imgRect.width * Z;
      const enlargedH = imgRect.height * Z;

      // Position of enlarged image inside the circular lens to center on the sampled point
      const imgX = -normX * enlargedW + D / 2;
      const imgY = -normY * enlargedH + D / 2;

      // Center horizontally on touch/cursor, bounded only by viewport edges (moves outwith flag container)
      const minX = D / 2 + 10;
      const maxX = (typeof window !== 'undefined' ? window.innerWidth : 1000) - D / 2 - 10;
      const lensX = Math.max(minX, Math.min(maxX, clientX));

      // Position ALWAYS above the selected area (never flips below finger)
      const targetCenterY = clientY - (D / 2 + gap);
      const minY = D / 2 + 8;
      const lensY = Math.max(minY, targetCenterY);

      // Pointer notch offset along bottom of lens to point straight at clientX
      const maxPointerOffset = D / 2 - 18;
      const pointerOffsetX = Math.max(-maxPointerOffset, Math.min(maxPointerOffset, clientX - lensX));

      setLensPos({
        targetX: clientX,
        targetY: clientY,
        lensX,
        lensY,
        imgX,
        imgY,
        enlargedW,
        enlargedH,
        effectiveSize: D,
        pointerOffsetX,
      });

      setIsSpyglassActive((prev) => {
        if (!prev) {
          nativeHaptics.light();
        }
        return true;
      });
    },
    [spyglassSize, spyglassZoom]
  );

  // Mouse event listeners
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!spyglass || !loaded || error) return;
    updateSpyglass(e.clientX, e.clientY, false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!spyglass || !loaded || error) return;
    updateSpyglass(e.clientX, e.clientY, false);
  };

  const handleMouseLeave = () => {
    setIsSpyglassActive(false);
  };

  // Touch event listeners for touchscreens (compatible with iOS WKWebView)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!spyglass || !loaded || error || e.touches.length === 0) return;
    const touch = e.touches[0];
    updateSpyglass(touch.clientX, touch.clientY, true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!spyglass || !loaded || error || e.touches.length === 0) return;
    const touch = e.touches[0];
    updateSpyglass(touch.clientX, touch.clientY, true);
  };

  const handleTouchEnd = () => {
    setIsSpyglassActive(false);
  };

  const handleTouchCancel = () => {
    setIsSpyglassActive(false);
  };

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-slate-900/60 border border-slate-700/50 p-1.5 ${
          shadow ? 'shadow-md shadow-black/40' : ''
        } ${aspectClass} ${className} ${
          spyglass ? 'cursor-crosshair touch-none select-none' : ''
        }`}
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
            ref={imgRef}
            src={flag.svgPath}
            alt={altText || `Flag of ${flag.name}`}
            className={`max-w-full max-h-full pointer-events-none select-none ${fitClass} ${
              flagShadow ? 'drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)]' : ''
            } transition-transform duration-300 ${
              zoomable ? 'hover:scale-105 cursor-pointer' : ''
            } ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>

      {/* Detective Spyglass Magnifying Loupe Portal */}
      {spyglass &&
        isSpyglassActive &&
        loaded &&
        !error &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[99999] overflow-visible">
            {/* 1. Target Crosshair Ring on the exact selected flag point */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{
                left: `${lensPos.targetX}px`,
                top: `${lensPos.targetY}px`,
                width: '32px',
                height: '32px',
              }}
            >
              <div className="w-6 h-6 rounded-full border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,1)]" />
              <div className="absolute w-7 h-[1px] bg-amber-400/70" />
              <div className="absolute h-7 w-[1px] bg-amber-400/70" />
            </div>

            {/* 2. Sleek Guideline Beam connecting target to loupe */}
            {lensPos.targetY > lensPos.lensY + lensPos.effectiveSize / 2 && (
              <div
                className="absolute w-[1.5px] bg-gradient-to-b from-amber-400/90 via-amber-400/40 to-amber-400/10 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                style={{
                  left: `${lensPos.targetX}px`,
                  top: `${lensPos.lensY + lensPos.effectiveSize / 2}px`,
                  height: `${Math.max(0, lensPos.targetY - (lensPos.lensY + lensPos.effectiveSize / 2))}px`,
                }}
              />
            )}

            {/* 3. Magnifying Loupe (Positioned ALWAYS above the selected area and can move outwith container) */}
            <div
              className="absolute rounded-full border-[3.5px] border-amber-400/95 bg-slate-950 ring-2 ring-black/85 shadow-[0_16px_40px_rgba(0,0,0,0.9),0_0_28px_rgba(251,191,36,0.55)] transition-[width,height] duration-75"
              style={{
                width: `${lensPos.effectiveSize}px`,
                height: `${lensPos.effectiveSize}px`,
                left: `${lensPos.lensX - lensPos.effectiveSize / 2}px`,
                top: `${lensPos.lensY - lensPos.effectiveSize / 2}px`,
              }}
            >
              {/* Magnified SVG flag view clipped to circle */}
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <img
                  src={flag.svgPath}
                  alt=""
                  className="absolute max-w-none pointer-events-none select-none"
                  style={{
                    width: `${lensPos.enlargedW}px`,
                    height: `${lensPos.enlargedH}px`,
                    left: `${lensPos.imgX}px`,
                    top: `${lensPos.imgY}px`,
                  }}
                  draggable={false}
                />

                {/* Lens Glass Edge Vignette & Depth */}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_24px_rgba(0,0,0,0.75)] pointer-events-none" />

                {/* Lens Glass Reflection Sheen */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />

                {/* Detective Spyglass Fine Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                  <div className="w-4 h-[1px] bg-amber-300" />
                  <div className="h-4 w-[1px] bg-amber-300 absolute" />
                  <div className="w-2 h-2 rounded-full border border-amber-300/80 absolute" />
                </div>

                {/* Magnification Badge */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/85 border border-amber-400/50 text-[10px] font-mono font-bold text-amber-300 pointer-events-none shadow-md">
                  {spyglassZoom}x
                </div>
              </div>

              {/* Downward indicator notch pointing to touch target */}
              <div
                className="absolute -bottom-2 z-20 w-0 h-0 border-x-[7px] border-x-transparent border-t-[9px] border-t-amber-400 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{
                  left: `calc(50% + ${lensPos.pointerOffsetX}px)`,
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
