import { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAppContext } from '../context/AppContext';
import styles from './Header.module.css';

export default function Header({ onNavigate, userRole }) {
  const { theme, toggleTheme } = useAppContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
  };

  const userEmail = auth.currentUser?.email || 'admin@fincadigital.com';

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.left}>
          <div className={styles.logoGroup}>
            <div className={styles.logoCircle}>
              <img src="/logo.png" alt="Finca Digital Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className={styles.brandInfo}>
              <h1 className={styles.brandName}>FINCA DIGITAL</h1>
              <div className={styles.divider}></div>
              <div className={styles.brandSub}>
                <h2 className={styles.mainTitle}>Panel Administrativo</h2>
                <p className={styles.subTitle}>Sistema de Gestión Agrícola</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.buttonGroup}>
            {(userRole === 'admin' || userRole === 'super_admin') && (
              <div className={styles.dropdownContainer} ref={dropdownRef}>
                <button 
                  className={styles.dropdownBtn} 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                  <span>Admin</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={dropdownOpen ? styles.dropdownArrowOpen : ''}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <button className={styles.dropdownItem} onClick={() => { onNavigate('usuarios'); setDropdownOpen(false); }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Usuarios
                    </button>
                    <button className={styles.dropdownItem} onClick={() => { onNavigate('alertas'); setDropdownOpen(false); }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      Alertas
                    </button>
                    <button className={styles.dropdownItem} onClick={() => { onNavigate('reportes'); setDropdownOpen(false); }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      Reportes
                    </button>
                  </div>
                )}
              </div>
            )}
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>

          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              AD
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>admin</span>
              <span className={styles.userEmail}>{userEmail}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
