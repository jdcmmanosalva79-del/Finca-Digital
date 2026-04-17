/**
 * ConfiguracionWhatsApp.jsx
 * Permite al usuario guardar su número de teléfono en Firestore
 * y activar/desactivar el envío de alertas por WhatsApp.
 */

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import styles from './ConfiguracionWhatsApp.module.css';

export default function ConfiguracionWhatsApp() {
  const [telefono, setTelefono]         = useState('');
  const [activado, setActivado]         = useState(false);
  const [guardando, setGuardando]       = useState(false);
  const [cargando, setCargando]         = useState(true);
  const [toast, setToast]               = useState(null);
  const [testEnviando, setTestEnviando] = useState(false);

  const userId = auth.currentUser?.uid;
  const API_URL = import.meta.env.VITE_API_URL ?? '';


  // ── Cargar configuración actual del usuario ──
  useEffect(() => {
    if (!userId) { setCargando(false); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'usuarios', userId));
        if (snap.exists()) {
          const data = snap.data();
          setTelefono(data.telefono || '');
          setActivado(data.notificacionesActivas || false);
        }
      } catch (err) {
        console.error('[ConfigWA] Error cargando config:', err);
      } finally {
        setCargando(false);
      }
    })();
  }, [userId]);

  // ── Guardar en Firestore ──
  async function handleGuardar(e) {
    e.preventDefault();
    if (!userId) return;

    // Validar formato básico: comienza con + y tiene dígitos
    if (!/^\+\d{7,15}$/.test(telefono.trim())) {
      mostrarToast('❌ Número inválido. Usa formato internacional: +584141234567', true);
      return;
    }

    setGuardando(true);
    try {
      await setDoc(
        doc(db, 'usuarios', userId),
        {
          telefono: telefono.trim(),
          notificacionesActivas: activado,
          actualizadoEn: serverTimestamp(),
          email: auth.currentUser?.email || null,
        },
        { merge: true }
      );
      mostrarToast('✅ Configuración guardada correctamente.');
    } catch (err) {
      mostrarToast(`❌ Error al guardar: ${err.message}`, true);
    } finally {
      setGuardando(false);
    }
  }

  // ── Mensaje de prueba ──
  async function handleTest() {
    if (!telefono.trim()) {
      mostrarToast('❌ Guarda primero tu número antes de enviar la prueba.', true);
      return;
    }
    setTestEnviando(true);
    try {
      const res = await fetch(`${API_URL}/api/notificaciones/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: telefono.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      mostrarToast('📲 Mensaje de prueba enviado. Revisa tu WhatsApp.');
    } catch (err) {
      mostrarToast(`❌ ${err.message}`, true);
    } finally {
      setTestEnviando(false);
    }
  }

  function mostrarToast(msg, isError = false) {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4500);
  }

  if (cargando) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingCenter}>
          <span className={styles.spinner} />
          <span>Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.wrapper}>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.isError ? styles.toastError : styles.toastOk}`}>
          {toast.msg}
        </div>
      )}

      <div className={styles.card}>

        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.iconWrap}>
            {/* WhatsApp SVG */}
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 1.99.522 3.86 1.436 5.476L2.001 22l4.617-1.41A9.954 9.954 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.963 7.963 0 0 1-4.076-1.116l-.292-.174-3.021.922.894-2.96-.192-.304A8 8 0 1 1 12 20z"/>
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>Notificaciones WhatsApp</h2>
            <p className={styles.subtitle}>
              Recibe alertas diarias de clima, riego y fertilización en tu teléfono.
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className={styles.form}>

          {/* Número de teléfono */}
          <div className={styles.field}>
            <label htmlFor="wa-telefono" className={styles.label}>
              <span className={styles.labelDot} />
              Número de WhatsApp (formato internacional)
            </label>
            <div className={styles.inputGroup}>
              <span className={styles.prefix}>📱</span>
              <input
                id="wa-telefono"
                type="tel"
                placeholder="+584141234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={styles.input}
              />
            </div>
            <span className={styles.hint}>Incluye el código de país. Ej: +58 para Venezuela.</span>
          </div>

          {/* Toggle Activar/Desactivar */}
          <div className={styles.toggleRow}>
            <div>
              <p className={styles.toggleLabel}>Enviar alertas diarias</p>
              <p className={styles.toggleDesc}>
                Cada día a las 6:00 AM recibirás el reporte de clima y tareas del día.
              </p>
            </div>
            <button
              type="button"
              id="wa-toggle-btn"
              role="switch"
              aria-checked={activado}
              className={`${styles.toggle} ${activado ? styles.toggleOn : ''}`}
              onClick={() => setActivado((v) => !v)}
              title={activado ? 'Desactivar notificaciones' : 'Activar notificaciones'}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>

          {/* Estado visual */}
          <div className={`${styles.statusBanner} ${activado ? styles.statusOn : styles.statusOff}`}>
            {activado
              ? '🔔 Las notificaciones están ACTIVADAS.'
              : '🔕 Las notificaciones están DESACTIVADAS.'}
          </div>

          {/* Acciones */}
          <div className={styles.actions}>
            <button
              type="submit"
              id="wa-guardar-btn"
              className={styles.btnPrimary}
              disabled={guardando}
            >
              {guardando ? <span className={styles.spinner} /> : '💾 Guardar Configuración'}
            </button>

            <button
              type="button"
              id="wa-test-btn"
              className={styles.btnSecondary}
              onClick={handleTest}
              disabled={testEnviando}
            >
              {testEnviando ? <span className={styles.spinner} /> : '📲 Enviar Mensaje de Prueba'}
            </button>
          </div>
        </form>

        {/* Info proveedor */}
        <div className={styles.infoFooter}>
          <span className={styles.infoIcon}>ℹ️</span>
          <p>
            Los mensajes se envían vía <strong>UltraMsg</strong> o <strong>Twilio</strong> según la configuración del servidor.
            Asegúrate de que el servidor backend esté activo.
          </p>
        </div>
      </div>
    </section>
  );
}
