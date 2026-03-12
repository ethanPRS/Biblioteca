import React, { createContext, useContext, useState } from 'react';

export interface Loan {
  id: string;
  bookId: number;
  userId: string;
  borrowDate: string;
  dueDate: string;
  status: 'Activo' | 'Devuelto' | 'Vencido';
  finePaid?: boolean;
}

const INITIAL_LOANS: Loan[] = [
  // Préstamos Activos sin multa
  { id: 'l1', bookId: 2, userId: '3', borrowDate: '2026-03-01', dueDate: '2026-03-15', status: 'Activo' },
  { id: 'l2', bookId: 7, userId: '4', borrowDate: '2026-03-02', dueDate: '2026-03-16', status: 'Activo' },
  
  // Préstamos Vencidos (con multas)
  { id: 'l3', bookId: 5, userId: '3', borrowDate: '2026-02-01', dueDate: '2026-02-15', status: 'Activo', finePaid: false }, // Carlos Pérez (A002) - 19 días de retraso
  { id: 'l4', bookId: 1, userId: '4', borrowDate: '2026-02-15', dueDate: '2026-03-01', status: 'Activo', finePaid: false }, // Ana Gómez (P001) - 5 días de retraso
];

interface LoanContextType {
  loans: Loan[];
  addLoan: (loan: Omit<Loan, 'id'>) => void;
  updateLoan: (id: string, loan: Partial<Loan>) => void;
}

const LoanContext = createContext<LoanContextType | null>(null);

export function LoanProvider({ children }: { children: React.ReactNode }) {
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);

  const addLoan = (newLoan: Omit<Loan, 'id'>) => {
    setLoans([{ ...newLoan, id: Date.now().toString() }, ...loans]);
  };

  const updateLoan = (id: string, updatedLoan: Partial<Loan>) => {
    setLoans(loans.map(l => l.id === id ? { ...l, ...updatedLoan } : l));
  };

  return (
    <LoanContext.Provider value={{ loans, addLoan, updateLoan }}>
      {children}
    </LoanContext.Provider>
  );
}

export const useLoans = () => {
  const ctx = useContext(LoanContext);
  if (!ctx) throw new Error('useLoans must be used within LoanProvider');
  return ctx;
};