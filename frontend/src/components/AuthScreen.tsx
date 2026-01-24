import React, { useState } from 'react';
import { authService } from '../services/authService';
import { UserRole, User } from '../types';
import { Button } from './Button';

type AuthScreenProps = {
  onAuthSuccess: (user: User) => void;
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.EXPLORER);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user =
        mode === 'login'
          ? await authService.login(email, password)
          : await authService.register(name, email, password, role);
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'No se pudo autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lp-bg text-lp-text flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="glass-panel w-full max-w-md rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-title text-2xl">Acceso Lunar</h2>
          <button
            type="button"
            className="text-xs text-lp-accent"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
          </button>
        </div>

        {mode === 'register' && (
          <input
            className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {mode === 'register' && (
          <select
            className="w-full rounded bg-black/30 border border-lp-border px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value={UserRole.EXPLORER}>EXPLORER</option>
            <option value={UserRole.ORGANIZER}>ORGANIZER</option>
          </select>
        )}

        {error && <p className="text-sm text-lp-error">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
        </Button>
      </form>
    </div>
  );
};
