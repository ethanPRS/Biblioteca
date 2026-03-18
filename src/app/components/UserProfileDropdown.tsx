import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { LogOut, User, Mail, Shield } from 'lucide-react';

export function UserProfileDropdown() {
  const { user: currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="text-right hidden sm:block">
          <p className="font-semibold text-sm text-gray-900 group-hover:text-[#2B74FF] transition-colors">{currentUser.name}</p>
          <p className="text-neutral-400 text-xs font-medium">{currentUser.role}</p>
        </div>
        <ImageWithFallback 
          src={currentUser.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"} 
          alt="Profile" 
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
        />
      </div>

      {isOpen && (
        <div className="absolute top-14 right-0 w-72 bg-white rounded-2xl shadow-xl border border-neutral-100 py-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-6 flex flex-col items-center border-b border-neutral-100 pb-4 mb-2">
            <ImageWithFallback 
              src={currentUser.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"} 
              alt="Profile" 
              className="w-20 h-20 rounded-full object-cover border-4 border-[#F8FAFC] shadow-sm mb-3"
            />
            <p className="font-bold text-lg text-gray-900 text-center leading-tight">{currentUser.name}</p>
            <p className="text-sm text-[#2B74FF] font-semibold mt-1">{currentUser.role}</p>
          </div>
          
          <div className="px-4 py-3 space-y-4">
            <div className="flex items-center gap-3 px-2">
              <User className="w-4 h-4 text-neutral-400" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Matrícula / Nómina</p>
                <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-2">
              <Mail className="w-4 h-4 text-neutral-400" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Correo Electrónico</p>
                <p className="text-sm font-medium text-gray-900">{currentUser.email || 'No registrado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2">
              <Shield className="w-4 h-4 text-neutral-400" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Función Principal</p>
                <p className="text-sm font-medium text-gray-900">{currentUser.funcion}</p>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-neutral-100 px-2">
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-semibold text-sm"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
