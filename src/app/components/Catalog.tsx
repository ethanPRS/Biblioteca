import React, { useState } from 'react';
import { UserProfileDropdown } from "./UserProfileDropdown";
import { 
  Search, Bell, SlidersHorizontal, MapPin, BookOpen, X, Calendar, User as UserIcon, CheckCircle2, AlertCircle, LayoutGrid, List
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { useBooks, Book } from '../context/BookContext';
import { useLoans } from '../context/LoanContext';
import { useLoanRequests } from '../context/LoanRequestContext';
import { useSettings } from '../context/SettingsContext';
import { NotificationBell } from './NotificationBell';
import { toast } from 'sonner';

export function Catalog() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { user, users } = useAuth();
  const { books, updateBook } = useBooks();
  const { loans, addLoan } = useLoans();
  const { loanRequests, addLoanRequest } = useLoanRequests();
  const { settings } = useSettings();
  const navigate = useNavigate();

  // Dynamically compute categories so there are no empty tabs!
  const DYNAMIC_CATEGORIES = ['Todos', ...Array.from(new Set(books.map(b => b.category).filter(Boolean))).sort()];

  const filteredBooks = books.filter(book => {
    const matchesCategory = activeCategory === 'Todos' || book.category === activeCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBorrow = () => {
    if (!user || !selectedBook || selectedBook.availableCopies <= 0 || isMyLoan) return;

    const isAdmin = user.role === 'Administrador' || user.role === 'Bibliotecario';
    
    // Check max books limit
    const maxBooks = user.role === 'Profesor' ? settings.maxBooksProf : settings.maxBooksStudent;
    const myActiveCount = loans.filter(l => l.userId === user.id && l.status === 'Activo').length;
    
    if (myActiveCount >= maxBooks && !isAdmin) {
      toast.error('Límite alcanzado', { description: `No puedes solicitar más de ${maxBooks} préstamos simultáneos.` });
      return;
    }

    if (isAdmin) {
      // Admin/Bibliotecario crea el préstamo directamente
      const loanDays = user.role === 'Profesor' || user.role === 'Administrador' ? settings.maxLoanDaysProf : settings.maxLoanDaysStudent;
      const borrowDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + loanDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      addLoan({
        userId: user.id,
        bookId: selectedBook.id,
        borrowDate,
        dueDate,
        status: 'Activo'
      });
      
      const newAvailable = selectedBook.availableCopies - 1;
      const newStatus = newAvailable === 0 ? 'Prestado' : 'Disponible';
      
      updateBook(selectedBook.id, { availableCopies: newAvailable, status: newStatus });
      setSelectedBook({ ...selectedBook, availableCopies: newAvailable, status: newStatus });
      
      toast.success('Préstamo registrado exitosamente');
    } else {
      // Usuario regular crea una solicitud
      addLoanRequest({
        bookId: selectedBook.id,
        userId: user.id,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'Pendiente'
      });
      
      toast.success('Tu solicitud ha sido enviada', {
        description: 'El bibliotecario revisará tu solicitud pronto'
      });
      
      setSelectedBook(null);
    }
  };

  // Find active loan details for the modal
  const myActiveLoan = selectedBook ? loans.find(l => l.bookId === selectedBook.id && l.status === 'Activo' && l.userId === user?.id) : null;
  const isMyLoan = !!myActiveLoan;
  
  // Si no es mío pero está prestado, mostramos info del primer préstamo (útil para admin o para ver la fecha)
  const firstActiveLoan = selectedBook ? loans.find(l => l.bookId === selectedBook.id && l.status === 'Activo') : null;
  const activeLoan = myActiveLoan || firstActiveLoan;
  
  const loanUser = activeLoan ? users.find(u => u.id === activeLoan.userId) : null;
  const isAdmin = user?.role === 'Administrador' || user?.role === 'Bibliotecario';

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
            placeholder="Buscar título, autor, ISBN..." 
          />
        </div>

        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <NotificationBell />
          <div className="w-px h-6 md:h-8 bg-neutral-200"></div>
          <UserProfileDropdown />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC]">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-[32px] font-bold text-gray-900 tracking-tight">Catálogo</h1>
              <p className="text-sm md:text-base text-neutral-400 font-medium mt-1">Explora, consulta y solicita libros en tiempo real</p>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                className="bg-white border border-neutral-200 text-neutral-600 hover:text-[#2B74FF] hover:border-[#B5DBF7] hover:bg-[#B5DBF7]/10 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
              >
                {viewMode === 'grid' ? (
                  <>
                    <List className="w-4 h-4" />
                    Vista de Lista
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4" />
                    Vista de Cuadrícula
                  </>
                )}
              </button>
            )}
          </div>

          {/* Retractable Category Menu (Mobile) */}
          <div className="lg:hidden mb-4">
            <select 
              value={activeCategory} 
              onChange={e => setActiveCategory(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2B74FF]/20"
            >
              {DYNAMIC_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Category Tabs (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {DYNAMIC_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeCategory === category 
                    ? 'bg-neutral-900 text-white shadow-md' 
                    : 'bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300 hover:text-gray-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {filteredBooks.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-12"
              : "flex flex-col gap-4 pb-12"
            }>
              {filteredBooks.map((book) => (
                viewMode === 'grid' ? (
                  <div 
                    key={book.id} 
                    onClick={() => setSelectedBook(book)}
                    className="group cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden mb-4 border border-neutral-200 shadow-sm bg-white transition-all duration-300 group-hover:shadow-xl group-hover:shadow-[#B5DBF7]/40 group-hover:-translate-y-1">
                      <ImageWithFallback 
                        src={book.cover} 
                        alt={book.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md
                          ${book.status === 'Disponible' 
                            ? 'bg-green-500/90 text-white' 
                            : 'bg-neutral-800/90 text-white'
                          }`}
                        >
                          {book.status === 'Disponible' ? `${book.availableCopies} ${book.availableCopies === 1 ? 'disponible' : 'disponibles'}` : 'Prestado'}
                        </span>
                      </div>
                    </div>

                    <div className="px-1 flex flex-col flex-1">
                      <h3 className="font-bold text-base text-gray-900 leading-tight mb-1.5 group-hover:text-[#2B74FF] transition-colors line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-neutral-500 font-medium mb-3">{book.author}</p>
                      
                      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 mt-auto">
                        <MapPin className="w-3.5 h-3.5" />
                        {book.location}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    key={book.id} 
                    onClick={() => setSelectedBook(book)}
                    className="group cursor-pointer flex items-center p-4 bg-white border border-neutral-200 rounded-2xl hover:shadow-md hover:border-[#B5DBF7] transition-all"
                  >
                    <ImageWithFallback 
                      src={book.cover} 
                      alt={book.title} 
                      className="w-16 h-24 object-cover rounded-lg shadow-sm mr-6 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1 group-hover:text-[#2B74FF] transition-colors truncate">
                            {book.title}
                          </h3>
                          <p className="text-sm text-neutral-500 font-medium mb-3">{book.author}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0
                          ${book.status === 'Disponible' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {book.status === 'Disponible' ? `${book.availableCopies} ${book.availableCopies === 1 ? 'disponible' : 'disponibles'}` : 'Prestado'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 mt-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
                          <MapPin className="w-4 h-4" />
                          {book.location}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
                          <span className="bg-[#F8FAFC] px-2 py-1 rounded-md text-neutral-500 border border-neutral-100">
                            {book.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-neutral-100 border-dashed">
              <BookOpen className="w-16 h-16 text-neutral-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron libros</h3>
              <p className="text-neutral-400 text-sm">Intenta ajustar tu búsqueda o los filtros de categoría.</p>
            </div>
          )}
          
        </div>
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setSelectedBook(null)}></div>
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            <button 
              onClick={() => setSelectedBook(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white text-neutral-800 rounded-full backdrop-blur-md transition-all shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Cover */}
            <div className="w-full md:w-2/5 bg-neutral-100 shrink-0 relative aspect-[3/4] md:aspect-auto">
              <ImageWithFallback 
                src={selectedBook.cover} 
                alt={selectedBook.title}
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
            </div>

            {/* Right: Details & Actions */}
            <div className="w-full md:w-3/5 flex-1 flex flex-col min-h-0 bg-white relative">
              
              {/* Contenido scrolleable */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-8">
              
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#B5DBF7]/30 text-[#2B74FF]">
                    {selectedBook.category}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                    ${selectedBook.status === 'Disponible' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {selectedBook.status === 'Disponible' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <AlertCircle className="w-3.5 h-3.5"/>}
                    {selectedBook.status === 'Disponible' ? `${selectedBook.availableCopies} ${selectedBook.availableCopies === 1 ? 'disponible' : 'disponibles'} de ${selectedBook.totalCopies}` : 'Prestado'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700">
                    {selectedBook.format}
                  </span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-2 tracking-tight">
                  {selectedBook.title}
                </h2>
                <p className="text-lg text-neutral-500 font-medium">por {selectedBook.author}</p>
              </div>

              {/* Synopsis */}
              {selectedBook.synopsis && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">Sinopsis</p>
                  <p className="text-sm text-neutral-600 leading-relaxed">{selectedBook.synopsis}</p>
                </div>
              )}

              {/* Book Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedBook.isbn && (
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">ISBN</p>
                    <p className="text-sm font-bold text-gray-900 font-mono">{selectedBook.isbn}</p>
                  </div>
                )}
                {selectedBook.editorial && (
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Editorial</p>
                    <p className="text-sm font-bold text-gray-900">{selectedBook.editorial}</p>
                  </div>
                )}
                {selectedBook.edition && (
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Edición</p>
                    <p className="text-sm font-bold text-gray-900">{selectedBook.edition}</p>
                  </div>
                )}
                {selectedBook.price > 0 && (
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Precio</p>
                    <p className="text-sm font-bold text-gray-900">${selectedBook.price}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-neutral-600 bg-[#F8FAFC] p-4 rounded-xl border border-neutral-100">
                  <MapPin className="w-5 h-5 text-[#2B74FF]" />
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Ubicación Física</p>
                    <p className="text-sm font-bold text-gray-900">{selectedBook.location}</p>
                  </div>
                </div>

                {/* Availability Status */}
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Estado de Disponibilidad</p>
                  <p className="text-sm font-bold text-gray-900">{selectedBook.availabilityStatus}</p>
                </div>

                {/* Fine Info */}
                {settings.dailyFineAmount > 0 && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Multa por Día de Retraso</p>
                    <p className="text-sm font-bold text-gray-900">${settings.dailyFineAmount} MXN</p>
                  </div>
                )}

                {/* Loan Info Section (Only if borrowed or if I have a copy) */}
                {(isMyLoan || (selectedBook.status === 'Prestado' && activeLoan)) && (
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-3">Información de Préstamo</p>
                    
                    {isMyLoan ? (
                      <div className="flex items-center gap-3">
                        <UserIcon className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">Tienes una copia de este libro en préstamo</p>
                          <p className="text-xs text-neutral-600">
                            Debes devolverlo antes del <span className="font-bold">{activeLoan ? new Date(activeLoan.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}</span>
                          </p>
                        </div>
                      </div>
                    ) : isAdmin ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ImageWithFallback src={loanUser?.avatar || ''} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{loanUser?.name}</p>
                            <p className="text-xs text-neutral-500 font-mono">{loanUser?.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-500 mb-0.5">Devolución</p>
                          <p className="text-sm font-bold text-orange-700">
                            {activeLoan ? new Date(activeLoan.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">No disponible temporalmente</p>
                          <p className="text-xs text-neutral-600">
                            Estará disponible a partir del <span className="font-bold">{activeLoan ? new Date(activeLoan.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              </div> {/* <-- Cierra el área de overflow-y-auto */}

              {/* Botón Estático al fondo */}
              <div className="px-6 md:px-10 py-5 bg-white border-t border-neutral-100 shrink-0 z-10 w-full shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.03)] mt-auto">
                {isMyLoan ? (
                  <button 
                    disabled
                    className="w-full bg-neutral-100 text-neutral-500 py-4 rounded-xl font-bold text-base cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Ya tienes este libro
                  </button>
                ) : selectedBook.status === 'Disponible' ? (
                  <button 
                    onClick={handleBorrow}
                    className="w-full bg-[#2B74FF] hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-[#2B74FF]/30 flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    Solicitar Préstamo
                  </button>
                ) : (
                  <button 
                    disabled
                    className="w-full bg-neutral-100 text-neutral-400 py-4 rounded-xl font-bold text-base cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Libro no disponible
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}