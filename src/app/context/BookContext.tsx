import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Book {
  id: number;
  title: string;
  author: string;
  cover: string;
  category: string;
  status: 'Disponible' | 'Prestado' | string;
  location: string;
  totalCopies: number;
  availableCopies: number;
  isbn: string;
  editorial: string;
  edition: string;
  price: number;
  finePerDay: number;
  synopsis: string;
  format: 'Físico' | 'Digital' | 'Ambos';
  physicalCopies?: number; // Solo para libros físicos o ambos
  pdfUrl?: string; // Solo para libros digitales o ambos
  availabilityStatus: 'Disponible para préstamo a casa' | 'Disponible para uso interno' | 'Dado de baja';
}

export const CATEGORIES = ["Negocios", "Ficción", "Desarrollo Personal", "Ciencias", "Historia", "Biografía"];

interface BookContextType {
  books: Book[];
  isLoading: boolean;
  addBook: (book: Omit<Book, 'id'>) => Promise<void>;
  updateBook: (id: number, book: Partial<Book>) => Promise<void>;
  deleteBook: (id: number) => Promise<void>;
}

const BookContext = createContext<BookContextType | null>(null);

const API_URL = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5001"}`}/api/books`;

export function BookProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load books from backend on mount
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addBook = async (newBook: Omit<Book, 'id'>) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      });
      if (res.ok) {
        const createdBook = await res.json();
        // Option 1: fetchBooks() again to get the joins (copies, category)
        // Option 2: Add it directly assuming it has 0 copies for now
        await fetchBooks(); 
      }
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  const updateBook = async (id: number, updatedBook: Partial<Book>) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBook)
      });
      if (res.ok) {
        await fetchBooks();
      }
    } catch (error) {
      console.error("Error updating book:", error);
    }
  };

  const deleteBook = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setBooks(prev => prev.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  return (
    <BookContext.Provider value={{ books, isLoading, addBook, updateBook, deleteBook }}>
      {children}
    </BookContext.Provider>
  );
}

export const useBooks = () => {
  const context = useContext(BookContext);
  if (!context) throw new Error('useBooks must be used within BookProvider');
  return context;
};