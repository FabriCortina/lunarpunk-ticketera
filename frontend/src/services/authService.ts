import { User, UserRole } from '../types';
import { get, post } from '../lib/api';

type AuthResponse = {
  user: User;
  pendingApproval?: boolean;
};

export const authService = {
  register: async (name: string, email: string, password: string, role: UserRole, cuitCuil?: string): Promise<User> => {
    const response = await post<AuthResponse>('/api/auth/register', { name, email, password, role, cuitCuil });
    if (response.pendingApproval) {
      throw new Error('Cuenta creada. Tu organización está pendiente de aprobación.');
    }
    return response.user;
  },

  login: async (email: string, password: string): Promise<User> => {
    const response = await post<AuthResponse>('/api/auth/login', { email, password });
    return response.user;
  },

  logout: async () => {
    try {
      await post('/api/auth/logout');
    } catch {
      // El logout local debe completarse incluso si el request falla
    }
  },

  refreshSession: async (): Promise<User | null> => {
    try {
      return await get<User>('/api/users/me');
    } catch {
      return null;
    }
  },

  updateProfile: async (updatedUser: User, _newPassword?: string): Promise<User> => {
    return updatedUser;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return post<{ message: string }>('/api/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    return post<{ message: string }>('/api/auth/reset-password', { token, password });
  }
};
