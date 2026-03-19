import React, { useState } from 'react';
import { UserProfileDropdown } from "./UserProfileDropdown";
import { 
  Search, Bell, Plus, X, ArrowRightLeft, Calendar, User as UserIcon, Book as BookIcon
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { useLoans, Loan } from '../context/LoanContext';

export function LoanManagement() {
  const { user: currentUser, users } = useAuth();
  const { books, updateBook } = useBooks();
  const { loans, addLoan, updateLoan } = useLoans();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isAdmin = currentUser?.role === 'Administrador' || currentUser?.role === 'Bibliotecario';
  
  // Date utils para valores por defecto
  const today = new Date().toISOString().split('T')[0];
  const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Form State
  const [formData, setFormData] = useState({
    userId: '',
    bookId: '',
    borrowDate: today,
    dueDate: fourteenDaysFromNow
  });

  // Filtrar préstamos: Si es admin, ve todos. Si es usuario regular, ve solo los suyos.
  const visibleLoans = isAdmin ? loans : loans.filter(l => l.userId === currentUser?.id);

  // Filtramos por búsqueda de nombre del libro o usuario
  const filteredLoans = visibleLoans.filter(loan => {
    const loanUser = users.find(u => u.id === loan.userId);
    const loanBook = books.find(b => b.id === loan.bookId);
    
    const searchLower = searchQuery.toLowerCase();
    const userMatch = loanUser?.name.toLowerCase().includes(searchLower) || loanUser?.username.toLowerCase().includes(searchLower);
    const bookMatch = loanBook?.title.toLowerCase().includes(searchLower);
    
    return userMatch || bookMatch;
  });

  const availableBooks = books.filter(b => b.status === 'Disponible');

  const handleOpenAdd = () => {
    setFormData({
      userId: currentUser?.id || '',
      bookId: availableBooks[0]?.id.toString() || '',
      borrowDate: today,
      dueDate: fourteenDaysFromNow
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.bookId) return;

    // Crear préstamo
    addLoan({
      userId: formData.userId,
      bookId: parseInt(formData.bookId),
      borrowDate: formData.borrowDate,
      dueDate: formData.dueDate,
      status: 'Activo'
    });

    // Actualizar cantidad disponible del libro
    const bookId = parseInt(formData.bookId);
    const book = books.find(b => b.id === bookId);
    if (book) {
      const newAvailable = book.availableCopies - 1;
      updateBook(bookId, { 
        availableCopies: newAvailable,
        status: newAvailable <= 0 ? 'Prestado' : 'Disponible'
      });
    }

    setIsModalOpen(false);
  };

  const handleReturn = (loan: Loan) => {
    // Marcar préstamo como devuelto
    updateLoan(loan.id, { status: 'Devuelto' });
    
    // Marcar libro como disponible y sumar copia
    const book = books.find(b => b.id === loan.bookId);
    if (book) {
      updateBook(loan.bookId, { 
        availableCopies: book.availableCopies + 1,
        status: 'Disponible' 
      });
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
            placeholder="Buscar por libro o matrícula..." 
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
              <h1 className="text-2xl md:text-[32px] font-bold text-gray-900 tracking-tight">
                {isAdmin ? 'Registro de Préstamos' : 'Mis Préstamos'}
              </h1>
              <p className="text-sm md:text-base text-neutral-400 font-medium mt-1">
                {isAdmin ? 'Control de circulación del material bibliográfico' : 'Historial de los libros que has solicitado'}
              </p>
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

          {/* Table Container */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-neutral-200 text-sm font-semibold text-neutral-500">
                    {isAdmin && <th className="px-6 py-4">Usuario</th>}
                    <th className="px-6 py-4">Libro</th>
                    <th className="px-6 py-4">F. Préstamo</th>
                    <th className="px-6 py-4">F. Devolución</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {filteredLoans.map(loan => {
                    const loanUser = users.find(u => u.id === loan.userId);
                    const loanBook = books.find(b => b.id === loan.bookId);

                    return (
                      <tr key={loan.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                        
                        {/* Usuario (Solo visible para admin) */}
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <ImageWithFallback 
                                src={loanUser?.avatar || ''} 
                                alt={loanUser?.name} 
                                className="w-8 h-8 object-cover rounded-full shadow-sm border border-neutral-200 shrink-0 bg-neutral-100" 
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
                          <div className="flex items-center gap-3">
                            <ImageWithFallback 
                              src={loanBook?.cover || ''} 
                              alt={loanBook?.title} 
                              className="w-8 h-10 object-cover rounded shadow-sm border border-neutral-200 shrink-0 bg-neutral-100" 
                            />
                            <p className="font-semibold text-gray-900 line-clamp-2" title={loanBook?.title}>
                              {loanBook?.title || 'Libro Eliminado'}
                            </p>
                          </div>
                        </td>

                        {/* F. Préstamo */}
                        <td className="px-6 py-4 text-neutral-600 font-medium">
                          {new Date(loan.borrowDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        {/* F. Devolución */}
                        <td className="px-6 py-4 text-neutral-600 font-medium">
                          {new Date(loan.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
                            ${loan.status === 'Activo' ? 'bg-[#B5DBF7]/30 text-[#2B74FF]' :
                              loan.status === 'Devuelto' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          {loan.status === 'Activo' && isAdmin ? (
                            <button 
                              onClick={() => handleReturn(loan)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] border border-neutral-200 text-neutral-600 hover:text-[#2B74FF] hover:border-[#2B74FF]/50 hover:bg-[#B5DBF7]/10 rounded-lg text-xs font-bold transition-all"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              Recibir
                            </button>
                          ) : loan.status === 'Activo' && !isAdmin ? (
                            <span className="text-[#2B74FF] text-xs font-medium">En tu posesión</span>
                          ) : (
                            <span className="text-neutral-400 text-xs font-medium italic">Completado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredLoans.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-neutral-400">
                        No se encontraron registros de préstamos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>

      {/* Add Loan Modal (Sólo Admin) */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                Registrar Nuevo Préstamo
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="loan-form" onSubmit={handleSave} className="space-y-6">
                
                {/* Seleccionar Usuario */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[#2B74FF]" />
                    Usuario o Lector
                  </label>
                  <select 
                    required
                    value={formData.userId}
                    onChange={e => setFormData({...formData, userId: e.target.value})}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                  >
                    <option value="" disabled>Selecciona un usuario...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.username})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seleccionar Libro */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <BookIcon className="w-4 h-4 text-[#2B74FF]" />
                    Libro a Prestar
                  </label>
                  <select 
                    required
                    value={formData.bookId}
                    onChange={e => setFormData({...formData, bookId: e.target.value})}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                  >
                    <option value="" disabled>Selecciona un libro disponible...</option>
                    {availableBooks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} - {b.author} ({b.availableCopies} disp.)
                      </option>
                    ))}
                  </select>
                  {availableBooks.length === 0 && (
                    <p className="text-xs text-red-500 font-medium mt-1">No hay libros disponibles actualmente en el catálogo.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Fecha de Préstamo */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      Fecha de Préstamo
                    </label>
                    <input 
                      required
                      type="date" 
                      value={formData.borrowDate}
                      onChange={e => setFormData({...formData, borrowDate: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Fecha de Devolución */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      Devolución Esperada
                    </label>
                    <input 
                      required
                      type="date" 
                      value={formData.dueDate}
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                form="loan-form"
                type="submit"
                disabled={availableBooks.length === 0}
                className="bg-[#2B74FF] hover:bg-blue-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#2B74FF]/20"
              >
                Confirmar Préstamo
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}