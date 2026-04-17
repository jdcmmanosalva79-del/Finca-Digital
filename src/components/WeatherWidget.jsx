import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './WeatherWidget.module.css';

export default function WeatherWidget() {
  const [weather, setWeather] = useState({
    temp: '--',
    condition: '--',
    rainProb: 0,
    recommendation: 'Cargando datos del servidor...',
    loading: true
  });

  useEffect(() => {
    // ── Escuchar la alerta más reciente generada por el servidor (weatherCron) ──
    const q = query(collection(db, 'alertasClima'), orderBy('fecha', 'desc'), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setWeather({
          temp: data.tempActual,
          condition: data.descripcionClima,
          rainProb: data.popMax,
          recommendation: data.decision,
          tipoAlerta: data.tipoAlerta,
          loading: false
        });
      } else {
        setWeather(prev => ({ ...prev, loading: false, recommendation: 'No hay reportes de clima disponibles.' }));
      }
    });

    return () => unsub();
  }, []);

  if (weather.loading) {
    return <div className={styles.widget}><div className={styles.spinner}></div></div>;
  }

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.location}>📍 Barinas (Sector La Yuca)</span>
        <span className={styles.temp}>{weather.temp}°C</span>
      </div>
      
      <div className={styles.forecast}>
        <div className={styles.icon}>
          {weather.rainProb > 50 ? '🌧️' : '☀️'}
        </div>
        <div className={styles.details}>
          <div className={styles.condition}>{weather.condition}</div>
          <div className={styles.prob}>Probabilidad de lluvia: {weather.rainProb}%</div>
        </div>
      </div>

      <div className={styles.alertBox} style={{ 
        background: weather.tipoAlerta === 'lluvia' ? '#eef2ff' : weather.tipoAlerta === 'sequia' ? '#fffbeb' : '#ecfdf5', 
        color: weather.tipoAlerta === 'lluvia' ? '#1e3a8a' : weather.tipoAlerta === 'sequia' ? '#b45309' : '#065f46',
        borderLeft: `4px solid ${weather.tipoAlerta === 'lluvia' ? '#3b82f6' : weather.tipoAlerta === 'sequia' ? '#f59e0b' : '#10b981'}`
      }}>
        <span className={styles.alertIcon}>
          {weather.tipoAlerta === 'lluvia' ? '🌧️' : weather.tipoAlerta === 'sequia' ? '☀️' : '🌤️'} Logística de Riego:
        </span>
        <p className={styles.alertText}>{weather.recommendation}</p>
      </div>
    </div>
  );
}
