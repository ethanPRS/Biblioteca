import React, { useState } from 'react';
import { 
  Settings, Save, Bell, Shield, Database, Palette, 
  Mail, Clock, SlidersHorizontal, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';

export function SettingsConfig() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    libraryName: 'Ducky University Bookstore',
    contactEmail: 'biblioteca@ducky.edu',
    maxLoanDaysStudent: 14,
    maxLoanDaysProf: 30,
    maxBooksStudent: 3,
    maxBooksProf: 10,
    dailyFineAmount: 10,
    fineCurrency: 'MXN',
    enableNotifications: true,
    autoReminders: true,
    maintenanceMode: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setSettings(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // Here you would normally save to context/backend
      alert("Configuraciones guardadas exitosamente.");
    }, 800);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'prestamos', label: 'Préstamos y Multas', icon: Clock },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
  ];

  return (
    <>
      <header className="h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-8 shrink-0 shadow-sm z-10 relative">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Configuración del Sistema</h2>
        </div>

        <div className="flex items-center gap-6">
          <NotificationBell />
          <div className="w-px h-8 bg-neutral-200"></div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-sm text-gray-900 group-hover:text-[#2B74FF] transition-colors">{user?.name}</p>
              <p className="text-neutral-400 text-xs font-medium">{user?.role}</p>
            </div>
            <ImageWithFallback 
              src={user?.avatar || ""} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
        <div className="max-w-[1000px] mx-auto">
          
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-[32px] font-bold text-gray-900 tracking-tight">Configuración</h1>
              <p className="text-neutral-400 font-medium mt-1">Ajusta los parámetros operativos de la biblioteca</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#2B74FF] hover:bg-blue-600 disabled:opacity-70 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-[#2B74FF]/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 shrink-0 space-y-1">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                      ${isActive 
                        ? 'bg-white text-[#2B74FF] shadow-sm border border-neutral-100' 
                        : 'text-neutral-500 hover:bg-white hover:text-gray-900 border border-transparent'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#2B74FF]' : 'text-neutral-400'}`} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden min-h-[500px]">
              
              {activeTab === 'general' && (
                <div className="p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#2B74FF]"/>
                    Información General
                  </h3>
                  
                  <div className="space-y-6 max-w-xl">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900 block">Nombre de la Biblioteca</label>
                      <input 
                        type="text" 
                        name="libraryName"
                        value={settings.libraryName}
                        onChange={handleChange}
                        className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900 block">Correo de Contacto (Soporte)</label>
                      <input 
                        type="email" 
                        name="contactEmail"
                        value={settings.contactEmail}
                        onChange={handleChange}
                        className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20"
                      />
                    </div>

                    <div className="pt-4 border-t border-neutral-100">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative inline-block w-12 mr-2 align-middle select-none">
                          <input type="checkbox" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-neutral-300 transition-transform duration-200 ease-in-out"/>
                          <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${settings.maintenanceMode ? 'bg-red-500' : 'bg-neutral-200'}`}></label>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Modo Mantenimiento</p>
                          <p className="text-xs text-neutral-500">Desactiva el acceso a usuarios no administradores.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'prestamos' && (
                <div className="p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-[#2B74FF]"/>
                    Reglas de Préstamo y Multas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
                    <div className="space-y-6">
                      <h4 className="font-semibold text-sm text-neutral-400 uppercase tracking-wider">Límites para Alumnos</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900 block">Días Máximos de Préstamo</label>
                        <input type="number" name="maxLoanDaysStudent" value={settings.maxLoanDaysStudent} onChange={handleChange} className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900 block">Libros Máximos Simultáneos</label>
                        <input type="number" name="maxBooksStudent" value={settings.maxBooksStudent} onChange={handleChange} className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-semibold text-sm text-neutral-400 uppercase tracking-wider">Límites para Profesores</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900 block">Días Máximos de Préstamo</label>
                        <input type="number" name="maxLoanDaysProf" value={settings.maxLoanDaysProf} onChange={handleChange} className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900 block">Libros Máximos Simultáneos</label>
                        <input type="number" name="maxBooksProf" value={settings.maxBooksProf} onChange={handleChange} className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-neutral-100 max-w-2xl">
                    <h4 className="font-semibold text-sm text-neutral-400 uppercase tracking-wider mb-6">Configuración de Multas</h4>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-sm font-semibold text-gray-900 block">Monto por día de retraso</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">$</span>
                          <input type="number" name="dailyFineAmount" value={settings.dailyFineAmount} onChange={handleChange} className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl pl-8 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20" />
                        </div>
                      </div>
                      <div className="w-1/3 space-y-2">
                        <label className="text-sm font-semibold text-gray-900 block">Moneda</label>
                        <select name="fineCurrency" value={settings.fineCurrency} onChange={handleChange} className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20">
                          <option value="MXN">MXN</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notificaciones' && (
                <div className="p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#2B74FF]"/>
                    Comunicaciones Automáticas
                  </h3>

                  <div className="space-y-6 max-w-xl">
                    <label className="flex items-start gap-4 p-4 border border-neutral-100 rounded-xl bg-[#F8FAFC] cursor-pointer group hover:border-[#B5DBF7] transition-colors">
                      <div className="pt-1">
                        <input type="checkbox" name="enableNotifications" checked={settings.enableNotifications} onChange={handleChange} className="w-5 h-5 text-[#2B74FF] rounded border-neutral-300 focus:ring-[#2B74FF] accent-[#2B74FF]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-1">Activar Notificaciones Globales</p>
                        <p className="text-xs text-neutral-500 leading-relaxed">Habilita o deshabilita el envío de correos electrónicos desde el sistema hacia los usuarios.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 border border-neutral-100 rounded-xl bg-white cursor-pointer group hover:border-[#B5DBF7] transition-colors">
                      <div className="pt-1">
                        <input type="checkbox" name="autoReminders" checked={settings.autoReminders} onChange={handleChange} className="w-5 h-5 text-[#2B74FF] rounded border-neutral-300 focus:ring-[#2B74FF] accent-[#2B74FF]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-1">Recordatorios de Devolución Automáticos</p>
                        <p className="text-xs text-neutral-500 leading-relaxed">Envía un aviso 2 días antes de la fecha de vencimiento y correos diarios cuando el préstamo esté vencido.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'seguridad' && (
                <div className="p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#2B74FF]"/>
                    Seguridad y Accesos
                  </h3>

                  <div className="p-6 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-4 mb-8">
                    <Shield className="w-6 h-6 text-orange-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Auditoría de Administradores</h4>
                      <p className="text-xs text-neutral-600 mb-4">Revisa qué cuentas tienen privilegios para modificar estas configuraciones.</p>
                      <button className="text-xs font-bold text-orange-600 bg-white px-4 py-2 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                        Ver Registro de Actividad
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-xl border-t border-neutral-100 pt-6">
                    <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-neutral-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Respaldos Automáticos</p>
                        <p className="text-xs text-neutral-500">Último respaldo: Hoy a las 03:00 AM</p>
                      </div>
                      <button className="text-sm font-bold text-[#2B74FF] hover:text-blue-700">Respaldar Ahora</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}