import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'Administrador' | 'Bibliotecario' | 'Alumno' | 'Profesor' | 'Colaborador';

export const ROLES: Role[] = ['Administrador', 'Bibliotecario', 'Alumno', 'Profesor', 'Colaborador'];

// Pantallas/Funciones disponibles en el sistema
export type Screen = 
  | 'inicio'
  | 'catalogo' 
  | 'prestamos'
  | 'solicitudes'
  | 'multas'
  | 'gestion-libros'
  | 'gestion-usuarios'
  | 'config';

export const SCREENS: { id: Screen; name: string }[] = [
  { id: 'inicio', name: 'Dashboard / Inicio' },
  { id: 'catalogo', name: 'Catálogo de Libros' },
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
  'Profesor': ['catalogo', 'solicitudes', 'multas'],
  'Alumno': ['catalogo', 'solicitudes', 'multas'],
  'Colaborador': ['catalogo', 'solicitudes']
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
}

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/users`;

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoadingUsers: boolean;
  rolePermissions: RolePermissions;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
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
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(INITIAL_ROLE_PERMISSIONS);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
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
  };

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

  const addUser = async (newUser: Omit<User, 'id'>) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error adding user:', error);
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
    setRolePermissions(prev => ({ ...prev, [role]: permissions }));
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