import React, { useState } from 'react';
import { 
  Search, Check, X, Clock, AlertCircle
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { useLoanRequests } from '../context/LoanRequestContext';
import { useLoans } from '../context/LoanContext';

export function LoanRequests() {
  const { user: currentUser, users } = useAuth();
  const { books, updateBook } = useBooks();
  const { loanRequests, updateLoanRequest } = useLoanRequests();
  const { addLoan } = useLoans();
  
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = currentUser?.role === 'Administrador' || currentUser?.role === 'Bibliotecario';

  // Filtrar solicitudes visibles
  const visibleRequests = isAdmin 
    ? loanRequests 
    : loanRequests.filter(r => r.userId === currentUser?.id);

  // Filtro por búsqueda
  const filteredRequests = visibleRequests.filter(request => {
    const requestUser = users.find(u => u.id === request.userId);
    const requestBook = books.find(b => b.id === request.bookId);
    
    const searchLower = searchQuery.toLowerCase();
    const userMatch = requestUser?.name.toLowerCase().includes(searchLower) || requestUser?.username.toLowerCase().includes(searchLower);
    const bookMatch = requestBook?.title.toLowerCase().includes(searchLower);
    
    return userMatch || bookMatch;
  });

  const handleApprove = (request: any) => {
    const book = books.find(b => b.id === request.bookId);
    if (!book || book.availableCopies <= 0) {
      alert('No hay copias disponibles de este libro');
      return;
    }

    // Crear préstamo
    const borrowDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    addLoan({
      userId: request.userId,
      bookId: request.bookId,
      borrowDate,
      dueDate,
      status: 'Activo'
    });

    // Actualizar libro
    const newAvailable = book.availableCopies - 1;
    const newStatus = newAvailable === 0 ? 'Prestado' : 'Disponible';
    updateBook(book.id, { availableCopies: newAvailable, status: newStatus });

    // Actualizar solicitud
    updateLoanRequest(request.id, {
      status: 'Aprobada',
      responseDate: new Date().toISOString().split('T')[0],
      reviewedBy: currentUser?.id
    });
  };

  const handleReject = (request: any) => {
    updateLoanRequest(request.id, {
      status: 'Rechazada',
      responseDate: new Date().toISOString().split('T')[0],
      reviewedBy: currentUser?.id
    });
  };

  // Estadísticas
  const pendingCount = filteredRequests.filter(r => r.status === 'Pendiente').length;
  const approvedCount = filteredRequests.filter(r => r.status === 'Aprobada').length;
  const rejectedCount = filteredRequests.filter(r => r.status === 'Rechazada').length;

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
            placeholder="Buscar usuario o libro..." 
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
          
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-[32px] font-bold text-gray-900 tracking-tight">
                {isAdmin ? 'Solicitudes de Préstamo' : 'Mis Solicitudes'}
              </h1>
              <p className="text-neutral-400 font-medium mt-1">
                {isAdmin ? 'Gestiona las solicitudes pendientes y el historial' : 'Consulta el estado de tus solicitudes de préstamo'}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm font-semibold mb-1">Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm font-semibold mb-1">Aprobadas</p>
                  <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm font-semibold mb-1">Rechazadas</p>
                  <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <X className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-neutral-200 text-sm font-semibold text-neutral-500">
                    {isAdmin && <th className="px-6 py-4">Usuario</th>}
                    <th className="px-6 py-4">Libro</th>
                    <th className="px-6 py-4">Fecha Solicitud</th>
                    <th className="px-6 py-4">Estado</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {filteredRequests.map(request => {
                    const requestUser = users.find(u => u.id === request.userId);
                    const requestBook = books.find(b => b.id === request.bookId);

                    return (
                      <tr key={request.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <ImageWithFallback 
                                src={requestUser?.avatar || ''} 
                                alt={requestUser?.name || ''} 
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
                              />
                              <div>
                                <p className="font-bold text-gray-900">{requestUser?.name}</p>
                                <p className="text-neutral-500 font-medium text-xs">{requestUser?.username}</p>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <ImageWithFallback 
                              src={requestBook?.cover || ''} 
                              alt={requestBook?.title || ''} 
                              className="w-10 h-14 object-cover rounded shadow-sm border border-neutral-200" 
                            />
                            <div>
                              <p className="font-bold text-gray-900 line-clamp-1">{requestBook?.title}</p>
                              <p className="text-neutral-500 font-medium text-xs">{requestBook?.author}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-neutral-600">{new Date(request.requestDate).toLocaleDateString('es-ES')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
                            ${request.status === 'Pendiente' ? 'bg-orange-100 text-orange-700' : ''}
                            ${request.status === 'Aprobada' ? 'bg-green-100 text-green-700' : ''}
                            ${request.status === 'Rechazada' ? 'bg-red-100 text-red-700' : ''}
                          `}>
                            {request.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            {request.status === 'Pendiente' && (
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleApprove(request)}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center gap-1"
                                  title="Aprobar solicitud"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Aprobar
                                </button>
                                <button 
                                  onClick={() => handleReject(request)}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center gap-1"
                                  title="Rechazar solicitud"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Rechazar
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-neutral-400">
                        No se encontraron solicitudes.
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
