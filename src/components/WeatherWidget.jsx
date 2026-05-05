import styles from './WeatherWidget.module.css';

export default function WeatherWidget() {
  const forecast = [
    { time: '12 hi', temp: '29°', icon: '⛈️' },
    { time: '03 hr', temp: '28°', icon: '⛅' },
    { time: '01 hr', temp: '27°', icon: '☁️' },
    { time: '06 hr', temp: '26°', icon: '🌤️' },
    { time: '10 hr', temp: '27°', icon: '⛅' },
    { time: '14 hr', temp: '28°', icon: '🌧️' },
    { time: '16 hr', temp: '28°', icon: '🌧️' },
    { time: '18 hr', temp: '27°', icon: '🌧️' },
  ];

  return (
    <div className={styles.weatherCard}>
      <div className={styles.left}>
        <div className={styles.mainInfo}>
          <h2 className={styles.temp}>29°</h2>
          <div className={styles.locationInfo}>
            <p className={styles.location}>Barinas, La Yuca</p>
            <p className={styles.probability}>93% Probabilidad</p>
          </div>
        </div>

        <div className={styles.forecast}>
          {forecast.map((item, index) => (
            <div key={index} className={styles.forecastItem}>
              <span className={styles.fIcon}>{item.icon}</span>
              <div className={styles.fLine}></div>
              <span className={styles.fTime}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.cloudWrapper}>
          <img src="/3d_storm_cloud_lightning_1777844935218.png" alt="Storm" className={styles.cloudImg} />
        </div>
        <p className={styles.conditionText}>Llovizna / Lluvia Ligera</p>
      </div>
    </div>
  );
}
