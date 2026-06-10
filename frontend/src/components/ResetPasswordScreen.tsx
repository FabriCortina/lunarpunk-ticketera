import React, { useState } from 'react';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';
import { authService } from '../services/authService';
import { AlertCircle, CheckCircle, KeyRound } from 'lucide-react';

interface ResetPasswordScreenProps {
  token: string;
  onDone: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ token, onDone }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-lp-bg">
      <div className="absolute inset-0 bg-lp-grad-purple opacity-20 z-0"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lp-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lp-accent/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-2xl relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo variant="icon" size="lg" withGlow />
          </div>
          <h1 className="lp-title text-4xl font-bold text-white tracking-widest mb-1 text-gradient-lp">
            LUNARPUNK
          </h1>
          <p className="text-lp-muted text-xs uppercase tracking-[0.3em] font-body">Restablecer Contraseña</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-lp-orange/10 border border-lp-orange/30 rounded flex items-center gap-2 text-lp-orange text-sm font-body">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-5">
            <div className="p-3 bg-lp-success/10 border border-lp-success/30 rounded flex items-center gap-2 text-lp-success text-sm font-body text-left">
              <CheckCircle size={16} className="shrink-0" />
              Tu contraseña fue actualizada correctamente.
            </div>
            <Button onClick={onDone} className="w-full py-3">
              Ir a Iniciar Sesión
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-lp-muted ml-1 font-body">
                Nueva Contraseña <span className="text-[10px] text-gray-500 lowercase">(min. 8 caracteres)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-lp-surface border border-lp-border rounded p-3 text-white focus:border-lp-accent focus:outline-none transition-all placeholder:text-gray-600 font-body"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-lp-muted ml-1 font-body">Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-lp-surface border border-lp-border rounded p-3 text-white focus:border-lp-accent focus:outline-none transition-all placeholder:text-gray-600 font-body"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full py-3 mt-4" isLoading={loading}>
              <span className="flex items-center gap-2"><KeyRound size={18} /> Restablecer Contraseña</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
