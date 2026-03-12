import React, { useState } from 'react';
import { 
  Search, Bell, AlertTriangle, CheckCircle, CreditCard, DollarSign, Wallet
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { useLoans, Loan } from '../context/LoanContext';

const FINE_PER_DAY = 10; // $10 por cada día de retraso

export function FinesManagement() {
  const { user: currentUser, users } = useAuth();
  const { books } = useBooks();
  const { loans, updateLoan } = useLoans();
  
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = currentUser?.role === 'Administrador' || currentUser?.role === 'Bibliotecario';

  // Obtener préstamos con multas (fecha de vencimiento anterior a hoy)
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const loansWithFines = loans.filter(loan => {
    const dueDate = new Date(loan.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < todayDate;
  });

  // Filtrar multas visibles (Admin ve todas, Usuario ve solo las suyas)
  const visibleFines = isAdmin 
    ? loansWithFines 
    : loansWithFines.filter(l => l.userId === currentUser?.id);

  // Filtramos por búsqueda (nombre del libro o usuario)
  const filteredFines = visibleFines.filter(loan => {
    const loanUser = users.find(u => u.id === loan.userId);
    const loanBook = books.find(b => b.id === loan.bookId);
    
    const searchLower = searchQuery.toLowerCase();
    const userMatch = loanUser?.name.toLowerCase().includes(searchLower) || loanUser?.username.toLowerCase().includes(searchLower);
    const bookMatch = loanBook?.title.toLowerCase().includes(searchLower);
    
    return userMatch || bookMatch;
  });

  // Cálculo de resumen
  let totalPending = 0;
  let totalPaid = 0;
  let pendingCount = 0;

  const finesData = filteredFines.map(loan => {
    const dueDate = new Date(loan.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = todayDate.getTime() - dueDate.getTime();
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const amount = daysOverdue * FINE_PER_DAY;
    const isPaid = loan.finePaid === true;

    if (!isPaid) {
      totalPending += amount;
      pendingCount++;
    } else {
      totalPaid += amount;
    }

    return {
      loan,
      daysOverdue,
      amount,
      isPaid
    };
  });

  const handlePayFine = (loanId: string) => {
    updateLoan(loanId, { finePaid: true });
  };

  return (
    <>
      {/* Topbar */}
      <header className="h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-8 shrink-0 shadow-sm z-10 relative">
        <div className="relative w-[480px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-full py-2.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all placeholder:text-neutral-400" 
            placeholder="Buscar por nombre, matrícula o libro..." 
          />
        </div>

        <div className="flex items-center gap-6">
          <NotificationBell />
          <div className="w-px h-8 bg-neutral-200"></div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-sm text-gray-900 group-hover:text-[#2B74FF] transition-colors">{currentUser?.name}</p>
              <p className="text-neutral-400 text-xs font-medium">{currentUser?.role}</p>
            </div>
            <ImageWithFallback 
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div>
              <h1 className="text-[32px] font-bold text-gray-900 tracking-tight">
                {isAdmin ? 'Gestión de Multas' : 'Mis Infracciones'}
              </h1>
              <p className="text-neutral-400 font-medium mt-1">
                {isAdmin ? 'Control de recargos por devoluciones atrasadas' : 'Revisa tus recargos pendientes por entregas tardías'}
              </p>
            </div>
            
            {/* Resumen rápido de multas */}
            <div className="flex gap-4">
              <div className="bg-white border border-red-100 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-0.5">Deuda Pendiente</p>
                  <p className="text-xl font-bold text-red-600 leading-none">${totalPending.toFixed(2)}</p>
                </div>
              </div>

              {isAdmin && (
                <div className="bg-white border border-green-100 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm hidden sm:flex">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-0.5">Recaudado</p>
                    <p className="text-xl font-bold text-green-600 leading-none">${totalPaid.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fines Table */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-neutral-200 text-sm font-semibold text-neutral-500">
                    {isAdmin && <th className="px-6 py-4">Usuario</th>}
                    <th className="px-6 py-4">Libro Atrasado</th>
                    <th className="px-6 py-4">Retraso</th>
                    <th className="px-6 py-4">Monto ($)</th>
                    <th className="px-6 py-4">Estatus</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {finesData.map(({ loan, daysOverdue, amount, isPaid }) => {
                    const loanUser = users.find(u => u.id === loan.userId);
                    const loanBook = books.find(b => b.id === loan.bookId);

                    return (
                      <tr key={loan.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                        
                        {/* Usuario (Solo admin) */}
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <ImageWithFallback 
                                src={loanUser?.avatar || ''} 
                                alt={loanUser?.name} 
                                className="w-9 h-9 object-cover rounded-full shadow-sm border border-neutral-200 shrink-0 bg-neutral-100" 
                              />
                              <div>
                                <p className="font-bold text-gray-900 leading-tight">{loanUser?.name || 'Usuario Eliminado'}</p>
                                <p className="text-neutral-500 text-xs font-mono">{loanUser?.username}</p>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Libro */}
                        <td className="px-6 py-4 max-w-[200px]">
                          <div className="flex flex-col">
                            <p className="font-semibold text-gray-900 line-clamp-1 mb-0.5" title={loanBook?.title}>
                              {loanBook?.title || 'Libro Eliminado'}
                            </p>
                            <p className="text-xs text-neutral-400">
                              Venció el {new Date(loan.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </td>

                        {/* Retraso */}
                        <td className="px-6 py-4">
                          <span className="text-red-600 font-bold">{daysOverdue} días</span>
                        </td>

                        {/* Monto */}
                        <td className="px-6 py-4">
                          <span className={`font-bold text-base ${isPaid ? 'text-neutral-400 line-through' : 'text-gray-900'}`}>
                            ${amount.toFixed(2)}
                          </span>
                        </td>

                        {/* Estatus */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                            ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                          `}>
                            {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {isPaid ? 'Pagada' : 'Pendiente'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          {!isPaid ? (
                            isAdmin ? (
                              <button 
                                onClick={() => handlePayFine(loan.id)}
                                className="inline-flex items-center gap-1.5 bg-[#2B74FF] hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                Pagar/Condonar
                              </button>
                            ) : (
                              <button 
                                onClick={() => alert('Dirígete a la biblioteca para realizar el pago de tu multa.')}
                                className="inline-flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-900 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Instrucciones
                              </button>
                            )
                          ) : (
                            <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Completado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {finesData.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">¡Sin infracciones!</h3>
                          <p className="text-neutral-500 text-sm max-w-sm">
                            No se detectaron préstamos con retraso o multas pendientes.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}