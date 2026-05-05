/**
 * DashboardAlertas.jsx
 * Vista principal de alertas:
 * - Tareas pendientes del día (leídas de Firestore / backend)
 * - Decisión de riego basada en la última alerta de clima guardada
 * - Botón para finalizar ciclo (pide rendimiento en KG)
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './DashboardAlertas.module.css';

const API_URL = import.meta.env.VITE_API_URL ?? '';


export default function DashboardAlertas() {
  const [tareasHoy, setTareasHoy] = useState([]);
  const [alertaClima, setAlertaClima] = useState(null);
  const [cropActivos, setCropActivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { cropId, lote, rubro }
  const [rendimiento, setRendimiento] = useState('');
  const [finalizando, setFinalizando] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // ── 1. Suscribir a cultivos activos en Firestore ──
  useEffect(() => {
    const q = query(collection(db, 'crops'), where('estado', '==', 'activo'));
    const unsub = onSnapshot(q, (snap) => {
      const hoy = new Date();
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

      const activos = [];
      const tareas = [];

      snap.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        activos.push(data);

        // Calcular progreso
        const inicio = data.fechaSiembra?.toDate?.() || new Date();
        const diasTranscurridos = Math.floor((hoy - inicio) / 86400000);

        // Tareas del día
        (data.tareas || []).forEach((t) => {
          if (t.completada) return;
          const fechaEj = t.fechaEjecucion?.toDate?.();
          if (fechaEj && fechaEj >= inicioDia && fechaEj <= finDia) {
            tareas.push({
              cropId: docSnap.id,
              rubro: data.rubro,
              lote: data.lote,
              tarea: t.nombre,
              tipo: t.tipo,
            });
          }
        });

        // Anotar días transcurridos
        data._diasTranscurridos = diasTranscurridos;
        data._progreso = Math.min(100, Math.round((diasTranscurridos / (data.duracionDias || 120)) * 100));
      });

      setCropActivos(activos);
      setTareasHoy(tareas);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  // ── 2. Última alerta de clima (Firestore) ──
  useEffect(() => {
    const q = query(
      collection(db, 'alertasClima'),
      orderBy('fecha', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setAlertaClima({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    });
    return () => unsub();
  }, []);

  // ── 3. Finalizar ciclo ──
  async function handleFinalizar(e) {
    e.preventDefault();
    if (!rendimiento || isNaN(Number(rendimiento))) return;
    setFinalizando(true);

    try {
      const res = await fetch(`${API_URL}/api/crops/${modal.cropId}/finalizar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rendimientoKg: Number(rendimiento) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      mostrarToast(`✅ ${data.mensaje}`);
      setModal(null);
      setRendimiento('');
    } catch (err) {
      mostrarToast(`❌ ${err.message}`, true);
    } finally {
      setFinalizando(false);
    }
  }

  function mostrarToast(msg, isError = false) {
    setToastMsg({ msg, isError });
    setTimeout(() => setToastMsg(null), 4000);
  }

  // ── Helpers visuales ──
  const tipoAlertaConfig = {
    lluvia: { color: '#2563eb', bg: '#eff6ff', icon: '🌧️', label: 'Lluvia intensa' },
    sequia: { color: '#d97706', bg: '#fffbeb', icon: '☀️', label: 'Sequía / Regar' },
    normal: { color: '#059669', bg: '#ecfdf5', icon: '🌤️', label: 'Condición normal' },
  };

  const climaCfg = alertaClima
    ? (tipoAlertaConfig[alertaClima.tipoAlerta] || tipoAlertaConfig.normal)
    : null;

  return (
    <div className={styles.wrapper}>

      {/* ── Toast ── */}
      {toastMsg && (
        <div className={`${styles.toast} ${toastMsg.isError ? styles.toastError : styles.toastOk}`}>
          {toastMsg.msg}
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Panel de Alertas</h1>
          <p className={styles.pageSubtitle}>
            {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className={styles.waLinkBtn}>
          <svg viewBox="0 0 448 512" fill="currentColor" className={styles.waBtnIcon}>
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.6-27.6-16.5-14.7-27.6-32.8-30.8-38.4-3.2-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.5-9.3.9-1.9.5-3.7-.2-5.6-.7-1.8-8.8-21.2-12.1-29-3.2-7.8-6.4-6.7-8.8-6.8-2.2-.1-4.8-.1-7.4-.1-2.6 0-6.9 1-10.6 5-3.7 4-14.3 14-14.3 34.2s14.7 39.7 16.7 42.5c2 2.8 29 44.3 70.2 62.1 9.8 4.2 17.5 6.7 23.5 8.6 10 3.2 19.2 2.7 26.4 1.6 8.1-1.2 24.9-10.2 28.4-20 3.5-9.9 3.5-18.4 2.5-20.2-1.1-1.7-4.1-2.8-9.6-5.6z" />
          </svg>
          VINCULACIÓN DE ALERTAS
        </button>
      </div>

      {/* ── Fila superior: Clima + Tareas del día ── */}
      <div className={styles.topRow}>

        {/* Alerta de clima */}
        <div className={styles.card} id="alerta-clima-card">
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🌦️</span>
            <h2 className={styles.cardTitle}>Decisión de Riego</h2>
            {alertaClima && (
              <span className={styles.badge} style={{ background: climaCfg.bg, color: climaCfg.color }}>
                {climaCfg.label}
              </span>
            )}
          </div>

          {alertaClima ? (
            <div className={styles.climaBody}>
              <p className={styles.climaDecision} style={{ color: climaCfg.color }}>
                {alertaClima.decision}
              </p>
              <div className={styles.climaMeta}>
                <span>🌡️ {alertaClima.tempActual}°C</span>
                <span>💧 {alertaClima.popMax}% lluvia</span>
                <span>📍 {alertaClima.ciudad}</span>
                <span>🕕 {alertaClima.fecha?.toDate?.()?.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) || '—'}</span>
              </div>
            </div>
          ) : (
            <p className={styles.empty}>Sin datos de clima. El cron se ejecutará a las 6:00 AM.</p>
          )}
        </div>

        {/* Tareas del día */}
        <div className={styles.card} id="tareas-hoy-card">
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>📋</span>
            <h2 className={styles.cardTitle}>Tareas de Hoy</h2>
            <span className={styles.countBadge}>{tareasHoy.length}</span>
          </div>

          {cargando ? (
            <div className={styles.loadingRow}>
              <span className={styles.spinner} />
              Cargando tareas...
            </div>
          ) : tareasHoy.length === 0 ? (
            <p className={styles.empty}>✅ Sin tareas de fertilización pendientes hoy.</p>
          ) : (
            <ul className={styles.tareaList}>
              {tareasHoy.map((t, i) => (
                <li key={i} className={styles.tareaItem}>
                  <span className={`${styles.tipoBadge} ${styles[t.tipo]}`}>
                    {t.tipo === 'fertilizacion' ? '🌿 Fertilización' : t.tipo}
                  </span>
                  <div>
                    <p className={styles.tareaName}>{t.tarea}</p>
                    <p className={styles.tareaLote}>{t.rubro} · Lote {t.lote}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Cultivos activos + progreso ── */}
      <div className={styles.card} id="cultivos-activos-card">
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>🌱</span>
          <h2 className={styles.cardTitle}>Cultivos Activos</h2>
          <span className={styles.countBadge}>{cropActivos.length}</span>
        </div>

        {cargando ? (
          <div className={styles.loadingRow}><span className={styles.spinner} /> Cargando...</div>
        ) : cropActivos.length === 0 ? (
          <p className={styles.empty}>No hay cultivos activos. Registra tu primera siembra.</p>
        ) : (
          <div className={styles.cropGrid}>
            {cropActivos.map((crop) => (
              <div key={crop.id} className={styles.cropCard}>
                <div className={styles.cropTop}>
                  <div>
                    <p className={styles.cropRubro}>{crop.rubro}</p>
                    <p className={styles.cropLote}>Lote {crop.lote} · {crop.hectareas} ha</p>
                  </div>
                  <span className={styles.cropDias}>
                    Día {crop._diasTranscurridos} / {crop.duracionDias || 120}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${crop._progreso}%` }}
                    title={`${crop._progreso}% completado`}
                  />
                </div>
                <p className={styles.progressLabel}>{crop._progreso}% del ciclo</p>

                {/* Tareas pendientes del crop */}
                <div className={styles.cropTareasCount}>
                  {(crop.tareas || []).filter(t => !t.completada).length} tarea(s) pendiente(s)
                </div>

                {/* Botón finalizar */}
                {crop._diasTranscurridos >= (crop.duracionDias || 120) && (
                  <button
                    className={styles.finalizarBtn}
                    id={`finalizar-btn-${crop.id}`}
                    onClick={() => setModal({ cropId: crop.id, lote: crop.lote, rubro: crop.rubro })}
                  >
                    🏁 Finalizar Ciclo
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Finalizar Ciclo ── */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>🏁 Finalizar Ciclo</h3>
            <p className={styles.modalDesc}>
              <strong>{modal.rubro}</strong> · Lote {modal.lote}<br />
              Ingresa el rendimiento obtenido para liberar el lote.
            </p>
            <form onSubmit={handleFinalizar} className={styles.modalForm}>
              <label htmlFor="rendimiento-input" className={styles.label}>Rendimiento (KG)</label>
              <input
                id="rendimiento-input"
                type="number"
                min="1"
                placeholder="Ej: 4500"
                value={rendimiento}
                onChange={(e) => setRendimiento(e.target.value)}
                className={styles.input}
                required
                autoFocus
              />
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setModal(null)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.confirmBtn} disabled={finalizando} id="confirm-finalizar-btn">
                  {finalizando ? <span className={styles.spinner} /> : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
