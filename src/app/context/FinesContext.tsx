import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

export interface Fine {
  id: number;
  userId: string;
  loanId: string;
  type: string;
  amount: number;
  daysOverdue: number;
  paymentStatus: 'Pendiente' | 'Pagada' | 'Perdonada';
  createdAt: string;
  borrowDate: string;
  dueDate: string;
  loanStatus: string;
  bookId: number;
}

interface FinesContextType {
  fines: Fine[];
  isLoading: boolean;
  updateFine: (fineId: number, data: Partial<Fine>) => Promise<void>;
  verifyFine: (fineId: number) => Promise<void>;
}

const FinesContext = createContext<FinesContextType | null>(null);

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/fines`;

export function FinesProvider({ children }: { children: React.ReactNode }) {
  const [fines, setFines] = useState<Fine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFines = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setFines(data.map((f: any) => ({
          ...f,
          userId: String(f.userId),
          loanId: String(f.loanId),
        })));
      }
    } catch (error) {
      console.error('Error fetching fines:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchFines(), 200);
  }, [fetchFines]);

  // Refresh when fines or loans change (loan payment updates multa via loans route)
  useRealtimeSubscription(['fines', 'loans'], debouncedRefetch);

  const updateFine = async (fineId: number, data: Partial<Fine>) => {
    try {
      const res = await fetch(`${API_URL}/${fineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: data.paymentStatus }) // Fines route expects paymentStatus
      });
      if (res.ok) {
        setFines(prev => prev.map(f => f.id === fineId ? { ...f, ...data } : f));
      } else {
        throw new Error('Failed to update fine');
      }
    } catch (error) {
      console.error('Error updating fine:', error);
      throw error;
    }
  };

  const verifyFine = async (fineId: number) => {
    try {
      const res = await fetch(`${API_URL}/${fineId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setFines(prev => prev.map(f => f.id === fineId ? { ...f, paymentStatus: 'Pagada' } : f));
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to verify fine');
      }
    } catch (error) {
      console.error('Error verifying fine:', error);
      throw error;
    }
  };

  return (
    <FinesContext.Provider value={{ fines, isLoading, updateFine, verifyFine }}>
      {children}
    </FinesContext.Provider>
  );
}

export const useFines = () => {
  const ctx = useContext(FinesContext);
  if (!ctx) throw new Error('useFines must be used within FinesProvider');
  return ctx;
};
