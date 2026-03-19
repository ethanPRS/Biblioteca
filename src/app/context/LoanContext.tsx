import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Loan {
  id: string;
  bookId: number;
  userId: string;
  borrowDate: string;
  dueDate: string;
  status: 'Activo' | 'Devuelto' | 'Vencido';
  finePaid?: boolean;
  loanCopyId?: number;
}

const API_URL = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5001"}`}/api/loans`;

interface LoanContextType {
  loans: Loan[];
  isLoading: boolean;
  addLoan: (loan: Omit<Loan, 'id'>) => Promise<void>;
  updateLoan: (id: string, loan: Partial<Loan>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
}

const LoanContext = createContext<LoanContextType | null>(null);

export function LoanProvider({ children }: { children: React.ReactNode }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
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
  };

  const addLoan = async (newLoan: Omit<Loan, 'id'>) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLoan)
      });
      if (res.ok) {
        await fetchLoans();
      }
    } catch (error) {
      console.error('Error adding loan:', error);
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
      }
    } catch (error) {
      console.error('Error updating loan:', error);
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