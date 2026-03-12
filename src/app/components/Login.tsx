import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import duckyLogo from '/placeholder-logo.png';
import libraryImage from '/placeholder-library.png';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    const success = login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Matrícula o contraseña incorrecta.');
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-['Montserrat',_sans-serif]">
      {/* Panel Izquierdo - Imagen y Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#F8FAFC] flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback 
            src={libraryImage}
            alt="Library Architecture"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-[#2B74FF]/20 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A4599]/90 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-white mt-auto w-full max-w-lg">
          <h2 className="text-4xl font-bold mb-4 tracking-tight leading-tight">Bienvenido al futuro de nuestra biblioteca</h2>
          <p className="text-lg text-white/90 font-medium leading-relaxed">
            Descubre, reserva y administra el conocimiento en tiempo real con la nueva plataforma digital de Ducky University.
          </p>
        </div>
      </div>

      {/* Panel Derecho - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-md">
          
          <div className="mb-12 flex justify-center">
            <ImageWithFallback src={duckyLogo} alt="Ducky Logo" className="h-16 w-auto object-contain" />
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Iniciar Sesión</h1>
            <p className="text-neutral-500 font-medium text-sm">Ingresa con tu matrícula o nómina institucional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold border border-red-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 block">Matrícula o Nómina</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. A001, B001"
                className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all placeholder:text-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 block">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all placeholder:text-neutral-400"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 text-[#2B74FF] rounded border-neutral-300 focus:ring-[#2B74FF] accent-[#2B74FF]" />
                <span className="text-sm font-medium text-neutral-600 group-hover:text-gray-900 transition-colors">Recordarme</span>
              </label>
              <button type="button" className="text-sm font-semibold text-[#2B74FF] hover:text-blue-700 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#2B74FF] hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-[#2B74FF]/20 mt-2"
            >
              Ingresar al sistema
            </button>
          </form>

          {/* Credenciales de Prueba (Para demostración) */}
          <div className="mt-12 pt-8 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 font-semibold mb-4 uppercase tracking-wider">Credenciales de prueba</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-neutral-600">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 transition-colors hover:border-neutral-200 cursor-default">
                <span className="font-bold text-gray-900 block mb-1">Administrador</span>
                User: <span className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">A001</span><br/>
                Pass: <span className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">1234</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 transition-colors hover:border-neutral-200 cursor-default">
                <span className="font-bold text-gray-900 block mb-1">Bibliotecario</span>
                User: <span className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">B001</span><br/>
                Pass: <span className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">1234</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 transition-colors hover:border-neutral-200 cursor-default">
                <span className="font-bold text-gray-900 block mb-1">Alumno</span>
                User: <span className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">A002</span><br/>
                Pass: <span className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">1234</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 transition-colors hover:border-neutral-200 cursor-default">
                <span className="font-bold text-gray-900 block mb-1">Profesor</span>
                User: <span className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">P001</span><br/>
                Pass: <span className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">1234</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}