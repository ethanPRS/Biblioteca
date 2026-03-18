import React from 'react';
import { X, Mail, Phone, Book } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { settings } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Centro de Ayuda</h2>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Book className="w-8 h-8 text-[#2B74FF]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">¿Necesitas asistencia?</h3>
            <p className="text-sm text-neutral-500">
              Nuestro equipo está disponible para ayudarte con cualquier duda sobre la plataforma de la biblioteca.
            </p>
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-4 border border-neutral-100">
            <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm hover:border-[#2B74FF]/30 border border-transparent transition-all group">
              <div className="p-2 bg-blue-50 text-[#2B74FF] rounded-md group-hover:bg-[#2B74FF] group-hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Correo de Soporte</p>
                <p className="text-sm font-semibold text-gray-900">{settings.contactEmail}</p>
              </div>
            </a>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-transparent">
              <div className="p-2 bg-green-50 text-green-600 rounded-md">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Línea de Atención</p>
                <p className="text-sm font-semibold text-gray-900">+52 (55) 1234 5678</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full bg-neutral-900 hover:bg-black text-white py-3 rounded-xl font-bold text-sm transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
