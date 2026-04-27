import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Info, Clock, CheckCircle2, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLoans } from '../context/LoanContext';
import { useBooks } from '../context/BookContext';
import { useNotifications, AppNotification } from '../context/NotificationContext';

const TYPE_CONFIG = {
  success: { Icon: CheckCircle2, color: 'text-green-500',  bg: 'bg-green-50'         },
  info:    { Icon: Info,         color: 'text-[#2B74FF]',  bg: 'bg-[#B5DBF7]/30'     },
  warning: { Icon: Clock,        color: 'text-orange-500', bg: 'bg-orange-50'         },
  alert:   { Icon: AlertTriangle,color: 'text-red-500',    bg: 'bg-red-50'            },
} as const;

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}m`;
  if (diffH < 24) return `Hace ${diffH}h`;
  return `Hace ${diffD}d`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { loans } = useLoans();
  const { books } = useBooks();
  const { notifications: dbNotifications, unreadCount, markAllRead } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isAdmin = user.role === 'Administrador' || user.role === 'Bibliotecario';

  // ── Dynamic role-based notifications (computed, not persisted) ──────────
  const dynamicNotifs: Array<{
    id: string; title: string; message: string;
    type: keyof typeof TYPE_CONFIG; time: string;
  }> = [];

  if (isAdmin) {
    const overdueLoans = loans.filter(l => l.status === 'Activo' && new Date(l.dueDate) < today);
    if (overdueLoans.length > 0) {
      dynamicNotifs.push({
        id: 'admin-overdue',
        title: 'Préstamos Vencidos',
        message: `Hay ${overdueLoans.length} préstamo(s) vencido(s) que requieren seguimiento.`,
        type: 'alert', time: 'Ahora'
      });
    }
    const uncollectedFines = loans.filter(l => l.status === 'Devuelto' && !l.finePaid);
    if (uncollectedFines.length > 0) {
      dynamicNotifs.push({
        id: 'admin-fines',
        title: 'Multas Pendientes',
        message: `Hay devoluciones con multas pendientes de cobro.`,
        type: 'warning', time: 'Pendiente'
      });
    }
  } else {
    // Student/Professor: show their own active loans
    const myActiveLoans = loans.filter(l => l.userId === user.id && l.status === 'Activo');
    myActiveLoans.forEach(loan => {
      const book = books.find(b => b.id === loan.bookId);
      const bookTitle = book?.title || 'Libro desconocido';

      let dueDate = new Date();
      if (loan.dueDate) {
        const parts = loan.dueDate.split('T')[0].split('-');
        dueDate = parts.length === 3
          ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
          : new Date(loan.dueDate);
      }
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

      let dateStr = '';
      try { dateStr = dueDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }); }
      catch { dateStr = `${dueDate.getDate()}/${dueDate.getMonth() + 1}`; }

      if (diffDays < 0) {
        dynamicNotifs.push({
          id: `overdue-${loan.id}`,
          title: '¡Libro Vencido!',
          message: `Debías devolver "${bookTitle}" el ${dateStr}. Por favor devuélvelo pronto.`,
          type: 'alert', time: 'Urgente'
        });
      } else if (diffDays <= 2) {
        dynamicNotifs.push({
          id: `warning-${loan.id}`,
          title: 'Devolución Próxima',
          message: `Tu préstamo de "${bookTitle}" vence en ${diffDays} día(s).`,
          type: 'warning', time: 'Pronto'
        });
      } else {
        dynamicNotifs.push({
          id: `active-${loan.id}`,
          title: 'Préstamo Activo',
          message: `Tienes "${bookTitle}" en préstamo hasta el ${dateStr}.`,
          type: 'info', time: 'Activo'
        });
      }
    });
  }

  // ── Filter persisted DB notifications for this user ─────────────────────
  const relevantDbNotifs = dbNotifications.filter(n =>
    n.targetUserId === null || n.targetUserId === user.id
  );

  // ── Build unified display list ───────────────────────────────────────────
  // DB notifications come first (newest first), then dynamic ones
  const allNotifications = [
    ...relevantDbNotifs.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: (n.type as keyof typeof TYPE_CONFIG) || 'info',
      time: formatTime(n.createdAt),
      isDb: true,
    })),
    ...dynamicNotifs.map(n => ({ ...n, isDb: false })),
  ];

  const hasAlerts = allNotifications.some(n => n.type === 'alert' || n.type === 'warning');
  // Badge count: unread DB notifications + dynamic alerts/warnings
  const badgeCount = unreadCount + dynamicNotifs.filter(n => n.type === 'alert' || n.type === 'warning').length;

  const handleOpen = () => {
    setIsOpen(prev => {
      if (!prev) {
        // Mark all DB notifications read when panel opens
        markAllRead();
      }
      return !prev;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        aria-label="Notificaciones"
        onClick={handleOpen}
        className={`relative p-2 transition-colors rounded-full
          ${isOpen ? 'bg-[#B5DBF7]/30 text-[#2B74FF]' : 'text-neutral-400 hover:text-[#2B74FF] hover:bg-[#B5DBF7]/20'}`}
      >
        <Bell className="w-5 h-5" />
        {badgeCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-[3px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-[9px] font-bold text-white leading-none">{badgeCount > 9 ? '9+' : badgeCount}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Panel de notificaciones"
          className="absolute -right-[60px] sm:right-0 mt-2 w-[340px] sm:w-[360px] bg-white rounded-2xl shadow-xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="p-4 border-b border-neutral-100 bg-[#F8FAFC] flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Notificaciones</h3>
            <span className="text-xs font-semibold bg-[#2B74FF] text-white px-2 py-0.5 rounded-full">
              {allNotifications.length}
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {allNotifications.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {allNotifications.map(notif => {
                  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                  const { Icon } = config;
                  return (
                    <div
                      key={notif.id}
                      className="p-4 hover:bg-[#F8FAFC] transition-colors cursor-default flex gap-3"
                    >
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
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