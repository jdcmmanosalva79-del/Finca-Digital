import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import styles from './MonitoreoCampo.module.css';

const STATUS_OPTIONS = [
  { id: 'saludable', label: 'Saludable', icon: '🟢', class: 'statusSaludable' },
  { id: 'peste', label: 'Peste / Plaga', icon: '🔴', class: 'statusPeste' },
  { id: 'deficiencia', label: 'Def. Nutrientes', icon: '🟡', class: 'statusDeficiencia' },
  { id: 'crecimiento', label: 'Crecimiento Óptimo', icon: '🔵', class: 'statusCrecimiento' },
];

export default function MonitoreoCampo() {
  const { data } = useAppContext();
  const isAdmin = data?.user?.rol === 'admin' || data?.user?.rol === 'Gerencia';
  const [activeTab, setActiveTab] = useState('registro'); // 'registro' | 'historial'
  
  const [loteId, setLoteId] = useState('');
  const [estado, setEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [tareasPendientes, setTareasPendientes] = useState([]);
  const [inventario, setInventario] = useState([]);
  
  const [tareaId, setTareaId] = useState('');
  const [usaInsumos, setUsaInsumos] = useState(false);
  const [insumoId, setInsumoId] = useState('');
  const [cantidadInsumo, setCantidadInsumo] = useState('');

  // Generamos una lista de lotes activos basados en el contexto
  const activeLotes = [
    { id: 'lote_cacao_1', name: 'Lote Cacao Norte', tipo: 'cacao' },
    { id: 'lote_maiz_1', name: 'Lote Maíz Principal', tipo: 'maiz' },
    { id: 'lote_platano_1', name: 'Lote Plátano Sur', tipo: 'platano' },
  ];

  useEffect(() => {
    // Escuchar historial de monitoreos
    const qMon = query(collection(db, 'monitoreos'), orderBy('timestamp', 'desc'));
    const unsubMon = onSnapshot(qMon, (snap) => {
      setHistorial(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Escuchar tareas pendientes
    const qTar = query(collection(db, 'tareas'), orderBy('timestamp', 'desc'));
    const unsubTar = onSnapshot(qTar, (snap) => {
      setTareasPendientes(snap.docs.filter(d => d.data().status === 'pendiente').map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Escuchar inventario (para descontar insumos)
    const qInv = query(collection(db, 'inventario'), orderBy('nombre', 'asc'));
    const unsubInv = onSnapshot(qInv, (snap) => {
      setInventario(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubMon();
      unsubTar();
      unsubInv();
    };
  }, []);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFoto = () => {
    setFoto(null);
    setPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loteId || !estado || !foto) {
      alert("Por favor selecciona el lote, el estado y sube una foto de evidencia.");
      return;
    }

    setLoading(true);
    try {
      // 1. Simular carga de foto a Firebase Storage (o Cloudinary)
      // En un flujo real: const photoUrl = await uploadBytes(ref, foto);
      const fakePhotoUrl = preview; // Usando Data URI por ahora

      // 2. Guardar registro en Firestore
      await addDoc(collection(db, 'monitoreos'), {
        loteId,
        estado,
        observaciones,
        fotoUrl: fakePhotoUrl,
        encargado: data.user.nombre,
        encargadoEmail: data.user.email,
        tareaId: tareaId || null,
        insumosUsados: usaInsumos ? { id: insumoId, cantidad: Number(cantidadInsumo) } : null,
        timestamp: serverTimestamp()
      });

      // 3. Si hay tarea asociada, marcarla como completada
      if (tareaId) {
        await updateDoc(doc(db, 'tareas', tareaId), {
          status: 'completada',
          completadaPor: data.user.nombre,
          fechaCompletada: serverTimestamp()
        });
      }

      // 4. Si usó insumos, descontar del inventario
      if (usaInsumos && insumoId && cantidadInsumo) {
        const itemInv = inventario.find(i => i.id === insumoId);
        if (itemInv) {
          await updateDoc(doc(db, 'inventario', insumoId), {
            cantidad: itemInv.cantidad - Number(cantidadInsumo),
            ultimaSalida: serverTimestamp()
          });
        }
      }

      setSuccess(true);
      // Reset form
      setTimeout(() => {
        setLoteId('');
        setEstado('');
        setObservaciones('');
        setTareaId('');
        setUsaInsumos(false);
        setInsumoId('');
        setCantidadInsumo('');
        removeFoto();
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error("Error al guardar monitoreo:", error);
      alert("Hubo un error al guardar el registro.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro que deseas marcar este reporte como solucionado y eliminarlo?")) {
      try {
        await deleteDoc(doc(db, 'monitoreos', id));
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const handleMarcarVisto = async (id) => {
    try {
      await updateDoc(doc(db, 'monitoreos', id), {
        vistoPor: arrayUnion(data.user.nombre)
      });
    } catch (error) {
      console.error("Error al marcar como visto:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Monitoreo en Campo</h2>
          <p className={styles.subtitle}>Registro fotográfico (Foto-Control) y estado visual de las plantas.</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'registro' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('registro')}
        >
          📝 Subir Monitoreo
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'historial' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          📷 Historial Fotográfico {isAdmin ? '(Admin View)' : ''}
        </button>
      </div>

      {activeTab === 'registro' && (
        <form className={styles.formCard} onSubmit={handleSubmit}>
          
          {/* Tarea Asociada */}
          <div className={styles.formGroup}>
            <label className={styles.label}>¿Es parte de una Tarea Asignada? (Opcional)</label>
            <select 
              className={styles.select}
              value={tareaId}
              onChange={(e) => {
                setTareaId(e.target.value);
                // Auto-seleccionar el lote si la tarea lo tiene
                const task = tareasPendientes.find(t => t.id === e.target.value);
                if (task) setLoteId(task.lote);
              }}
            >
              <option value="">-- No, registro espontáneo --</option>
              {tareasPendientes.map(tarea => (
                <option key={tarea.id} value={tarea.id}>
                  📌 {tarea.tipo} - {tarea.lote} (Asignado por: {tarea.creadoPor})
                </option>
              ))}
            </select>
          </div>

          {/* Lote Selection */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Selecciona el Lote o Sector</label>
            <select 
              className={styles.select}
              value={loteId}
              onChange={(e) => setLoteId(e.target.value)}
              required
            >
              <option value="">-- Elige un lote --</option>
              {activeLotes.map(lote => (
                <option key={lote.id} value={lote.id}>
                  {lote.name} ({lote.tipo})
                </option>
              ))}
            </select>
          </div>

          {/* Insumos Logic */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <input 
                type="checkbox" 
                id="usaInsumos" 
                checked={usaInsumos} 
                onChange={e => setUsaInsumos(e.target.checked)} 
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="usaInsumos" className={styles.label} style={{ margin: 0 }}>¿Utilizaste insumos del inventario?</label>
            </div>

            {usaInsumos && (
              <div className={styles.insumosBox}>
                <div className={styles.formRow}>
                  <select 
                    className={styles.select} 
                    value={insumoId} 
                    onChange={e => setInsumoId(e.target.value)}
                    required={usaInsumos}
                  >
                    <option value="">-- Selecciona el Insumo --</option>
                    {inventario.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nombre} ({item.cantidad} {item.unidad} disp.)
                      </option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    className={styles.input} 
                    placeholder="Cant." 
                    value={cantidadInsumo}
                    onChange={e => setCantidadInsumo(e.target.value)}
                    required={usaInsumos}
                    style={{ width: '100px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Estado Visual Selection */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Estado Visual de la Planta</label>
            <div className={styles.statusGrid}>
              {STATUS_OPTIONS.map(opt => (
                <div 
                  key={opt.id}
                  className={`${styles.statusCard} ${estado === opt.id ? styles.active : ''} ${styles[opt.class]}`}
                  onClick={() => setEstado(opt.id)}
                >
                  <span className={styles.statusIcon}>{opt.icon}</span>
                  <span className={styles.statusName}>{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Foto-Control Upload */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Foto-Control (Evidencia)</label>
            {!preview ? (
              <div className={styles.photoUploadArea}>
                <span className={styles.uploadIcon}>📸</span>
                <span className={styles.uploadText}>Toca para tomar una foto o subir</span>
                <span className={styles.uploadSubtext}>Solo imágenes JPG o PNG</span>
                <input 
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  className={styles.fileInput}
                  onChange={handleFotoChange}
                />
              </div>
            ) : (
              <div className={styles.photoUploadArea} style={{ padding: 0 }}>
                <img src={preview} alt="Vista previa" className={styles.previewImage} />
                <button type="button" className={styles.removePhotoBtn} onClick={removeFoto}>
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Novedades u Observaciones (Opcional)</label>
            <textarea 
              className={styles.textarea}
              placeholder="Escribe detalles sobre la plaga, o el estado del cultivo..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={loading || success}
            style={success ? { background: '#22c55e' } : {}}
          >
            {loading ? 'Subiendo registro...' : success ? '¡Registro Guardado! ✅' : 'Guardar Monitoreo'}
          </button>

        </form>
      )}

      {activeTab === 'historial' && (
        <div className={styles.historyGrid}>
          {historial.length === 0 ? (
            <p style={{ color: 'var(--gray-500)' }}>No hay reportes de monitoreo aún.</p>
          ) : (
            historial.map(item => {
              const statusOpt = STATUS_OPTIONS.find(s => s.id === item.estado);
              const loteName = activeLotes.find(l => l.id === item.loteId)?.name || item.loteId;
              const dateStr = item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString('es-VE') : 'Reciente';
              
              return (
                <div key={item.id} className={styles.historyCard}>
                  {item.fotoUrl && (
                    <img src={item.fotoUrl} alt="Evidencia" className={styles.historyPhoto} />
                  )}
                  <div className={styles.historyContent}>
                    <div className={styles.historyHeader}>
                      <h3 className={styles.historyLote}>{loteName}</h3>
                      <span className={styles.historyDate}>{dateStr}</span>
                    </div>
                    {statusOpt && (
                      <span className={`${styles.historyStatus} ${styles[statusOpt.id]}`}>
                        {statusOpt.icon} {statusOpt.label}
                      </span>
                    )}
                    {item.observaciones && (
                      <p className={styles.historyObs}>"{item.observaciones}"</p>
                    )}
                    <div className={styles.historyUser}>
                      <p style={{ margin: '0 0 4px 0' }}><strong>Reportado por:</strong> {item.encargado}</p>
                      {item.vistoPor && item.vistoPor.length > 0 && (
                        <p style={{ margin: '0', color: 'var(--teal-dark)' }}>
                          <strong>Visto por:</strong> {item.vistoPor.join(', ')}
                        </p>
                      )}
                    </div>
                    
                    <div className={styles.cardActions} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {(!item.vistoPor || !item.vistoPor.includes(data.user.nombre)) && (
                        <button 
                          onClick={() => handleMarcarVisto(item.id)}
                          style={{ flex: 1, padding: '6px', fontSize: '12px', background: 'var(--gray-100)', border: '1px solid var(--gray-300)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          👁️ Marcar Visto
                        </button>
                      )}
                      
                      {(isAdmin || data.user.email === item.encargadoEmail) && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          style={{ flex: 1, padding: '6px', fontSize: '12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          ✔️ Solucionado (Borrar)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
