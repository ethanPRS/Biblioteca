import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = 'http://localhost:5001/api/loanRequests';

export interface LoanRequest {
  id: string;
  bookId: number;
  userId: string;
  requestDate: string;
  status: 'Pendiente' | 'Aprobada' | 'Rechazada';
  responseDate?: string;
  reviewedBy?: string;
}

interface LoanRequestContextType {
  loanRequests: LoanRequest[];
  addLoanRequest: (request: Omit<LoanRequest, 'id'>) => Promise<void>;
  updateLoanRequest: (id: string, request: Partial<LoanRequest>) => Promise<void>;
  fetchLoanRequests: () => Promise<void>;
}

const LoanRequestContext = createContext<LoanRequestContextType | null>(null);

export function LoanRequestProvider({ children }: { children: React.ReactNode }) {
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);

  const fetchLoanRequests = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setLoanRequests(data);
      }
    } catch (error) {
      console.error('Error fetching loan requests:', error);
    }
  };

  useEffect(() => {
    fetchLoanRequests();
  }, []);

  const addLoanRequest = async (newRequest: Omit<LoanRequest, 'id'>) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });
      if (res.ok) {
        await fetchLoanRequests();
      }
    } catch (error) {
      console.error('Error adding loan request:', error);
    }
  };

  const updateLoanRequest = async (id: string, updatedRequest: Partial<LoanRequest>) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRequest)
      });
      if (res.ok) {
        await fetchLoanRequests();
      }
    } catch (error) {
      console.error('Error updating loan request:', error);
    }
  };

  return (
    <LoanRequestContext.Provider value={{ loanRequests, addLoanRequest, updateLoanRequest, fetchLoanRequests }}>
      {children}
    </LoanRequestContext.Provider>
  );
}

export const useLoanRequests = () => {
  const ctx = useContext(LoanRequestContext);
  if (!ctx) throw new Error('useLoanRequests must be used within LoanRequestProvider');
  return ctx;
};
