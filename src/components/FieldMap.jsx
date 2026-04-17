import styles from './FieldMap.module.css';

const fields = [
  { id: 'lote1', label: 'Lote 1-Maíz', sublabel: 'Field ID', color: '#3a9e8a', x: 20, y: 15, w: 38, h: 30 },
  { id: 'lote2', label: 'Lote 2-Cacao', sublabel: 'Field ID', color: '#c8860a', x: 60, y: 10, w: 35, h: 28 },
  { id: 'lote3', label: 'Lote 3', sublabel: 'Field', color: '#6b9e7a', x: 2, y: 48, w: 30, h: 35 },
  { id: 'lote4', label: 'Lote 4', sublabel: 'Field', color: '#8aad6e', x: 35, y: 50, w: 28, h: 33 },
  { id: 'lote5', label: '', sublabel: '', color: '#c8b06a', x: 65, y: 40, w: 32, h: 25 },
  { id: 'lote6', label: '', sublabel: '', color: '#a8c48a', x: 65, y: 67, w: 32, h: 26 },
];

export default function FieldMap() {
  return (
    <div className={styles.mapWrapper}>
      <div className={styles.mapContainer}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className={styles.mapSvg}>
          {/* Background */}
          <rect width="100" height="100" fill="#d4e8c2" rx="0" />

          {/* Path lines */}
          <line x1="58" y1="0" x2="58" y2="100" stroke="#c2d4aa" strokeWidth="1.5" />
          <line x1="0" y1="47" x2="100" y2="47" stroke="#c2d4aa" strokeWidth="1.5" />
          <line x1="33" y1="47" x2="33" y2="100" stroke="#c2d4aa" strokeWidth="0.8" />
          <line x1="63" y1="38" x2="63" y2="47" stroke="#c2d4aa" strokeWidth="0.8" />

          {fields.map((f) => (
            <g key={f.id} className={styles.field}>
              <rect
                x={f.x}
                y={f.y}
                width={f.w}
                height={f.h}
                fill={f.color}
                opacity="0.78"
                rx="1"
              />
              {f.label && (
                <>
                  <text
                    x={f.x + f.w / 2}
                    y={f.y + f.h / 2 - 3}
                    textAnchor="middle"
                    fontSize="4.2"
                    fontWeight="600"
                    fill="white"
                    fontFamily="Inter, sans-serif"
                  >
                    {f.label}
                  </text>
                  <text
                    x={f.x + f.w / 2}
                    y={f.y + f.h / 2 + 5}
                    textAnchor="middle"
                    fontSize="3"
                    fill="rgba(255,255,255,0.85)"
                    fontFamily="Inter, sans-serif"
                  >
                    {f.sublabel}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className={styles.mapOverlay}>
        <span className={styles.mapBadge}>📍 Vista de Lotes</span>
      </div>
    </div>
  );
}
