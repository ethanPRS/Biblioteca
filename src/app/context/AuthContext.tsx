import React, { createContext, useContext, useState } from 'react';

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
  'Profesor': ['inicio', 'catalogo', 'solicitudes', 'multas'],
  'Alumno': ['inicio', 'catalogo', 'solicitudes'],
  'Colaborador': ['inicio', 'catalogo', 'solicitudes']
};

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  avatar: string;
}

export const INITIAL_USERS: User[] = [
  { 
    id: '1', 
    name: 'Hugo Gzz', 
    email: 'hugo.gzz@biblioteca.edu',
    username: 'A001', 
    role: 'Administrador', 
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
  },
  { 
    id: '2', 
    name: 'Laura Martínez', 
    email: 'laura.martinez@biblioteca.edu',
    username: 'B001', 
    role: 'Bibliotecario', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150'
  },
  { 
    id: '3', 
    name: 'Carlos Pérez', 
    email: 'carlos.perez@estudiante.edu',
    username: 'A002', 
    role: 'Alumno', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'
  },
  { 
    id: '4', 
    name: 'Ana Gómez', 
    email: 'ana.gomez@profesor.edu',
    username: 'P001', 
    role: 'Profesor', 
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
  },
];

interface AuthContextType {
  user: User | null;
  users: User[];
  rolePermissions: RolePermissions;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateRolePermissions: (role: Role, permissions: Screen[]) => void;
  getUserPermissions: (role: Role) => Screen[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(INITIAL_ROLE_PERMISSIONS);

  const login = (username: string, pass: string) => {
    const foundUser = users.find(u => u.username === username);
    if (foundUser && pass === '1234') { // Contraseña simulada para todos
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const addUser = (newUser: Omit<User, 'id'>) => {
    setUsers([{ ...newUser, id: Date.now().toString() }, ...users]);
  };

  const updateUser = (id: string, updatedUser: Partial<User>) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updatedUser } : u));
    // Actualizar el usuario logueado si se edita a sí mismo
    if (user && user.id === id) {
      setUser({ ...user, ...updatedUser });
    }
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const updateRolePermissions = (role: Role, permissions: Screen[]) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: permissions
    }));
  };

  const getUserPermissions = (role: Role): Screen[] => {
    return rolePermissions[role] || [];
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users, 
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