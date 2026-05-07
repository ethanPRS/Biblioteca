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
import { createPortal } from 'react-dom';

export function LoanRequests() {
  const { user: currentUser, users } = useAuth();
  const { books } = useBooks();
  const { loanRequests, updateLoanRequest } = useLoanRequests();
  const { loans, addLoan } = useLoans();
  const { settings } = useSettings();
  const { addNotification } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [processingRequestIds, setProcessingRequestIds] = useState<string[]>([]);
  const [verifyPopup, setVerifyPopup] = useState<{ isOpen: boolean; status: 'loading' | 'success' | 'error'; message?: string; isRejection?: boolean }>({
    isOpen: false,
    status: 'loading'
  });
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

  const toDateValue = (value?: string) => {
    if (!value) return 0;
    return new Date(value).getTime();
  };

  const requestLoanMap = new Map<string, any>();
  const groupedRequestKeys = Array.from(new Set(
    sortedGroupKeySource(filteredRequests).map(request => `${request.userId}-${request.bookId}`)
  ));

  groupedRequestKeys.forEach((groupKey) => {
    const [userId, bookIdText] = groupKey.split('-');
    const bookId = Number(bookIdText);
    const requestsForGroup = filteredRequests
      .filter(request => request.userId === userId && request.bookId === bookId && request.status === 'Aprobada')
      .sort((a, b) => toDateValue(a.requestDate) - toDateValue(b.requestDate));

    const loansForGroup = loans
      .filter(loan => loan.userId === userId && loan.bookId === bookId)
      .sort((a, b) => toDateValue(a.borrowDate) - toDateValue(b.borrowDate));

    let loanIndex = 0;
    requestsForGroup.forEach((request) => {
      while (
        loanIndex < loansForGroup.length - 1 &&
        toDateValue(loansForGroup[loanIndex].borrowDate) < toDateValue(request.requestDate)
      ) {
        loanIndex += 1;
      }

      const matchedLoan = loansForGroup[loanIndex];
      if (matchedLoan) {
        requestLoanMap.set(request.id, matchedLoan);
        loanIndex += 1;
      }
    });
  });

  function sortedGroupKeySource(requests: typeof filteredRequests) {
    return [...requests].sort((a, b) => toDateValue(a.requestDate) - toDateValue(b.requestDate));
  }

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
    setVerifyPopup({ isOpen: true, status: 'loading', isRejection: false });
    try {
      const createdLoan = await addLoan({
        userId: request.userId,
        bookId: request.bookId,
        borrowDate,
        dueDate,
        status: 'Activo'
      });

      if (!createdLoan) {
        setVerifyPopup({ isOpen: true, status: 'error', message: 'No se pudo aprobar la solicitud. Verifica si ya existe un préstamo activo para este libro.' });
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
      
      setVerifyPopup({ isOpen: true, status: 'success', message: 'La solicitud ha sido aprobada y las notificaciones fueron enviadas al usuario.' });
    } catch {
      setVerifyPopup({ isOpen: true, status: 'error', message: 'Ocurrió un error al procesar la aprobación.' });
    } finally {
      setProcessingRequestIds(prev => prev.filter(id => id !== request.id));
    }
  };

  const handleReject = async (request: any) => {
    if (isProcessingRequest(request.id) || request.status !== 'Pendiente') return;

    setProcessingRequestIds(prev => [...prev, request.id]);
    setVerifyPopup({ isOpen: true, status: 'loading', isRejection: true });
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
      
      setVerifyPopup({ isOpen: true, status: 'success', message: 'La solicitud ha sido rechazada y el usuario ha sido notificado.' });
    } catch {
      setVerifyPopup({ isOpen: true, status: 'error', message: 'Ocurrió un error al intentar rechazar la solicitud.' });
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
        const activeLoan = requestLoanMap.get(request.id);
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
                                const relatedLoan = requestLoanMap.get(request.id);
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
                                  const activeLoan = requestLoanMap.get(request.id);
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

      {verifyPopup.isOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'rgba(23, 23, 23, 0.4)', backdropFilter: 'blur(4px)' }}
        >
          <div
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => verifyPopup.status === 'error' && setVerifyPopup({ isOpen: false, status: 'loading' })}
          ></div>

          <div
            style={{ position: 'relative', backgroundColor: 'white', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: '22rem', padding: '2.5rem 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
            className="animate-in fade-in zoom-in duration-200"
          >
            {(verifyPopup.status === 'success' || verifyPopup.status === 'error') && (
              <button
                onClick={() => setVerifyPopup({ isOpen: false, status: 'loading' })}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {verifyPopup.status === 'loading' && (
              <>
                <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', backgroundColor: verifyPopup.isRejection ? '#FEF2F2' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <div className={`w-9 h-9 border-4 ${verifyPopup.isRejection ? 'border-red-500' : 'border-[#2B74FF]'} border-t-transparent rounded-full animate-spin`}></div>
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.75rem' }}>
                  {verifyPopup.isRejection ? 'Rechazando Solicitud...' : 'Aprobando Solicitud...'}
                </h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                  Procesando la transacción y enviando notificaciones.
                </p>
                <button
                  disabled
                  style={{ width: '100%', backgroundColor: verifyPopup.isRejection ? '#FCA5A5' : '#93C5FD', color: 'white', fontWeight: 'bold', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'not-allowed', fontSize: '1rem' }}
                >
                  Procesando
                </button>
              </>
            )}

            {verifyPopup.status === 'success' && (
              <>
                <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', backgroundColor: verifyPopup.isRejection ? '#FEE2E2' : '#E0F2E9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  {verifyPopup.isRejection ? (
                    <X className="w-10 h-10 text-red-500 animate-in zoom-in" />
                  ) : (
                    <Check className="w-10 h-10 text-green-500 animate-in zoom-in" />
                  )}
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.75rem' }}>
                  {verifyPopup.isRejection ? 'Rechazo Completado' : 'Aprobación Exitosa'}
                </h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                  {verifyPopup.message}
                </p>
                <button
                  onClick={() => setVerifyPopup({ isOpen: false, status: 'loading' })}
                  style={{ width: '100%', backgroundColor: verifyPopup.isRejection ? '#EF4444' : '#22C55E', color: 'white', fontWeight: 'bold', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'background-color 0.2s' }}
                >
                  Completar
                </button>
              </>
            )}

            {verifyPopup.status === 'error' && (
              <>
                <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <X className="w-10 h-10 text-red-500 animate-in zoom-in" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.75rem' }}>No se pudo procesar</h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                  {verifyPopup.message}
                </p>
                <button
                  onClick={() => setVerifyPopup({ isOpen: false, status: 'loading' })}
                  style={{ width: '100%', backgroundColor: '#EF4444', color: 'white', fontWeight: 'bold', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'background-color 0.2s' }}
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
