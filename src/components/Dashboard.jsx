import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import WeatherWidget from './WeatherWidget';
import CropIcon from './CropIcon';
import styles from './Dashboard.module.css';

// Configuración visual de cada cultivo (colores del catálogo)
const CROP_CONFIG = {
  maíz:    { color: '#F59E0B', colorDim: '#FDE68A', label: 'Maíz' },
  cacao:   { color: '#8B4513', colorDim: '#D4A574', label: 'Cacao' },
  yuca:    { color: '#e07b54', colorDim: '#FBBF9A', label: 'Yuca' },
  plátano: { color: '#3a9e8a', colorDim: '#86CCBE', label: 'Plátano' },
  platano: { color: '#3a9e8a', colorDim: '#86CCBE', label: 'Plátano' },
};

const FALLBACK_CROPS = [
  { key: 'maíz',    hectareas: 124.2, campos: 3 },
  { key: 'cacao',   hectareas: 2.1,   campos: 1 },
  { key: 'yuca',    hectareas: 14.7,  campos: 2 },
  { key: 'plátano', hectareas: 2.0,   campos: 1 },
];

// Genera los segmentos SVG de la dona
function buildSegments(crops, total) {
  const circumference = 100; // perímetro normalizado (como % del círculo)
  let offset = 0;
  return crops.map((crop, i) => {
    const pct = total > 0 ? (crop.hectareas / total) * circumference : 0;
    const seg = { ...crop, pct, offset };
    offset += pct;
    return seg;
  });
}

// SVG path circular estándar para la dona
const CIRCLE_PATH = "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";

