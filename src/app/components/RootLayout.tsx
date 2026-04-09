import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router';
import { 
  Search, Bell, LayoutDashboard, BookOpen, BookText, 
  Users, Settings, HelpCircle, LogOut, ArrowRightLeft,
  RotateCcw, AlertCircle, Send, Menu, BookMarked
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth, Screen } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Toaster } from 'sonner';
import { HelpModal } from './HelpModal';
import { ChatWidget } from './ChatWidget';

const NAV_ITEMS: Array<{ icon: any; label: string; path: string; screenId: Screen, desktopOnly?: boolean }> = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/inicio', screenId: 'inicio', desktopOnly: true },
  { icon: BookOpen, label: 'Catálogo', path: '/', screenId: 'catalogo' },
  { icon: BookMarked, label: 'Mis Libros', path: '/mis-libros', screenId: 'mis-libros' },
  { icon: ArrowRightLeft, label: 'Préstamos', path: '/prestamos', screenId: 'prestamos', desktopOnly: true },
  { icon: Send, label: 'Solicitudes', path: '/solicitudes', screenId: 'solicitudes', desktopOnly: true },
  { icon: AlertCircle, label: 'Multas', path: '/multas', screenId: 'multas', desktopOnly: true },
  { icon: BookText, label: 'Gestión de Libros', path: '/gestion-libros', screenId: 'gestion-libros', desktopOnly: true },
  { icon: Users, label: 'Gestión de Usuarios', path: '/gestion-usuarios', screenId: 'gestion-usuarios', desktopOnly: true },
  { icon: Settings, label: 'Configuración', path: '/config', screenId: 'config', desktopOnly: true },
];

export function RootLayout() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, getUserPermissions } = useAuth();
  const { settings } = useSettings();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (settings.maintenanceMode && user.role !== 'Administrador') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC] font-['Montserrat',_sans-serif]">
        <div className="text-center max-w-md p-8 bg-white rounded-3xl shadow-sm border border-neutral-100">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Modo Mantenimiento</h2>
          <p className="text-neutral-500 mb-8 leading-relaxed">Nuestra plataforma se encuentra temporalmente en mantenimiento para mejorar tu experiencia. Por favor, intenta de nuevo más tarde.</p>
          <button 
            onClick={logout}
            className="w-full bg-[#2B74FF] hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-[#2B74FF]/20"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const userPermissions = getUserPermissions(user.role);
  const filteredNav = NAV_ITEMS.filter(item => userPermissions.includes(item.screenId));

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F8FAFC] font-['Montserrat',_sans-serif] text-neutral-800 overflow-hidden relative">
      
      {/* Floating Hamburger Button for Mobile/Tablet */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-3 left-4 z-40 p-2.5 text-neutral-600 bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50 rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-64 bg-white border-r border-neutral-100 flex flex-col h-full shrink-0 shadow-xl transition-transform duration-300
        lg:static lg:translate-x-0 lg:shadow-sm
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-24 flex items-center justify-center border-b border-neutral-100 px-6 shrink-0">
          <ImageWithFallback 
            src="/logoDucky.jpeg" 
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
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                  ${item.desktopOnly ? 'hidden lg:flex' : ''}
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
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 hover:bg-[#B5DBF7]/20 hover:text-[#2B74FF] transition-all font-medium text-sm"
          >
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
        {(() => {
          const currentRoute = NAV_ITEMS.find(i => i.path === location.pathname);
          if (currentRoute?.desktopOnly) {
            return (
              <>
                <div className="flex lg:hidden flex-col items-center justify-center h-full w-full p-8 text-center bg-[#F8FAFC]">
                  <AlertCircle className="w-16 h-16 text-[#2B74FF] mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Vista en Escritorio Requerida</h2>
                  <p className="text-neutral-500 leading-relaxed max-w-sm">
                    La <span className="font-semibold text-gray-900">{currentRoute.label}</span> contiene información detallada que requiere una pantalla más amplia para una correcta visualización. Por favor, accede desde un ordenador o tableta.
                  </p>
                </div>
                <div className="hidden lg:flex flex-col flex-1 h-full w-full min-w-0">
                  <Outlet />
                </div>
              </>
            );
          }
          return <Outlet />;
        })()}
      </main>

      {/* Toast Notifications */}
      <Toaster richColors position="top-right" />

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Floating Chat Widget */}
      <ChatWidget />

    </div>
  );
}