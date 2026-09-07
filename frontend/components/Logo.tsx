import React from 'react';
import Image from 'next/image';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'full', size = 'md', className = '' }) => {
  const heightMap = {
    sm: variant === 'icon' ? 28 : 32,
    md: variant === 'icon' ? 38 : 44,
    lg: variant === 'icon' ? 52 : 60,
  };

  const height = heightMap[size];
  const width = variant === 'icon' ? height : height * 3.8;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {variant === 'icon' ? (
        <div className="relative flex items-center justify-center">
          <Image
            src="/images/logo-icon.png"
            alt="OPPARCH AI Logo Mark"
            width={height}
            height={height}
            className="object-contain filter drop-shadow-[0_0_8px_rgba(77,141,255,0.4)]"
            priority
          />
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <Image
            src="/images/logo-icon.png"
            alt="OPPARCH AI"
            width={height}
            height={height}
            className="object-contain filter drop-shadow-[0_0_8px_rgba(77,141,255,0.4)]"
            priority
          />
          <div className="flex flex-col">
            <span className="font-extrabold tracking-wider text-white font-sans text-xl leading-none flex items-center gap-1">
              OPP<span className="text-electric-500">ARCH</span> <span className="bg-gradient-to-r from-electric-500 to-royal-400 bg-clip-text text-transparent text-sm font-black px-1.5 py-0.5 rounded border border-electric-500/30 bg-navy-900">AI</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mt-1">
              FIND THE OPPORTUNITIES BEHIND THE DATA
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
