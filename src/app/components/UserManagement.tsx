import React, { useState } from 'react';
import { UserProfileDropdown } from "./UserProfileDropdown";
import { 
  Search, Bell, Plus, Pencil, Trash2, X, AlertTriangle, User as UserIcon, Shield, Mail, Eye, BookOpen, Calendar, AlertCircle, DollarSign, CheckCircle2
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { NotificationBell } from './NotificationBell';
import { useAuth, ROLES, User, Role, SCREENS, Screen } from '../context/AuthContext';
import { useLoans } from '../context/LoanContext';
import { useBooks } from '../context/BookContext';
import { toast } from 'sonner';

export function UserManagement() {
  const { user: currentUser, users, addUser, updateUser, deleteUser, rolePermissions, updateRolePermissions } = useAuth();
  const { loans } = useLoans();
  const { books } = useBooks();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form State
  const initialFormState = {
    name: '',
    email: '',
    username: '',
    role: ROLES[0],
    avatar: ''
  };
  
  const [formData, setFormData] = useState<Omit<User, 'id'>>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Permisos por rol
  const [selectedRole, setSelectedRole] = useState<Role>('Alumno');
  const [tempPermissions, setTempPermissions] = useState<Screen[]>([]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar
    });
    setEditingId(user.id);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    if (user.id === currentUser?.id) return; // Prevent deleting oneself
    
    // Validar si el usuario tiene préstamos activos
    const activeLoans = loans.filter(loan => 
      loan.userId === user.id && loan.status === 'Activo'
    );
    
    // Validar si el usuario tiene multas pendientes (préstamos vencidos sin pagar)
    const today = new Date();
    const loansWithFines = loans.filter(loan => {
      if (loan.userId !== user.id || loan.status !== 'Activo') return false;
      const dueDate = new Date(loan.dueDate);
      return today > dueDate && !loan.finePaid;
    });
    
    if (activeLoans.length > 0) {
      toast.error('No se puede eliminar el usuario', {
        description: `${user.name} tiene ${activeLoans.length} préstamo(s) activo(s). Debe devolver los libros primero.`
      });
      return;
    }
    
    if (loansWithFines.length > 0) {
      toast.error('No se puede eliminar el usuario', {
        description: `${user.name} tiene multas pendientes por pagar. Debe saldar su cuenta primero.`
      });
      return;
    }
    
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleOpenPermissions = () => {
    // Abre el modal para editar permisos por rol
    setSelectedRole('Alumno'); // Empieza con Alumno
    setTempPermissions(rolePermissions['Alumno']);
    setIsPermissionsModalOpen(true);
  };

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setTempPermissions(rolePermissions[role]);
  };

  const handlePermissionChange = (screen: Screen) => {
    setTempPermissions(prev => {
      if (prev.includes(screen)) {
        return prev.filter(s => s !== screen);
      } else {
        return [...prev, screen];
      }
    });
  };

  const savePermissions = () => {
    updateRolePermissions(selectedRole, tempPermissions);
    setIsPermissionsModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateUser(editingId, formData);
    } else {
      addUser(formData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleOpenDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  return (
    <>
      {/* Topbar */}
      <header className="h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-8 shrink-0 shadow-sm z-10 relative">
        <div className="relative w-[480px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-full py-2.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all placeholder:text-neutral-400" 
            placeholder="Buscar por nombre, matrícula o rol..." 
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
              <h1 className="text-[32px] font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h1>
              <p className="text-neutral-400 font-medium mt-1">Administra los accesos y roles de la plataforma</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleOpenPermissions}
                className="bg-white hover:bg-[#F8FAFC] text-[#2B74FF] border border-[#2B74FF] px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Editar Permisos por Rol
              </button>
              <button 
                onClick={handleOpenAdd}
                className="bg-[#2B74FF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#2B74FF]/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Usuario
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-neutral-200 text-sm font-semibold text-neutral-500">
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Correo Electrónico</th>
                    <th className="px-6 py-4">Matrícula / Nómina</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <ImageWithFallback 
                            src={u.avatar} 
                            alt={u.name} 
                            className="w-10 h-10 object-cover rounded-full shadow-sm border border-neutral-200 shrink-0" 
                          />
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-[#2B74FF] transition-colors">{u.name}</p>
                            {u.id === currentUser?.id && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B74FF] bg-[#B5DBF7]/30 px-1.5 py-0.5 rounded ml-1">Tú</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Mail className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-neutral-600 font-medium bg-neutral-100 px-2 py-1 rounded">
                          {u.username}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
                          ${u.role === 'Administrador' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'Bibliotecario' ? 'bg-blue-100 text-[#2B74FF]' :
                            u.role === 'Profesor' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 text-neutral-400 hover:text-[#2B74FF] hover:bg-[#B5DBF7]/20 rounded-lg transition-all"
                            title="Editar usuario"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenDelete(u)}
                            disabled={u.id === currentUser?.id}
                            className={`p-2 rounded-lg transition-all ${
                              u.id === currentUser?.id 
                                ? 'text-neutral-300 cursor-not-allowed' 
                                : 'text-neutral-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title={u.id === currentUser?.id ? "No puedes eliminarte a ti mismo" : "Eliminar usuario"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenDetails(u)}
                            className="p-2 text-neutral-400 hover:text-[#2B74FF] hover:bg-[#B5DBF7]/20 rounded-lg transition-all"
                            title="Ver detalles del usuario"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                        No se encontraron usuarios.
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
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="user-form" onSubmit={handleSave} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Nombre completo</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      disabled={!!editingId}
                      className={`w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all ${
                        editingId 
                          ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' 
                          : 'bg-[#F8FAFC] focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20'
                      }`}
                    />
                    {editingId && (
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        No se puede editar el nombre después del alta
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Correo electrónico</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      disabled={!!editingId}
                      className={`w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all ${
                        editingId 
                          ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' 
                          : 'bg-[#F8FAFC] focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20'
                      }`}
                    />
                    {editingId && (
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        No se puede editar el correo después del alta
                      </p>
                    )}
                  </div>

                  {/* Username (Matrícula) */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 block">Matrícula o Nómina</label>
                    <input 
                      required
                      type="text" 
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value.toUpperCase()})}
                      placeholder="Ej. A01234567"
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all uppercase"
                    />
                  </div>

                  {/* Rol */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-900 block">Rol del usuario</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as Role})}
                      className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                    >
                      {ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  {/* Avatar URL */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-900 block">URL del Avatar (Opcional)</label>
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 shrink-0 border border-neutral-200 rounded-full overflow-hidden bg-neutral-100 shadow-sm flex items-center justify-center">
                        {formData.avatar ? (
                          <ImageWithFallback src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-neutral-300" />
                        )}
                      </div>
                      <div className="flex-1 relative">
                        <input 
                          type="url" 
                          value={formData.avatar}
                          onChange={e => setFormData({...formData, avatar: e.target.value})}
                          placeholder="https://ejemplo.com/avatar.jpg"
                          className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                        />
                      </div>
                    </div>
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
                form="user-form"
                type="submit"
                className="bg-[#2B74FF] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#2B74FF]/20"
              >
                {editingId ? 'Guardar Cambios' : 'Agregar Usuario'}
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
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminar Usuario</h3>
            <p className="text-neutral-500 text-sm mb-6">
              ¿Estás seguro que deseas eliminar a "<span className="font-semibold text-gray-900">{userToDelete?.name}</span>"? Esta acción revocará su acceso.
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

      {/* Permissions Modal */}
      {isPermissionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsPermissionsModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                Gestión de Permisos por Rol
              </h2>
              <button 
                onClick={() => setIsPermissionsModalOpen(false)}
                className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                
                {/* Selector de Rol */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 block">Selecciona un rol para editar sus permisos:</label>
                  <select 
                    value={selectedRole}
                    onChange={e => handleRoleChange(e.target.value as Role)}
                    className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2B74FF] focus:ring-2 focus:ring-[#2B74FF]/20 transition-all"
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* Lista de Permisos */}
                <div className="bg-[#F8FAFC] border border-neutral-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-4">
                    Permisos para el rol de <span className="text-[#2B74FF]">{selectedRole}</span>:
                  </p>
                  <div className="space-y-3">
                    {SCREENS.map(screen => (
                      <label 
                        key={screen.id} 
                        className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg hover:bg-[#B5DBF7]/10 hover:border-[#2B74FF] transition-all cursor-pointer"
                      >
                        <input 
                          type="checkbox" 
                          checked={tempPermissions.includes(screen.id)}
                          onChange={() => handlePermissionChange(screen.id)}
                          className="w-4 h-4 text-[#2B74FF] rounded border-neutral-300 focus:ring-[#2B74FF] focus:ring-2 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-900 flex-1">{screen.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Importante</p>
                      <p className="text-xs text-neutral-600">
                        Al modificar los permisos de un rol, todos los usuarios con ese rol tendrán automáticamente 
                        los mismos permisos. Los cambios se aplican inmediatamente a todos los usuarios activos.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={savePermissions}
                className="bg-[#2B74FF] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#2B74FF]/20"
              >
                Guardar Permisos
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Details Modal - Vista Completa del Usuario */}
      {isDetailsModalOpen && selectedUser && (() => {
        // Calcular información del usuario
        const userLoans = loans.filter(l => l.userId === selectedUser.id);
        const activeLoans = userLoans.filter(l => l.status === 'Activo');
        const loanHistory = userLoans.filter(l => l.status === 'Devuelto');
        
        const today = new Date();
        const loansWithFines = activeLoans.filter(loan => {
          const dueDate = new Date(loan.dueDate);
          return today > dueDate && !loan.finePaid;
        });
        
        // Calcular total de multas
        let totalFines = 0;
        loansWithFines.forEach(loan => {
          const book = books.find(b => b.id === loan.bookId);
          if (book) {
            const dueDate = new Date(loan.dueDate);
            const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const fineAmount = daysLate * book.finePerDay;
            totalFines += fineAmount;
          }
        });
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
              
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white text-neutral-800 rounded-full backdrop-blur-md transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left: Avatar y Info Básica */}
              <div className="w-full md:w-2/5 bg-gradient-to-br from-[#2B74FF] to-[#B5DBF7] shrink-0 relative p-8 flex flex-col items-center justify-center text-white">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl mb-4">
                  <ImageWithFallback 
                    src={selectedUser.avatar} 
                    alt={selectedUser.name}
                    className="w-full h-full object-cover" 
                  />
                </div>
                <h2 className="text-2xl font-bold text-white text-center mb-2">{selectedUser.name}</h2>
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold mb-4
                  ${selectedUser.role === 'Administrador' ? 'bg-purple-600' :
                    selectedUser.role === 'Bibliotecario' ? 'bg-blue-600' :
                    selectedUser.role === 'Profesor' ? 'bg-orange-600' :
                    'bg-green-600'
                  } text-white shadow-lg`}
                >
                  {selectedUser.role}
                </span>
                
                <div className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm font-mono">{selectedUser.username}</span>
                  </div>
                </div>

                {/* Resumen rápido */}
                <div className="w-full grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">{activeLoans.length}</div>
                    <div className="text-xs opacity-90">Préstamos Activos</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">{loansWithFines.length}</div>
                    <div className="text-xs opacity-90">Con Multa</div>
                  </div>
                </div>
              </div>

              {/* Right: Detalles e Historial */}
              <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col overflow-y-auto bg-white">
                
                <div className="space-y-6">
                  
                  {/* Multas Pendientes */}
                  {loansWithFines.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 mb-1">Multas Pendientes</p>
                          <p className="text-xs text-neutral-600">Este usuario tiene préstamos vencidos</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">${totalFines}</p>
                          <p className="text-xs text-neutral-500">MXN</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {loansWithFines.map(loan => {
                          const book = books.find(b => b.id === loan.bookId);
                          if (!book) return null;
                          
                          const dueDate = new Date(loan.dueDate);
                          const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                          const fineAmount = daysLate * book.finePerDay;
                          
                          return (
                            <div key={loan.id} className="bg-white rounded-lg p-3 border border-red-100">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-gray-900">{book.title}</p>
                                  <p className="text-xs text-neutral-500">{daysLate} {daysLate === 1 ? 'día' : 'días'} de retraso</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-red-600">${fineAmount}</p>
                                  <p className="text-xs text-neutral-400">${book.finePerDay}/día</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Préstamos Activos */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-[#2B74FF]" />
                      <h3 className="text-lg font-bold text-gray-900">Préstamos Actuales</h3>
                    </div>
                    
                    {activeLoans.length > 0 ? (
                      <div className="space-y-3">
                        {activeLoans.map(loan => {
                          const book = books.find(b => b.id === loan.bookId);
                          if (!book) return null;
                          
                          const dueDate = new Date(loan.dueDate);
                          const isOverdue = today > dueDate;
                          
                          return (
                            <div key={loan.id} className={`bg-[#F8FAFC] rounded-xl p-4 border ${isOverdue ? 'border-red-200' : 'border-neutral-100'}`}>
                              <div className="flex items-start gap-3">
                                <ImageWithFallback 
                                  src={book.cover} 
                                  alt={book.title}
                                  className="w-12 h-16 object-cover rounded shadow-sm border border-neutral-200 shrink-0" 
                                />
                                <div className="flex-1">
                                  <p className="font-bold text-sm text-gray-900 mb-1">{book.title}</p>
                                  <p className="text-xs text-neutral-500 mb-2">{book.author}</p>
                                  <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-neutral-400" />
                                      <span className="text-neutral-600">Prestado: {new Date(loan.borrowDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                                    </div>
                                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Vence: {dueDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-[#F8FAFC] rounded-xl p-6 text-center border border-neutral-100">
                        <BookOpen className="w-12 h-12 text-neutral-200 mx-auto mb-2" />
                        <p className="text-sm text-neutral-400">No tiene préstamos activos</p>
                      </div>
                    )}
                  </div>

                  {/* Historial de Préstamos */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-neutral-600" />
                      <h3 className="text-lg font-bold text-gray-900">Historial de Préstamos</h3>
                    </div>
                    
                    {loanHistory.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {loanHistory.slice(0, 10).map(loan => {
                          const book = books.find(b => b.id === loan.bookId);
                          if (!book) return null;
                          
                          return (
                            <div key={loan.id} className="bg-white rounded-lg p-3 border border-neutral-100 hover:border-[#B5DBF7] transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-10 shrink-0 bg-neutral-100 rounded flex items-center justify-center">
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-gray-900">{book.title}</p>
                                  <p className="text-xs text-neutral-500">
                                    {new Date(loan.borrowDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(loan.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-6 text-center border border-neutral-100">
                        <p className="text-sm text-neutral-400">Sin historial de préstamos</p>
                      </div>
                    )}
                  </div>

                </div>
                
              </div>
              
            </div>
          </div>
        );
      })()}
    </>
  );
}