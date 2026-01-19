import React from 'react';

interface BrandLogoProps {
  variant?: 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withGlow?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  variant = 'icon', 
  size = 'md', 
  className = '',
  withGlow = false 
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',   // 28px
    md: 'w-9 h-9',   // 36px
    lg: 'w-12 h-12', // 48px
    xl: 'w-24 h-24'  // 96px
  };

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 select-none ${className}`}>
      <img 
        src="/brand/lunarpunk-logo-icon.png" 
        alt="Lunar Punk logo" 
        className={`${sizeClasses[size]} object-contain rounded-full ${withGlow ? 'drop-shadow-[0_0_8px_rgba(16,255,187,0.5)]' : ''}`}
        draggable="false"
      />
      {variant === 'full' && (
        <span className={`lp-title font-bold text-white tracking-widest ${
          size === 'sm' ? 'text-lg' : 
          size === 'md' ? 'text-2xl' : 
          'text-4xl'
        }`}>
          LUNARPUNK
        </span>
      )}
    </div>
  );
};