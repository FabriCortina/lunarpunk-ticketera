import React from 'react';

type BrandLogoProps = {
  variant?: 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withGlow?: boolean;
  className?: string;
};

const sizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl'
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  withGlow = false,
  className = ''
}) => {
  const glow = withGlow ? 'drop-shadow-[0_0_12px_rgba(16,255,187,0.4)]' : '';
  return (
    <span className={`font-title tracking-widest ${sizeMap[size]} ${glow} ${className}`}>
      {variant === 'icon' ? 'LP' : 'LUNARPUNK'}
    </span>
  );
};
