import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

export interface Loan {
  id: string;
  bookId: number;
  userId: string;
  borrowDate: string;
  dueDate: string;
  status: 'Activo' | 'Devuelto' | 'Vencido';
  finePaid?: boolean;
  loanCopyId?: number;
  condition?: string;
  fines?: any[];
  receiptUrl?: string;
  emailReceiptSent?: boolean;
  emailReceiptMessage?: string;
}

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/loans`;

interface LoanContextType {
  loans: Loan[];
  isLoading: boolean;
  addLoan: (loan: Omit<Loan, 'id'>) => Promise<Loan | null>;
  updateLoan: (id: string, loan: Partial<Loan>) => Promise<{ success: boolean; error?: string }>;
  deleteLoan: (id: string) => Promise<void>;
}

const LoanContext = createContext<LoanContextType | null>(null);

export function LoanProvider({ children }: { children: React.ReactNode }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLoans = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setLoans(data);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Debounced refetch for realtime updates
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLoans();
    }, 200);
  }, [fetchLoans]);

  // Subscribe to real-time changes on loans domain
  useRealtimeSubscription(['loans'], debouncedRefetch);

  const addLoan = async (newLoan: Omit<Loan, 'id'>): Promise<Loan | null> => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLoan)
      });
      if (res.ok) {
        const created: Loan = await res.json();
        await fetchLoans();
        return created;
      }
      return null;
    } catch (error) {
      console.error('Error adding loan:', error);
      return null;
    }
  };

  const updateLoan = async (id: string, updatedLoan: Partial<Loan>) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLoan)
      });
      if (res.ok) {
        await fetchLoans();
        return { success: true };
      }
      let error = 'No se pudo actualizar el prestamo';
      try {
        const data = await res.json();
        error = data.error || error;
      } catch {}
      return { success: false, error };
    } catch (error) {
      console.error('Error updating loan:', error);
      return { success: false, error: 'Error de red al actualizar el prestamo' };
    }
  };

  const deleteLoan = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLoans(prev => prev.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  };

  return (
    <LoanContext.Provider value={{ loans, isLoading, addLoan, updateLoan, deleteLoan }}>
      {children}
    </LoanContext.Provider>
  );
}

export const useLoans = () => {
  const ctx = useContext(LoanContext);
  if (!ctx) throw new Error('useLoans must be used within LoanProvider');
  return ctx;
};
