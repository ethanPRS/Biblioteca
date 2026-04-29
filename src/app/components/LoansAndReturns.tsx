import React, { useState } from 'react';
import { toast } from 'sonner';
import { UserProfileDropdown } from "./UserProfileDropdown";
import { 
  Search, Plus, Calendar, User as UserIcon, BookOpen, CheckCircle2, X, AlertTriangle, Clock, CalendarCheck
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { useLoans, Loan } from '../context/LoanContext';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';

export function LoansAndReturns() {
  const { user: currentUser, users } = useAuth();
  const { settings } = useSettings();
  const { books } = useBooks();
  const { loans, addLoan, updateLoan } = useLoans();
  const { addNotification } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    bookId: 0,
    borrowDate: '',
    dueDate: '',
  });

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<Loan | null>(null);
  const [returnCondition, setReturnCondition] = useState<string>('Buen Estado');

  const isAdmin = currentUser?.role === 'Administrador' || currentUser?.role === 'Bibliotecario';

  // Filtrar préstamos visibles (Admin ve todos, Usuario ve solo los suyos)
  const visibleLoans = isAdmin 
    ? loans 
    : loans.filter(l => l.userId === currentUser?.id);

  // Filtro por búsqueda
  const filteredLoans = visibleLoans.filter(loan => {
    const loanUser = users.find(u => u.id === loan.userId);
    const loanBook = books.find(b => b.id === loan.bookId);
    
    const searchLower = searchQuery.toLowerCase();
    const userMatch = loanUser?.name.toLowerCase().includes(searchLower) || loanUser?.username.toLowerCase().includes(searchLower);
    const bookMatch = loanBook?.title.toLowerCase().includes(searchLower);
    
    return userMatch || bookMatch;
  });

  // Calcular estado del préstamo
  const getLoanStatus = (loan: Loan) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(loan.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    // Calculate pending condition fines from the database
    const pendingConditionFines = loan.fines?.filter(f => (f.tipo === 'Daño' || f.tipo === 'Pérdida') && f.estatus_pago !== 'Pagada') || [];
    const conditionFineTotal = pendingConditionFines.reduce((sum, f) => sum + (f.monto || 0), 0);
    const conditionLabels = pendingConditionFines.map(f => f.tipo).join(' y ');

    if (loan.status === 'Devuelto') {
      // Si el préstamo ya fue devuelto y hay multa pendiente por daños o pérdida
      if (conditionFineTotal > 0) {
        return {
          label: 'Devuelto con Adeudo',
          type: 'overdue' as const,
          color: 'bg-red-100 text-red-700',
          fine: conditionFineTotal,
          fineType: conditionLabels
        };
      }

      const returnDate = new Date(); // En un sistema real, tendrías una fecha de devolución
      const diffTime = dueDate.getTime() - returnDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) {
        return {
          label: 'Devuelto a tiempo',
          type: 'early' as const,
          color: 'bg-green-100 text-green-700'
        };
      } else {
        return {
          label: `Devuelto con ${Math.abs(diffDays)} días de retraso`,
          type: 'late' as const,
          color: 'bg-orange-100 text-orange-700'
        };
      }
    }
    
    // Para préstamos activos
    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysOverdue > 0) {
      return {
        label: `Vencido hace ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'}`,
        type: 'overdue' as const,
        color: 'bg-red-100 text-red-700',
        fine: daysOverdue * settings.dailyFineAmount
      };
    } else if (daysOverdue === 0) {
      return {
        label: 'Vence hoy',
        type: 'due-today' as const,
        color: 'bg-orange-100 text-orange-700'
      };
    } else {
      const daysRemaining = Math.abs(daysOverdue);
      return {
        label: `Vence en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`,
        type: 'active' as const,
        color: 'bg-blue-100 text-blue-700'
      };
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      userId: '',
      bookId: 0,
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + settings.maxLoanDaysStudent * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const book = books.find(b => b.id === formData.bookId);
    const selectedUser = users.find(u => u.id === formData.userId);
    if (!book || book.availableCopies <= 0) return;

    addLoan({
      userId: formData.userId,
      bookId: formData.bookId,
      borrowDate: formData.borrowDate,
      dueDate: formData.dueDate,
      status: 'Activo'
    });

    setIsModalOpen(false);

    toast.success('Préstamo registrado con éxito');

    // Persistent notification for ALL users
    addNotification({
      title: 'Nuevo Préstamo Registrado',
      message: `Se ha registrado el préstamo de "${book.title}" para ${selectedUser?.name || 'un usuario'}.`,
      type: 'success',
      targetUserId: null, // null = visible para todos
    });
  };

  const handleReturnClick = (loan: Loan) => {
    setSelectedLoanForReturn(loan);
    setReturnCondition('Buen Estado');
    setIsReturnModalOpen(true);
  };

  const confirmReturn = async () => {
    if (!selectedLoanForReturn) return;

    const book = books.find(b => b.id === selectedLoanForReturn.bookId);
    const loanUser = users.find(u => u.id === selectedLoanForReturn.userId);
    if (!book) return;

    // The backend handles marking the exemplar as 'Disponible' automatically
    // when status is set to 'Devuelto' — no need to call updateBook separately.
    await updateLoan(selectedLoanForReturn.id, { 
      status: 'Devuelto',
      condition: returnCondition
    });

    toast.success('Devolución registrada con éxito');

    // Persistent notification for ALL users
    addNotification({
      title: 'Devolución Registrada',
      message: `El libro "${book.title}" ha sido devuelto por ${loanUser?.name || 'un usuario'}.`,
      type: 'success',
      targetUserId: null,
    });

    setIsReturnModalOpen(false);
    setSelectedLoanForReturn(null);
  };

  // Estadísticas
  const activeLoans = filteredLoans.filter(l => l.status === 'Activo').length;
  const overdueLoans = filteredLoans.filter(l => {
    if (l.status !== 'Activo') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(l.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;
  const returnedLoans = filteredLoans.filter(l => l.status === 'Devuelto').length;

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
            placeholder="Buscar usuario o libro..." 
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
              <h1 className="text-2xl md:text-[32px] font-bold text-gray-900 tracking-tight">Préstamos y Devoluciones</h1>
              <p className="text-sm md:text-base text-neutral-400 font-medium mt-1">Gestiona los préstamos activos y el historial de devoluciones</p>
            </div>
            
            {isAdmin && (
              <button 
                onClick={handleOpenAdd}
                className="bg-[#2B74FF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#2B74FF]/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo Préstamo
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm font-semibold mb-1">Préstamos Activos</p>
                  <p className="text-3xl font-bold text-gray-900">{activeLoans}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm font-semibold mb-1">Préstamos Vencidos</p>
                  <p className="text-3xl font-bold text-red-600">{overdueLoans}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm font-semibold mb-1">Devoluciones</p>
                  <p className="text-3xl font-bold text-green-600">{returnedLoans}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
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
                    <th className="px-6 py-4">Fecha Préstamo</th>
                    <th className="px-6 py-4">Fecha Vencimiento</th>
                    <th className="px-6 py-4">Estado</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {filteredLoans.map(loan => {
                    const loanUser = users.find(u => u.id === loan.userId);
                    const loanBook = books.find(b => b.id === loan.bookId);
                    const status = getLoanStatus(loan);

                    return (
                      <tr key={loan.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <ImageWithFallback 
                                src={loanUser?.avatar || ''} 
                                alt={loanUser?.name || ''} 
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
                              />
                              <div>
                                <p className="font-bold text-gray-900">{loanUser?.name}</p>
                                <p className="text-neutral-500 font-medium text-xs">{loanUser?.username}</p>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <ImageWithFallback 
                              src={loanBook?.cover || ''} 
                              alt={loanBook?.title || ''} 
                              className="w-10 h-14 object-cover rounded shadow-sm border border-neutral-200" 
                            />
                            <div>
                              <p className="font-bold text-gray-900 line-clamp-1">{loanBook?.title}</p>
                              <p className="text-neutral-500 font-medium text-xs">{loanBook?.author}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-neutral-600">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <span className="font-medium">{new Date(loan.borrowDate).toLocaleDateString('es-ES')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-neutral-600">
                            <CalendarCheck className="w-4 h-4 text-neutral-400" />
                            <span className="font-medium">{new Date(loan.dueDate).toLocaleDateString('es-ES')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold w-fit ${status.color}`}>
                              {status.label}
                            </span>
                            {status.fine && (
                              <span className="text-xs text-red-600 font-semibold">
                                Multa ({status.fineType || 'Retraso'}): ${status.fine}
                              </span>
                            )}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            {loan.status === 'Activo' && (
                              <button 
                                onClick={() => handleReturnClick(loan)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-xs transition-all shadow-sm"
                              >
                                Marcar como Devuelto
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  
                  {filteredLoans.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-neutral-400">
                        No se encontraron préstamos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>

      {/* Add Loan Modal */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Préstamo</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 block">Usuario</label>
                <select 
                  required
                  value={formData.userId}
                  onChange={e => {
                    const uid = e.target.value;
                    const u = users.find(usr => usr.id === uid);
                    const days = (u?.role === 'Profesor' || u?.role === 'Administrador') ? settings.maxLoanDaysProf : settings.maxLoanDaysStudent;
                    setFormData({
                      ...formData, 
                      userId: uid,
                      dueDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    });
                  }}
                  className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                >
                  <option value="">Seleccionar usuario</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.username})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 block">Libro</label>
                <select 
                  required
                  value={formData.bookId}
                  onChange={e => setFormData({...formData, bookId: parseInt(e.target.value)})}
                  className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                >
                  <option value={0}>Seleccionar libro</option>
                  {books.filter(b => b.availableCopies > 0).map(book => (
                    <option key={book.id} value={book.id}>{book.title} ({book.availableCopies} disponibles)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 block">Fecha de Préstamo</label>
                <input 
                  required
                  type="date" 
                  value={formData.borrowDate}
                  onChange={e => setFormData({...formData, borrowDate: e.target.value})}
                  className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 block">Fecha de Vencimiento</label>
                <input 
                  required
                  type="date" 
                  value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[#2B74FF] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#2B74FF]/20"
                >
                  Crear Préstamo
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}

      {/* Return Modal */}
      {isReturnModalOpen && selectedLoanForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsReturnModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Confirmar Devolución</h2>
              <button 
                onClick={() => setIsReturnModalOpen(false)}
                className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-600 mb-4">
                Por favor, indica el estado en el que se devuelve el libro.
              </p>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input 
                    type="radio" 
                    name="condition" 
                    value="Buen Estado" 
                    checked={returnCondition === 'Buen Estado'}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Buen Estado</p>
                    <p className="text-xs text-neutral-500">El libro no presenta daños significativos.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input 
                    type="radio" 
                    name="condition" 
                    value="Mal Estado" 
                    checked={returnCondition === 'Mal Estado'}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Mal Estado</p>
                    <p className="text-xs text-neutral-500">Se cobrará el 50% del valor del libro como multa.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input 
                    type="radio" 
                    name="condition" 
                    value="Se perdio" 
                    checked={returnCondition === 'Se perdio'}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Se perdió</p>
                    <p className="text-xs text-neutral-500">Se cobrará el 100% del valor del libro como multa.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmReturn}
                  className="bg-[#2B74FF] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#2B74FF]/20"
                >
                  Confirmar Devolución
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
