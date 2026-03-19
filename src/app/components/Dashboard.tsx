import React from 'react';
import { Navigate } from 'react-router';
import { UserProfileDropdown } from "./UserProfileDropdown";
import { 
  Bell, BookOpen, Users, AlertTriangle, ArrowRightLeft, 
  TrendingUp, Clock, DollarSign
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { useLoans } from '../context/LoanContext';
import { useSettings } from '../context/SettingsContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { NotificationBell } from './NotificationBell';

export function Dashboard() {
  const { user: currentUser, users, getUserPermissions } = useAuth();
  const { settings } = useSettings();
  const { books } = useBooks();
  const { loans } = useLoans();

  if (currentUser && !getUserPermissions(currentUser.role).includes('inicio')) {
    return <Navigate to="/" replace />;
  }

  // Calcular estadísticas
  const totalBooks = books.reduce((acc, book) => acc + (book.totalCopies || 1), 0);
  const availableBooks = books.reduce((acc, book) => acc + (book.availableCopies || 0), 0);
  const borrowedBooks = totalBooks - availableBooks;
  
  const activeLoans = loans.filter(l => l.status === 'Activo');
  const returnedLoans = loans.filter(l => l.status === 'Devuelto');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueLoans = activeLoans.filter(loan => {
    const dueDate = new Date(loan.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const totalUsers = users.filter(u => u.role === 'Alumno' || u.role === 'Profesor').length;

  let totalFinesCollected = 0;
  loans.filter(l => l.finePaid).forEach(loan => {
    const dueDate = new Date(loan.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - dueDate.getTime();
    if (diffTime > 0) {
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalFinesCollected += daysOverdue * settings.dailyFineAmount;
    }
  });

  // Datos mock para las gráficas, agregando ID único
  const activityData = [
    { id: '1', name: 'Lun', prestamos: 4, devoluciones: 2 },
    { id: '2', name: 'Mar', prestamos: 7, devoluciones: 5 },
    { id: '3', name: 'Mie', prestamos: 5, devoluciones: 3 },
    { id: '4', name: 'Jue', prestamos: 9, devoluciones: 6 },
    { id: '5', name: 'Vie', prestamos: 6, devoluciones: 8 },
    { id: '6', name: 'Sab', prestamos: 2, devoluciones: 1 },
    { id: '7', name: 'Dom', prestamos: 1, devoluciones: 0 },
  ];

  return (
    <>
      {/* Topbar */}
      <header className="h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-8 shrink-0 shadow-sm z-10 relative">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard General</h2>
        </div>

        <div className="flex items-center gap-6">
          <NotificationBell />
          <div className="w-px h-8 bg-neutral-200"></div>
          <UserProfileDropdown />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="mb-8">
            <h1 className="text-[32px] font-bold text-gray-900 tracking-tight">Bienvenido, {currentUser?.name.split(' ')[0]}</h1>
            <p className="text-neutral-400 font-medium mt-1">Aquí tienes un resumen de la actividad de la biblioteca hoy.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
              <div>
                <p className="text-sm font-semibold text-neutral-400 mb-1">Total del Inventario</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-bold text-gray-900">{totalBooks}</h3>
                  <p className="text-sm font-medium text-green-500 mb-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Listos
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-[#B5DBF7]/30 rounded-xl flex items-center justify-center text-[#2B74FF]">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
              <div>
                <p className="text-sm font-semibold text-neutral-400 mb-1">Préstamos Activos</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-bold text-[#2B74FF]">{activeLoans.length}</h3>
                  <p className="text-sm font-medium text-neutral-400 mb-1">
                    /{totalBooks} libros
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-[#2B74FF]/10 rounded-xl flex items-center justify-center text-[#2B74FF]">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-semibold text-neutral-400 mb-1">Préstamos Vencidos</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-bold text-red-600">{overdueLoans.length}</h3>
                  <p className="text-sm font-medium text-red-400 mb-1">requieren acción</p>
                </div>
              </div>
              <div className="relative z-10 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-50 rounded-full blur-2xl z-0"></div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
              <div>
                <p className="text-sm font-semibold text-neutral-400 mb-1">Multas Recaudadas</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-bold text-green-600">${totalFinesCollected}</h3>
                  <p className="text-sm font-medium text-green-500 mb-1 flex items-center">
                    MXN
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Actividad Semanal</h3>
                  <p className="text-sm font-medium text-neutral-400">Flujo de préstamos y devoluciones</p>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart id="dashboard-barchart" accessibilityLayer={false} data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis key="xaxis" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                    <YAxis key="yaxis" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <RechartsTooltip key="tooltip" 
                      cursor={{fill: '#F8FAFC'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar key="bar-prestamos" dataKey="prestamos" name="Préstamos" fill="#2B74FF" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false} />
                    <Bar key="bar-devoluciones" dataKey="devoluciones" name="Devoluciones" fill="#B5DBF7" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side list (Alumnos o Préstamos Recientes) */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Libros más Solicitados</h3>
                <div className="p-1.5 bg-[#F8FAFC] rounded-lg text-neutral-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {/* Simulamos libros populares con un slice */}
                {books.slice(0, 5).map((book, idx) => (
                  <div key={book.id} className="flex items-center gap-4 group cursor-pointer">
                    <p className="text-sm font-bold text-neutral-300 w-4 text-center">{idx + 1}</p>
                    <ImageWithFallback 
                      src={book.cover} 
                      alt={book.title} 
                      className="w-10 h-14 object-cover rounded shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#2B74FF] transition-colors">
                        {book.title}
                      </p>
                      <p className="text-xs font-medium text-neutral-400 truncate">
                        {book.author}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {users.filter(u => u.role === 'Alumno' || u.role === 'Profesor').slice(0, 4).map(u => (
                    <ImageWithFallback 
                      key={u.id}
                      src={u.avatar} 
                      alt={u.name} 
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#F8FAFC] flex items-center justify-center text-xs font-bold text-neutral-500">
                    +{totalUsers - 4}
                  </div>
                </div>
                <p className="text-xs font-semibold text-neutral-500">Usuarios Activos</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}