import React, { useState } from 'react';
import { 
  Search, Bell, Plus, Pencil, Trash2, X, AlertTriangle, Image as ImageIcon, Printer, Eye
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useBooks, CATEGORIES, Book } from '../context/BookContext';
import { useLoans } from '../context/LoanContext';
import { toast } from 'sonner';

export function BookManagement() {
  const { user } = useAuth();
  const { books, addBook, updateBook, deleteBook } = useBooks();
  const { loans } = useLoans();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Form State
  const initialFormState: Omit<Book, 'id'> = {
    title: '',
    author: '',
    cover: '',
    category: CATEGORIES[0],
    status: 'Disponible',
    location: '',
    totalCopies: 1,
    availableCopies: 1,
    isbn: '',
    editorial: '',
    edition: '',
    price: 0,
    finePerDay: 10,
    synopsis: '',
    format: 'Físico',
    physicalCopies: 1,
    availabilityStatus: 'Disponible para préstamo a casa'
  };
  
  const [formData, setFormData] = useState<Omit<Book, 'id'>>(initialFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setFormData({
      title: book.title,
      author: book.author,
      cover: book.cover,
      category: book.category,
      status: book.status,
      location: book.location,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      isbn: book.isbn,
      editorial: book.editorial,
      edition: book.edition,
      price: book.price,
      finePerDay: book.finePerDay,
      synopsis: book.synopsis,
      format: book.format,
      physicalCopies: book.physicalCopies,
      availabilityStatus: book.availabilityStatus
    });
    setEditingId(book.id);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (book: Book) => {
    // Verificar si el libro tiene préstamos activos
    const activeLoans = loans.filter(loan => 
      loan.bookId === book.id && loan.status === 'Activo'
    );

    if (activeLoans.length > 0) {
      toast.error('Libro con préstamo Activo, Intente darlo de baja cuando sea devuelto');
      return;
    }

    setBookToDelete(book);
    setIsDeleteModalOpen(true);
  };

  const handleOpenDetails = (book: Book) => {
    setSelectedBook(book);
    setIsDetailsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateBook(editingId, formData);
    } else {
      addBook(formData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (bookToDelete) {
      deleteBook(bookToDelete.id);
      setIsDeleteModalOpen(false);
      setBookToDelete(null);
    }
  };

  const handlePrint = () => {
    // Imprimir el listado actual de libros (con filtro de búsqueda aplicado)
    if (filteredBooks.length === 0) {
      toast.error('No hay libros para imprimir.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Listado de Libros - Biblioteca</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Arial', sans-serif;
                padding: 40px;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #2B74FF;
                padding-bottom: 20px;
              }
              h1 {
                color: #2B74FF;
                font-size: 28px;
                margin-bottom: 10px;
              }
              .subtitle {
                color: #666;
                font-size: 14px;
              }
              .meta {
                text-align: right;
                margin-bottom: 20px;
                font-size: 12px;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th {
                background-color: #F8FAFC;
                color: #666;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                padding: 12px 8px;
                text-align: left;
                border-bottom: 2px solid #E5E7EB;
              }
              td {
                padding: 12px 8px;
                border-bottom: 1px solid #E5E7EB;
                font-size: 13px;
              }
              tr:hover {
                background-color: #F9FAFB;
              }
              .book-title {
                font-weight: 600;
                color: #111827;
              }
              .book-author {
                color: #6B7280;
                font-size: 12px;
                margin-top: 2px;
              }
              .badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
              }
              .badge-disponible {
                background-color: #D1FAE5;
                color: #065F46;
              }
              .badge-prestado {
                background-color: #E5E7EB;
                color: #374151;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #E5E7EB;
                text-align: center;
                font-size: 11px;
                color: #999;
              }
              @media print {
                body {
                  padding: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Listado de Libros</h1>
              <p class="subtitle">Sistema de Gestión de Biblioteca</p>
            </div>

            <div class="meta">
              <strong>Fecha de impresión:</strong> ${new Date().toLocaleDateString('es-MX', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}<br>
              <strong>Total de libros:</strong> ${filteredBooks.length}
              ${searchQuery ? `<br><strong>Filtro aplicado:</strong> "${searchQuery}"` : ''}
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 35%;">Libro</th>
                  <th style="width: 15%;">Categoría</th>
                  <th style="width: 12%;">Estado</th>
                  <th style="width: 10%;">Copias</th>
                  <th style="width: 18%;">Ubicación</th>
                  <th style="width: 10%;">ISBN</th>
                </tr>
              </thead>
              <tbody>
                ${filteredBooks.map(book => `
                  <tr>
                    <td>
                      <div class="book-title">${book.title}</div>
                      <div class="book-author">${book.author}</div>
                    </td>
                    <td>${book.category}</td>
                    <td>
                      <span class="badge ${book.status === 'Disponible' ? 'badge-disponible' : 'badge-prestado'}">
                        ${book.status}
                      </span>
                    </td>
                    <td>${book.availableCopies} / ${book.totalCopies}</td>
                    <td>${book.location}</td>
                    <td style="font-size: 11px;">${book.isbn || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>© ${new Date().getFullYear()} Sistema de Gestión de Biblioteca - Generado automáticamente</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <>
      {/* Topbar (Idéntico a Catalog para mantener la consistencia del layout) */}
      <header className="h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-8 shrink-0 shadow-sm z-10 relative">
        <div className="relative w-[480px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-full py-2.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all placeholder:text-neutral-400" 
            placeholder="Buscar título o autor..." 
          />
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
              src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-[32px] font-bold text-gray-900 tracking-tight">Gestión de Libros</h1>
              <p className="text-neutral-400 font-medium mt-1">Administra el inventario del catálogo de la biblioteca</p>
            </div>
            
            <button 
              onClick={handleOpenAdd}
              className="bg-[#2B74FF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#2B74FF]/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Libro
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-neutral-200 text-sm font-semibold text-neutral-500">
                    <th className="px-6 py-4">Libro</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Copias</th>
                    <th className="px-6 py-4">Ubicación</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {filteredBooks.map(book => (
                    <tr key={book.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <ImageWithFallback 
                            src={book.cover} 
                            alt={book.title} 
                            className="w-12 h-16 object-cover rounded shadow-sm border border-neutral-200 shrink-0" 
                          />
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-[#2B74FF] transition-colors line-clamp-1">{book.title}</p>
                            <p className="text-neutral-500 font-medium">{book.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#B5DBF7]/20 text-[#2B74FF]">
                          {book.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
                          ${book.status === 'Disponible' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {book.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 font-medium">
                        {book.availableCopies} / {book.totalCopies}
                      </td>
                      <td className="px-6 py-4 text-neutral-500 font-medium">
                        {book.location}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button 
                            onClick={() => handleOpenEdit(book)}
                            className="p-2 text-neutral-400 hover:text-[#2B74FF] hover:bg-[#B5DBF7]/20 rounded-lg transition-all"
                            title="Editar libro"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenDelete(book)}
                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar libro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenDetails(book)}
                            className="p-2 text-neutral-400 hover:text-[#2B74FF] hover:bg-[#B5DBF7]/20 rounded-lg transition-all"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredBooks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                        No se encontraron libros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Libro' : 'Agregar Nuevo Libro'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="book-form" onSubmit={handleSave} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Título */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Título del libro</label>
                    <input 
                      required
                      type="text" 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Autor */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Autor</label>
                    <input 
                      required
                      type="text" 
                      value={formData.author}
                      onChange={e => setFormData({...formData, author: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Categoría */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Categoría</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Estado */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Estado</label>
                    <select 
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    >
                      <option value="Disponible">Disponible</option>
                      <option value="Prestado">Prestado</option>
                      <option value="En Reparación">En Reparación</option>
                      <option value="Extraviado">Extraviado</option>
                    </select>
                  </div>

                  {/* Ubicación */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-900 block">Ubicación física</label>
                    <input 
                      required
                      type="text" 
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      placeholder="Ej. Estante A-12"
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Copias Totales */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Copias Totales</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      value={formData.totalCopies}
                      onChange={e => setFormData({...formData, totalCopies: parseInt(e.target.value) || 1})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Copias Disponibles */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Copias Disponibles</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      max={formData.totalCopies}
                      value={formData.availableCopies}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setFormData({
                          ...formData, 
                          availableCopies: val,
                          status: val === 0 ? 'Prestado' : 'Disponible'
                        });
                      }}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* URL de Portada */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-900 block">URL de la Portada</label>
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 relative">
                        <ImageIcon className="absolute left-4 top-3.5 text-neutral-400 w-5 h-5" />
                        <input 
                          required
                          type="url" 
                          value={formData.cover}
                          onChange={e => setFormData({...formData, cover: e.target.value})}
                          placeholder="https://ejemplo.com/imagen.jpg"
                          className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 pl-12 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                        />
                      </div>
                      {formData.cover && (
                        <div className="w-16 h-20 shrink-0 border border-neutral-200 rounded overflow-hidden bg-neutral-100 shadow-sm">
                          <ImageWithFallback src={formData.cover} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ISBN */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">ISBN</label>
                    <input 
                      type="text" 
                      value={formData.isbn}
                      onChange={e => setFormData({...formData, isbn: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Editorial */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Editorial</label>
                    <input 
                      type="text" 
                      value={formData.editorial}
                      onChange={e => setFormData({...formData, editorial: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Edición */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Edición</label>
                    <input 
                      type="text" 
                      value={formData.edition}
                      onChange={e => setFormData({...formData, edition: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Precio */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Precio</label>
                    <input 
                      type="number" 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Multa por Día */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Multa por Día</label>
                    <input 
                      type="number" 
                      value={formData.finePerDay}
                      onChange={e => setFormData({...formData, finePerDay: parseInt(e.target.value) || 10})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Sinopsis */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-900 block">Sinopsis</label>
                    <textarea 
                      value={formData.synopsis}
                      onChange={e => setFormData({...formData, synopsis: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Formato */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Formato</label>
                    <select 
                      value={formData.format}
                      onChange={e => setFormData({...formData, format: e.target.value as 'Físico' | 'Electrónico'})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    >
                      <option value="Físico">Físico</option>
                      <option value="Electrónico">Electrónico</option>
                    </select>
                  </div>

                  {/* Estado de Disponibilidad */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Estado de Disponibilidad</label>
                    <select 
                      value={formData.availabilityStatus}
                      onChange={e => setFormData({...formData, availabilityStatus: e.target.value as any})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    >
                      <option value="Disponible para préstamo a casa">Disponible para préstamo a casa</option>
                      <option value="Disponible para uso interno">Disponible para uso interno</option>
                      <option value="Dado de baja">Dado de baja</option>
                    </select>
                  </div>

                </div>
              </form>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                form="book-form"
                type="submit"
                className="bg-[#2B74FF] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#2B74FF]/20"
              >
                {editingId ? 'Guardar Cambios' : 'Agregar Libro'}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden flex flex-col items-center text-center">
            
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminar Libro</h3>
            <p className="text-neutral-500 text-sm mb-6">
              ¿Estás seguro que deseas eliminar "<span className="font-semibold text-gray-900">{bookToDelete?.title}</span>"? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-center gap-3 w-full">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-red-600/20"
              >
                Sí, eliminar
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                Detalles del Libro
              </h2>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Título */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Título del libro</label>
                  <input 
                    type="text" 
                    value={selectedBook.title}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Autor */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Autor</label>
                  <input 
                    type="text" 
                    value={selectedBook.author}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Categoría</label>
                  <input 
                    type="text" 
                    value={selectedBook.category}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Estado</label>
                  <input 
                    type="text" 
                    value={selectedBook.status}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Ubicación */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-900 block">Ubicación física</label>
                  <input 
                    type="text" 
                    value={selectedBook.location}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Copias Totales */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Copias Totales</label>
                  <input 
                    type="number" 
                    value={selectedBook.totalCopies}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Copias Disponibles */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Copias Disponibles</label>
                  <input 
                    type="number" 
                    value={selectedBook.availableCopies}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* URL de Portada */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-900 block">URL de la Portada</label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 relative">
                      <ImageIcon className="absolute left-4 top-3.5 text-neutral-400 w-5 h-5" />
                      <input 
                        type="url" 
                        value={selectedBook.cover}
                        className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 pl-12 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                        readOnly
                      />
                    </div>
                    {selectedBook.cover && (
                      <div className="w-16 h-20 shrink-0 border border-neutral-200 rounded overflow-hidden bg-neutral-100 shadow-sm">
                        <ImageWithFallback src={selectedBook.cover} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ISBN */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">ISBN</label>
                  <input 
                    type="text" 
                    value={selectedBook.isbn}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Editorial */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Editorial</label>
                  <input 
                    type="text" 
                    value={selectedBook.editorial}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Edición */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Edición</label>
                  <input 
                    type="text" 
                    value={selectedBook.edition}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Precio */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Precio</label>
                  <input 
                    type="number" 
                    value={selectedBook.price}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Multa por Día */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Multa por Día</label>
                  <input 
                    type="number" 
                    value={selectedBook.finePerDay}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Sinopsis */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-900 block">Sinopsis</label>
                  <textarea 
                    value={selectedBook.synopsis}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Formato */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Formato</label>
                  <input 
                    type="text" 
                    value={selectedBook.format}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

                {/* Estado de Disponibilidad */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Estado de Disponibilidad</label>
                  <input 
                    type="text" 
                    value={selectedBook.availabilityStatus}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    readOnly
                  />
                </div>

              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Print Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={handlePrint}
          className="bg-[#2B74FF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-[#2B74FF]/30 flex items-center gap-2"
          title="Imprimir listado actual de libros"
        >
          <Printer className="w-4 h-4" />
          Imprimir Listado
        </button>
      </div>
    </>
  );
}