export default function Dashboard() {
  const { data, loading } = useAppContext();
  const [hoveredKey, setHoveredKey] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, crop: null });
  const svgRef = useRef(null);

  if (loading) return null;

  const weather = data?.weather || {};
  const isRainy = weather.pop > 50 || (weather.condition && weather.condition.toLowerCase().includes('lluvia'));
  const isSunny = weather.pop < 20 && weather.temp > 30;

  // ── Construir datos reales de cultivos ──
  const cultivosMap = data.cultivos || {};
  let cropList = Object.entries(cultivosMap)
    .map(([key, val]) => ({
      key,
      hectareas: Number(val.hectareas) || 0,
      campos: val.campos || 0,
      count: val.count || 0,
    }))
    .filter(c => c.hectareas > 0);

  if (cropList.length === 0) cropList = FALLBACK_CROPS;

  const total = cropList.reduce((s, c) => s + c.hectareas, 0);
  const segments = buildSegments(cropList, total);

  const handleMouseEnter = (seg, e) => {
    setHoveredKey(seg.key);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      crop: seg,
    });
  };

  const handleMouseMove = (e) => {
    if (tooltip.visible) {
      setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    }
  };

  const handleMouseLeave = () => {
    setHoveredKey(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const activeSeg = hoveredKey ? segments.find(s => s.key === hoveredKey) : null;
  const pct = activeSeg ? ((activeSeg.hectareas / total) * 100).toFixed(1) : null;

  return (
    <div className={styles.dashboard}>
      <div className={styles.mainGrid}>

        {/* ROW 1: Clima (Izq) y Donut Chart (Der) */}
        <div className={styles.rowTop}>
          <div className={styles.weatherWrapper}>
            <WeatherWidget />
          </div>

          {/* ══ DONA INTERACTIVA ══ */}
          <div className={styles.donutCard}>
            <div className={styles.donutCardHeader}>
              <h3 className={styles.cardTitle}>Hectáreas por Siembra</h3>
              <span className={styles.donutBadge}>{total.toFixed(1)} ha total</span>
            </div>

            <div className={styles.donutContent}>
              {/* Gráfico SVG */}
              <div className={styles.donutChartContainer} onMouseMove={handleMouseMove}>
                <svg
                  ref={svgRef}
                  viewBox="0 0 36 36"
                  className={styles.donutSvg}
                >
                  {/* Track base */}
                  <path
                    d={CIRCLE_PATH}
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="5"
                  />

                  {/* Segmentos reales */}
                  {segments.map((seg) => {
                    const cfg = CROP_CONFIG[seg.key] || { color: '#9ca3af', label: seg.key };
                    const isActive = hoveredKey === seg.key;
                    const isDimmed = hoveredKey && !isActive;
                    return (
                      <path
                        key={seg.key}
                        d={CIRCLE_PATH}
                        fill="none"
                        stroke={isDimmed ? cfg.colorDim || cfg.color + '55' : cfg.color}
                        strokeWidth={isActive ? "6.5" : "5"}
                        strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                        strokeDashoffset={-seg.offset}
                        strokeLinecap="round"
                        style={{
                          transition: 'stroke-width 0.2s ease, stroke 0.2s ease, opacity 0.2s ease',
                          cursor: 'pointer',
                          filter: isActive ? `drop-shadow(0 0 3px ${cfg.color}88)` : 'none',
                        }}
                        onMouseEnter={(e) => handleMouseEnter(seg, e)}
                        onMouseLeave={handleMouseLeave}
                      />
                    );
                  })}
                </svg>

                {/* Centro dinámico */}
                <div className={styles.donutCenter}>
                  {activeSeg ? (
                    <>
                      <CropIcon
                        rubro={activeSeg.key}
                        className={styles.donutCenterSvg}
                      />
                      <span className={styles.donutCenterPct}>{pct}%</span>
                      <span className={styles.donutCenterSub}>
                        {activeSeg.hectareas.toFixed(1)} ha
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={styles.donutValueTotal}>{total.toFixed(1)}</span>
                      <span className={styles.donutCenterUnit}>ha</span>
                    </>
                  )}
                </div>
              </div>

              {/* Leyenda interactiva */}
              <div className={styles.donutLegend}>
                <div className={styles.legendHeader}>
                  <span className={styles.lCrop}>Cultivo</span>
                  <span className={styles.lHect}>Hectáreas</span>
                </div>
                {segments.map((seg) => {
                  const cfg = CROP_CONFIG[seg.key] || { color: '#9ca3af', emoji: '🌱', label: seg.key };
                  const isActive = hoveredKey === seg.key;
                  const isDimmed = hoveredKey && !isActive;
                  const segPct = total > 0 ? ((seg.hectareas / total) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={seg.key}
                      className={`${styles.legendRow} ${isActive ? styles.legendRowActive : ''} ${isDimmed ? styles.legendRowDimmed : ''}`}
                      onMouseEnter={() => setHoveredKey(seg.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                    >
                      <div className={styles.lCropName}>
                        <span
                          className={styles.lDot}
                          style={{ background: cfg.color }}
                        />
                        <CropIcon rubro={seg.key} className={styles.lCropSvg} />
                        <span>{cfg.label || seg.key}</span>
                      </div>
                      <div className={styles.lRight}>
                        <span className={styles.lCropVal}>{seg.hectareas.toFixed(1)} ha</span>
                        <span className={styles.lCropPct}>{segPct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Barra proporcional al fondo */}
            <div className={styles.donutBarRow}>
              {segments.map((seg) => {
                const cfg = CROP_CONFIG[seg.key] || { color: '#9ca3af' };
                const isActive = hoveredKey === seg.key;
                return (
                  <div
                    key={seg.key}
                    className={styles.donutBar}
                    style={{
                      flex: seg.hectareas,
                      background: cfg.color,
                      opacity: hoveredKey && !isActive ? 0.35 : 1,
                    }}
                    onMouseEnter={() => setHoveredKey(seg.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    title={`${cfg.label || seg.key}: ${seg.hectareas.toFixed(1)} ha`}
                  />
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Tooltip flotante */}
      {tooltip.visible && tooltip.crop && (() => {
        const seg = tooltip.crop;
        const cfg = CROP_CONFIG[seg.key] || { color: '#9ca3af', emoji: '🌱', label: seg.key };
        const segPct = total > 0 ? ((seg.hectareas / total) * 100).toFixed(1) : '0';
        return (
          <div
            className={styles.donutTooltip}
            style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
          >
            <div className={styles.tooltipHeader} style={{ borderColor: cfg.color }}>
              <CropIcon rubro={seg.key} className={styles.tooltipSvg} />
              <strong>{cfg.label || seg.key}</strong>
            </div>
            <div className={styles.tooltipRow}>
              <span>Hectáreas</span>
              <strong>{seg.hectareas.toFixed(1)} ha</strong>
            </div>
            <div className={styles.tooltipRow}>
              <span>Participación</span>
              <strong>{segPct}%</strong>
            </div>
            {seg.campos > 0 && (
              <div className={styles.tooltipRow}>
                <span>Lotes</span>
                <strong>{seg.campos}</strong>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
