import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { KeyRound, ArrowRight, CheckCircle2, X } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password States
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedUsername = localStorage.getItem('library_remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    const success = await login(username, password);
    if (success) {
      if (rememberMe) {
        localStorage.setItem('library_remembered_username', username);
      } else {
        localStorage.removeItem('library_remembered_username');
      }
      navigate('/');
    } else {
      setError('Matrícula o contraseña incorrecta.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotStatus('loading');
    setTimeout(() => {
      setForgotStatus('sent');
    }, 1500);
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-['Montserrat',_sans-serif]">
      {/* Panel Izquierdo - Imagen y Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#F8FAFC] flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback 
            src="/fondoBilbioteca.jpeg"
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
            <ImageWithFallback src="/logoDucky.jpeg" alt="Ducky Logo" className="h-16 w-auto object-contain" />
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
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#2B74FF] rounded border-neutral-300 focus:ring-[#2B74FF] accent-[#2B74FF]" 
                />
                <span className="text-sm font-medium text-neutral-600 group-hover:text-gray-900 transition-colors">Recordarme</span>
              </label>
              <button 
                type="button"
                onClick={() => { setIsForgotOpen(true); setForgotStatus('idle'); setForgotEmail(''); }}
                className="text-sm font-bold text-[#2B74FF] hover:text-blue-700 transition-colors"
              >
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

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsForgotOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4">
            
            <button 
              onClick={() => setIsForgotOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotStatus === 'sent' ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¡Enlace enviado!</h3>
                <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
                  Si el correo existe en nuestra base de datos, recibirás un enlace seguro para restablecer tu contraseña en los próximos minutos.
                </p>
                <button 
                  onClick={() => setIsForgotOpen(false)}
                  className="w-full bg-neutral-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-sm transition-colors"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <KeyRound className="w-8 h-8 text-[#2B74FF]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Recuperar Acceso</h3>
                <p className="text-sm text-neutral-500 mb-8 px-2 leading-relaxed">
                  Ingresa tu correo electrónico institucional para enviarte un enlace de recuperación.
                </p>

                <form onSubmit={handleForgotSubmit} className="w-full space-y-4">
                  <input 
                    type="email" 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tucorreo@universidad.edu"
                    required
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all text-center"
                  />
                  
                  <button 
                    type="submit"
                    disabled={forgotStatus === 'loading' || !forgotEmail}
                    className="w-full bg-[#2B74FF] hover:bg-blue-600 disabled:opacity-70 disabled:hover:bg-[#2B74FF] text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-[#2B74FF]/20"
                  >
                    {forgotStatus === 'loading' ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Enviar Enlace
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}