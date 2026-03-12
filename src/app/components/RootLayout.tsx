import { Outlet, Link, useLocation, Navigate } from 'react-router';
import { 
  Search, Bell, LayoutDashboard, BookOpen, BookText, 
  Users, Settings, HelpCircle, LogOut, ArrowRightLeft,
  RotateCcw, AlertCircle, Send
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth, Screen } from '../context/AuthContext';
import duckyLogo from '/placeholder-logo.png';
import { Toaster } from './ui/sonner';

const NAV_ITEMS: Array<{ icon: any; label: string; path: string; screenId: Screen }> = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/inicio', screenId: 'inicio' },
  { icon: BookOpen, label: 'Catálogo', path: '/', screenId: 'catalogo' },
  { icon: ArrowRightLeft, label: 'Préstamos', path: '/prestamos', screenId: 'prestamos' },
  { icon: Send, label: 'Solicitudes', path: '/solicitudes', screenId: 'solicitudes' },
  { icon: AlertCircle, label: 'Multas', path: '/multas', screenId: 'multas' },
  { icon: BookText, label: 'Gestión de Libros', path: '/gestion-libros', screenId: 'gestion-libros' },
  { icon: Users, label: 'Gestión de Usuarios', path: '/gestion-usuarios', screenId: 'gestion-usuarios' },
  { icon: Settings, label: 'Configuración', path: '/config', screenId: 'config' },
];

export function RootLayout() {
  const location = useLocation();
  const { user, logout, getUserPermissions } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userPermissions = getUserPermissions(user.role);
  const filteredNav = NAV_ITEMS.filter(item => userPermissions.includes(item.screenId));

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-['Montserrat',_sans-serif] text-neutral-800 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-100 flex flex-col h-full shrink-0 shadow-sm z-10">
        <div className="h-24 flex items-center justify-center border-b border-neutral-100 px-6 shrink-0">
          <ImageWithFallback 
            src={duckyLogo} 
            alt="Ducky University Bookstore" 
            className="w-full h-full object-contain p-2"
          />
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                  ${isActive 
                    ? 'bg-[#2B74FF] text-white shadow-md shadow-[#2B74FF]/20' 
                    : 'text-neutral-500 hover:bg-[#B5DBF7]/20 hover:text-[#2B74FF]'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 hover:bg-[#B5DBF7]/20 hover:text-[#2B74FF] transition-all font-medium text-sm">
            <HelpCircle className="w-5 h-5 text-neutral-400" />
            Ayuda
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium text-sm">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <Outlet />
      </main>

      {/* Toast Notifications */}
      <Toaster richColors position="top-right" />

    </div>
  );
}