
import { User, UserRole } from '../types';
import { MOCK_IDS } from '../constants';

const USERS_KEY = 'lunar_users';
const SESSION_KEY = 'lunar_session';

// Predefined users for testing/demo purposes
const TEST_USERS = [
  {
    id: MOCK_IDS.ORG_1,
    name: 'Organizer Alpha',
    email: 'org1@lunar.net',
    password: 'password',
    role: UserRole.ORGANIZER
  },
  {
    id: MOCK_IDS.ORG_2,
    name: 'Organizer Beta',
    email: 'org2@lunar.net',
    password: 'password',
    role: UserRole.ORGANIZER
  },
  {
    id: MOCK_IDS.EXP_1,
    name: 'Explorer One',
    email: 'exp1@lunar.net',
    password: 'password',
    role: UserRole.EXPLORER
  },
  {
    id: MOCK_IDS.EXP_2,
    name: 'Explorer Two',
    email: 'exp2@lunar.net',
    password: 'password',
    role: UserRole.EXPLORER
  }
];

export const authService = {
  register: async (name: string, email: string, password: string, role: UserRole): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Check against both local storage and test users
    if (users.find((u: any) => u.email === email) || TEST_USERS.find(u => u.email === email)) {
      throw new Error('El correo electrónico ya está registrado en el sistema lunar.');
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      role // Persist the selected role
    };

    // Store user with password (In a real app, never store plain text passwords!)
    const userRecord = { ...newUser, password };
    users.push(userRecord);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Auto login
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return newUser;
  },

  login: async (email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Check Local Storage Users
    let user = users.find((u: any) => u.email === email && u.password === password);

    // If not found, check Test Users
    if (!user) {
        user = TEST_USERS.find(u => u.email === email && u.password === password);
    }

    if (!user) {
      throw new Error('Credenciales inválidas. Acceso denegado.');
    }

    const { password: _, ...safeUser } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser;
  },

  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  updateProfile: async (updatedUser: User, newPassword?: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 1. Update Session
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));

    // 2. Update Persistent Storage (Local Storage Array)
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex((u: any) => u.id === updatedUser.id);

    if (userIndex !== -1) {
      // User exists in local storage created via register
      const existingUser = users[userIndex];
      users[userIndex] = {
        ...existingUser,
        ...updatedUser,
        password: newPassword || existingUser.password // Update password if provided, else keep old
      };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } 
    
    // Note: We cannot update TEST_USERS because they are hardcoded constants in this mock.
    // In a real app, this would be an API PUT call.

    return updatedUser;
  }
};
