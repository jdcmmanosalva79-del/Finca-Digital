import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import NuevaSiembra from './NuevaSiembra';
import FieldMap from './FieldMap';
import styles from './CropsManagement.module.css';

const CATALOGO = [
  { key: 'Maíz', emoji: '🌽', ciclo: '100 – 120 días', agua: 'Crítica', color: '#c8860a', bg: 'linear-gradient(135deg, #fff9ee 0%, #fef0cc 100%)', alerta: 'Control de maleza / Fertilización nitrogenada días 25 y 45.', tareasCiclo: ['Preparación de suelo', 'Siembra', 'Reabonado N/P (día 25)', 'Reabonado N/P (día 45)', 'Cosecha (día 120)'] },
  { key: 'Cacao', emoji: '🍫', ciclo: '5 – 6 meses', agua: 'Alta', color: '#8B4513', bg: 'linear-gradient(135deg, #fdf5ee 0%, #f5dfc8 100%)', alerta: 'Poda de mantenimiento / Control de Monilia.', tareasCiclo: ['Siembra / Trasplante', 'Manejo de sombra', 'Poda fitosanitaria', 'Control Monilia', 'Cosecha'] },
  { key: 'Yuca', emoji: '🥔', ciclo: '8 – 12 meses', agua: 'Baja', color: '#e07b54', bg: 'linear-gradient(135deg, #fff5f0 0%, #fde8df 100%)', alerta: 'Punto de almidón (suelo seco para arranque).', tareasCiclo: ['Selección de estacas', 'Siembra', 'Control maleza', 'Fertilización', 'Arranque'] },
  { key: 'Plátano', emoji: '🍌', ciclo: '9 – 11 meses', agua: 'Muy Alta', color: '#3a9e8a', bg: 'linear-gradient(135deg, #eef8f5 0%, #d5f0e8 100%)', alerta: 'Deshije / Apuntalamiento de racimos.', tareasCiclo: ['Siembra de hijuelos', 'Deshije', 'Control maleza', 'Apuntalamiento', 'Cosecha del racimo'] },
];

