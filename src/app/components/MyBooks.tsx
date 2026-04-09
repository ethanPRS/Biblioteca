import React, { useState } from 'react';
import { UserProfileDropdown } from "./UserProfileDropdown";
import { 
  BookOpen, Calendar, Clock, AlertTriangle, CheckCircle2, 
  Search, BookMarked, Timer
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useBooks, Book } from '../context/BookContext';
import { useLoans, Loan } from '../context/LoanContext';
import { useSettings } from '../context/SettingsContext';

export function MyBooks() {
  const { user } = useAuth();
  const { books } = useBooks();
  const { loans } = useLoans();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');

  // Get only this user's active loans
  const myActiveLoans = loans.filter(
    l => l.userId === user?.id && l.status === 'Activo'
  );

  // Filter by search
  const filteredLoans = myActiveLoans.filter(loan => {
    const book = books.find(b => b.id === loan.bookId);
    if (!book) return false;
    const q = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q)
    );
  });

  // Calculate loan status
  const getLoanStatus = (loan: Loan) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(loan.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysOverdue > 0) {
      return {
        label: `Vencido hace ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'}`,
        type: 'overdue' as const,
        color: 'bg-red-100 text-red-700',
        borderColor: 'border-red-200',
        iconColor: 'text-red-500',
        fine: daysOverdue * settings.dailyFineAmount,
        daysRemaining: -daysOverdue,
      };
    } else if (daysOverdue === 0) {
      return {
        label: 'Vence hoy',
        type: 'due-today' as const,
        color: 'bg-orange-100 text-orange-700',
        borderColor: 'border-orange-200',
        iconColor: 'text-orange-500',
        fine: 0,
        daysRemaining: 0,
      };
    } else {
      const daysRemaining = Math.abs(daysOverdue);
      return {
        label: `${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'} restantes`,
        type: 'active' as const,
        color: 'bg-emerald-100 text-emerald-700',
        borderColor: 'border-emerald-200',
        iconColor: 'text-emerald-500',
        fine: 0,
        daysRemaining,
      };
    }
  };

  // Stats
  const totalActive = myActiveLoans.length;
  const overdueCount = myActiveLoans.filter(l => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(l.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;
  const onTimeCount = totalActive - overdueCount;

  // Calculate progress bar for book limit
  const maxBooks = user?.role === 'Profesor' ? settings.maxBooksProf : settings.maxBooksStudent;
  const usagePercent = maxBooks > 0 ? Math.min((totalActive / maxBooks) * 100, 100) : 0;

  return (
    <>
      {/* Topbar */}
      <header className="h-16 md:h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-4 pl-[68px] lg:px-8 shrink-0 shadow-sm z-10 relative gap-4">
        <div className="relative flex-1 max-w-[480px]">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 md:w-5 md:h-5" />
          <input 
            type="text"
            id="my-books-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-full py-2 pl-9 pr-3 md:py-2.5 md:pl-12 md:pr-4 text-xs md:text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all placeholder:text-neutral-400" 
            placeholder="Buscar en mis libros..." 
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

          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-[32px] font-bold text-gray-900 tracking-tight">Mis Libros</h1>
            <p className="text-sm md:text-base text-neutral-400 font-medium mt-1">Libros que tienes actualmente en préstamo</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">

            {/* Active Books */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm font-semibold mb-1">Libros en Préstamo</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-gray-900">{totalActive}</p>
                    <p className="text-sm font-medium text-neutral-400 mb-1">/ {maxBooks} máx.</p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-[#B5DBF7]/30 rounded-xl flex items-center justify-center">
                  <BookMarked className="w-6 h-6 text-[#2B74FF]" />
                </div>
              </div>
              {/* Usage Bar */}
              <div className="mt-4">
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 75 ? 'bg-orange-400' : 'bg-[#2B74FF]'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* On Time */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm font-semibold mb-1">Al Corriente</p>
                  <p className="text-3xl font-bold text-emerald-600">{onTimeCount}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Overdue */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm font-semibold mb-1">Vencidos</p>
                  <p className={`text-3xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{overdueCount}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overdueCount > 0 ? 'bg-red-100' : 'bg-neutral-100'}`}>
                  <AlertTriangle className={`w-6 h-6 ${overdueCount > 0 ? 'text-red-600' : 'text-neutral-400'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Book Cards */}
          {filteredLoans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-12">
              {filteredLoans.map(loan => {
                const book = books.find(b => b.id === loan.bookId);
                if (!book) return null;
                const status = getLoanStatus(loan);

                return (
                  <article
                    key={loan.id}
                    id={`my-book-${loan.id}`}
                    className={`bg-white rounded-2xl border ${status.borderColor} shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group`}
                  >
                    <div className="flex p-5 gap-5">
                      {/* Book Cover */}
                      <div className="w-20 h-28 md:w-24 md:h-[136px] shrink-0 rounded-xl overflow-hidden shadow-md shadow-black/10 border border-neutral-100">
                        <ImageWithFallback
                          src={book.cover}
                          alt={book.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-base md:text-lg text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-[#2B74FF] transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-sm text-neutral-500 font-medium mb-3">{book.author}</p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>
                            {status.type === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                            {status.type === 'due-today' && <Clock className="w-3 h-3" />}
                            {status.type === 'active' && <CheckCircle2 className="w-3 h-3" />}
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer with dates */}
                    <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-neutral-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-neutral-500">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="font-medium">
                          Prestado: <span className="font-bold text-neutral-700">{new Date(loan.borrowDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-500">
                        <Timer className={`w-3.5 h-3.5 ${status.iconColor}`} />
                        <span className="font-medium">
                          Vence: <span className={`font-bold ${status.type === 'overdue' ? 'text-red-600' : status.type === 'due-today' ? 'text-orange-600' : 'text-neutral-700'}`}>
                            {new Date(loan.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Fine warning if overdue */}
                    {status.fine > 0 && (
                      <div className="px-5 py-2.5 bg-red-50 border-t border-red-100 flex items-center gap-2 text-xs font-semibold text-red-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Multa acumulada: ${status.fine} MXN
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-neutral-100 border-dashed">
              <BookOpen className="w-16 h-16 text-neutral-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {myActiveLoans.length === 0 
                  ? 'No tienes libros en préstamo' 
                  : 'No se encontraron resultados'}
              </h3>
              <p className="text-neutral-400 text-sm">
                {myActiveLoans.length === 0
                  ? 'Visita el catálogo para solicitar un préstamo.'
                  : 'Intenta ajustar tu búsqueda.'}
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
