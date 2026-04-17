import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import MiniChart from './MiniChart';
import FieldMap from './FieldMap';
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
  },
  'inventario': {
    id: 'inventario', title: 'Inventario', sub: 'Control de insumos', link: 'Recibir insumos (+5) →', color: '#2a5f8a', bg: '#e4eef8',
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="18" width="32" height="22" rx="3" fill="#5a9fd4" opacity="0.3" />
        <rect x="12" y="22" width="24" height="14" rx="2" fill="#2a5f8a" opacity="0.4" />
        <path d="M24 18 L8 26 L24 34 L40 26 Z" fill="#3a7fc4" opacity="0.5" />
        <path d="M24 10 L8 18 L24 26 L40 18 Z" fill="#2a5f8a" opacity="0.7" />
        <line x1="24" y1="26" x2="24" y2="34" stroke="#5a9fd4" strokeWidth="1.5" />
        <line x1="40" y1="18" x2="40" y2="26" stroke="#5a9fd4" strokeWidth="1.5" />
      </svg>
    ),
  },
  'reportes': {
    id: 'reportes', title: 'Reportes', sub: 'Análisis y estadísticas', link: 'Ver detalles →', color: '#6a3d9e', bg: '#f0eafc',
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="10" y="8" width="28" height="34" rx="3" fill="#a080d0" opacity="0.25" />
        <rect x="14" y="12" width="20" height="3" rx="1.5" fill="#7a50c0" opacity="0.5" />
        <rect x="14" y="18" width="20" height="3" rx="1.5" fill="#7a50c0" opacity="0.4" />
        <rect x="14" y="24" width="14" height="3" rx="1.5" fill="#7a50c0" opacity="0.3" />
        <rect x="28" y="30" width="6" height="8" rx="1" fill="#7a50c0" opacity="0.7" />
        <rect x="20" y="33" width="6" height="5" rx="1" fill="#9060d0" opacity="0.6" />
        <rect x="14" y="35" width="4" height="3" rx="1" fill="#a070d8" opacity="0.5" />
      </svg>
    ),
  },
};

export default function Dashboard() {
  const { data, loading, updateCrop, updateInventoryStat } = useAppContext();
  const [activeCard, setActiveCard] = useState(null);

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando datos del Dashboard...</div>;
  }

  const handleAddCampo = (cropId) => {
    const currentCrop = data.cultivos[cropId];
    const newDataPoint = Math.floor(Math.random() * 3) + currentCrop.count;
    const newData = [...(currentCrop.data || []), newDataPoint].slice(-8);

    updateCrop(cropId, {
      campos: currentCrop.campos + 1,
      count: currentCrop.count + 1,
      data: newData,
      hectareas: `${((currentCrop.campos + 1) * 0.8).toFixed(1)} ha totales`
    });
  };

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
        <div className={styles.userCard}>
          <div className={styles.userCardHeader}>
            <span className={styles.sectionIcon}>👤</span>
            <h2 className={styles.sectionTitle}>Información del Usuario</h2>
          </div>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              <svg viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="#e8f5f2" />
                <circle cx="32" cy="24" r="10" fill="#2a7d6f" opacity="0.5" />
                <path d="M14 56 C14 44 50 44 50 56" fill="#2a7d6f" opacity="0.4" />
                <circle cx="32" cy="24" r="8" fill="#c8a87a" />
                <path d="M26 22 C26 17 38 17 38 22" fill="#6b4c2a" />
                <circle cx="29" cy="25" r="1.5" fill="#4a3020" />
                <circle cx="35" cy="25" r="1.5" fill="#4a3020" />
                <path d="M29 30 Q32 33 35 30" stroke="#4a3020" strokeWidth="1" fill="none" strokeLinecap="round" />
                <rect x="28" y="36" width="8" height="10" rx="2" fill="#1a5f5a" />
                <path d="M16 56 C16 46 24 42 28 40 L28 46 L36 46 L36 40 C40 42 48 46 48 56 Z" fill="#1a5f5a" opacity="0.7" />
              </svg>
            </div>
            <div className={styles.userTitle}>
              <span className={styles.userRole}>Administrador</span>
              <span className={styles.userRoleBig}>Principal</span>
            </div>
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userField}>
              <span className={styles.fieldLabel}>Nombre</span>
              <span className={styles.fieldValue}>{user.nombre}</span>
            </div>
            <div className={styles.userField}>
              <span className={styles.fieldLabel}>Rol</span>
              <span className={styles.fieldValue}>{user.rol}</span>
            </div>
            <div className={styles.userField}>
              <span className={styles.fieldLabel}>Email</span>
              <span className={styles.fieldValue}>{user.email}</span>
            </div>
            <div className={styles.userField}>
              <span className={styles.fieldLabel}>Estado</span>
              <span className={styles.fieldValueStatus}>
                {user.estado} <span className={styles.statusDot} style={{ background: user.estado === 'Activo' ? '#22c55e' : '#f59e0b', boxShadow: `0 0 0 2px ${user.estado === 'Activo' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'}` }}></span>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.mapCard}>
          <FieldMap />
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
                if (card.id === 'inventario') updateInventoryStat(5);
              }}
            />
          ))}
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🌿</span>
          <h2 className={styles.sectionTitle}>Resumen de Cultivos</h2>
        </div>
        <div className={styles.cultivoGrid}>
          {cultivosData.map((c) => (
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
                  <button 
                    className={styles.addBtn}
                    onClick={(e) => { e.stopPropagation(); handleAddCampo(c.id); }}
                    title={`Añadir campo de ${c.name}`}
                  >
                    +
                  </button>
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
      </div>
    </div>
  );
}
