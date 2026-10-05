import { createContext } from 'react';

// { user, login, logout, updateUser }, provided by AuthProvider and read with useAuth()
export const AuthContext = createContext(null);
