import React, { useState } from 'react';
import logoImage from '../assets/logo.jpg';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  withGlow?: boolean;
  onClick?: () => void;
}

const sizeMap = {
  xs: {
    container: 'w-6 h-6 min-w-6 min-h-6',
    title: 'text-xs',
    sub: 'text-[9px]',
  },
  sm: {
    container: 'w-8 h-8 min-w-8 min-h-8',
    title: 'text-sm',
    sub: 'text-[10px]',
  },
  md: {
    container: 'w-10 h-10 min-w-10 min-h-10',
    title: 'text-base',
    sub: 'text-xs',
  },
  lg: {
    container: 'w-12 h-12 min-w-12 min-h-12',
    title: 'text-lg',
    sub: 'text-xs',
  },
  xl: {
    container: 'w-16 h-16 min-w-16 min-h-16',
    title: 'text-xl',
    sub: 'text-sm',
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle,
  className = '',
  withGlow = false,
  onClick,
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 ${onClick ? 'cursor-pointer select-none' : ''} ${className}`}
    >
      <div
        className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-[#071d10] ${
          currentSize.container
        } ${
          withGlow
            ? 'ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.45)]'
            : 'border border-emerald-600/40 shadow-xs'
        }`}
      >
        {!loadFailed ? (
          <img
            src={logoImage || '/logo.jpg'}
            alt="Senna Logo"
            onError={() => setLoadFailed(true)}
            className="w-full h-full object-cover rounded-full select-none"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        ) : (
          /* High Fidelity Vector Render of the Neon Lightning Brand Mark */
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full select-none drop-shadow-[0_0_8px_#4ade80]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="48" fill="#061f0e" stroke="#166534" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="42" stroke="#22c55e" strokeWidth="3" opacity="0.8" />
            <circle cx="50" cy="50" r="37" stroke="#4ade80" strokeWidth="2.5" />
            <path
              d="M54 12L24 52h24l-6 36 34-42H52l6-34z"
              fill="#22c55e"
              stroke="#86efac"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M52 20L28 50h20l-4 28 26-34H48l4-24z"
              fill="#86efac"
              opacity="0.9"
            />
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className={`font-black tracking-wider text-gray-900 dark:text-white uppercase flex items-center gap-1.5 ${currentSize.title}`}>
            <span>SENNA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          </div>
          {subtitle && (
            <span className={`text-gray-500 dark:text-gray-400 font-medium ${currentSize.sub}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
