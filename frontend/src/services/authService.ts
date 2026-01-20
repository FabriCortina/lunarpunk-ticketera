import { User, UserRole } from '../types';
import { get, post } from '../lib/api';

const SESSION_KEY = 'lunar_session';
const TOKEN_KEY = 'token';

type AuthResponse = {
  user: User;
  token: string;
};

export const authService = {
  register: async (name: string, email: string, password: string, role: UserRole): Promise<User> => {
    const { user, token } = await post<AuthResponse>('/api/auth/register', {
      name,
      email,
      password,
      role
    });

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  login: async (email: string, password: string): Promise<User> => {
    const { user, token } = await post<AuthResponse>('/api/auth/login', {
      email,
      password
    });

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  refreshSession: async (): Promise<User> => {
    const user = await get<User>('/api/users/me');
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  updateProfile: async (updatedUser: User, _newPassword?: string): Promise<User> => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }
};