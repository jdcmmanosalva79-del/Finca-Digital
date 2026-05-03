import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import styles from './Header.module.css';

export default function Header({ onNavigate, userRole }) {
  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
  };

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <svg viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#e8f5f2" />
            <path d="M24 38C24 38 12 30 12 20C12 14.477 17.373 10 24 10C30.627 10 36 14.477 36 20C36 30 24 38 24 38Z" fill="#2a7d6f" opacity="0.3" />
            <path d="M24 34C24 34 14 27 14 19C14 14.582 18.477 11 24 11C29.523 11 34 14.582 34 19C34 27 24 34 24 34Z" fill="#2a7d6f" opacity="0.6" />
            <path d="M24 10 L24 30" stroke="#c8860a" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 22 C24 22 19 18 17 14" stroke="#c8860a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 18 C24 18 28 15 30 12" stroke="#c8860a" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="24" cy="24" r="22" stroke="#2a7d6f" strokeWidth="1.5" strokeDasharray="3 2" />
          </svg>
        </div>
        <div className={styles.brandText}>
          <h1 className={styles.brandTitle}>Panel Administrativo - Finca Digital</h1>
          <p className={styles.brandSubtitle}>Sistema de Gestión Agrícola</p>
        </div>
      </div>

      <div className={styles.actions}>
        {userRole === 'admin' && (
          <button 
            className={`${styles.btn} ${styles.btnTeal}`} 
            onClick={() => onNavigate('usuarios')}
            title="Gestión Usuarios"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className={styles.btnText}>Usuarios</span>
          </button>
        )}

        <button className={`${styles.btn} ${styles.btnDark}`} onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
