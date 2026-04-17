import { useAppContext } from '../context/AppContext';
import styles from './PlaceholderPage.module.css';

export default function CropsManagement() {
  const { data } = useAppContext();
  const cultivos = data?.cultivos || {};

  return (
    <div className={styles.container} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🌱 Gestión de Cultivos</h1>
        <p style={{ color: 'var(--gray-500)', marginTop: '8px' }}>
          Catálogo de rubros, registro de ciclos y control de plagas y fertilización.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', width: '100%' }}>
        {Object.entries(cultivos).map(([key, crop]) => (
          <div key={key} className={styles.card} style={{ alignItems: 'flex-start', padding: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '32px' }}>{key === 'maiz' ? '🌽' : key === 'cacao' ? '🍫' : key === 'yuca' ? '🥔' : '🍌'}</span>
              <h2 style={{ margin: 0, textTransform: 'capitalize' }}>{key}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Ciclo de Cosecha:</span>
                <strong>{key === 'cacao' ? '5 - 6 meses' : key === 'platano' ? '9 - 11 meses' : key === 'maiz' ? '100 - 120 días' : '8 - 12 meses'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Nec. Hídrica:</span>
                <strong>{key === 'cacao' ? 'Alta' : key === 'platano' ? 'Muy Alta' : key === 'maiz' ? 'Crítica' : 'Baja'}</strong>
              </div>
              <div style={{ background: 'var(--teal-pale)', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--teal-dark)' }}>Alerta Crítica:</span>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: 'var(--teal)' }}>
                  {key === 'cacao' ? 'Poda de mantenimiento / Control de Monilia.' :
                   key === 'platano' ? 'Deshije / Apuntalamiento de racimos.' :
                   key === 'maiz' ? 'Control de maleza / Fertilización nitrogenada.' :
                   'Punto de almidón (suelo seco para arranque).'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
