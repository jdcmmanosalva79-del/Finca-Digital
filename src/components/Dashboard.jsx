import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import MiniChart from './MiniChart';
import StatCard from './StatCard';
import WeatherWidget from './WeatherWidget';
import styles from './Dashboard.module.css';

const CULTIVOS_CONFIG = {
  maiz: { id: 'maiz', emoji: '🌽', name: 'Maíz', color: '#c8860a', bgGradient: 'linear-gradient(135deg, #fff9ee 0%, #fef0cc 100%)', imgBg: '#f5e09a' },
  cacao: { id: 'cacao', emoji: '🍫', name: 'Cacao', color: '#8B4513', bgGradient: 'linear-gradient(135deg, #fdf5ee 0%, #f5dfc8 100%)', imgBg: '#c4956a' },
  yuca: { id: 'yuca', emoji: '🥔', name: 'Yuca', color: '#e07b54', bgGradient: 'linear-gradient(135deg, #fff5f0 0%, #fde8df 100%)', imgBg: '#e8c9b0' },
  platano: { id: 'platano', emoji: '🍌', name: 'Plátano', color: '#3a9e8a', bgGradient: 'linear-gradient(135deg, #eef8f5 0%, #d5f0e8 100%)', imgBg: '#a8dac8' },
};

const STAT_CONFIG = {
  'cultivos-activos': {
    id: 'cultivos-activos', title: 'Cultivos Activos', sub: 'Gestión de cultivos', link: 'Ver detalles →', color: '#2a7d6f', bg: '#e8f5f2',
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <ellipse cx="24" cy="36" rx="14" ry="5" fill="#c8e8d8" opacity="0.5" />
        <path d="M24 35 L24 16" stroke="#2a7d6f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 28 C24 28 17 23 15 16 C19 15 24 19 24 24" fill="#3a9e8a" />
        <path d="M24 23 C24 23 31 19 33 13 C29 11 24 15 24 20" fill="#2a7d6f" />
        <circle cx="20" cy="14" r="2" fill="#f0a429" />
        <circle cx="28" cy="11" r="1.5" fill="#f0a429" />
        <circle cx="16" cy="19" r="1.5" fill="#f0a429" />
      </svg>
    ),
  }
};

