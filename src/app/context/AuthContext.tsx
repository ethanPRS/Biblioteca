import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

export type Role = 'Administrador' | 'Bibliotecario' | 'Alumno' | 'Profesor' | 'Colaborador';

export const ROLES: Role[] = ['Administrador', 'Bibliotecario', 'Alumno', 'Profesor', 'Colaborador'];

// Pantallas/Funciones disponibles en el sistema
export type Screen = 
  | 'inicio'
  | 'catalogo' 
  | 'mis-libros'
  | 'prestamos'
  | 'solicitudes'
  | 'multas'
  | 'gestion-libros'
  | 'gestion-usuarios'
  | 'config';

export const SCREENS: { id: Screen; name: string }[] = [
  { id: 'inicio', name: 'Dashboard / Inicio' },
  { id: 'catalogo', name: 'Catálogo de Libros' },
  { id: 'mis-libros', name: 'Mis Libros' },
  { id: 'prestamos', name: 'Préstamos y Devoluciones' },
  { id: 'solicitudes', name: 'Solicitudes de Préstamo' },
  { id: 'multas', name: 'Gestión de Multas' },
  { id: 'gestion-libros', name: 'Gestión de Libros' },
  { id: 'gestion-usuarios', name: 'Gestión de Usuarios' },
  { id: 'config', name: 'Configuración' }
];

// Permisos por rol (se pueden editar desde la UI)
export type RolePermissions = Record<Role, Screen[]>;

const INITIAL_ROLE_PERMISSIONS: RolePermissions = {
  'Administrador': ['inicio', 'catalogo', 'prestamos', 'solicitudes', 'multas', 'gestion-libros', 'gestion-usuarios', 'config'],
  'Bibliotecario': ['inicio', 'catalogo', 'prestamos', 'solicitudes', 'multas', 'gestion-libros', 'config'],
  'Profesor': ['catalogo', 'mis-libros', 'solicitudes', 'multas'],
  'Alumno': ['catalogo', 'mis-libros', 'solicitudes', 'multas'],
  'Colaborador': ['catalogo', 'mis-libros', 'solicitudes']
};

const getInitialPermissions = (): RolePermissions => {
  const saved = localStorage.getItem('rolePermissions');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing role permissions from local storage', e);
    }
  }
  return INITIAL_ROLE_PERMISSIONS;
};

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  avatar: string;
  status?: string;
  funcion?: string;
  passwordHash?: string;
}

const API_URL = ((import.meta as any).env?.VITE_API_URL || "http://localhost:5001") + "/api/users";

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoadingUsers: boolean;
  rolePermissions: RolePermissions;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: Partial<User>) => Promise<{success: boolean, message?: string}>;
  findExternalUser: (username: string) => Promise<{success: boolean, user?: Partial<User>, message?: string}>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateRolePermissions: (role: Role, permissions: Screen[]) => void;
  getUserPermissions: (role: Role) => Screen[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(getInitialPermissions());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced refetch for realtime updates
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers();
    }, 500);
  }, [fetchUsers]);

  // Subscribe to real-time changes on users domain
  useRealtimeSubscription(['users'], debouncedRefetch);

  const login = async (username: string, pass: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass })
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  };

  const logout = () => setUser(null);

  const findExternalUser = async (username: string) => {
    try {
      const res = await fetch(`${API_URL}/external/${username}`);
      const data = await res.json();
      if (res.ok) {
        return { success: true, user: data as Partial<User> };
      } else {
        return { success: false, message: data.error || 'Usuario no encontrado' };
      }
    } catch (error) {
      console.error('Error finding user:', error);
      return { success: false, message: 'Error de red' };
    }
  };

  const addUser = async (newUser: Partial<User>) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (res.ok) {
        await fetchUsers();
        return { success: true, message: `El usuario ${data.name} ha sido dado de alta exitosamente.` };
      } else {
        return { success: false, message: data.error || 'Error al agregar usuario' };
      }
    } catch (error) {
      console.error('Error adding user:', error);
      return { success: false, message: 'Error de red al agregar usuario' };
    }
  };

  const updateUser = async (id: string, updatedUser: Partial<User>) => {
    try {
      const current = users.find(u => u.id === id);
      const merged = { ...current, ...updatedUser };
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      });
      if (res.ok) {
        await fetchUsers();
        if (user && user.id === id) {
          setUser(prev => prev ? { ...prev, ...updatedUser } : prev);
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const updateRolePermissions = (role: Role, permissions: Screen[]) => {
    setRolePermissions(prev => {
      const newPermissions = { ...prev, [role]: permissions };
      localStorage.setItem('rolePermissions', JSON.stringify(newPermissions));
      return newPermissions;
    });
  };

  const getUserPermissions = (role: Role): Screen[] => {
    return rolePermissions[role] || [];
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users,
      isLoadingUsers,
      rolePermissions,
      login, 
      logout, 
      findExternalUser,
      addUser, 
      updateUser, 
      deleteUser,
      updateRolePermissions,
      getUserPermissions
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};