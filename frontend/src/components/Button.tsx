import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  className = '',
  ...props 
}) => {
  // Manual: Texto cuerpo (Botones) -> Montserrat (font-body)
  const baseStyles = "px-6 py-2.5 rounded font-body font-bold transition-all duration-300 uppercase tracking-wider text-sm flex items-center justify-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    // Manual: Botón primario usa var(--lp-grad-primary)
    // Hover: aumentar contraste/brillo sin cambiar color base
    primary: "bg-lp-grad-primary border-transparent text-white hover:brightness-110 shadow-lg shadow-lp-primary/30",
    
    // Secundario: Borde Accent (Mint), fondo transparente
    secondary: "bg-transparent border-lp-accent text-lp-accent hover:bg-lp-accent/10",
    
    // Danger: Usa color de error (Orange)
    danger: "bg-lp-error/10 text-lp-error border-lp-error hover:bg-lp-error/20",
    
    // Ghost: Texto plano
    ghost: "border-transparent text-lp-muted hover:text-white hover:bg-white/5"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
