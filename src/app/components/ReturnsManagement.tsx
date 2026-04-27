import React, { useState } from 'react';
import { UserProfileDropdown } from "./UserProfileDropdown";
import { 
  Search, Bell, CheckCircle, Clock, AlertCircle, ArrowRightLeft 
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { useLoans, Loan } from '../context/LoanContext';

export function ReturnsManagement() {
  const { user: currentUser, users } = useAuth();
  const { books } = useBooks();
  const { loans, updateLoan } = useLoans();
  
  const [searchQuery, setSearchQuery] = useState('');

  // Solo nos interesan los préstamos que están 'Activos' (pendientes de devolución)
  const activeLoans = loans.filter(l => l.status === 'Activo');

  // Filtrado por búsqueda (usuario, matrícula o libro)
  const filteredLoans = activeLoans.filter(loan => {
    const loanUser = users.find(u => u.id === loan.userId);
    const loanBook = books.find(b => b.id === loan.bookId);
    
    const searchLower = searchQuery.toLowerCase();
    const userMatch = loanUser?.name.toLowerCase().includes(searchLower) || loanUser?.username.toLowerCase().includes(searchLower);
    const bookMatch = loanBook?.title.toLowerCase().includes(searchLower);
    
    return userMatch || bookMatch;
  });

  const handleReturn = (loan: Loan) => {
    // Marcar el préstamo como Devuelto.
    // El backend actualiza automáticamente el estatus del ejemplar a 'Disponible'.
    updateLoan(loan.id, { status: 'Devuelto' });
  };

  // Función para calcular si un préstamo está vencido
  const getStatusInfo = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        text: `Vencido hace ${Math.abs(diffDays)} días`, 
        color: 'text-red-700', 
        bg: 'bg-red-100',
        icon: AlertCircle
      };
    } else if (diffDays === 0) {
      return { 
        text: 'Vence hoy', 
        color: 'text-orange-700', 
        bg: 'bg-orange-100',
        icon: Clock
      };
    } else {
      return { 
        text: `Vence en ${diffDays} días`, 
        color: 'text-neutral-600', 
        bg: 'bg-neutral-100',
        icon: Clock
      };
    }
  };

  return (
    <>
      {/* Topbar */}
      <header className="h-16 md:h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-4 pl-[68px] lg:px-8 shrink-0 shadow-sm z-10 relative gap-4">
        <div className="relative flex-1 max-w-[480px]">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 md:w-5 md:h-5" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-full py-2 pl-9 pr-3 md:py-2.5 md:pl-12 md:pr-4 text-xs md:text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all placeholder:text-neutral-400" 
            placeholder="Buscar por libro, nombre o matrícula..." 
          />
        </div>

        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <NotificationBell />
          <div className="w-px h-6 md:h-8 bg-neutral-200"></div>
          <UserProfileDropdown />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC]">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-[32px] font-bold text-gray-900 tracking-tight">Recepción de Devoluciones</h1>
              <p className="text-sm md:text-base text-neutral-400 font-medium mt-1">Registra los libros que están siendo devueltos a la biblioteca</p>
            </div>
            
            {/* Resumen rápido */}
            <div className="flex gap-4">
              <div className="bg-white border border-neutral-200 rounded-xl px-4 py-2 flex flex-col justify-center items-end shadow-sm">
                <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Pendientes</span>
                <span className="text-xl font-bold text-[#2B74FF] leading-none mt-1">{activeLoans.length}</span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-neutral-200 text-sm font-semibold text-neutral-500">
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Libro a Devolver</th>
                    <th className="px-6 py-4">Fecha Acordada</th>
                    <th className="px-6 py-4">Estatus de Tiempo</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {filteredLoans.map(loan => {
                    const loanUser = users.find(u => u.id === loan.userId);
                    const loanBook = books.find(b => b.id === loan.bookId);
                    const statusInfo = getStatusInfo(loan.dueDate);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={loan.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                        
                        {/* Usuario */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <ImageWithFallback 
                              src={loanUser?.avatar || ''} 
                              alt={loanUser?.name} 
                              className="w-10 h-10 object-cover rounded-full shadow-sm border border-neutral-200 shrink-0 bg-neutral-100" 
                            />
                            <div>
                              <p className="font-bold text-gray-900 leading-tight">{loanUser?.name || 'Usuario Eliminado'}</p>
                              <p className="text-neutral-500 text-xs font-mono">{loanUser?.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Libro */}
                        <td className="px-6 py-4 max-w-[250px]">
                          <div className="flex items-center gap-3">
                            <ImageWithFallback 
                              src={loanBook?.cover || ''} 
                              alt={loanBook?.title} 
                              className="w-10 h-14 object-cover rounded shadow-sm border border-neutral-200 shrink-0 bg-neutral-100" 
                            />
                            <div>
                              <p className="font-bold text-gray-900 line-clamp-2 leading-tight mb-1" title={loanBook?.title}>
                                {loanBook?.title || 'Libro Eliminado'}
                              </p>
                              <span className="text-xs text-[#2B74FF] bg-[#B5DBF7]/20 px-2 py-0.5 rounded font-semibold">
                                {loanBook?.location}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Fecha Devolución */}
                        <td className="px-6 py-4 text-neutral-900 font-medium">
                          {new Date(loan.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </td>

                        {/* Status (Vencido, a tiempo, etc) */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.text}
                          </span>
                        </td>

                        {/* Acción - Registrar Devolución */}
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleReturn(loan)}
                            className="inline-flex items-center justify-center gap-2 bg-[#2B74FF] hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md shadow-[#2B74FF]/20 group-hover:scale-105"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Recibir Libro
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredLoans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">Todo al día</h3>
                          <p className="text-neutral-500 text-sm max-w-sm">
                            {searchQuery 
                              ? 'No se encontraron préstamos activos con esa búsqueda.' 
                              : 'No hay libros pendientes de devolución en este momento.'}
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