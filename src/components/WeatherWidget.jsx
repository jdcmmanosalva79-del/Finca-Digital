import { useState, useEffect } from 'react';
import styles from './WeatherWidget.module.css';

export default function WeatherWidget() {
  const [weather, setWeather] = useState({
    temp: 28,
    condition: 'Parcialmente Nublado',
    rainProb: 75,
    recommendation: 'Calculando...',
    loading: true
  });

  useEffect(() => {
    // In a real scenario: fetch(`https://api.openweathermap.org/data/2.5/weather?q=Barinas&appid=YOUR_API_KEY`)
    // Mocking the API response to demonstrate the logic requested by the user.
    setTimeout(() => {
      const isRaining = true; // Simulating high rain probability
      const probability = 85;

      setWeather({
        temp: 26,
        condition: 'Lluvia Moderada',
        rainProb: probability,
        recommendation: probability > 70 
          ? 'No encender bombas de riego hoy, se espera lluvia intensa en el sector La Yuca.' 
          : 'Alerta: Iniciar ciclo de riego en sector Plátano por déficit hídrico.',
        loading: false
      });
    }, 1000);
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

      <div className={styles.alertBox} style={{ background: weather.rainProb > 70 ? '#e8f5f2' : '#fef6e4', color: weather.rainProb > 70 ? '#1a5f5a' : '#c8860a' }}>
        <span className={styles.alertIcon}>💡 Logística de Riego:</span>
        <p className={styles.alertText}>{weather.recommendation}</p>
      </div>
    </div>
  );
}