function safeToDate(timestamp) {
  try {
    if (!timestamp) return new Date();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch (e) {
    return new Date();
  }
}

export default function CropsManagement() {
  const [tab, setTab] = useState('catalogo');
  const [siembras, setSiembras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editModal, setEditModal] = useState(null); 
  const [taskModal, setTaskModal] = useState(null); 

  useEffect(() => {
    const q = query(collection(db, 'crops'), where('estado', '==', 'activo'));
    const unsub = onSnapshot(q, (snap) => {
      const hoy = new Date();
      setSiembras(snap.docs.map((d) => {
        const data = { id: d.id, ...d.data() };
        const inicio = safeToDate(data.fechaSiembra);
        data._diasTranscurridos = Math.max(0, Math.floor((hoy - inicio) / 86400000));
        data._progreso = Math.min(100, Math.round((data._diasTranscurridos / (data.duracionDias || 120)) * 100));
        data._tareasPendientes = (Array.isArray(data.tareas) ? data.tareas : []).filter(t => !t.completada).length;
        return data;
      }));
      setCargando(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  const eliminarSiembra = async (id) => {
    if (window.confirm('¿Deseas eliminar esta siembra y todas sus tareas?')) {
      try { await deleteDoc(doc(db, 'crops', id)); } catch (err) { alert(err.message); }
    }
  };

  const toggleTarea = async (cropId, tareas, index) => {
    const nuevasTareas = [...(Array.isArray(tareas) ? tareas : [])];
    if (nuevasTareas[index]) {
      nuevasTareas[index].completada = !nuevasTareas[index].completada;
      try { await updateDoc(doc(db, 'crops', cropId), { tareas: nuevasTareas }); } catch (err) { alert(err.message); }
    }
  };

  const handleUpdateCrop = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'crops', editModal.id), {
        lote: editModal.lote,
        hectareas: Number(editModal.hectareas),
        duracionDias: Number(editModal.duracionDias)
      });
      setEditModal(null);
    } catch (err) { alert(err.message); }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    const crop = siembras.find(s => s.id === taskModal.cropId);
    if (!crop) return;
    let nuevasTareas = [...(Array.isArray(crop.tareas) ? crop.tareas : [])];

    const taskData = {
      nombre: taskModal.nombre,
      tipo: taskModal.tipo || 'general',
      fechaEjecucion: Timestamp.fromDate(new Date(taskModal.fecha + 'T12:00:00')),
      completada: taskModal.completada || false
    };

    if (taskModal.index !== null) {
      nuevasTareas[taskModal.index] = taskData;
    } else {
      nuevasTareas.push(taskData);
      nuevasTareas.sort((a, b) => safeToDate(a.fechaEjecucion).getTime() - safeToDate(b.fechaEjecucion).getTime());
    }

    try {
      await updateDoc(doc(db, 'crops', taskModal.cropId), { tareas: nuevasTareas });
      setTaskModal(null);
    } catch (err) { alert(err.message); }
  };

  const eliminarTarea = async (cropId, index) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    const crop = siembras.find(s => s.id === cropId);
    if (!crop || !Array.isArray(crop.tareas)) return;
    const nuevasTareas = crop.tareas.filter((_, i) => i !== index);
    try { await updateDoc(doc(db, 'crops', cropId), { tareas: nuevasTareas }); } catch (err) { alert(err.message); }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🌿 Gestión de Cultivos</h1>
      </div>

      <div className={styles.tabs}>
        {['catalogo', 'activas', 'nueva', 'mapa'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'catalogo' ? '📚 Catálogo' : t === 'activas' ? '🌱 Activas' : t === 'nueva' ? '➕ Nueva' : '🗺️ Mapa'}
          </button>
        ))}
      </div>

      {cargando && tab === 'activas' && (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Sincronizando con la finca...</p>
        </div>
      )}

      {tab === 'catalogo' && (
        <div className={styles.catalogGrid}>
          {CATALOGO.map(rubro => (
            <div key={rubro.key} className={styles.catalogCard} style={{ background: rubro.bg }}>
              <div className={styles.catalogTop}>
                <span className={styles.catalogEmoji}>{rubro.emoji}</span>
                <p className={styles.catalogName}>{rubro.key}</p>
              </div>
              <p className={styles.alertaText}>{rubro.alerta}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'activas' && !cargando && (
        <div className={styles.siembrasGrid}>
          {siembras.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No se encontraron siembras activas en este momento.</p>
              <button onClick={() => setTab('nueva')} className={styles.confirmBtn}>Registrar Nueva Siembra</button>
            </div>
          ) : (
            siembras.map(s => (
              <div key={s.id} className={styles.siembraCard}>
                <div className={styles.siembraHeader}>
                  <div>
                    <h3 className={styles.siembraRubro}>{s.rubro} - Lote {s.lote}</h3>
                    <p className={styles.siembraMeta}>{s.hectareas} ha · {s.duracionDias} días</p>
                  </div>
                  <div className={styles.headerActions}>
                    <button onClick={() => setEditModal(s)} className={styles.iconBtn}>✏️</button>
                    <button onClick={() => eliminarSiembra(s.id)} className={styles.iconBtn}>🗑️</button>
                  </div>
                </div>

                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${s._progreso}%` }} /></div>
                  <span className={styles.progressLabel}>{s._progreso}% completado</span>
                </div>

                <div className={styles.tasksSection}>
                  <div className={styles.tasksHeader}>
                    <h4 className={styles.tasksTitle}>Bitácora de Tareas</h4>
                    <button className={styles.addTaskBtn} onClick={() => setTaskModal({ cropId: s.id, index: null, nombre: '', tipo: 'general', fecha: '' })}>+ Tarea</button>
                  </div>
                  <ul className={styles.tareasList}>
                    {(Array.isArray(s.tareas) ? s.tareas : []).map((t, i) => (
                      <li key={i} className={styles.tareaItem}>
                        <input type="checkbox" checked={t.completada} onChange={() => toggleTarea(s.id, s.tareas, i)} />
                        <div className={styles.tareaDetails} onClick={() => setTaskModal({ cropId: s.id, index: i, ...t, fecha: safeToDate(t.fechaEjecucion).toISOString().split('T')[0] })}>
                          <span className={styles.tareaName}>{t.nombre || 'Tarea General'}</span>
                          <span className={styles.tareaDate}>{safeToDate(t.fechaEjecucion).toLocaleDateString()}</span>
                        </div>
                        <button onClick={() => eliminarTarea(s.id, i)} className={styles.deleteTaskBtn}>×</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'nueva' && <NuevaSiembra onSiembraCreada={() => setTab('activas')} />}

      {tab === 'mapa' && (
        <div className={styles.mapSection}>
          <FieldMap />
        </div>
      )}

      {editModal && (
        <div className={styles.modalOverlay} onClick={() => setEditModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>Editar Siembra: {editModal.rubro}</h2>
            <form onSubmit={handleUpdateCrop} className={styles.modalForm}>
              <label>Lote / Potrero</label>
              <input value={editModal.lote} onChange={e => setEditModal({ ...editModal, lote: e.target.value })} />
              <label>Hectáreas</label>
              <input type="number" value={editModal.hectareas} onChange={e => setEditModal({ ...editModal, hectareas: e.target.value })} />
              <label>Duración (días)</label>
              <input type="number" value={editModal.duracionDias} onChange={e => setEditModal({ ...editModal, duracionDias: e.target.value })} />
              <button type="submit" className={styles.confirmBtn}>Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {taskModal && (
        <div className={styles.modalOverlay} onClick={() => setTaskModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>{taskModal.index !== null ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
            <form onSubmit={handleTaskSubmit} className={styles.modalForm}>
              <label>Nombre de la tarea</label>
              <input value={taskModal.nombre} onChange={e => setTaskModal({ ...taskModal, nombre: e.target.value })} required />
              <label>Fecha Programada</label>
              <input type="date" value={taskModal.fecha} onChange={e => setTaskModal({ ...taskModal, fecha: e.target.value })} required />
              <button type="submit" className={styles.confirmBtn}>Guardar Tarea</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
