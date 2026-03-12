import React, { createContext, useContext, useState } from 'react';

export interface LoanRequest {
  id: string;
  bookId: number;
  userId: string;
  requestDate: string;
  status: 'Pendiente' | 'Aprobada' | 'Rechazada';
  responseDate?: string;
  reviewedBy?: string;
}

const INITIAL_LOAN_REQUESTS: LoanRequest[] = [
  { 
    id: 'lr1', 
    bookId: 5, 
    userId: '3', 
    requestDate: '2026-03-06', 
    status: 'Pendiente' 
  },
  { 
    id: 'lr2', 
    bookId: 6, 
    userId: '4', 
    requestDate: '2026-03-05', 
    status: 'Pendiente' 
  },
];

interface LoanRequestContextType {
  loanRequests: LoanRequest[];
  addLoanRequest: (request: Omit<LoanRequest, 'id'>) => void;
  updateLoanRequest: (id: string, request: Partial<LoanRequest>) => void;
}

const LoanRequestContext = createContext<LoanRequestContextType | null>(null);

export function LoanRequestProvider({ children }: { children: React.ReactNode }) {
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>(INITIAL_LOAN_REQUESTS);

  const addLoanRequest = (newRequest: Omit<LoanRequest, 'id'>) => {
    setLoanRequests([{ ...newRequest, id: Date.now().toString() }, ...loanRequests]);
  };

  const updateLoanRequest = (id: string, updatedRequest: Partial<LoanRequest>) => {
    setLoanRequests(loanRequests.map(lr => lr.id === id ? { ...lr, ...updatedRequest } : lr));
  };

  return (
    <LoanRequestContext.Provider value={{ loanRequests, addLoanRequest, updateLoanRequest }}>
      {children}
    </LoanRequestContext.Provider>
  );
}

export const useLoanRequests = () => {
  const ctx = useContext(LoanRequestContext);
  if (!ctx) throw new Error('useLoanRequests must be used within LoanRequestProvider');
  return ctx;
};
