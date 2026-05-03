/**
 * NuevaSiembra.jsx
 * Formulario para registrar una nueva siembra enviando datos al backend Node.
 */

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './NuevaSiembra.module.css';

const RUBROS_DISPONIBLES = ['Maíz', 'Cacao', 'Yuca', 'Plátano'];

const CICLOS_PREVIEW = {
  Maíz: {
    duracion: 120,
    tareas: [
      { nombre: "Reabonado N/P (1ra aplicación)", dia: 25 },
      { nombre: "Reabonado N/P (2da aplicación)", dia: 45 },
    ]
  },
  Cacao: {
    duracion: 180,
    tareas: [
      { nombre: "Poda de mantenimiento", dia: 30 },
      { nombre: "Fertilización foliar", dia: 60 },
      { nombre: "Control de malezas", dia: 90 },
    ]
  },
  Yuca: {
    duracion: 270,
    tareas: [
      { nombre: "Desmalezado temprano", dia: 30 },
      { nombre: "Aporque y fertilización", dia: 60 },
    ]
  },
  Plátano: {
    duracion: 300,
    tareas: [
      { nombre: "Deshoje y deshije", dia: 45 },
      { nombre: "Fertilización potásica", dia: 90 },
      { nombre: "Embolsado de racimo", dia: 210 },
    ]
  }
};
export default function NuevaSiembra({ onSiembraCreada }) {
  const [form, setForm] = useState({
    rubro: 'Maíz',
    hectareas: '',
    lote: '',
    fechaSiembra: '',
  });
  const [estado, setEstado] = useState({ tipo: null, mensaje: '' });

  const hoy = new Date().toISOString().split('T')[0];

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEstado({ tipo: 'cargando', mensaje: 'Registrando siembra...' });

    try {
      const start = new Date(form.fechaSiembra + 'T12:00:00'); // Evita desfase UTC
      const info = CICLOS_PREVIEW[form.rubro];
      
      const tareasProgramadas = info.tareas.map(t => {
        const d = new Date(start);
        d.setDate(d.getDate() + t.dia);
        return {
          nombre: t.nombre,
          dia: t.dia,
          fechaEjecucion: Timestamp.fromDate(d),
          completada: false
        };
      });

      const dFin = new Date(start);
      dFin.setDate(dFin.getDate() + info.duracion);

      const nuevaSiembra = {
        rubro: form.rubro,
        lote: form.lote,
        hectareas: Number(form.hectareas),
        fechaSiembra: Timestamp.fromDate(start),
        fechaFinalizacion: Timestamp.fromDate(dFin),
        duracionDias: info.duracion,
        estado: 'activo',
        tareas: tareasProgramadas,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'crops'), nuevaSiembra);

      setEstado({
        tipo: 'exito',
        mensaje: `✅ Siembra registrada. Finalización estimada: ${dFin.toLocaleDateString('es-VE')}`,
        tareas: tareasProgramadas.map(t => ({
          nombre: t.nombre,
          fecha: t.fechaEjecucion.toDate().toLocaleDateString('es-VE')
        })),
      });

      setForm({ rubro: 'Maíz', hectareas: '', lote: '', fechaSiembra: '' });
      if (onSiembraCreada) onSiembraCreada({ id: docRef.id, ...nuevaSiembra });
    } catch (err) {
      setEstado({ tipo: 'error', mensaje: `❌ ${err.message}` });
    }
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.iconWrap}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
              <path d="M12 22V12" />
              <path d="M12 12C12 7 7 4 3 5c0 5 4 8 9 7" />
              <path d="M12 12C12 7 17 4 21 5c0 5-4 8-9 7" />
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>Nueva Siembra</h2>
            <p className={styles.subtitle}>Registra un ciclo de cultivo. Las tareas se calcularán automáticamente.</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>

            {/* Rubro */}
            <div className={styles.field}>
              <label htmlFor="ns-rubro" className={styles.label}>
                <span className={styles.labelIcon}>🌱</span>
                Rubro
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="ns-rubro"
                  name="rubro"
                  value={form.rubro}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  {RUBROS_DISPONIBLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lote */}
            <div className={styles.field}>
              <label htmlFor="ns-lote" className={styles.label}>
                <span className={styles.labelIcon}>📍</span>
                Lote
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </span>
                <input
                  id="ns-lote"
                  name="lote"
                  type="text"
                  placeholder="Ej: Lote A-1"
                  value={form.lote}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            {/* Hectáreas */}
            <div className={styles.field}>
              <label htmlFor="ns-hectareas" className={styles.label}>
                <span className={styles.labelIcon}>📏</span>
                Hectáreas
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </span>
                <input
                  id="ns-hectareas"
                  name="hectareas"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="Ej: 5.5"
                  value={form.hectareas}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            {/* Fecha de Siembra */}
            <div className={styles.field}>
              <label htmlFor="ns-fecha" className={styles.label}>
                <span className={styles.labelIcon}>📅</span>
                Fecha de Siembra
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </span>
                <input
                  id="ns-fecha"
                  name="fechaSiembra"
                  type="date"
                  max={hoy}
                  value={form.fechaSiembra}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>
          </div>

          {/* Preview de tareas */}
          {form.fechaSiembra && (
            <div className={styles.preview}>
              <h3 className={styles.previewTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Tareas Automáticas para {form.rubro}
              </h3>
              <div className={styles.timeline}>
                {CICLOS_PREVIEW[form.rubro].tareas.map((t, i) => (
                  <div className={styles.timelineItem} key={i}>
                    <div className={styles.timelineDot}></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineDay}>Día {t.dia}</div>
                      <div className={styles.timelineDesc}>{t.nombre}</div>
                      <div className={styles.timelineDate}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {addDaysStr(form.fechaSiembra, t.dia)}
                      </div>
                    </div>
                  </div>
                ))}
                <div className={`${styles.timelineItem} ${styles.final}`}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineDay}>Día {CICLOS_PREVIEW[form.rubro].duracion}</div>
                    <div className={styles.timelineDesc}>Cosecha Estimada</div>
                    <div className={styles.timelineDate}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {addDaysStr(form.fechaSiembra, CICLOS_PREVIEW[form.rubro].duracion)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.btnWrapper}>
            <button
              type="submit"
              className={styles.btn}
              id="ns-submit-btn"
              disabled={estado.tipo === 'cargando'}
            >
              {estado.tipo === 'cargando'
                ? <span className={styles.spinner} />
                : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Confirmar e Iniciar Ciclo
                  </>
                )}
            </button>
          </div>
        </form>

        {/* Feedback */}
        {estado.tipo && estado.tipo !== 'cargando' && (
          <div className={`${styles.feedback} ${styles[estado.tipo]}`}>
            <p>{estado.mensaje}</p>
            {estado.tareas && (
              <ul className={styles.tareasList}>
                {estado.tareas.map((t, i) => (
                  <li key={i}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--teal)'}}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    {t.nombre} — <strong>{t.fecha}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Suma días a un string YYYY-MM-DD y devuelve la fecha formateada */
function addDaysStr(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00'); // T12 evita desfase UTC
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}
