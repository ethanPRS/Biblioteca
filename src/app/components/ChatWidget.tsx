import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLoans } from '../context/LoanContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { loans } = useLoans();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  if (!user) return null; // Only show for logged-in users

  const toggleChat = () => {
    if (!isOpen && messages.length === 0) {
      // Add initial greeting when opened for the first time
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: `¡Hola ${user.name.split(' ')[0]}! Soy Ducky, tu asistente virtual universitario. ¿En qué te puedo ayudar hoy?`,
          timestamp: new Date()
        }
      ]);
    }
    setIsOpen(!isOpen);
  };

  const calculateUserContext = () => {
    const activeLoans = loans.filter(l => l.userId === user.id && l.status === 'Activo').length;
    // Simple mock logic for pending fines context based on loan status
    let pendingFines = 0;
    loans.filter(l => l.userId === user.id && !l.finePaid).forEach(loan => {
      const dueDate = new Date(loan.dueDate);
      const today = new Date();
      dueDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDate.getTime();
      if (diffTime > 0) {
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        pendingFines += daysOverdue * 10; // Assuming $10 for context, though they can ask for specifics
      }
    });

    return {
      name: user.name,
      role: user.role,
      activeLoans,
      pendingFines: \`$\${pendingFines.toFixed(2)} MXN\`
    };
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const context = calculateUserContext();

      // Make API call
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history,
          context
        })
      });

      if (!response.ok) {
        throw new Error('Error de conexión');
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "Lo siento, tuve un problema procesando tu petición.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Lo siento, no pude conectarme con el asistente inteligente. Por favor, intenta de nuevo más tarde.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-neutral-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom-right">
          
          {/* Header */}
          <div className="bg-[#2B74FF] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Ducky Bot</h3>
                <p className="text-[10px] text-blue-100 font-medium">Asistente Virtual</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC] flex flex-col gap-3">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-6 h-6 rounded-full flex flex-shrink-0 items-center justify-center mt-1 
                    ${msg.role === 'assistant' ? 'bg-[#2B74FF] text-white' : 'bg-neutral-200 text-neutral-600'}`}
                  >
                    {msg.role === 'assistant' ? <Bot className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                  </div>

                  {/* Bubble */}
                  <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? 'bg-[#2B74FF] text-white rounded-tr-sm' 
                      : 'bg-white border border-neutral-200 text-gray-800 rounded-tl-sm shadow-sm'}`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="flex gap-2 max-w-[80%] flex-row">
                  <div className="w-6 h-6 rounded-full flex flex-shrink-0 items-center justify-center mt-1 bg-[#2B74FF] text-white">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="px-4 py-3 bg-white border border-neutral-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-neutral-100 shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-[#F8FAFC] border border-neutral-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#2B74FF] focus:ring-1 focus:ring-[#2B74FF]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-[#2B74FF] text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-[#2B74FF] transition-colors shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={toggleChat}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 transition-transform active:scale-95 z-50
          ${isOpen ? 'bg-neutral-800 hover:bg-black text-white' : 'bg-[#2B74FF] hover:bg-blue-600 text-white'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

    </div>
  );
}
