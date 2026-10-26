import React from 'react';
import { isAndroid } from '../utils/native';

interface VexillumLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VexillumLogo: React.FC<VexillumLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  let sizeClass = 'h-12 sm:h-16 md:h-20';
  if (size === 'sm') sizeClass = 'h-7 sm:h-10';
  if (size === 'lg') sizeClass = 'w-full max-w-sm sm:max-w-md h-auto';

  const base = import.meta.env.BASE_URL || './';
  const logoSrc = `${base.endsWith('/') ? base : base + '/'}vexillum.png`;

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none group cursor-pointer ${className}`}>
      <img
        src={logoSrc}
        alt="Clark Galloway's Vexillum"
        className={`${sizeClass} object-contain ${
          isAndroid ? '' : 'drop-shadow-[0_4px_16px_rgba(225,29,72,0.35)]'
        } transition-transform duration-200 group-hover:scale-[1.03]`}
        loading="eager"
      />
    </div>
  );
};
