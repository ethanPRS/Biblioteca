import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  createdAt: string;
  targetUserId: string | null; // null = visible for everyone
}

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/notifications`;
const READ_KEY = 'biblioteca_read_notifications';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt'>) => Promise<void>;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(READ_KEY);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data: AppNotification[] = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('[Notifications] Error fetching:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Debounced refetch on realtime change
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchNotifications();
    }, 200);
  }, [fetchNotifications]);

  useRealtimeSubscription(['notifications'], debouncedRefetch);

  const addNotification = useCallback(async (n: Omit<AppNotification, 'id' | 'createdAt'>) => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n),
      });
      // The SSE will trigger a refetch for all clients automatically
    } catch (err) {
      console.error('[Notifications] Error creating:', err);
    }
  }, []);

  const markAllRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    const newReadIds = new Set([...readIds, ...allIds]);
    setReadIds(newReadIds);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...newReadIds]));
    } catch {}
  }, [notifications, readIds]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
