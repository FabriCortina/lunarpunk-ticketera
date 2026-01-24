import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors';
  const styles =
    variant === 'primary'
      ? 'bg-lp-accent text-lp-navy hover:bg-lp-accent/90'
      : 'bg-transparent border border-lp-border text-lp-text hover:bg-white/5';

  return <button className={`${base} ${styles} ${className}`} {...props} />;
};
