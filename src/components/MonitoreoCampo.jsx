import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import styles from './MonitoreoCampo.module.css';

/* ── Constantes ─────────────────────────────── */
const STATUS_OPTIONS = [
  {
    id: 'saludable',
    label: 'Saludable',
    sub: 'Sin anomalías detectadas',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#86efac',
    dot: '#22c55e',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#dcfce7"/>
        <path d="M8 12l3 3 5-6" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'peste',
    label: 'Plaga / Enfermedad',
    sub: 'Requiere intervención urgente',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    dot: '#ef4444',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#fee2e2"/>
        <path d="M12 8v4m0 4h.01" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="1" fill="#dc2626"/>
      </svg>
    ),
  },
  {
    id: 'deficiencia',
    label: 'Def. Nutrientes',
    sub: 'Aplicar fertilizante',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fcd34d',
    dot: '#f59e0b',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#fef3c7"/>
        <path d="M12 7v5l3 3" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'crecimiento',
    label: 'Crecimiento Óptimo',
    sub: 'Desarrollo superior al promedio',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#93c5fd',
    dot: '#3b82f6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#dbeafe"/>
        <path d="M7 17l3-4 3 2 4-6" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

/* ── Icono de lote ──────────────────────────── */
function LoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function MonitoreoCampo() {
  const { data, showAlert, hideAlert } = useAppContext();
  const isAdmin = data?.user?.rol === 'admin' || data?.user?.rol === 'Gerencia' || data?.user?.rol === 'Administrador';
  const [activeTab, setActiveTab] = useState('registro');
  const [isDragging, setIsDragging] = useState(false);

  const [loteId, setLoteId]           = useState('');
  const [estado, setEstado]           = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [foto, setFoto]               = useState(null);
  const [preview, setPreview]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [historial, setHistorial]     = useState([]);
  const [tareasPendientes, setTareasPendientes] = useState([]);
  const [inventario, setInventario]   = useState([]);
  const [tareaId, setTareaId]         = useState('');
  const [usaInsumos, setUsaInsumos]   = useState(false);
  const [insumoId, setInsumoId]       = useState('');
  const [cantidadInsumo, setCantidadInsumo] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const dropRef = useRef(null);

  // Lotes desde cultivos activos del contexto
  const activeLotes = (data.activeCrops || []).length > 0
    ? (data.activeCrops || []).map(c => ({
        id: c.id,
        name: `Lote ${c.lote} — ${c.rubro}`,
        tipo: c.rubro,
      }))
    : [
        { id: 'lote_cacao_1',   name: 'Lote Cacao Norte',    tipo: 'cacao' },
        { id: 'lote_maiz_1',    name: 'Lote Maíz Principal', tipo: 'maiz' },
        { id: 'lote_platano_1', name: 'Lote Plátano Sur',    tipo: 'platano' },
      ];

  useEffect(() => {
    const qMon = query(collection(db, 'monitoreos'), orderBy('timestamp', 'desc'));
    const unsubMon = onSnapshot(qMon, snap =>
      setHistorial(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const qTar = query(collection(db, 'tareas'), orderBy('timestamp', 'desc'));
    const unsubTar = onSnapshot(qTar, snap =>
      setTareasPendientes(snap.docs.filter(d => d.data().status === 'pendiente').map(d => ({ id: d.id, ...d.data() })))
    );
    const qInv = query(collection(db, 'inventario'), orderBy('nombre', 'asc'));
    const unsubInv = onSnapshot(qInv, snap =>
      setInventario(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubMon(); unsubTar(); unsubInv(); };
  }, []);

  const applyFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFotoChange = e => applyFile(e.target.files[0]);

  const handleDrop = e => {
    e.preventDefault();
    setIsDragging(false);
    applyFile(e.dataTransfer.files[0]);
  };

  const removeFoto = () => { setFoto(null); setPreview(''); };

  const resetForm = () => {
    setLoteId(''); setEstado(''); setObservaciones('');
    setTareaId(''); setUsaInsumos(false); setInsumoId('');
    setCantidadInsumo(''); removeFoto(); setSuccess(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!loteId || !estado || !foto) {
      showAlert({ type: 'warning', title: 'Datos incompletos', message: 'Selecciona el lote, el estado y sube una foto de evidencia.', confirmText: 'Entendido' });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'monitoreos'), {
        loteId, estado, observaciones, fotoUrl: preview,
        encargado: data.user.nombre, encargadoEmail: data.user.email,
        tareaId: tareaId || null,
        insumosUsados: usaInsumos ? { id: insumoId, cantidad: Number(cantidadInsumo) } : null,
        timestamp: serverTimestamp()
      });
      if (tareaId) {
        await updateDoc(doc(db, 'tareas', tareaId), { status: 'completada', completadaPor: data.user.nombre, fechaCompletada: serverTimestamp() });
      }
      if (usaInsumos && insumoId && cantidadInsumo) {
        const item = inventario.find(i => i.id === insumoId);
        if (item) await updateDoc(doc(db, 'inventario', insumoId), { cantidad: item.cantidad - Number(cantidadInsumo), ultimaSalida: serverTimestamp() });
      }
      setSuccess(true);
      setTimeout(resetForm, 2800);
    } catch (err) {
      showAlert({ type: 'error', title: 'Error de Guardado', message: 'No se pudo guardar el registro.', confirmText: 'Cerrar' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = id => {
    showAlert({
      type: 'confirm', title: 'Marcar como Solucionado',
      message: '¿Confirmas que este reporte fue atendido y puede archivarse?',
      confirmText: 'Sí, Solucionado', cancelText: 'Cancelar',
      onConfirm: async () => {
        hideAlert();
        try {
          await deleteDoc(doc(db, 'monitoreos', id));
          showAlert({ type: 'success', title: 'Archivado', message: 'Reporte marcado como solucionado.', confirmText: 'Ok' });
        } catch { showAlert({ type: 'error', title: 'Error', message: 'No se pudo eliminar.', confirmText: 'Ok' }); }
      }
    });
  };

  const handleMarcarVisto = async id => {
    try { await updateDoc(doc(db, 'monitoreos', id), { vistoPor: arrayUnion(data.user.nombre) }); } catch {}
  };

  // Estadísticas rápidas
  const totalReportes = historial.length;
  const alertas = historial.filter(h => h.estado === 'peste' || h.estado === 'deficiencia').length;
  const saludables = historial.filter(h => h.estado === 'saludable').length;
  const pendientesVisto = historial.filter(h => !h.vistoPor || !h.vistoPor.includes(data.user?.nombre)).length;

  const historialFiltrado = filterEstado === 'todos' ? historial : historial.filter(h => h.estado === filterEstado);

  return (
    <div className={styles.page}>

      {/* ── Page Header ─────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.headerIcon}>
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h1 className={styles.pageTitle}>Monitoreo en Campo</h1>
            <p className={styles.pageSubtitle}>Registro Foto-Control · Estado visual de cultivos · La Yuca, Barinas</p>
          </div>
        </div>

        {/* KPI chips */}
        <div className={styles.kpiRow}>
          <div className={styles.kpi}>
            <span className={styles.kpiVal}>{totalReportes}</span>
            <span className={styles.kpiLbl}>Reportes</span>
          </div>
          <div className={`${styles.kpi} ${styles.kpiAlert}`}>
            <span className={styles.kpiVal}>{alertas}</span>
            <span className={styles.kpiLbl}>Alertas</span>
          </div>
          <div className={`${styles.kpi} ${styles.kpiGreen}`}>
            <span className={styles.kpiVal}>{saludables}</span>
            <span className={styles.kpiLbl}>Saludables</span>
          </div>
          {pendientesVisto > 0 && (
            <div className={`${styles.kpi} ${styles.kpiBadge}`}>
              <span className={styles.kpiVal}>{pendientesVisto}</span>
              <span className={styles.kpiLbl}>Sin ver</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'registro' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('registro')}
        >
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Nuevo Reporte
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'historial' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Historial
          {historial.length > 0 && <span className={styles.tabCount}>{historial.length}</span>}
        </button>
      </div>

      {/* ══ TAB: REGISTRO ═══════════════ */}
      {activeTab === 'registro' && (
        <div className={styles.formLayout}>
          <form className={styles.formCard} onSubmit={handleSubmit}>

            {/* Sección 1: Tarea + Lote */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionNum}>1</span>
                Ubicación y Contexto
              </div>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldWrapper}>
                  <label className={styles.fieldLabel}>Tarea Asignada (Opcional)</label>
                  <div className={styles.selectWrapper}>
                    <svg className={styles.selectIcon} viewBox="0 0 24 24" fill="none" width="16" height="16">
                      <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <select className={styles.select} value={tareaId} onChange={e => { setTareaId(e.target.value); const t = tareasPendientes.find(t => t.id === e.target.value); if (t) setLoteId(t.lote); }}>
                      <option value="">— Registro espontáneo —</option>
                      {tareasPendientes.map(t => (
                        <option key={t.id} value={t.id}>📌 {t.tipo} — {t.lote} ({t.creadoPor})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldWrapper}>
                  <label className={styles.fieldLabel}>Lote / Sector <span className={styles.required}>*</span></label>
                  <div className={styles.selectWrapper}>
                    <span className={styles.selectIcon} style={{display:'flex',alignItems:'center',color:'#6b7280'}}><LoteIcon /></span>
                    <select className={styles.select} value={loteId} onChange={e => setLoteId(e.target.value)} required>
                      <option value="">— Seleccionar lote —</option>
                      {activeLotes.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 2: Estado visual */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionNum}>2</span>
                Estado Visual de la Planta <span className={styles.required}>*</span>
              </div>
              <div className={styles.statusGrid}>
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${styles.statusCard} ${estado === opt.id ? styles.statusCardActive : ''}`}
                    style={estado === opt.id ? { '--sc-color': opt.color, '--sc-bg': opt.bg, '--sc-border': opt.border } : {}}
                    onClick={() => setEstado(opt.id)}
                  >
                    <div className={styles.statusIconWrap}>{opt.icon}</div>
                    <div className={styles.statusInfo}>
                      <span className={styles.statusLabel}>{opt.label}</span>
                      <span className={styles.statusSub}>{opt.sub}</span>
                    </div>
                    {estado === opt.id && (
                      <div className={styles.statusCheck}>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                          <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sección 3: Foto-Control */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionNum}>3</span>
                Foto-Control (Evidencia) <span className={styles.required}>*</span>
              </div>
              {!preview ? (
                <div
                  ref={dropRef}
                  className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <div className={styles.dropZoneInner}>
                    <div className={styles.dropIconCircle}>
                      <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8"/>
                      </svg>
                    </div>
                    <p className={styles.dropText}>Arrastra una foto aquí o <span className={styles.dropLink}>selecciona desde el dispositivo</span></p>
                    <p className={styles.dropSub}>JPG, PNG · Máx 10 MB · Cámara del dispositivo compatible</p>
                  </div>
                  <input type="file" accept="image/*" capture="environment" className={styles.fileInput} onChange={handleFotoChange} />
                </div>
              ) : (
                <div className={styles.previewWrapper}>
                  <img src={preview} alt="Vista previa" className={styles.previewImg} />
                  <div className={styles.previewOverlay}>
                    <span className={styles.previewBadge}>✓ Foto cargada</span>
                    <button type="button" className={styles.removeBtn} onClick={removeFoto}>
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                      Quitar foto
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sección 4: Insumos */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionNum}>4</span>
                Insumos Utilizados
              </div>
              <label className={styles.toggleRow}>
                <div className={`${styles.toggle} ${usaInsumos ? styles.toggleOn : ''}`} onClick={() => setUsaInsumos(p => !p)}>
                  <div className={styles.toggleThumb} />
                </div>
                <span className={styles.toggleLabel}>Se utilizaron insumos del inventario en esta visita</span>
              </label>

              {usaInsumos && (
                <div className={styles.insumosPanel}>
                  <div className={styles.insumosRow}>
                    <div style={{ flex: 1 }}>
                      <label className={styles.fieldLabel}>Insumo</label>
                      <select className={styles.select} value={insumoId} onChange={e => setInsumoId(e.target.value)} required={usaInsumos}>
                        <option value="">— Seleccionar —</option>
                        {inventario.map(item => <option key={item.id} value={item.id}>{item.nombre} ({item.cantidad} {item.unidad} disponibles)</option>)}
                      </select>
                    </div>
                    <div style={{ width: '120px' }}>
                      <label className={styles.fieldLabel}>Cantidad</label>
                      <input type="number" className={styles.input} placeholder="0" min="0" value={cantidadInsumo} onChange={e => setCantidadInsumo(e.target.value)} required={usaInsumos} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sección 5: Observaciones */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionTitle}>
                <span className={styles.sectionNum}>5</span>
                Observaciones de Campo
              </div>
              <textarea
                className={styles.textarea}
                placeholder="Describe el estado del cultivo, anomalías observadas, acciones tomadas..."
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                rows={4}
              />
            </div>

            {/* CTA Submit */}
            <button type="submit" className={`${styles.submitBtn} ${success ? styles.submitSuccess : ''}`} disabled={loading || success}>
              {loading ? (
                <><span className={styles.spinner} /> Guardando registro...</>
              ) : success ? (
                <><svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> ¡Monitoreo registrado con éxito!</>
              ) : (
                <><svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 21 17 13 7 13 7 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Guardar Monitoreo</>
              )}
            </button>
          </form>

          {/* Panel lateral de info */}
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelCard}>
              <h4 className={styles.sidePanelTitle}>
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Protocolo de Campo
              </h4>
              <ul className={styles.protocolList}>
                <li><span className={styles.protocolDot} style={{background:'#22c55e'}} />Foto en luz natural, planta centrada</li>
                <li><span className={styles.protocolDot} style={{background:'#3b82f6'}} />Registrar antes de aplicar insumos</li>
                <li><span className={styles.protocolDot} style={{background:'#f59e0b'}} />Plagas: foto de hoja afectada en detalle</li>
                <li><span className={styles.protocolDot} style={{background:'#ef4444'}} />Urgencias: notificar al supervisor inmediatamente</li>
              </ul>
            </div>

            <div className={styles.sidePanelCard}>
              <h4 className={styles.sidePanelTitle}>
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Resumen de Alertas
              </h4>
              {STATUS_OPTIONS.map(opt => {
                const count = historial.filter(h => h.estado === opt.id).length;
                return (
                  <div key={opt.id} className={styles.alertRow}>
                    <div className={styles.alertDot} style={{ background: opt.dot }} />
                    <span className={styles.alertLabel}>{opt.label}</span>
                    <span className={styles.alertCount} style={{ color: opt.color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: HISTORIAL ══════════════ */}
      {activeTab === 'historial' && (
        <div className={styles.historialSection}>
          {/* Filtros */}
          <div className={styles.filterBar}>
            <span className={styles.filterLabel}>Filtrar por estado:</span>
            <div className={styles.filterBtns}>
              {[{ id: 'todos', label: 'Todos' }, ...STATUS_OPTIONS].map(f => (
                <button
                  key={f.id}
                  className={`${styles.filterBtn} ${filterEstado === f.id ? styles.filterBtnActive : ''}`}
                  style={filterEstado === f.id && f.color ? { background: f.bg, color: f.color, borderColor: f.border } : {}}
                  onClick={() => setFilterEstado(f.id)}
                >
                  {f.id !== 'todos' && <span className={styles.filterDot} style={{ background: f.dot }} />}
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {historialFiltrado.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke="#d1d5db" strokeWidth="1.5"/>
                </svg>
              </div>
              <p className={styles.emptyText}>No hay reportes {filterEstado !== 'todos' ? `con estado "${STATUS_OPTIONS.find(s=>s.id===filterEstado)?.label}"` : 'aún'}.</p>
            </div>
          ) : (
            <div className={styles.historyGrid}>
              {historialFiltrado.map((item, idx) => {
                const statusOpt  = STATUS_OPTIONS.find(s => s.id === item.estado);
                const loteName   = activeLotes.find(l => l.id === item.loteId)?.name || item.loteId;
                const dateStr    = item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString('es-VE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Reciente';
                const yaVisto    = item.vistoPor?.includes(data.user?.nombre);
                const puedeElim  = isAdmin || data.user?.email === item.encargadoEmail;

                return (
                  <div key={item.id} className={styles.histCard} style={{ '--hc-accent': statusOpt?.color || '#6b7280', animationDelay: `${idx * 0.05}s` }}>
                    {/* Foto */}
                    {item.fotoUrl ? (
                      <div className={styles.histPhotoWrap}>
                        <img src={item.fotoUrl} alt="Evidencia" className={styles.histPhoto} />
                        {statusOpt && (
                          <div className={styles.histPhotoBadge} style={{ background: statusOpt.bg, color: statusOpt.color, borderColor: statusOpt.border }}>
                            <span className={styles.histBadgeDot} style={{ background: statusOpt.dot }} />
                            {statusOpt.label}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={styles.histNoPhoto}>
                        <svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#9ca3af" strokeWidth="1.5"/><circle cx="12" cy="13" r="4" stroke="#9ca3af" strokeWidth="1.5"/></svg>
                      </div>
                    )}

                    {/* Contenido */}
                    <div className={styles.histBody}>
                      <div className={styles.histTop}>
                        <div>
                          <h3 className={styles.histLote}>{loteName}</h3>
                          <p className={styles.histDate}>🕐 {dateStr}</p>
                        </div>
                        {!item.fotoUrl && statusOpt && (
                          <span className={styles.histStatusPill} style={{ background: statusOpt.bg, color: statusOpt.color }}>
                            {statusOpt.label}
                          </span>
                        )}
                      </div>

                      {item.observaciones && (
                        <p className={styles.histObs}>"{item.observaciones}"</p>
                      )}

                      <div className={styles.histFooter}>
                        <div className={styles.histUser}>
                          <div className={styles.histAvatar}>{item.encargado?.charAt(0)?.toUpperCase() || '?'}</div>
                          <div>
                            <p className={styles.histUserName}>{item.encargado}</p>
                            {item.vistoPor?.length > 0 && (
                              <p className={styles.histVisto}>Visto por {item.vistoPor.length} persona{item.vistoPor.length > 1 ? 's' : ''}</p>
                            )}
                          </div>
                        </div>

                        <div className={styles.histActions}>
                          {!yaVisto && (
                            <button className={styles.histBtnSec} onClick={() => handleMarcarVisto(item.id)}>
                              <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                              Visto
                            </button>
                          )}
                          {puedeElim && (
                            <button className={styles.histBtnDanger} onClick={() => handleDelete(item.id)}>
                              <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              Solucionado
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
