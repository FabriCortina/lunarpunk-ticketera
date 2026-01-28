import { User, UserRole } from '../types';
import { get, post } from '../lib/api';

const USER_KEY = 'user';
const TOKEN_KEY = 'token';

type AuthResponse = {
  user: User;
  token: string | null;
  pendingApproval?: boolean;
};

const storeSession = (payload: AuthResponse) => {
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  localStorage.setItem(TOKEN_KEY, payload.token);
};

const clearSession = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

export const authService = {
  register: async (name: string, email: string, password: string, role: UserRole, cuitCuil?: string): Promise<User> => {
    const response = await post<AuthResponse>('/api/auth/register', { name, email, password, role, cuitCuil });
    if (!response.token) {
      clearSession();
      throw new Error('Cuenta creada. Tu organización está pendiente de aprobación.');
    }
    storeSession(response);
    return response.user;
  },

  login: async (email: string, password: string): Promise<User> => {
    const response = await post<AuthResponse>('/api/auth/login', { email, password });
    if (!response.token) {
      clearSession();
      throw new Error('No se pudo iniciar sesión.');
    }
    storeSession(response);
    return response.user;
  },

  logout: async () => {
    clearSession();
  },

  getCurrentUser: (): User | null => {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  },

  refreshSession: async (): Promise<User | null> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      clearSession();
      return null;
    }

    try {
      const user = await get<User>('/api/users/me');
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      clearSession();
      return null;
    }
  },

  updateProfile: async (updatedUser: User, _newPassword?: string): Promise<User> => {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }
};
