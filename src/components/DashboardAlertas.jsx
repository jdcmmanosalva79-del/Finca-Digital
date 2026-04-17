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
  const [tareasHoy, setTareasHoy]       = useState([]);
  const [alertaClima, setAlertaClima]   = useState(null);
  const [cropActivos, setCropActivos]   = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [modal, setModal]               = useState(null); // { cropId, lote, rubro }
  const [rendimiento, setRendimiento]   = useState('');
  const [finalizando, setFinalizando]   = useState(false);
  const [toastMsg, setToastMsg]         = useState(null);

  // ── 1. Suscribir a cultivos activos en Firestore ──
  useEffect(() => {
    const q = query(collection(db, 'crops'), where('estado', '==', 'activo'));
    const unsub = onSnapshot(q, (snap) => {
      const hoy = new Date();
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finDia    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

      const activos = [];
      const tareas  = [];

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

      <h1 className={styles.pageTitle}>Panel de Alertas</h1>
      <p className={styles.pageSubtitle}>
        {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

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
