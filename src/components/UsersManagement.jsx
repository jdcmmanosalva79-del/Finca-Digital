import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { fetchAllUsers, updateUserRole, createNewUser, deleteUser } from '../server/services/userService';
import { useAppContext } from '../context/AppContext';
import styles from './UsersManagement.module.css';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // New User Form State
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('encargado');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const { showAlert, hideAlert } = useAppContext();

  const fetchUsers = async () => {
    try {
      const usersList = await fetchAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === auth.currentUser?.uid) {
      showAlert({
        type: 'error',
        title: 'Acción Denegada',
        message: 'No puedes eliminar tu propia cuenta de administrador.',
        confirmText: 'Entendido'
      });
      return;
    }

    showAlert({
      type: 'warning',
      title: '¿Eliminar usuario?',
      message: 'Esta acción borrará permanentemente el perfil de Firestore. El acceso del usuario será revocado.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        hideAlert();
        setUpdating(userId);
        try {
          await deleteUser(userId);
          setUsers(users.filter(u => u.id !== userId));
          showAlert({
            type: 'success',
            title: 'Usuario Eliminado',
            message: 'El usuario ha sido removido exitosamente del sistema.',
            confirmText: 'Excelente'
          });
        } catch (error) {
          console.error("Error deleting user:", error);
          showAlert({
            type: 'error',
            title: 'Error',
            message: 'Hubo un problema al intentar eliminar el usuario.',
            confirmText: 'Reintentar'
          });
        } finally {
          setUpdating(null);
        }
      }
    });
  };


  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const newUser = await createNewUser(newEmail, newPassword, newRole);

      // Add to local state
      setUsers([...users, newUser]);
      
      setShowModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('encargado');
      
      showAlert({
        type: 'success',
        title: 'Usuario Creado',
        message: `El usuario ${newEmail} ha sido registrado correctamente con el rol de ${newRole}.`,
        confirmText: 'Genial'
      });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setCreateError('El correo ya está registrado.');
      else if (err.code === 'auth/weak-password') setCreateError('La contraseña debe tener al menos 6 caracteres.');
      else setCreateError('Error al crear usuario. Revisa los datos.');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando usuarios...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Gestión de Usuarios</h2>
          <p className={styles.subtitle}>Administra los roles y accesos del personal de la finca.</p>
        </div>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          + Crear Usuario
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario / Correo</th>
              <th>Rol Actual</th>
              <th>Acciones (Asignar Rol)</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>{user.email.charAt(0).toUpperCase()}</div>
                    <span className={styles.email}>{user.email}</span>
                  </div>
                </td>
                <td>
                  <span className={`${styles.roleBadge} ${styles[user.role] || styles.encargado}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <select 
                      className={styles.roleSelect}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updating === user.id}
                    >
                      <option value="admin">Administrador</option>
                      <option value="encargado">Encargado</option>
                      <option value="empleado">Empleado</option>
                    </select>
                    {updating === user.id && <span className={styles.saving}>Guardando...</span>}
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={updating === user.id}
                      title="Eliminar Usuario"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="3" className={styles.empty}>No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser}>
              {createError && <div className={styles.error}>{createError}</div>}
              
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)} 
                  required 
                  placeholder="ejemplo@fincadigital.com"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Contraseña</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Rol Inicial</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="encargado">Encargado</option>
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={creating}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn} disabled={creating}>
                  {creating ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
