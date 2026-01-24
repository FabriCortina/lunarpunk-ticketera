import React from 'react';
import { User } from '../types';
import { Button } from './Button';

type ProfileModalProps = {
  user: User;
  onClose: () => void;
  onUpdate: (user: User, newPassword?: string) => void;
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 space-y-4">
        <h3 className="font-title text-xl">Perfil</h3>
        <div className="space-y-1 text-sm text-lp-muted">
          <p>Nombre: <span className="text-lp-text">{user.name}</span></p>
          <p>Email: <span className="text-lp-text">{user.email}</span></p>
          <p>Rol: <span className="text-lp-text">{user.role}</span></p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button onClick={() => onUpdate(user)}>Guardar</Button>
        </div>
      </div>
    </div>
  );
};
