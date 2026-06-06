import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import { formatDate, safeToDate } from '../utils/dateUtils';
import styles from './DashboardAlertas.module.css';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export default function DashboardAlertas() {
  const { data, loading: contextLoading } = useAppContext();
  const [alertaClima, setAlertaClima] = useState(null);
  const [rendimiento, setRendimiento] = useState('');
  const [finalizando, setFinalizando] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [modal, setModal] = useState(null);

  const cropActivos = data.activeCrops || [];

  const getCropBgClass = (rubro) => {
    const r = rubro?.toLowerCase() || '';
    if (r.includes('maíz') || r.includes('maiz')) return styles.bgMaiz;
    if (r.includes('cacao')) return styles.bgCacao;
    if (r.includes('yuca')) return styles.bgYuca;
    if (r.includes('plátano') || r.includes('platano')) return styles.bgPlatano;
    if (r.includes('café') || r.includes('cafe')) return styles.bgCafe;
    return styles.bgDefault;
  };
  
  // Calculate upcoming tasks
  const todasLasTareas = [];
  cropActivos.forEach(crop => {
    (crop.tareas || []).forEach(t => {
      if (t.completada) return;
      todasLasTareas.push({
        ...t,
        cropId: crop.id,
        rubro: crop.rubro,
        lote: crop.lote,
        fechaObj: safeToDate(t.fechaEjecucion)
      });
    });
  });

  const tareasOrdenadas = todasLasTareas.sort((a, b) => a.fechaObj.getTime() - b.fechaObj.getTime());
  const hoyStr = new Date().toISOString().split('T')[0];
  const tareasHoy = tareasOrdenadas.filter(t => t.fechaObj.toISOString().split('T')[0] === hoyStr);
  const tareasProximas = tareasOrdenadas.filter(t => t.fechaObj.toISOString().split('T')[0] > hoyStr).slice(0, 5);

  // ── 1. Última alerta de clima (Firestore) ──
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

  // ── 2. Finalizar ciclo ──
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
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      mostrarToast(`✅ ${resData.mensaje}`);
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

  return (
    <div className={styles.wrapper}>
      {toastMsg && (
        <div className={`${styles.toast} ${toastMsg.isError ? styles.toastError : styles.toastOk}`}>
          {toastMsg.msg}
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Panel de Control & Alertas</h1>
          <p className={styles.pageSubtitle}>{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button className={styles.waLinkBtn}>
          <svg viewBox="0 0 448 512" fill="currentColor" className={styles.waBtnIcon}><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.6-27.6-16.5-14.7-27.6-32.8-30.8-38.4-3.2-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.5-9.3.9-1.9.5-3.7-.2-5.6-.7-1.8-8.8-21.2-12.1-29-3.2-7.8-6.4-6.7-8.8-6.8-2.2-.1-4.8-.1-7.4-.1-2.6 0-6.9 1-10.6 5-3.7 4-14.3 14-14.3 34.2s14.7 39.7 16.7 42.5c2 2.8 29 44.3 70.2 62.1 9.8 4.2 17.5 6.7 23.5 8.6 10 3.2 19.2 2.7 26.4 1.6 8.1-1.2 24.9-10.2 28.4-20 3.5-9.9 3.5-18.4 2.5-20.2-1.1-1.7-4.1-2.8-9.6-5.6z" /></svg>
          VINCULAR WHATSAPP
        </button>
      </div>

      <div className={styles.topRow}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🌦️</span>
            <h2 className={styles.cardTitle}>Clima & Riego</h2>
            {data.weather && <span className={styles.liveBadge}>Sincronizado</span>}
          </div>
          {data.weather ? (
            <div className={styles.climaBodyPremium}>
              <div className={styles.weatherMain}>
                <img src={`https://openweathermap.org/img/wn/${data.weather.icon}@2x.png`} alt={data.weather.condition} className={styles.weatherIconLarge} />
                <div className={styles.weatherInfo}>
                  <h3 className={styles.weatherTemp}>{data.weather.temp}°C</h3>
                  <p className={styles.weatherCond}>{data.weather.condition}</p>
                  <p className={styles.weatherCity}>{data.weather.city}</p>
                </div>
              </div>
              <div className={styles.weatherMetrics}>
                <div className={styles.metric}><span className={styles.mLabel}>Humedad</span><span className={styles.mValue}>{data.weather.humidity}%</span></div>
                <div className={styles.metric}><span className={styles.mLabel}>Nubes</span><span className={styles.mValue}>{data.weather.pop}%</span></div>
              </div>
            </div>
          ) : (
            <p className={styles.empty}>Obteniendo datos climáticos...</p>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>📋</span>
            <h2 className={styles.cardTitle}>Próximas Tareas</h2>
            <span className={styles.countBadge}>{tareasOrdenadas.length}</span>
          </div>
          <div className={styles.tasksScrollArea}>
            {tareasOrdenadas.length === 0 ? (
              <p className={styles.empty}>✅ No hay tareas pendientes.</p>
            ) : (
              <>
                {tareasHoy.length > 0 && (
                  <div className={styles.taskGroup}>
                    <h4 className={styles.groupLabel}>PARA HOY</h4>
                    {tareasHoy.map((t, i) => (
                      <div key={`hoy-${i}`} className={styles.tareaItemPremium}>
                        <div className={styles.tareaDot} />
                        <div className={styles.tareaText}>
                          <p className={styles.tareaName}>{t.nombre}</p>
                          <p className={styles.tareaLote}>{t.rubro} · Lote {t.lote}</p>
                        </div>
                        <span className={styles.todayBadge}>HOY</span>
                      </div>
                    ))}
                  </div>
                )}
                {tareasProximas.length > 0 && (
                  <div className={styles.taskGroup}>
                    <h4 className={styles.groupLabel}>PRÓXIMAMENTE</h4>
                    {tareasProximas.map((t, i) => (
                      <div key={`prox-${i}`} className={styles.tareaItemPremium}>
                        <div className={`${styles.tareaDot} ${styles.dotGray}`} />
                        <div className={styles.tareaText}>
                          <p className={styles.tareaName}>{t.nombre}</p>
                          <p className={styles.tareaLote}>{t.rubro} · Lote {t.lote}</p>
                        </div>
                        <span className={styles.dateBadge}>{formatDate(t.fechaEjecucion, { day: 'numeric', month: 'short' })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Estado de Cultivos Activos</h2>
          <span className={styles.countBadge}>{cropActivos.length}</span>
        </div>
        {contextLoading ? (
          <div className={styles.loadingRow}><span className={styles.spinner} /> Sincronizando...</div>
        ) : cropActivos.length === 0 ? (
          <p className={styles.empty}>No hay cultivos en curso. Registra una nueva siembra.</p>
        ) : (
          <div className={styles.cropGridPremium}>
            {cropActivos.map((crop) => (
              <div key={crop.id} className={`${styles.cropCardPremium} ${getCropBgClass(crop.rubro)}`}>
                <div className={styles.cropCardHeader}>
                  <div className={styles.cropMainInfo}>
                    <h4 className={styles.cropRubroTitle}>{crop.rubro}</h4>
                    <p className={styles.cropLoteSub}>Lote {crop.lote} · {crop.hectareas} ha</p>
                  </div>
                </div>
                
                <div className={styles.cropStatusRow}>
                  <span className={styles.statusLabel}>Progreso del ciclo</span>
                  <span className={styles.statusValue}>{crop._progreso}%</span>
                </div>
                
                <div className={styles.progressContainerPremium}>
                  <div className={styles.progressFillPremium} style={{ width: `${crop._progreso}%` }} />
                </div>

                <div className={styles.cropFooterPremium}>
                  <div className={styles.footerItem}>
                    <span className={styles.footerLabel}>Día</span>
                    <span className={styles.footerValue}>{crop._diasTranscurridos}</span>
                  </div>
                  <div className={styles.footerItem}>
                    <span className={styles.footerLabel}>Tareas</span>
                    <span className={styles.footerValue}>{crop._tareasPendientes}</span>
                  </div>
                  {crop._diasTranscurridos >= (crop.duracionDias || 120) && (
                    <button className={styles.finalizarBtnPremium} onClick={() => setModal({ cropId: crop.id, lote: crop.lote, rubro: crop.rubro })}>
                      Cosechar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>🏁 Finalizar Ciclo de {modal.rubro}</h3>
            <p className={styles.modalDesc}>Registra el rendimiento final para cerrar este ciclo y liberar el lote {modal.lote}.</p>
            <form onSubmit={handleFinalizar} className={styles.modalForm}>
              <label htmlFor="rendimiento-input" className={styles.label}>Rendimiento Total (KG)</label>
              <input id="rendimiento-input" type="number" min="1" placeholder="Ej: 5200" value={rendimiento} onChange={(e) => setRendimiento(e.target.value)} className={styles.input} required autoFocus />
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className={styles.confirmBtn} disabled={finalizando}>
                  {finalizando ? <span className={styles.spinner} /> : 'Finalizar y Archivar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
