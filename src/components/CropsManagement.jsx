import { useState } from 'react';
import { doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import NuevaSiembra from './NuevaSiembra';
import CropIcon from './CropIcon';
import { CROP_CATALOG, getCropMetadata } from '../server/constants/crops';
import { safeToDate, formatDate } from '../utils/dateUtils';

import styles from './CropsManagement.module.css';


export default function CropsManagement() {
  const [editModal, setEditModal] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const [nuevaSiembraModal, setNuevaSiembraModal] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [filtroCultivo, setFiltroCultivo] = useState('todos');
  const { data, loading, showAlert, hideAlert } = useAppContext();

  const siembras = data.activeCrops || [];

  const siembrasFiltradas = filtroCultivo === 'todos' 
    ? siembras 
    : siembras.filter(s => s.rubro === filtroCultivo);

  const toggleCardExpand = (id) => {
    setExpandedCardId(prevId => prevId === id ? null : id);
  };

  const eliminarSiembra = async (id) => {
    showAlert({
      type: 'warning',
      title: '¿Eliminar siembra?',
      message: '¿Deseas eliminar esta siembra y todas sus tareas? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        hideAlert();
        try { 
          await deleteDoc(doc(db, 'crops', id)); 
          showAlert({
            type: 'success',
            title: 'Siembra Eliminada',
            message: 'El registro del cultivo ha sido removido.',
            confirmText: 'Ok'
          });
        } catch (err) { 
          showAlert({ type: 'error', title: 'Error', message: err.message });
        }
      }
    });
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
    showAlert({
      type: 'warning',
      title: '¿Eliminar tarea?',
      message: '¿Estás seguro de que deseas eliminar esta tarea de la bitácora?',
      confirmText: 'Sí, eliminar',
      cancelText: 'No',
      onConfirm: async () => {
        hideAlert();
        const crop = siembras.find(s => s.id === cropId);
        if (!crop || !Array.isArray(crop.tareas)) return;
        const nuevasTareas = crop.tareas.filter((_, i) => i !== index);
        try { 
          await updateDoc(doc(db, 'crops', cropId), { tareas: nuevasTareas }); 
        } catch (err) { 
          showAlert({ type: 'error', title: 'Error', message: err.message });
        }
      }
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🌿 Gestión de Cultivos</h1>
        <div className={styles.headerActions}>
          <select 
            className={styles.filtroSelect} 
            value={filtroCultivo} 
            onChange={(e) => setFiltroCultivo(e.target.value)}
          >
            <option value="todos">Todos los Cultivos</option>
            {CROP_CATALOG.map(c => (
              <option key={c.key} value={c.key}>{c.key}</option>
            ))}
          </select>
          <button className={styles.nuevaSiembraBtn} onClick={() => setNuevaSiembraModal(true)}>
            + Nueva Siembra
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Sincronizando con la finca...</p>
        </div>
      )}

      {!loading && (
        <div className={styles.siembrasGrid}>
          {siembras.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No se encontraron siembras activas en este momento.</p>
              <button onClick={() => setNuevaSiembraModal(true)} className={styles.confirmBtn}>Registrar Nueva Siembra</button>
            </div>
          ) : (
            siembrasFiltradas.map(s => {
              const meta = getCropMetadata(s.rubro);
              const totalTareas = Array.isArray(s.tareas) ? s.tareas.length : 0;
              const tareasCompletadas = Array.isArray(s.tareas) ? s.tareas.filter(t => t.completada).length : 0;
              
              let aguaClass = styles.aguaBaja;
              if (meta.agua === 'Crítica') aguaClass = styles.aguaCritica;
              else if (meta.agua === 'Alta' || meta.agua === 'Muy Alta') aguaClass = styles.aguaAlta;

              return (
                <div 
                  key={s.id} 
                  className={styles.siembraCard}
                  style={{
                    '--crop-accent': meta.color || '#10b981',
                    '--crop-bg-gradient': meta.bg || 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                  }}
                >
                  <div className={styles.siembraHeader}>
                    <div className={styles.siembraTitleGroup}>
                      <span 
                        className={styles.cropEmojiBadge}
                        style={{ 
                          borderColor: meta.color || '#10b981',
                          backgroundColor: `${meta.color || '#10b981'}15`
                        }}
                      >
                        <CropIcon rubro={s.rubro} className={styles.cropIconSvg} />
                      </span>
                      <div className={styles.cropTextGroup}>
                        <h3 className={styles.siembraRubro}>{s.rubro}</h3>
                        <span className={styles.loteBadge}>Lote {s.lote}</span>
                      </div>
                    </div>
                    <div className={styles.headerActions}>
                      <button 
                        onClick={() => toggleCardExpand(s.id)} 
                        className={`${styles.iconBtn} ${expandedCardId === s.id ? styles.activeExpandBtn : ''}`} 
                        title={expandedCardId === s.id ? 'Colapsar Bitácora' : 'Ver Bitácora'}
                      >
                        {expandedCardId === s.id ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        )}
                      </button>
                      <button onClick={() => setEditModal(s)} className={styles.iconBtn} title="Editar Cultivo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => eliminarSiembra(s.id)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Eliminar Cultivo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>

                  <div className={styles.cropStatsGrid}>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{s.hectareas} ha</span>
                      <span className={styles.statLabel}>SUPERFICIE</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{s.duracionDias} días</span>
                      <span className={styles.statLabel}>DURACIÓN</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={`${styles.statValue} ${styles.waterVal} ${aguaClass}`}>{meta.agua}</span>
                      <span className={styles.statLabel}>AGUA</span>
                    </div>
                  </div>

                  <div className={styles.progressSection}>
                    <div className={styles.progressTextInfo}>
                      <span className={styles.progressPercentage}>{s._progreso}% completado</span>
                      {totalTareas > 0 && (
                        <span className={styles.taskSummaryText}>
                          ✓ {tareasCompletadas}/{totalTareas} Tareas
                        </span>
                      )}
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ 
                          width: `${s._progreso}%`,
                          background: `linear-gradient(90deg, var(--crop-accent) 0%, #10b981 100%)`
                        }} 
                      />
                    </div>
                    
                    <div className={styles.timelineDates}>
                      <div className={styles.dateGroup}>
                        <span className={styles.dateIcon}>📅</span>
                        <div className={styles.dateTexts}>
                          <span className={styles.dateTitle}>Siembra</span>
                          <span className={styles.dateVal}>{formatDate(s.fechaSiembra)}</span>
                        </div>
                      </div>
                      <div className={styles.dateGroup}>
                        <span className={styles.dateIcon}>🏁</span>
                        <div className={styles.dateTexts}>
                          <span className={styles.dateTitle}>Cosecha</span>
                          <span className={styles.dateVal}>{formatDate(s.fechaFinalizacion)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedCardId === s.id && (
                    <div className={styles.tasksSection}>
                      <div className={styles.tasksHeader}>
                        <h4 className={styles.tasksTitle}>Bitácora de Actividades</h4>
                        <button 
                          className={styles.addTaskBtn} 
                          onClick={() => setTaskModal({ cropId: s.id, index: null, nombre: '', tipo: 'general', fecha: '' })}
                        >
                          + Agregar Tarea
                        </button>
                      </div>
                      <ul className={styles.tareasList}>
                        {(Array.isArray(s.tareas) ? s.tareas : []).map((t, i) => {
                          let badgeStyle = styles.badgeGeneral;
                          if (t.tipo === 'riego') badgeStyle = styles.badgeRiego;
                          else if (t.tipo === 'fertilizacion') badgeStyle = styles.badgeFertilizacion;
                          else if (t.tipo === 'poda') badgeStyle = styles.badgePoda;
                          else if (t.tipo === 'cosecha') badgeStyle = styles.badgeCosecha;

                          return (
                            <li key={i} className={`${styles.tareaItem} ${t.completada ? styles.tareaItemCompletada : ''}`}>
                              <label className={styles.checkboxContainer}>
                                <input 
                                  type="checkbox" 
                                  checked={t.completada} 
                                  onChange={() => toggleTarea(s.id, s.tareas, i)} 
                                  className={styles.tareaCheckboxInput}
                                />
                                <span className={styles.customCheckbox} />
                              </label>
                              
                              <div 
                                className={styles.tareaDetails} 
                                onClick={() => setTaskModal({ 
                                  cropId: s.id, 
                                  index: i, 
                                  ...t, 
                                  fecha: safeToDate(t.fechaEjecucion).toISOString().split('T')[0] 
                                })}
                              >
                                <div className={styles.tareaRow}>
                                  <span className={styles.tareaName}>{t.nombre || 'Tarea General'}</span>
                                  {t.tipo && <span className={`${styles.tareaTypeBadge} ${badgeStyle}`}>{t.tipo}</span>}
                                </div>
                                <span className={styles.tareaDate}>📅 {formatDate(t.fechaEjecucion)}</span>
                              </div>
                              <button onClick={() => eliminarTarea(s.id, i)} className={styles.deleteTaskBtn}>×</button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {nuevaSiembraModal && (
        <div className={styles.modalOverlay} onClick={() => setNuevaSiembraModal(false)}>
          <div className={styles.modalLarge} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nueva Siembra</h2>
              <button className={styles.modalCloseBtn} onClick={() => setNuevaSiembraModal(false)}>×</button>
            </div>
            <NuevaSiembra onSiembraCreada={() => setNuevaSiembraModal(false)} />
          </div>
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
              
              <label>Tipo de tarea</label>
              <select 
                value={taskModal.tipo || 'general'} 
                onChange={e => setTaskModal({ ...taskModal, tipo: e.target.value })}
                className={styles.modalSelect}
              >
                <option value="general">⚙️ General</option>
                <option value="riego">💧 Riego</option>
                <option value="fertilizacion">🌱 Fertilización</option>
                <option value="poda">✂️ Poda</option>
                <option value="cosecha">🚜 Cosecha</option>
              </select>

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
