import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Info, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLoans } from '../context/LoanContext';
import { useBooks } from '../context/BookContext';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { loans } = useLoans();
  const { books } = useBooks();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  // Generate dynamic notifications based on role
  const generateNotifications = () => {
    const notifs = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isAdmin = user.role === 'Administrador' || user.role === 'Bibliotecario';

    if (isAdmin) {
      // Admin Notifications
      const overdueLoans = loans.filter(l => l.status === 'Activo' && new Date(l.dueDate) < today);
      if (overdueLoans.length > 0) {
        notifs.push({
          id: 'admin-overdue',
          title: 'Préstamos Vencidos',
          message: `Hay ${overdueLoans.length} préstamos vencidos en el sistema que requieren seguimiento.`,
          type: 'alert',
          icon: AlertTriangle,
          color: 'text-red-500',
          bg: 'bg-red-50',
          time: 'Ahora'
        });
      }

      const activeLoansCount = loans.filter(l => l.status === 'Activo').length;
      if (activeLoansCount > 0) {
        notifs.push({
          id: 'admin-active',
          title: 'Resumen de Préstamos',
          message: `Actualmente hay ${activeLoansCount} préstamos en curso.`,
          type: 'info',
          icon: Info,
          color: 'text-[#2B74FF]',
          bg: 'bg-[#B5DBF7]/30',
          time: 'Hoy'
        });
      }
      
      // Check for pending fines
      const uncollectedFines = loans.filter(l => l.status === 'Devuelto' && !l.finePaid);
      if (uncollectedFines.length > 0) {
        notifs.push({
          id: 'admin-fines',
          title: 'Multas Pendientes',
          message: `Existen devoluciones con multas pendientes de cobro.`,
          type: 'warning',
          icon: Clock,
          color: 'text-orange-500',
          bg: 'bg-orange-50',
          time: 'Pendiente'
        });
      }

    } else {
      // Student/Professor Notifications
      const myActiveLoans = loans.filter(l => l.userId === user.id && l.status === 'Activo');
      
      myActiveLoans.forEach(loan => {
        const book = books.find(b => b.id === loan.bookId);
        const bookTitle = book?.title || 'Libro desconocido';
        
        let dueDate = new Date();
        if (loan.dueDate) {
          const parts = loan.dueDate.split('T')[0].split('-');
          if (parts.length === 3) {
            dueDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          } else {
            dueDate = new Date(loan.dueDate);
          }
        }
        dueDate.setHours(0, 0, 0, 0);
        
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dateStr = '';
        try {
          dateStr = dueDate.toLocaleDateString('es-ES', {day: '2-digit', month: 'short'});
        } catch(e) {
          dateStr = `${dueDate.getDate()}/${dueDate.getMonth() + 1}`;
        }

        if (diffDays < 0) {
          notifs.push({
            id: `overdue-${loan.id}`,
            title: '¡Libro Vencido!',
            message: `Debías devolver "${bookTitle}" el ${dateStr}. Por favor devuélvelo pronto.`,
            type: 'alert',
            icon: AlertTriangle,
            color: 'text-red-500',
            bg: 'bg-red-50',
            time: 'Urgente'
          });
        } else if (diffDays <= 2) {
          notifs.push({
            id: `warning-${loan.id}`,
            title: 'Devolución Próxima',
            message: `Tu préstamo de "${bookTitle}" vence en ${diffDays} día(s).`,
            type: 'warning',
            icon: Clock,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
            time: 'Pronto'
          });
        } else {
          notifs.push({
            id: `active-${loan.id}`,
            title: 'Préstamo Activo',
            message: `Tienes "${bookTitle}" en préstamo hasta el ${dateStr}.`,
            type: 'info',
            icon: CheckCircle2,
            color: 'text-green-500',
            bg: 'bg-green-50',
            time: 'Activo'
          });
        }
      });
    }

    // Default notification if empty to show it works
    if (notifs.length === 0) {
      notifs.push({
        id: 'welcome',
        title: '¡Bienvenido!',
        message: 'No tienes notificaciones nuevas por el momento.',
        type: 'info',
        icon: Info,
        color: 'text-[#2B74FF]',
        bg: 'bg-[#B5DBF7]/30',
        time: 'Ahora'
      });
    }

    return notifs;
  };

  const notifications = generateNotifications();
  const hasAlerts = notifications.some(n => n.type === 'alert' || n.type === 'warning');

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition-colors rounded-full 
          ${isOpen ? 'bg-[#B5DBF7]/30 text-[#2B74FF]' : 'text-neutral-400 hover:text-[#2B74FF] hover:bg-[#B5DBF7]/20'}`}
      >
        <Bell className="w-5 h-5"/>
        {hasAlerts && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-neutral-100 bg-[#F8FAFC] flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Notificaciones</h3>
            <span className="text-xs font-semibold bg-[#2B74FF] text-white px-2 py-0.5 rounded-full">
              {notifications.length}
            </span>
          </div>
          
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {notifications.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <div key={notif.id} className="p-4 hover:bg-[#F8FAFC] transition-colors cursor-default flex gap-3">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.bg} ${notif.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className="text-sm font-bold text-gray-900 truncate pr-2">{notif.title}</p>
                          <span className="text-[10px] font-semibold text-neutral-400 shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-xs text-neutral-500 leading-snug">{notif.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">No hay notificaciones</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}