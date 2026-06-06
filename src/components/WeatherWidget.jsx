import { useAppContext } from '../context/AppContext';
import styles from './WeatherWidget.module.css';

// Convierte grados de viento a dirección cardinal
function windDirection(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(deg / 45) % 8];
}

export default function WeatherWidget() {
  const { data } = useAppContext();

  const weather = data?.weather || {
    temp: 30,
    feelsLike: 33,
    tempMin: 24,
    tempMax: 35,
    condition: 'Cargando...',
    icon: '01d',
    humidity: 72,
    pop: 20,
    windSpeed: 14,
    windDir: 90,
    pressure: 1012,
    visibility: 10,
    city: 'La Yuca, Barinas',
    lastUpdated: '--:--',
  };

  const forecast = data?.forecast || [];

  const isLoading = !data?.weather;

  return (
    <div className={styles.weatherCard}>
      {/* Fondo decorativo */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      {/* Header: ubicación y hora */}
      <div className={styles.header}>
        <div className={styles.locationRow}>
          <span className={styles.pinIcon}>📍</span>
          <span className={styles.locationText}>{weather.city}</span>
        </div>
        <span className={styles.updatedAt}>
          {isLoading ? 'Conectando...' : `Actualizado: ${weather.lastUpdated}`}
        </span>
      </div>

      {/* Cuerpo principal: temperatura + icono */}
      <div className={styles.mainBody}>
        <div className={styles.tempSection}>
          <div className={styles.tempDisplay}>
            <span className={styles.tempValue}>{weather.temp}</span>
            <span className={styles.tempUnit}>°C</span>
          </div>
          <p className={styles.conditionLabel}>{weather.condition}</p>
          <p className={styles.feelsLike}>
            Sensación: <strong>{weather.feelsLike ?? weather.temp}°C</strong>
            &nbsp;&nbsp;↓{weather.tempMin ?? '--'}° / ↑{weather.tempMax ?? '--'}°
          </p>
        </div>

        <div className={styles.iconSection}>
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
            alt={weather.condition}
            className={styles.weatherIcon}
            onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Métricas secundarias */}
      <div className={styles.metricsGrid}>
        <div className={styles.metric}>
          <span className={styles.metricIcon}>💧</span>
          <span className={styles.metricValue}>{weather.humidity}%</span>
          <span className={styles.metricLabel}>Humedad</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricIcon}>💨</span>
          <span className={styles.metricValue}>
            {weather.windSpeed} <small>km/h</small>
          </span>
          <span className={styles.metricLabel}>Viento {weather.windDir != null ? windDirection(weather.windDir) : ''}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricIcon}>🌧️</span>
          <span className={styles.metricValue}>{weather.pop}%</span>
          <span className={styles.metricLabel}>Nubosidad</span>
        </div>
        {weather.pressure && (
          <div className={styles.metric}>
            <span className={styles.metricIcon}>🌡️</span>
            <span className={styles.metricValue}>{weather.pressure} <small>hPa</small></span>
            <span className={styles.metricLabel}>Presión</span>
          </div>
        )}
      </div>

      {/* Divisor */}
      <div className={styles.divider} />

      {/* Pronóstico 7 días */}
      {forecast.length > 0 && (
        <div className={styles.forecastSection}>
          <p className={styles.forecastTitle}>Pronóstico 7 días</p>
          <div className={styles.forecastList}>
            {forecast.map((item, i) => (
              <div key={i} className={styles.forecastDay}>
                <span className={styles.fDayLabel}>{item.day}</span>
                <img
                  src={`https://openweathermap.org/img/wn/${item.icon}@2x.png`}
                  alt=""
                  className={styles.fIcon}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className={styles.fTemp}>{item.temp}°</span>
                {item.pop > 0 && (
                  <span className={styles.fPop}>
                    {item.pop > 0 ? `${item.pop}%` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
