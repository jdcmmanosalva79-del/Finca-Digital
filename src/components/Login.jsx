import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import styles from './Login.module.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: userCred.user.email,
          role: userCred.user.email === 'admin@fincadigital.com' ? 'admin' : 'encargado',
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential') setError('Credenciales incorrectas o usuario no encontrado.');
      else if (err.code === 'auth/email-already-in-use') setError('El correo ya está registrado.');
      else if (err.code === 'auth/weak-password') setError('La contraseña debe tener al menos 6 caracteres.');
      else setError('Error de autenticación. Verifica tus datos e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      {/* Background decoration */}
      <div className={styles.bgDecoration1}></div>
      <div className={styles.bgDecoration2}></div>

      <div className={styles.loginCard}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#e8f5f2" />
              <path d="M24 38C24 38 12 30 12 20C12 14.477 17.373 10 24 10C30.627 10 36 14.477 36 20C36 30 24 38 24 38Z" fill="#2a7d6f" opacity="0.3" />
              <path d="M24 34C24 34 14 27 14 19C14 14.582 18.477 11 24 11C29.523 11 34 14.582 34 19C34 27 24 34 24 34Z" fill="#2a7d6f" opacity="0.6" />
              <path d="M24 10 L24 30" stroke="#c8860a" strokeWidth="2" strokeLinecap="round" />
              <path d="M24 22 C24 22 19 18 17 14" stroke="#c8860a" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M24 18 C24 18 28 15 30 12" stroke="#c8860a" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className={styles.title}>Finca Digital</h1>
          <p className={styles.subtitle}>Sistema Inteligente de Gestión Agrícola</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Correo Electrónico</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>✉️</span>
              <input
                type="email"
                className={styles.input}
                placeholder="admin@fincadigital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Cargando...' : (isLogin ? 'Ingresar al Panel' : 'Registrar Cuenta')}
          </button>
        </form>

        <div className={styles.footer}>
          <span className={styles.footerText}>
            {isLogin ? '¿No tienes cuenta en la finca?' : '¿Ya eres parte de Finca Digital?'}
          </span>
          <button
            type="button"
            className={styles.switchBtn}
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
