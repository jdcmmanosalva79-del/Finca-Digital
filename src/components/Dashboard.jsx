import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import WeatherWidget from './WeatherWidget';
import styles from './Dashboard.module.css';

const Sparkline = ({ color }) => (
  <svg width="180" height="40" viewBox="0 0 180 40" className={styles.sparkline}>
    <path
      d="M0 35 Q 20 15, 40 30 T 80 20 T 120 30 T 160 15 T 180 25"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

export default function Dashboard() {
  const { data, loading } = useAppContext();

  if (loading) return null;

  const userEmail = data?.user?.email || 'admin@fincadigital.com';

  return (
    <div className={styles.dashboard}>
      <div className={styles.mainGrid}>
        {/* Columna Izquierda */}
        <div className={styles.columnLeft}>
          {/* Perfil */}
          <div className={styles.profileCard}>
            <div className={styles.profileAvatarLarge}>
              <img src="https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff&size=128" alt="Avatar" />
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>admin <span className={styles.profileRole}>| Administrador</span></h2>
              <span className={styles.profileStatus}>Activo</span>
              <div className={styles.profileMeta}>
                <p>{userEmail}</p>
                <p>Sede Principal, Barinas</p>
                <p>Último acceso: Hoy</p>
              </div>
            </div>
          </div>

          {/* Resumen de Cultivos */}
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Resumen de Cultivos Activos</h3>
          </div>

          <div className={styles.cropCards}>
            {/* Maíz */}
            <div className={styles.cropCard}>
              <div className={styles.cropTop}>
                <div className={styles.cropIcon}>
                  <img src="https://cdn-icons-png.flaticon.com/512/1205/1205166.png" alt="Maiz" />
                </div>
                <div className={styles.cropHeader}>
                  <div className={styles.cropTitleRow}>
                    <h4 className={styles.cropTitle}>Maíz</h4>
                    <span className={styles.cropTime}>Últimos 7 días</span>
                  </div>
                  <p className={styles.cropDetail}>2 campos activos</p>
                  <p className={styles.cropDetail}>0.8 ha totales</p>
                </div>
              </div>
              <div className={styles.cropBottom}>
                <Sparkline color="#d97706" />
                <div className={styles.cropCount}>2</div>
              </div>
            </div>

            {/* Yuca */}
            <div className={styles.cropCard}>
              <div className={styles.cropTop}>
                <div className={styles.cropIcon}>
                  <img src="https://cdn-icons-png.flaticon.com/512/1041/1041300.png" alt="Yuca" />
                </div>
                <div className={styles.cropHeader}>
                  <div className={styles.cropTitleRow}>
                    <h4 className={styles.cropTitle}>Yuca</h4>
                    <span className={styles.cropTime}>Últimos 7 días</span>
                  </div>
                  <p className={styles.cropDetail}>3 campos activos</p>
                  <p className={styles.cropDetail}>10.7 ha totales</p>
                </div>
              </div>
              <div className={styles.cropBottom}>
                <Sparkline color="#10b981" />
                <div className={styles.cropCount}>3</div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className={styles.columnRight}>
          <WeatherWidget />

          {/* Alerta */}
          <div className={styles.alertCard}>
            <div className={styles.alertIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 9v4M12 17h.01M4.93 19h14.14a2 2 0 0 0 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.2 16a2 2 0 0 0 1.73 3z" />
              </svg>
            </div>
            <div className={styles.alertContent}>
              <h4 className={styles.alertTitle}>ALERTA DE LOGÍSTICA / TAREAS ASIGNADAS:</h4>
              <p className={styles.alertText}>
                • Alta probabilidad de lluvia: Postergar fertilización. <br />
                • Asegurar drenajes en lotes bajos. <br />
                • Revisar bitácora de riego (Pendiente).
              </p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className={styles.statsCard}>
            <div className={styles.statsHeader}>
              <h3 className={styles.statsTitle}>ESTADÍSTICAS TERRITORIALES</h3>
              <p className={styles.statsSub}>Distribución de Hectáreas - Territorio</p>
            </div>
            <div className={styles.statsContent}>
              <div className={styles.statsLeft}>
                <div className={styles.totalBadge}>
                  <span className={styles.totalNum}>5</span>
                  <p className={styles.totalLabel}>Total Cultivos Activos</p>
                </div>
                <div className={styles.statsIconPlant}>
                  <img src="https://cdn-icons-png.flaticon.com/512/628/628283.png" alt="Plant" />
                </div>
              </div>
              <div className={styles.statsRight}>
                <div className={styles.chartContainer}>
                  <svg viewBox="0 0 36 36" className={styles.donutChart}>
                    <path className={styles.donutHole} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="#fff" />
                    <path className={styles.donutRing} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                    <path className={styles.donutSegment} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#d97706" strokeWidth="4" strokeDasharray="92 8" strokeDashoffset="25" />
                    <path className={styles.donutSegment} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="8 92" strokeDashoffset="33" />
                  </svg>
                  <div className={styles.donutCenter}>
                    <span className={styles.donutTotal}>Total</span>
                    <span className={styles.donutValue}>12.0 ha</span>
                  </div>
                </div>
                <div className={styles.legend}>
                  <p>Yuca 82% (10.7 ha)</p>
                  <p>Maíz 8% (0.9 ha)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tareas */}
          <div className={styles.tasksCard}>
            <div className={styles.tasksHeader}>
              <h3 className={styles.tasksTitle}>TAREAS PENDIENTES</h3>
              <span className={styles.tasksTotal}>Total: 0</span>
            </div>
            <div className={styles.tasksContent}>
              <div className={styles.tasksLeft}>
                <div className={styles.tasksCircle}>0</div>
              </div>
              <div className={styles.tasksRight}>
                <ul className={styles.tasksList}>
                  <li><s>Fumigación de Maíz (Campo 1)</s></li>
                  <li><s>Riego de Yuca (Campo 3)</s></li>
                  <li><s>Riego de Yuca (Campo 3)</s></li>
                </ul>
                <p className={styles.tasksFooter}>No hay labores pendientes. ¡Todo al día!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
