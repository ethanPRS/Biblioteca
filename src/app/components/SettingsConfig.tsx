import React, { useState } from 'react';
import { UserProfileDropdown } from "./UserProfileDropdown";
import { 
  Settings, Save, Bell, Shield, Database, Palette, 
  Mail, Clock, SlidersHorizontal, UserCheck, X, Activity, HardDriveDownload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'sonner';
import { useAuditLogs } from '../context/AuditLogContext';

export function SettingsConfig() {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { logs, addLog } = useAuditLogs();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState('Hoy a las 03:00 AM');

  const handleBackup = async () => {
    setIsBackingUp(true);
    toast.info("Iniciando respaldo de la base de datos...");
    try {
      const res = await fetch('http://localhost:5001/api/backup', { method: 'POST' });
      if (res.ok) {
        setLastBackup('Hoy a las ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
        toast.success("Base de datos respaldada correctamente", { description: "El archivo .db se ha guardado en server/db/backups/" });
        addLog('Generó un respaldo de la Base de Datos', 'Sistema');
      } else {
        toast.error("Error al respaldar la base de datos");
      }
    } catch (error) {
      toast.error("Error de conexión al respaldar");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    updateSettings({ [e.target.name]: value });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Configuraciones guardadas exitosamente.");
      addLog(`Modificó la configuración`, 'Configuración');
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
          <UserProfileDropdown />
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
                    <div className="space-y-2 opacity-70">
                      <label className="text-sm font-semibold text-gray-900 block">Nombre de la Biblioteca</label>
                      <input 
                        type="text" 
                        name="libraryName"
                        value={settings.libraryName}
                        disabled
                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 cursor-not-allowed select-none"
                      />
                    </div>
                    
                    <div className="space-y-2 opacity-70">
                      <label className="text-sm font-semibold text-gray-900 block">Correo de Contacto (Soporte)</label>
                      <input 
                        type="email" 
                        name="contactEmail"
                        value={settings.contactEmail}
                        disabled
                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 cursor-not-allowed select-none"
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
                      <button 
                        onClick={() => setIsActivityModalOpen(true)}
                        className="text-xs font-bold text-orange-600 bg-white px-4 py-2 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors shadow-sm"
                      >
                        Ver Registro de Actividad
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-xl border-t border-neutral-100 pt-6">
                    <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-neutral-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Respaldos Automáticos</p>
                        <p className="text-xs text-neutral-500">Último respaldo: {lastBackup}</p>
                      </div>
                      <button 
                        onClick={handleBackup}
                        disabled={isBackingUp}
                        className="text-sm font-bold text-[#2B74FF] hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isBackingUp ? <div className="w-4 h-4 border-2 border-[#2B74FF] border-t-transparent rounded-full animate-spin"></div> : <HardDriveDownload className="w-4 h-4" />}
                        {isBackingUp ? 'Respaldando...' : 'Respaldar Ahora'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsActivityModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Registro de Actividad</h2>
                  <p className="text-xs font-medium text-neutral-500">Auditoría de Administradores y Bibliotecarios</p>
                </div>
              </div>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="p-2 text-neutral-400 hover:bg-neutral-200 hover:text-gray-900 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              <div className="divide-y divide-neutral-100">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400">No hay registros de actividad recientes.</div>
                ) : logs.map((log) => (
                  <div key={log.id_auditoria} className="p-6 hover:bg-[#F8FAFC]/50 transition-colors flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-[#2B74FF]"></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 mb-0.5">{log.accion}</p>
                      <p className="text-xs text-neutral-500 font-medium mb-2">Realizado por: <span className="text-gray-700">{log.nombre} ({log.username})</span></p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-neutral-400">{new Date(log.fecha).toLocaleString('es-ES')}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                          {log.tipo}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}