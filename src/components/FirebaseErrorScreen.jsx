import React, { useState } from 'react';
import styles from './FirebaseErrorScreen.module.css';

export default function FirebaseErrorScreen({ error }) {
  const [copied, setCopied] = useState(false);

  const envTemplate = `# Variables de entorno para Netlify (copia esto a tu panel)
VITE_OPENWEATHER_KEY=tu_openweather_key
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_DATABASE_URL=tu_database_url
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className={styles.icon}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className={styles.title}>Error de Configuración</h1>
          <p className={styles.subtitle}>Finca Digital — Firebase no inicializado</p>
        </div>

        <p className={styles.description}>
          La aplicación se compiló, pero se muestra una pantalla en blanco porque no se pudieron cargar las credenciales de Firebase en el entorno de producción (Netlify).
        </p>

        <div className={styles.alertBox}>
          <div className={styles.alertTitle}>Detalle del error técnico:</div>
          <p className={styles.alertText}>{error}</p>
        </div>

        <h2 className={styles.sectionTitle}>¿Por qué sucede esto?</h2>
        <p className={styles.description} style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          Por motivos de seguridad, tu archivo <code>.env</code> que contiene las claves privadas está en el archivo <code>.gitignore</code> y no se sube a GitHub. Cuando Netlify descarga tu código y compila la aplicación, no encuentra estas variables, provocando que Firebase falle al iniciar.
        </p>

        <h2 className={styles.sectionTitle}>¿Cómo solucionarlo en Netlify?</h2>
        <ol className={styles.steps}>
          <li className={styles.stepItem}>
            Inicia sesión en <strong>Netlify</strong> y ve al panel de tu sitio (<strong>Finca-Digital</strong>).
          </li>
          <li className={styles.stepItem}>
            Dirígete a <strong>Site configuration</strong> &gt; <strong>Environment variables</strong> (o <em>Variables de entorno</em>).
          </li>
          <li className={styles.stepItem}>
            Haz clic en <strong>Add a variable</strong> y añade cada una de las variables listadas abajo con el valor correspondiente de tu archivo <code>.env</code> local.
          </li>
          <li className={styles.stepItem}>
            <strong>Muy importante:</strong> Después de guardarlas, ve a la pestaña <strong>Deploys</strong> y haz clic en <strong>Trigger deploy</strong> &gt; <strong>Clear cache and deploy site</strong> para volver a compilar el proyecto con las nuevas variables cargadas.
          </li>
        </ol>

        <div className={styles.codeBlockHeader}>
          <span className={styles.codeTitle}>Variables requeridas</span>
          <button
            onClick={copyToClipboard}
            className={`${styles.copyButton} ${copied ? styles.copyButtonActive : ''}`}
          >
            {copied ? '¡Copiado!' : 'Copiar Plantilla'}
          </button>
        </div>
        <div className={styles.codeArea}>
          <pre className={styles.codeContent}>{envTemplate}</pre>
        </div>

        <div className={styles.footer}>
          Finca Digital © {new Date().getFullYear()} — Diseñado para una agricultura eficiente y moderna.
        </div>
      </div>
    </div>
  );
}
