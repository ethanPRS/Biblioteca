import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface AuditLog {
  id_auditoria: number;
  id_usuario: number;
  accion: string;
  tipo: string;
  fecha: string;
  nombre?: string;
  username?: string;
}

interface AuditLogContextType {
  logs: AuditLog[];
  addLog: (action: string, type: string) => Promise<void>;
  fetchLogs: () => Promise<void>;
}

const AuditLogContext = createContext<AuditLogContextType | null>(null);

export function AuditLogProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const { user } = useAuth();
  
  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/audit`;

  const fetchLogs = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const addLog = async (action: string, type: string) => {
    if (!user) return; // Cannot log anonymously
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action, type })
      });
      if (response.ok) {
        fetchLogs(); // Refresh logs after adding
      }
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'Administrador' || user?.role === 'Bibliotecario') {
      fetchLogs();
    }
  }, [user]);

  return (
    <AuditLogContext.Provider value={{ logs, addLog, fetchLogs }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export const useAuditLogs = () => {
  const ctx = useContext(AuditLogContext);
  if (!ctx) throw new Error('useAuditLogs must be used within AuditLogProvider');
  return ctx;
};
