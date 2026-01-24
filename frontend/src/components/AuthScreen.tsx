import React, { useState } from 'react';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';
import { authService } from '../services/authService';
import { User, UserRole } from '../types';
import { UserPlus, LogIn, AlertCircle, Map, Database, User as UserIcon } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: UserRole.EXPLORER
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let user: User;
      
      if (isLogin) {
        if (!formData.email || !formData.password) {
          throw new Error("Por favor ingresa tu email y contraseña.");
        }
        user = await authService.login(formData.email, formData.password);
      } else {
        if (!formData.firstName || !formData.lastName) {
           throw new Error("Nombre y Apellido son requeridos.");
        }
        if (formData.password.length < 8) {
          throw new Error("La contraseña debe tener al menos 8 caracteres.");
        }
        const fullName = `${formData.firstName} ${formData.lastName}`;
        user = await authService.register(fullName, formData.email, formData.password, formData.role);
      }
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-lp-bg">
      {/* Background Ambience based on Official Gradients */}
      <div className="absolute inset-0 bg-lp-grad-purple opacity-20 z-0"></div>
      
      {/* Orbs based on Primary/Secondary colors */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lp-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lp-accent/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-2xl relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo variant="icon" size="lg" withGlow />
          </div>
          {/* H1 Title -> Xystema Forced Class */}
          <h1 className="lp-title text-4xl font-bold text-white tracking-widest mb-1 text-gradient-lp">
            LUNARPUNK
          </h1>
          {/* Body -> Montserrat */}
          <p className="text-lp-muted text-xs uppercase tracking-[0.3em] font-body">Acceso al Sistema</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-lp-orange/10 border border-lp-orange/30 rounded flex items-center gap-2 text-lp-orange text-sm font-body">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-lp-muted ml-1 font-body">Rol en la Red</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: UserRole.EXPLORER})}
                    className={`p-3 rounded border flex flex-col items-center gap-2 transition-all ${
                      formData.role === UserRole.EXPLORER 
                      ? 'bg-lp-accent/10 border-lp-accent text-lp-accent shadow-lg shadow-lp-accent/10' 
                      : 'bg-lp-surface border-lp-border text-lp-muted hover:bg-lp-surface/80'
                    }`}
                  >
                    <Map size={20} />
                    <span className="text-xs font-title font-bold">EXPLORER</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: UserRole.ORGANIZER})}
                    className={`p-3 rounded border flex flex-col items-center gap-2 transition-all ${
                      formData.role === UserRole.ORGANIZER 
                      ? 'bg-lp-primary/20 border-lp-primary text-lp-primary shadow-lg shadow-lp-primary/10' 
                      : 'bg-lp-surface border-lp-border text-lp-muted hover:bg-lp-surface/80'
                    }`}
                  >
                    <Database size={20} />
                    <span className="text-xs font-title font-bold">ORGANIZER</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-lp-muted ml-1 font-body">Nombre</label>
                  <div className="relative">
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full bg-lp-surface border border-lp-border rounded p-3 text-white focus:border-lp-accent focus:outline-none transition-all placeholder:text-gray-600 pl-9 font-body"
                        placeholder="John"
                    />
                    <UserIcon size={16} className="absolute left-3 top-3.5 text-gray-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-lp-muted ml-1 font-body">Apellido</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-lp-surface border border-lp-border rounded p-3 text-white focus:border-lp-accent focus:outline-none transition-all placeholder:text-gray-600 font-body"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-lp-muted ml-1 font-body">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-lp-surface border border-lp-border rounded p-3 text-white focus:border-lp-accent focus:outline-none transition-all placeholder:text-gray-600 font-body"
              placeholder="user@lunar.net"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-lp-muted ml-1 font-body">
               Contraseña { !isLogin && <span className="text-[10px] text-gray-500 lowercase">(min. 8 caracteres)</span> }
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-lp-surface border border-lp-border rounded p-3 text-white focus:border-lp-accent focus:outline-none transition-all placeholder:text-gray-600 font-body"
              placeholder="••••••••"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full py-3 mt-4" 
            isLoading={loading}
          >
            {isLogin ? (
              <span className="flex items-center gap-2"><LogIn size={18} /> Iniciar Sesión</span>
            ) : (
              <span className="flex items-center gap-2"><UserPlus size={18} /> Crear Cuenta</span>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm font-body">
            {isLogin ? "¿No tienes credenciales?" : "¿Ya tienes una cuenta?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setFormData({ firstName: '', lastName: '', email: '', password: '', role: UserRole.EXPLORER });
            }}
            className="text-lp-accent hover:text-white font-bold text-sm mt-1 uppercase tracking-wider transition-colors font-body"
          >
            {isLogin ? "Registrarse en la Red" : "Acceder al Sistema"}
          </button>
        </div>
      </div>
    </div>
  );
};
