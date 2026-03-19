import React, { useState } from 'react';
import { UserProfileDropdown } from "./UserProfileDropdown";
import { 
  Search, Bell, Plus, Pencil, Trash2, X, AlertTriangle, Image as ImageIcon, Printer, Eye, MapPin, CheckCircle2, AlertCircle as AlertCircleIcon
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
    pdfUrl: '',
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
      pdfUrl: book.pdfUrl,
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
          <UserProfileDropdown />
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
                    <label className="text-sm font-semibold text-gray-900 block">Cantidad de Copias Totales</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      value={formData.totalCopies}
                      onChange={e => setFormData({...formData, totalCopies: Math.max(1, parseInt(e.target.value) || 1)})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    />
                  </div>

                  {/* Copias Disponibles (Sólo lectura) */}
                  {editingId && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900 block">Copias Disponibles</label>
                      <input 
                        type="number" 
                        value={formData.availableCopies}
                        disabled
                        className="w-full bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium cursor-not-allowed"
                      />
                    </div>
                  )}

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
                      onChange={e => setFormData({...formData, format: e.target.value as 'Físico' | 'Digital' | 'Ambos'})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    >
                      <option value="Físico">Físico</option>
                      <option value="Digital">Digital</option>
                      <option value="Ambos">Ambos</option>
                    </select>
                  </div>

                  {/* URL del PDF (solo si es Digital o Ambos) */}
                  {(formData.format === 'Digital' || formData.format === 'Ambos') && (
                    <div className={`space-y-2 ${formData.format === 'Digital' ? 'md:col-span-2' : ''}`}>
                      <label className="text-sm font-semibold text-gray-900 block">URL del PDF</label>
                      <input 
                        type="url" 
                        value={formData.pdfUrl || ''}
                        onChange={e => setFormData({...formData, pdfUrl: e.target.value})}
                        placeholder="https://ejemplo.com/libro.pdf"
                        className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                      />
                    </div>
                  )}

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

      {/* Details Modal - Vista Visual igual que Catálogo */}
      {isDetailsModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            <button 
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white text-neutral-800 rounded-full backdrop-blur-md transition-all shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Cover */}
            <div className="w-full md:w-2/5 bg-neutral-100 shrink-0 relative aspect-[3/4] md:aspect-auto">
              <ImageWithFallback 
                src={selectedBook.cover} 
                alt={selectedBook.title}
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col overflow-y-auto bg-white">
              
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#B5DBF7]/30 text-[#2B74FF]">
                    {selectedBook.category}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                    ${selectedBook.status === 'Disponible' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {selectedBook.status === 'Disponible' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <AlertCircleIcon className="w-3.5 h-3.5"/>}
                    {selectedBook.status === 'Disponible' ? `${selectedBook.availableCopies} ${selectedBook.availableCopies === 1 ? 'disponible' : 'disponibles'} de ${selectedBook.totalCopies}` : 'Prestado'}
                  </span>
                  {/* Mostrar badges separados si es formato "Ambos" */}
                  {selectedBook.format === 'Ambos' ? (
                    <>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        Físico
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                        Digital
                      </span>
                    </>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      selectedBook.format === 'Físico' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {selectedBook.format}
                    </span>
                  )}
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-2 tracking-tight">
                  {selectedBook.title}
                </h2>
                <p className="text-lg text-neutral-500 font-medium">por {selectedBook.author}</p>
              </div>

              {/* Synopsis */}
              {selectedBook.synopsis && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">Sinopsis</p>
                  <p className="text-sm text-neutral-600 leading-relaxed">{selectedBook.synopsis}</p>
                </div>
              )}

              {/* Book Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedBook.isbn && (
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">ISBN</p>
                    <p className="text-sm font-bold text-gray-900 font-mono">{selectedBook.isbn}</p>
                  </div>
                )}
                {selectedBook.editorial && (
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Editorial</p>
                    <p className="text-sm font-bold text-gray-900">{selectedBook.editorial}</p>
                  </div>
                )}
                {selectedBook.edition && (
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Edición</p>
                    <p className="text-sm font-bold text-gray-900">{selectedBook.edition}</p>
                  </div>
                )}
                {selectedBook.price > 0 && (
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Precio</p>
                    <p className="text-sm font-bold text-gray-900">${selectedBook.price}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-neutral-600 bg-[#F8FAFC] p-4 rounded-xl border border-neutral-100">
                  <MapPin className="w-5 h-5 text-[#2B74FF]" />
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Ubicación Física</p>
                    <p className="text-sm font-bold text-gray-900">{selectedBook.location}</p>
                  </div>
                </div>

                {/* Availability Status */}
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Estado de Disponibilidad</p>
                  <p className="text-sm font-bold text-gray-900">{selectedBook.availabilityStatus}</p>
                </div>

                {/* Fine Info */}
                {selectedBook.finePerDay > 0 && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Multa por Día de Retraso</p>
                    <p className="text-sm font-bold text-gray-900">${selectedBook.finePerDay} MXN</p>
                  </div>
                )}
              </div>
              
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