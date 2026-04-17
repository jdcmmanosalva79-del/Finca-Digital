/**
 * CropsManagement.jsx
 * Vista completa de gestión de cultivos con tres pestañas:
 * - Catálogo: info estática de cada rubro
 * - Siembras activas: lee colección "crops" de Firestore en tiempo real
 * - Nueva Siembra: formulario integrado
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import NuevaSiembra from './NuevaSiembra';
import styles from './CropsManagement.module.css';

// ── Catálogo estático de rubros ──────────────────────────────
const CATALOGO = [
  {
    key: 'Maíz', emoji: '🌽',
    ciclo: '100 – 120 días', agua: 'Crítica', color: '#c8860a',
    bg: 'linear-gradient(135deg, #fff9ee 0%, #fef0cc 100%)',
    alerta: 'Control de maleza / Fertilización nitrogenada días 25 y 45.',
    tareasCiclo: ['Preparación de suelo', 'Siembra', 'Reabonado N/P (día 25)', 'Reabonado N/P (día 45)', 'Cosecha (día 120)'],
  },
  {
    key: 'Cacao', emoji: '🍫',
    ciclo: '5 – 6 meses', agua: 'Alta', color: '#8B4513',
    bg: 'linear-gradient(135deg, #fdf5ee 0%, #f5dfc8 100%)',
    alerta: 'Poda de mantenimiento / Control de Monilia.',
    tareasCiclo: ['Siembra / Trasplante', 'Manejo de sombra', 'Poda fitosanitaria', 'Control Monilia', 'Cosecha'],
  },
  {
    key: 'Yuca', emoji: '🥔',
    ciclo: '8 – 12 meses', agua: 'Baja', color: '#e07b54',
    bg: 'linear-gradient(135deg, #fff5f0 0%, #fde8df 100%)',
    alerta: 'Punto de almidón (suelo seco para arranque).',
    tareasCiclo: ['Selección de estacas', 'Siembra', 'Control maleza', 'Fertilización', 'Arranque'],
  },
  {
    key: 'Plátano', emoji: '🍌',
    ciclo: '9 – 11 meses', agua: 'Muy Alta', color: '#3a9e8a',
    bg: 'linear-gradient(135deg, #eef8f5 0%, #d5f0e8 100%)',
    alerta: 'Deshije / Apuntalamiento de racimos.',
    tareasCiclo: ['Siembra de hijuelos', 'Deshije', 'Control maleza', 'Apuntalamiento', 'Cosecha del racimo'],
  },
];

const AGUA_COLOR = { 'Crítica': '#ef4444', 'Muy Alta': '#f97316', 'Alta': '#eab308', 'Baja': '#22c55e' };

export default function CropsManagement() {
  const [tab, setTab] = useState('catalogo'); // 'catalogo' | 'activas' | 'nueva'
  const [siembras, setSiembras] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ── Suscribir a siembras activas ──
  useEffect(() => {
    const q = query(collection(db, 'crops'), where('estado', '==', 'activo'));
    const unsub = onSnapshot(q, (snap) => {
      const hoy = new Date();
      setSiembras(snap.docs.map((d) => {
        const data = { id: d.id, ...d.data() };
        const inicio = data.fechaSiembra?.toDate?.() || hoy;
        data._diasTranscurridos = Math.floor((hoy - inicio) / 86400000);
        data._progreso = Math.min(100, Math.round((data._diasTranscurridos / (data.duracionDias || 120)) * 100));
        data._tareasPendientes = (data.tareas || []).filter(t => !t.completada).length;
        return data;
      }));
      setCargando(false);
    });
    return () => unsub();
  }, []);

  // ── Acciones sobre la siembra ──
  const eliminarSiembra = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta siembra permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'crops', id));
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  const toggleTarea = async (cropId, tareas, index) => {
    const nuevasTareas = [...tareas];
    nuevasTareas[index].completada = !nuevasTareas[index].completada;
    try {
      await updateDoc(doc(db, 'crops', cropId), { tareas: nuevasTareas });
    } catch (err) {
      alert('Error al actualizar tarea: ' + err.message);
    }
  };

  const cambiarFechaTarea = async (cropId, tareas, index, nuevaFechaStr) => {
    try {
      const nuevasTareas = [...tareas];
      const oldDate = nuevasTareas[index].fechaEjecucion.toDate();
      const newDate = new Date(nuevaFechaStr + 'T12:00:00'); // T12 para evitar desfase de zona horaria
      
      const diffTime = newDate.getTime() - oldDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      // Desplazar esta tarea y TODAS las siguientes por la diferencia de días
      for (let i = index; i < nuevasTareas.length; i++) {
        const d = nuevasTareas[i].fechaEjecucion.toDate();
        d.setDate(d.getDate() + diffDays);
        nuevasTareas[i].fechaEjecucion = Timestamp.fromDate(d);
      }

      // Actualizar la fecha de finalización (basada en la última tarea)
      const ultimaTareaDate = nuevasTareas[nuevasTareas.length - 1].fechaEjecucion.toDate();

      await updateDoc(doc(db, 'crops', cropId), { 
        tareas: nuevasTareas,
        fechaFinalizacion: Timestamp.fromDate(ultimaTareaDate)
      });
    } catch (err) {
      alert('Error al reprogramar: ' + err.message);
    }
  };

  const tabs = [
    { id: 'catalogo', label: '📚 Catálogo', count: null },
    { id: 'activas', label: '🌱 Siembras Activas', count: siembras.length },
    { id: 'nueva', label: '➕ Nueva Siembra', count: null },
  ];

  return (
    <div className={styles.wrapper}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🌿 Gestión de Cultivos</h1>
          <p className={styles.pageSubtitle}>Catálogo de rubros, ciclos activos y registro de nuevas siembras.</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {tabs.map(t => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count !== null && (
              <span className={styles.tabBadge}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB: CATÁLOGO ══════════════ */}
      {tab === 'catalogo' && (
        <div className={styles.catalogGrid}>
          {CATALOGO.map(rubro => (
            <div key={rubro.key} className={styles.catalogCard} style={{ background: rubro.bg }}>
              <div className={styles.catalogTop}>
                <span className={styles.catalogEmoji}>{rubro.emoji}</span>
                <div>
                  <p className={styles.catalogName}>{rubro.key}</p>
                  <p className={styles.catalogCiclo}>Ciclo: {rubro.ciclo}</p>
                </div>
                <span
                  className={styles.aguaBadge}
                  style={{ background: AGUA_COLOR[rubro.agua] + '22', color: AGUA_COLOR[rubro.agua] }}
                >
                  💧 {rubro.agua}
                </span>
              </div>

              <div className={styles.alertaBox}>
                <span className={styles.alertaLabel}>⚠️ Alerta Crítica</span>
                <p className={styles.alertaText}>{rubro.alerta}</p>
              </div>

              <div className={styles.tareasTimeline}>
                {rubro.tareasCiclo.map((t, i) => (
                  <div key={i} className={styles.timelineItem}>
                    <div className={styles.timelineDot} style={{ background: rubro.color }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════ TAB: SIEMBRAS ACTIVAS ══════════════ */}
      {tab === 'activas' && (
        <div className={styles.activasWrapper}>
          {cargando ? (
            <div className={styles.loadingCenter}>
              <span className={styles.spinner} /> Cargando siembras...
            </div>
          ) : siembras.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🌱</span>
              <p>No hay siembras activas.</p>
              <button className={styles.emptyBtn} onClick={() => setTab('nueva')}>
                + Registrar primera siembra
              </button>
            </div>
          ) : (
            <div className={styles.siembrasGrid}>
              {siembras.map(s => {
                const fechaSiembraStr = s.fechaSiembra?.toDate?.()?.toLocaleDateString('es-VE') || '—';
                const fechaFinStr = s.fechaFinalizacion?.toDate?.()?.toLocaleDateString('es-VE') || '—';
                return (
                  <div key={s.id} className={styles.siembraCard}>
                    {/* Header de la card */}
                    <div className={styles.siembraHeader}>
                      <div className={styles.siembraInfo}>
                        <span className={styles.siembraEmoji}>
                          {s.rubro === 'Maíz' ? '🌽' : s.rubro === 'Cacao' ? '🍫' : s.rubro === 'Yuca' ? '🥔' : '🍌'}
                        </span>
                        <div>
                          <p className={styles.siembraRubro}>{s.rubro}</p>
                          <p className={styles.siembraLote}>Lote {s.lote} · {s.hectareas} ha</p>
                        </div>
                      </div>
                      <div className={styles.headerActions}>
                        <span className={`${styles.estadoBadge} ${styles.estadoActivo}`}>● Activo</span>
                        <button 
                          className={styles.deleteBtn} 
                          onClick={() => eliminarSiembra(s.id)}
                          title="Eliminar siembra"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className={styles.progressSection}>
                      <div className={styles.progressHeader}>
                        <span>Día {s._diasTranscurridos} de {s.duracionDias || 120}</span>
                        <span>{s._progreso}%</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${s._progreso}%`,
                            background: s._progreso > 85 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,var(--teal-light),var(--teal-dark))'
                          }}
                        />
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className={styles.fechasRow}>
                      <div className={styles.fechaItem}>
                        <span className={styles.fechaLabel}>Siembra</span>
                        <span className={styles.fechaVal}>{fechaSiembraStr}</span>
                      </div>
                      <div className={styles.fechaDivider} />
                      <div className={styles.fechaItem}>
                        <span className={styles.fechaLabel}>Finalización</span>
                        <span className={styles.fechaVal}>{fechaFinStr}</span>
                      </div>
                    </div>

                    {/* Tareas pendientes */}
                    <div className={styles.tareasSummary}>
                      <span className={styles.tareasPendBadge}>
                        📋 {s._tareasPendientes} tarea(s) pendiente(s)
                      </span>
                    </div>

                    {/* Lista de tareas */}
                    <ul className={styles.tareasList}>
                      {(s.tareas || []).map((t, i) => {
                        // Extraer YYYY-MM-DD para el input type="date"
                        const d = t.fechaEjecucion?.toDate?.();
                        const isoDate = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
                        
                        return (
                          <li key={i} className={`${styles.tareaItem} ${t.completada ? styles.tareaCompletada : ''}`}>
                            <input 
                              type="checkbox" 
                              className={styles.tareaCheckbox}
                              checked={t.completada} 
                              onChange={() => toggleTarea(s.id, s.tareas, i)}
                              title="Marcar como completada"
                            />
                            <div className={styles.tareaDetails}>
                              <p className={styles.tareaNombre}>{t.nombre}</p>
                              <div className={styles.tareaDateEdit}>
                                📅 
                                <input 
                                  type="date" 
                                  className={styles.dateInput}
                                  value={isoDate}
                                  onChange={(e) => cambiarFechaTarea(s.id, s.tareas, i, e.target.value)}
                                  disabled={t.completada}
                                  title="Reprogramar tarea (Desplazará las siguientes)"
                                />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB: NUEVA SIEMBRA ══════════════ */}
      {tab === 'nueva' && (
        <NuevaSiembra onSiembraCreada={() => setTab('activas')} />
      )}
    </div>
  );
}
