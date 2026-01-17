import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { X, User as UserIcon, Mail, Lock, Save, Camera } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User, newPassword?: string) => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: '',
    avatar: user.avatar || ''
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const updatedUser: User = {
      ...user,
      name: formData.name,
      email: formData.email,
      avatar: formData.avatar
    };

    const passwordToUpdate = formData.password.trim() !== '' ? formData.password : undefined;

    await onUpdate(updatedUser, passwordToUpdate);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-2xl relative border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
        
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          {/* H3 equivalent Title -> text-2xl */}
          <h2 className="text-2xl font-title font-bold text-white tracking-wider flex items-center gap-2">
            <UserIcon className="text-lunar-accent" /> Editar Perfil
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 font-body">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
             <div 
               className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-600 overflow-hidden relative group cursor-pointer hover:border-lunar-accent transition-colors"
               onClick={() => fileInputRef.current?.click()}
             >
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-2xl bg-slate-900">
                    {formData.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera size={24} className="text-white" />
                </div>
             </div>
             <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
             <span className="text-xs text-slate-500">Click para cambiar foto</span>
          </div>

          <div className="space-y-1">
             <label className="text-xs text-lunar-silver uppercase tracking-wider">Nombre Completo</label>
             <div className="relative">
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded p-3 pl-10 text-white focus:border-lunar-accent focus:outline-none font-body"
                  required
                />
                <UserIcon size={16} className="absolute left-3 top-3.5 text-slate-500" />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-xs text-lunar-silver uppercase tracking-wider">Email</label>
             <div className="relative">
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded p-3 pl-10 text-white focus:border-lunar-accent focus:outline-none font-body"
                  required
                />
                <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-xs text-lunar-silver uppercase tracking-wider">
               Nueva Contraseña <span className="text-slate-600 normal-case">(Opcional)</span>
             </label>
             <div className="relative">
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded p-3 pl-10 text-white focus:border-lunar-accent focus:outline-none font-body"
                  placeholder="••••••••"
                />
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
             </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full font-body" isLoading={loading}>
               <Save size={18} /> Guardar Cambios
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};