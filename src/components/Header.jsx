import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import styles from './Header.module.css';

export default function Header({ onNavigate, userRole }) {
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
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" fill="#5c8a34" />
                <path d="M10 24C10 24 15 15 24 15C33 15 38 24 38 24" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 28C12 28 17 21 24 21C31 21 36 28 36 28" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M15 32C15 32 19 27 24 27C29 27 33 32 33 32" stroke="white" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.brandInfo}>
              <h1 className={styles.brandName}>FINCA DIGITAL</h1>
              <div className={styles.divider}></div>
              <div className={styles.brandSub}>
                <h2 className={styles.mainTitle}>Panel Administrativo - Finca Digital</h2>
                <p className={styles.subTitle}>Sistema de Gestión Agrícola</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.buttonGroup}>
            {userRole === 'admin' && (
              <button className={styles.outlineBtn} onClick={() => onNavigate('usuarios')}>
                Usuarios
              </button>
            )}
            <button className={styles.outlineBtn} onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>

          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              <img src="https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff" alt="User" />
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
