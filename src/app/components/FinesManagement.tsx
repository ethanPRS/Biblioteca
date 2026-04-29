import React, { useState } from 'react';
import { UserProfileDropdown } from "./UserProfileDropdown";
import { 
  Search, Bell, AlertTriangle, CheckCircle, CreditCard, DollarSign, Wallet
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { useLoans } from '../context/LoanContext';
import { useFines } from '../context/FinesContext';
import { toast } from 'sonner';

export function FinesManagement() {
  const { user: currentUser, users } = useAuth();
  const { books } = useBooks();
  const { fines, updateFine } = useFines();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  const isAdmin = currentUser?.role === 'Administrador' || currentUser?.role === 'Bibliotecario';

  // Filtrar multas visibles (Admin ve todas, Usuario ve solo las suyas)
  const visibleFines = isAdmin
    ? fines
    : fines.filter(f => f.userId === currentUser?.id);

  // Filtrar por búsqueda (nombre del libro o usuario) y select
  const filteredFines = visibleFines.filter(fine => {
    // Filtro por dropdown de usuario
    if (isAdmin && selectedUserId !== 'all' && fine.userId !== selectedUserId) {
      return false;
    }

    const fineUser = users.find(u => u.id === fine.userId);
    const fineBook = books.find(b => b.id === fine.bookId);
    const searchLower = searchQuery.toLowerCase();
    const userMatch = fineUser?.name.toLowerCase().includes(searchLower) || fineUser?.username.toLowerCase().includes(searchLower);
    const bookMatch = fineBook?.title.toLowerCase().includes(searchLower);
    return userMatch || bookMatch;
  });

  // Totales desde la BD
  let totalPending = 0;
  let totalPaid = 0;

  for (const fine of filteredFines) {
    if (fine.paymentStatus === 'Pendiente') totalPending += fine.amount;
    else totalPaid += fine.amount;
  }

  const finesData = filteredFines.map(fine => ({
    fine,
    daysOverdue: fine.daysOverdue,
    amount: fine.amount,
    isPaid: fine.paymentStatus !== 'Pendiente',
  })).sort((a, b) => {
    if (a.isPaid !== b.isPaid) {
      return a.isPaid ? 1 : -1;
    }
    return new Date(b.fine.createdAt).getTime() - new Date(a.fine.createdAt).getTime();
  });

  // Marcar como pagada: actualiza la multa específica
  const handlePayFine = async (fineId: number) => {
    try {
      await updateFine(fineId, { paymentStatus: 'Pagada' });
      toast.success('Multa marcada como pagada/condonada');
    } catch (error) {
      toast.error('Error al procesar el pago de la multa');
    }
  };

  return (
    <>
      {/* Topbar */}
      <header className="h-16 md:h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-4 pl-[68px] lg:px-8 shrink-0 shadow-sm z-10 relative gap-4">
        <div className="relative flex-1 max-w-[700px] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 md:w-5 md:h-5" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-full py-2 pl-9 pr-3 md:py-2.5 md:pl-12 md:pr-4 text-xs md:text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all placeholder:text-neutral-400" 
              placeholder="Buscar por nombre, matrícula o libro..." 
            />
          </div>

          {isAdmin && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="hidden sm:block w-[200px] lg:w-[240px] bg-[#F8FAFC] border border-neutral-200 rounded-full px-4 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all text-neutral-600"
            >
              <option value="all">Todos los usuarios</option>
              {users
                .filter(u => fines.some(f => f.userId === u.id))
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          )}
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
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-[32px] font-bold text-gray-900 tracking-tight">
                {isAdmin ? 'Gestión de Multas' : 'Mis Infracciones'}
              </h1>
              <p className="text-sm md:text-base text-neutral-400 font-medium mt-1">
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
                    <th className="px-6 py-4">Libro</th>
                    <th className="px-6 py-4">Tipo/Retraso</th>
                    <th className="px-6 py-4">Monto ($)</th>
                    <th className="px-6 py-4">Estatus</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {finesData.map(({ fine, daysOverdue, amount, isPaid }) => {
                    const fineUser = users.find(u => u.id === fine.userId);
                    const fineBook = books.find(b => b.id === fine.bookId);

                    return (
                      <tr key={fine.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">

                        {/* Usuario (Solo admin) */}
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <ImageWithFallback
                                src={fineUser?.avatar || ''}
                                alt={fineUser?.name}
                                className="w-9 h-9 object-cover rounded-full shadow-sm border border-neutral-200 shrink-0 bg-neutral-100"
                              />
                              <div>
                                <p className="font-bold text-gray-900 leading-tight">{fineUser?.name || 'Usuario Eliminado'}</p>
                                <p className="text-neutral-500 text-xs font-mono">{fineUser?.username}</p>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Libro */}
                        <td className="px-6 py-4 max-w-[200px]">
                          <div className="flex flex-col">
                            <p className="font-semibold text-gray-900 line-clamp-1 mb-0.5" title={fineBook?.title}>
                              {fineBook?.title || 'Libro Eliminado'}
                            </p>
                            <p className="text-xs text-neutral-400">
                              Venció el {new Date(fine.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </td>

                        {/* Tipo / Retraso */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className={`font-bold ${fine.type === 'Retraso' ? 'text-orange-600' : 'text-red-600'}`}>
                              {fine.type}
                            </span>
                            {fine.type === 'Retraso' && (
                              <span className="text-xs text-neutral-500 font-medium">{daysOverdue} días de demora</span>
                            )}
                          </div>
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
                            ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {isPaid ? 'Pagada' : 'Pendiente'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          {!isPaid ? (
                            isAdmin ? (
                              <button
                                onClick={() => handlePayFine(fine.id)}
                                className="inline-flex items-center gap-1.5 bg-[#2B74FF] hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                Pagar/Condonar
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  toast.info('Instrucciones de Pago', {
                                    description: `Dirígete físicamente a la biblioteca para saldar tu multa pendiente por la cantidad de $${amount.toFixed(2)} MXN a la brevedad posible.`,
                                    duration: 5000,
                                    icon: <CreditCard className="w-5 h-5 text-[#2B74FF]" />
                                  });
                                }}
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