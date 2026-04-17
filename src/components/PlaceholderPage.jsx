import styles from './PlaceholderPage.module.css';

const pages = {
  cultivos: { icon: '🌱', title: 'Gestión de Cultivos', desc: 'Administra y monitorea todos tus cultivos activos.' },
  inventario: { icon: '📦', title: 'Control de Inventario', desc: 'Gestiona insumos, herramientas y materiales.' },
  reportes: { icon: '📊', title: 'Reportes y Análisis', desc: 'Visualiza estadísticas y genera reportes detallados.' },
  config: { icon: '⚙️', title: 'Configuración', desc: 'Ajusta preferencias del sistema y parámetros.' },
};

export default function PlaceholderPage({ page }) {
  const info = pages[page] || { icon: '📄', title: page, desc: '' };
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.icon}>{info.icon}</span>
        <h2 className={styles.title}>{info.title}</h2>
        <p className={styles.desc}>{info.desc}</p>
        <div className={styles.badge}>Próximamente</div>
      </div>
    </div>
  );
}
