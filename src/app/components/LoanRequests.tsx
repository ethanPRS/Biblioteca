import React, { useState } from 'react';
import { Link } from 'react-router';
import { UserProfileDropdown } from "./UserProfileDropdown";
import {
  Search, Check, X, Clock, FileText
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { useLoanRequests } from '../context/LoanRequestContext';
import { useLoans } from '../context/LoanContext';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';

export function LoanRequests() {
  const { user: currentUser, users } = useAuth();
  const { books } = useBooks();
  const { loanRequests, updateLoanRequest } = useLoanRequests();
  const { loans, addLoan } = useLoans();
  const { settings } = useSettings();
  const { addNotification } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [processingRequestIds, setProcessingRequestIds] = useState<string[]>([]);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

  const isAdmin = currentUser?.role === 'Administrador' || currentUser?.role === 'Bibliotecario';

  const visibleRequests = isAdmin
    ? loanRequests
    : loanRequests.filter(r => r.userId === currentUser?.id);

  const filteredRequests = visibleRequests.filter(request => {
    const requestUser = users.find(u => u.id === request.userId);
    const requestBook = books.find(b => b.id === request.bookId);

    const searchLower = searchQuery.toLowerCase();
    const userMatch = requestUser?.name.toLowerCase().includes(searchLower) || requestUser?.username.toLowerCase().includes(searchLower);
    const bookMatch = requestBook?.title.toLowerCase().includes(searchLower);

    return userMatch || bookMatch;
  });

  const openReceipt = (loanId: string) => {
    window.open(`${API_BASE_URL}/api/loans/${loanId}/receipt.pdf?userId=${encodeURIComponent(currentUser?.id || '')}`, '_blank', 'noopener,noreferrer');
  };

  const isProcessingRequest = (requestId: string) => processingRequestIds.includes(requestId);

  const handleApprove = async (request: any) => {
    if (isProcessingRequest(request.id) || request.status !== 'Pendiente') return;

    const book = books.find(b => b.id === request.bookId);
    if (!book || book.availableCopies <= 0) {
      alert('No hay copias disponibles de este libro');
      return;
    }

    const requestUser = users.find(u => u.id === request.userId);
    const loanDays = requestUser?.role === 'Profesor' || requestUser?.role === 'Administrador'
      ? settings.maxLoanDaysProf
      : settings.maxLoanDaysStudent;

    const borrowDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + loanDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setProcessingRequestIds(prev => [...prev, request.id]);
    try {
      const createdLoan = await addLoan({
        userId: request.userId,
        bookId: request.bookId,
        borrowDate,
        dueDate,
        status: 'Activo'
      });

      if (!createdLoan) {
        alert('No se pudo aprobar la solicitud. Verifica si ya existe un prestamo activo para este libro.');
        return;
      }

      await updateLoanRequest(request.id, {
        status: 'Aprobada',
        responseDate: new Date().toISOString().split('T')[0],
        reviewedBy: currentUser?.id
      });

      addNotification({
        title: 'Solicitud Aprobada',
        message: `La solicitud de "${book?.title || 'libro'}" para ${requestUser?.name || 'un usuario'} fue aprobada.`,
        type: 'success',
        targetUserId: null,
      });

      if (request.userId) {
        addNotification({
          title: 'Tu solicitud fue aprobada',
          message: `Tu solicitud del libro "${book?.title || 'libro'}" ha sido aprobada. Tu recibo de prestamo ya esta disponible.`,
          type: 'success',
          targetUserId: request.userId,
        });
      }
    } finally {
      setProcessingRequestIds(prev => prev.filter(id => id !== request.id));
    }
  };

  const handleReject = async (request: any) => {
    if (isProcessingRequest(request.id) || request.status !== 'Pendiente') return;

    setProcessingRequestIds(prev => [...prev, request.id]);
    try {
      await updateLoanRequest(request.id, {
        status: 'Rechazada',
        responseDate: new Date().toISOString().split('T')[0],
        reviewedBy: currentUser?.id
      });

      const book = books.find(b => b.id === request.bookId);

      if (request.userId) {
        addNotification({
          title: 'Solicitud Rechazada',
          message: `Tu solicitud del libro "${book?.title || 'libro'}" no pudo ser aprobada en este momento.`,
          type: 'warning',
          targetUserId: request.userId,
        });
      }
    } finally {
      setProcessingRequestIds(prev => prev.filter(id => id !== request.id));
    }
  };

  const pendingCount = filteredRequests.filter(r => r.status === 'Pendiente').length;
  const approvedCount = filteredRequests.filter(r => r.status === 'Aprobada').length;
  const rejectedCount = filteredRequests.filter(r => r.status === 'Rechazada').length;

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const getPriority = (request: any) => {
      if (request.status === 'Pendiente') return 1;

      if (request.status === 'Aprobada') {
        const activeLoan = loans.find(l => l.userId === request.userId && l.bookId === request.bookId && l.status === 'Activo');
        if (activeLoan) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const [year, month, day] = activeLoan.dueDate.split('T')[0].split('-');
          const dueDate = new Date(Number(year), Number(month) - 1, Number(day));
          dueDate.setHours(0, 0, 0, 0);

          if (dueDate < today) return 2;
        }
      }
      return 3;
    };

    const priorityA = getPriority(a);
    const priorityB = getPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
  });

  return (
    <>
      <header className="h-16 md:h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-4 pl-[68px] lg:px-8 shrink-0 shadow-sm z-10 relative gap-4">
        <div className="relative flex-1 max-w-[480px]">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 md:w-5 md:h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-full py-2 pl-9 pr-3 md:py-2.5 md:pl-12 md:pr-4 text-xs md:text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all placeholder:text-neutral-400"
            placeholder="Buscar usuario o libro..."
          />
        </div>

        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <NotificationBell />
          <div className="w-px h-6 md:h-8 bg-neutral-200"></div>
          <UserProfileDropdown />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC]">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-[32px] font-bold text-gray-900 tracking-tight">
                {isAdmin ? 'Solicitudes de Prestamo' : 'Mis Solicitudes'}
              </h1>
              <p className="text-sm md:text-base text-neutral-400 font-medium mt-1">
                {isAdmin ? 'Gestiona las solicitudes pendientes y el historial' : 'Consulta el estado de tus solicitudes de prestamo'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
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

          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-neutral-200 text-sm font-semibold text-neutral-500">
                    {isAdmin && <th className="px-6 py-4">Usuario</th>}
                    <th className="px-6 py-4">Libro</th>
                    <th className="px-6 py-4">Fecha Solicitud</th>
                    <th className="px-6 py-4">Estado</th>
                    {!isAdmin && <th className="px-6 py-4">Devolucion</th>}
                    {isAdmin && <th className="px-6 py-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {sortedRequests.map(request => {
                    const requestUser = users.find(u => u.id === request.userId);
                    const requestBook = books.find(b => b.id === request.bookId);
                    const isBusy = isProcessingRequest(request.id);

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
                        {!isAdmin && (
                          <td className="px-6 py-4">
                            {(() => {
                              if (request.status === 'Aprobada') {
                                const relatedLoans = loans.filter(
                                  l => l.userId === request.userId && l.bookId === request.bookId
                                ).sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
                                const relatedLoan = relatedLoans[0];
                                if (relatedLoan) {
                                  if (relatedLoan.status === 'Activo') {
                                    return (
                                      <div className="flex items-center gap-2">
                                        <span className="text-orange-600 font-bold text-xs bg-orange-50 px-2 py-1 rounded-md">Pendiente</span>
                                        <button
                                          onClick={() => openReceipt(relatedLoan.id)}
                                          className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md text-xs font-bold transition-colors"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          Recibo
                                        </button>
                                      </div>
                                    );
                                  } else if (relatedLoan.status === 'Devuelto') {
                                    return <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-md">Devuelto</span>;
                                  }
                                }
                                return <span className="text-neutral-400 font-medium text-xs">-</span>;
                              }
                              return <span className="text-neutral-400 font-medium text-xs">-</span>;
                            })()}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-6 py-4">
                            {request.status === 'Pendiente' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApprove(request)}
                                  disabled={isBusy}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center gap-1"
                                  title="Aprobar solicitud"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  {isBusy ? 'Procesando...' : 'Aprobar'}
                                </button>
                                <button
                                  onClick={() => handleReject(request)}
                                  disabled={isBusy}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center gap-1"
                                  title="Rechazar solicitud"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  {isBusy ? 'Procesando...' : 'Rechazar'}
                                </button>
                              </div>
                            )}
                            {request.status === 'Aprobada' && (
                              <div className="flex justify-end">
                                {(() => {
                                  const activeLoan = loans.find(
                                    l => l.userId === request.userId && l.bookId === request.bookId && l.status === 'Activo'
                                  );
                                  if (activeLoan) {
                                    return (
                                      <Link
                                        to="/prestamos"
                                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold text-xs transition-all flex items-center gap-1"
                                      >
                                        Ir a Devolver
                                      </Link>
                                    );
                                  }
                                  return null;
                                })()}
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
