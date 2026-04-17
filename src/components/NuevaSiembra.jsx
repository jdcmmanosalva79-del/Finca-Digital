/**
 * NuevaSiembra.jsx
 * Formulario para registrar una nueva siembra enviando datos al backend Node.
 */

import { useState } from 'react';
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
const API_URL = import.meta.env.VITE_API_URL ?? '';


export default function NuevaSiembra({ onSiembraCreada }) {
  const [form, setForm] = useState({
    rubro: 'Maíz',
    hectareas: '',
    lote: '',
    fechaSiembra: '',
  });
  const [estado, setEstado] = useState({ tipo: null, mensaje: '' }); // 'exito' | 'error' | 'cargando'

  const hoy = new Date().toISOString().split('T')[0];

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEstado({ tipo: 'cargando', mensaje: 'Registrando siembra...' });

    try {
      const res = await fetch(`${API_URL}/api/crops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          hectareas: Number(form.hectareas),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error desconocido');

      setEstado({
        tipo: 'exito',
        mensaje: `✅ Siembra registrada. Finalización estimada: ${data.fechaFinalizacion}`,
        tareas: data.tareasProgramadas,
      });

      setForm({ rubro: 'Maíz', hectareas: '', lote: '', fechaSiembra: '' });
      if (onSiembraCreada) onSiembraCreada(data);
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
                <span className={styles.labelDot} />
                Rubro
              </label>
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

            {/* Lote */}
            <div className={styles.field}>
              <label htmlFor="ns-lote" className={styles.label}>
                <span className={styles.labelDot} />
                Lote
              </label>
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

            {/* Hectáreas */}
            <div className={styles.field}>
              <label htmlFor="ns-hectareas" className={styles.label}>
                <span className={styles.labelDot} />
                Hectáreas
              </label>
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

            {/* Fecha de Siembra */}
            <div className={styles.field}>
              <label htmlFor="ns-fecha" className={styles.label}>
                <span className={styles.labelDot} />
                Fecha de Siembra
              </label>
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

          {/* Preview de tareas */}
          {form.fechaSiembra && (
            <div className={styles.preview}>
              <p className={styles.previewTitle}>📅 Tareas que se programarán ({form.rubro}):</p>
              <ul className={styles.previewList}>
                {CICLOS_PREVIEW[form.rubro].tareas.map((t, i) => (
                  <li key={i}>Día {t.dia} — {t.nombre}:&nbsp;
                    <strong>{addDaysStr(form.fechaSiembra, t.dia)}</strong>
                  </li>
                ))}
                <li>Día {CICLOS_PREVIEW[form.rubro].duracion} — Finalización del ciclo:&nbsp;
                  <strong>{addDaysStr(form.fechaSiembra, CICLOS_PREVIEW[form.rubro].duracion)}</strong>
                </li>
              </ul>
            </div>
          )}

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
                    width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Registrar Siembra
                </>
              )}
          </button>
        </form>

        {/* Feedback */}
        {estado.tipo && estado.tipo !== 'cargando' && (
          <div className={`${styles.feedback} ${styles[estado.tipo]}`}>
            <p>{estado.mensaje}</p>
            {estado.tareas && (
              <ul className={styles.tareasList}>
                {estado.tareas.map((t, i) => (
                  <li key={i}>📋 {t.nombre} — <strong>{t.fecha}</strong></li>
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