function CropDistributionChart({ cultivos }) {
  const data = Object.values(cultivos).filter(c => c.campos > 0);

  if (data.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, border: '1px solid var(--cream-dark)' }}>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, fontWeight: 600 }}>No hay siembras activas para graficar</p>
      </div>
    );
  }

  const total = data.reduce((acc, c) => acc + (parseFloat(c.hectareas) || 0), 0);
  let currentAngle = 0;

  return (
    <div style={{
      borderRadius: 24,
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
      width: 342,
      height: 184,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(200, 134, 10, 0.2)'
    }}>
      <svg fill="none" viewBox="0 0 342 175" height="175" width="342" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <path fill="url(#paint0_linear_hectares)" d="M0 66.4396C0 31.6455 0 14.2484 11.326 5.24044C22.6519 -3.76754 39.6026 0.147978 73.5041 7.97901L307.903 62.1238C324.259 65.9018 332.436 67.7909 337.218 73.8031C342 79.8154 342 88.2086 342 104.995V131C342 151.742 342 162.113 335.556 168.556C329.113 175 318.742 175 298 175H44C23.2582 175 12.8873 175 6.44365 168.556C0 162.113 0 151.742 0 131V66.4396Z"></path>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" y2="128" x2="354.142" y1="128" x1="0" id="paint0_linear_hectares">
            <stop stopColor="#f0a429"></stop>
            <stop stopColor="#c8860a" offset="1"></stop>
          </linearGradient>
        </defs>
      </svg>

      <div style={{ position: 'absolute', right: -10, top: -10, width: 120, height: 120, zIndex: 2, opacity: 0.8 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 20px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, marginTop: 4 }}>
          <div style={{ position: 'relative', width: 85, height: 85, flexShrink: 0 }}>
            <svg viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.2))' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
              {data.map((c, i) => {
                const val = parseFloat(c.hectareas) || 0;
                const fraction = val / total;
                const dashLength = Math.max(fraction * 100 - 1.5, 0);
                const dasharray = `${dashLength} 100`;
                const offset = -currentAngle;
                currentAngle += fraction * 100;
                return (
                  <circle
                    key={c.id}
                    r="16"
                    cx="20"
                    cy="20"
                    fill="none"
                    stroke={c.color}
                    strokeWidth="6"
                    strokeDasharray={dasharray}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'all 1s' }}
                  />
                );
              })}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#1a202c', lineHeight: 1 }}>{total.toFixed(0)}</span>
              <span style={{ fontSize: 9, color: '#4a5568', fontWeight: 600, marginTop: 2 }}>ha</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'center' }}>
            {data.slice(0, 4).map(c => {
              const val = parseFloat(c.hectareas) || 0;
              const percent = ((val / total) * 100).toFixed(0);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, background: 'rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: '10px', backdropFilter: 'blur(4px)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, boxShadow: `0 0 8px ${c.color}` }}></div>
                    <span style={{ color: '#2d3748', fontWeight: 700 }}>{c.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#4a5568', fontWeight: 600 }}>{val.toFixed(1)} ha</span>
                    <span style={{ fontWeight: 800, color: '#1a202c', fontSize: 14 }}>{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 11, color: '#4a5568', fontWeight: 600 }}>Estadísticas Territoriales</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c' }}>Distribución de Hectáreas</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>Territorio</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, updateCrop, updateInventoryStat } = useAppContext();
  const [activeCard, setActiveCard] = useState(null);

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando datos del Dashboard...</div>;
  }

  const statCardsData = Object.keys(STAT_CONFIG).map(key => ({
    ...STAT_CONFIG[key],
    ...data.stats[key]
  }));

  const cultivosData = Object.keys(CULTIVOS_CONFIG).map(key => ({
    ...CULTIVOS_CONFIG[key],
    ...(data.cultivos[key] || {})
  }));

  const { user } = data;

  return (
    <div className={styles.dashboard}>
      <div className={styles.topRow}>
        <div className={styles.leftColumn}>
          <div className={styles.userCard}>
            <div className={styles.userProfileCompact}>
              <div className={styles.userAvatarCompact}>
                <span style={{ fontSize: 28 }}>👨‍🌾</span>
              </div>
              <div className={styles.userTitleCompact}>
                <span className={styles.userRoleBigCompact}>{user.nombre}</span>
                <span className={styles.userRoleCompact}>{user.rol}</span>
              </div>
              <div className={styles.userStatusCompact}>
                <span className={styles.statusDotCompact} style={{ background: user.estado === 'Activo' ? '#22c55e' : '#f59e0b' }}></span>
                {user.estado}
              </div>
            </div>

            <div className={styles.userDetailsCompact}>
              <div className={styles.userFieldCompact}>
                <span className={styles.fieldIconCompact}>📧</span>
                <span className={styles.fieldValueCompact}>{user.email}</span>
              </div>
              <div className={styles.userFieldCompact}>
                <span className={styles.fieldIconCompact}>📍</span>
                <span className={styles.fieldValueCompact}>Sede Principal, Barinas</span>
              </div>
              <div className={styles.userFieldCompact}>
                <span className={styles.fieldIconCompact}>🕒</span>
                <span className={styles.fieldValueCompact}>Último acceso: Hoy</span>
              </div>
            </div>
          </div>

          <div className={styles.bottomRow}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🌿</span>
              <h2 className={styles.sectionTitle}>Resumen de Cultivos Activos</h2>
            </div>
            {cultivosData.filter(c => c.campos > 0).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'var(--white)', borderRadius: 'var(--radius-lg)', color: 'var(--gray-500)', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>🌱</span>
                No tienes siembras activas en este momento.<br />
                Ve a la sección <b>Cultivos</b> para registrar una nueva siembra.
              </div>
            ) : (
              <div className={styles.cultivoGrid}>
                {cultivosData.filter(c => c.campos > 0).map((c) => (
                  <div
                    key={c.id}
                    className={styles.cultivoCard}
                    style={{ background: c.bgGradient }}
                  >
                    <div className={styles.cultivoHeader}>
                      <div className={styles.cultivoInfo}>
                        <div className={styles.cultivoEmoji}>{c.emoji}</div>
                        <div className={styles.cultivoName}>{c.name}</div>
                      </div>
                      <div className={styles.cultivoCount} style={{ color: c.color }}>
                        {c.count}
                      </div>
                    </div>
                    <div className={styles.cultivoSub}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {c.campos} {c.campos === 1 ? 'campo activo' : 'campos activos'}
                      </div>
                      <div>{c.hectareas}</div>
                    </div>
                    <div className={styles.cultivoChart}>
                      <MiniChart
                        data={c.data || [0]}
                        color={c.color}
                        type={c.id === 'platano' ? 'bar' : 'line'}
                      />
                    </div>
                    <div
                      className={styles.cultivoImageBg}
                      style={{ background: c.imgBg }}
                    >
                      <span className={styles.cultivoBigEmoji}>{c.emoji}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.statCards}>
          <WeatherWidget />

          {statCardsData.map((card) => (
            <StatCard
              key={card.id}
              {...card}
              active={activeCard === card.id}
              onClick={() => {
                setActiveCard(activeCard === card.id ? null : card.id);
              }}
            />
          ))}

          <CropDistributionChart cultivos={data.cultivos} />
        </div>
      </div>
    </div>
  );
}
