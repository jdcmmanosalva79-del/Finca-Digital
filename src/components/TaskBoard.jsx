import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import styles from './TaskBoard.module.css';

const COLUMNS = [
  { id: 'todo', label: 'Pendientes', color: '#f59e0b', icon: '⏳' },
  { id: 'doing', label: 'En Progreso', color: '#3b82f6', icon: '🔄' },
  { id: 'done', label: 'Completado', color: '#10b981', icon: '✅' }
];

const PRIORITIES = [
  { value: 'low', label: 'Baja', color: '#10b981' },
  { value: 'medium', label: 'Media', color: '#f59e0b' },
  { value: 'high', label: 'Alta', color: '#ef4444' }
];

export default function TaskBoard() {
  const { data, showAlert } = useAppContext();
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', desc: '', worker: '', priority: 'medium', category: '' });

  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        const taskRef = doc(db, 'tasks', editingTask.id);
        await updateDoc(taskRef, {
          ...newTask,
          updatedAt: serverTimestamp()
        });
        showAlert({ type: 'success', title: 'Tarea Actualizada', message: 'La tarea ha sido actualizada exitosamente.' });
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...newTask,
          status: 'todo',
          createdAt: serverTimestamp(),
          createdBy: data.user.nombre
        });
        showAlert({ type: 'success', title: 'Tarea Creada', message: 'La tarea ha sido creada exitosamente.' });
      }
      setIsModalOpen(false);
      setEditingTask(null);
      setNewTask({ title: '', desc: '', worker: '', priority: 'medium', category: '' });
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      desc: task.desc,
      worker: task.worker,
      priority: task.priority || 'medium',
      category: task.category || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      showAlert({ type: 'success', title: 'Tarea Eliminada', message: 'La tarea ha sido eliminada exitosamente.' });
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    const p = PRIORITIES.find(p => p.value === priority);
    return p ? p.color : '#64748b';
  };

  const getPriorityLabel = (priority) => {
    const p = PRIORITIES.find(p => p.value === priority);
    return p ? p.label : 'Media';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h2 className={styles.title}>Gestión de Tareas</h2>
            <p className={styles.subtitle}>Asigna y supervisa las labores de campo en tiempo real.</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{tasks.length}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{tasks.filter(t => t.status === 'done').length}</span>
              <span className={styles.statLabel}>Completadas</span>
            </div>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditingTask(null); setNewTask({ title: '', desc: '', worker: '', priority: 'medium', category: '' }); setIsModalOpen(true); }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva Labor
        </button>
      </header>

      <div className={styles.board}>
        {COLUMNS.map(col => (
          <div key={col.id} className={styles.column}>
            <div className={styles.colHeader} style={{ borderTop: `4px solid ${col.color}` }}>
              <div className={styles.colHeaderLeft}>
                <span className={styles.colIcon}>{col.icon}</span>
                <h3>{col.label}</h3>
              </div>
              <span className={styles.count}>{tasks.filter(t => t.status === col.id).length}</span>
            </div>
            <div className={styles.colContent}>
              {tasks.filter(t => t.status === col.id).map(task => (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <span 
                      className={styles.priorityBadge} 
                      style={{ backgroundColor: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                    <div className={styles.taskActions}>
                      <button className={styles.actionBtn} onClick={() => handleEditTask(task)} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className={styles.actionBtn} onClick={() => handleDeleteTask(task.id)} title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h4 className={styles.taskTitle}>{task.title}</h4>
                  {task.category && <span className={styles.categoryBadge}>{task.category}</span>}
                  <p className={styles.taskDesc}>{task.desc}</p>
                  <div className={styles.taskFooter}>
                    <div className={styles.workerInfo}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>{task.worker}</span>
                    </div>
                    <div className={styles.moveActions}>
                      {col.id !== 'todo' && (
                        <button className={styles.moveBtn} onClick={() => moveTask(task.id, 'todo')} title="Mover a Pendientes">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10" />
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                          </svg>
                        </button>
                      )}
                      {col.id === 'todo' && (
                        <button className={styles.moveBtn} onClick={() => moveTask(task.id, 'doing')} title="Mover a En Progreso">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </button>
                      )}
                      {col.id === 'doing' && (
                        <button className={styles.moveBtn} onClick={() => moveTask(task.id, 'done')} title="Mover a Completado">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === col.id).length === 0 && (
                <div className={styles.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p>Sin tareas</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
            <form onSubmit={handleAddTask}>
              <div className={styles.formGroup}>
                <label>Título de la labor</label>
                <input 
                  type="text" 
                  placeholder="Ej: Fumigar lote norte" 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Categoría</label>
                <select
                  value={newTask.category}
                  onChange={e => setNewTask({...newTask, category: e.target.value})}
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Cosecha">Cosecha</option>
                  <option value="Siembra">Siembra</option>
                  <option value="Fumigación">Fumigación</option>
                  <option value="Riego">Riego</option>
                  <option value="Fertilización">Fertilización</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Prioridad</label>
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask({...newTask, priority: e.target.value})}
                >
                  {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Descripción / Instrucciones</label>
                <textarea 
                  placeholder="Detalles sobre el producto a usar o área específica..." 
                  value={newTask.desc} 
                  onChange={e => setNewTask({...newTask, desc: e.target.value})} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Encargado</label>
                <input 
                  type="text" 
                  placeholder="Nombre del trabajador" 
                  value={newTask.worker} 
                  onChange={e => setNewTask({...newTask, worker: e.target.value})} 
                  required 
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => { setIsModalOpen(false); setEditingTask(null); }}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>{editingTask ? 'Actualizar' : 'Crear'} Tarea</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
