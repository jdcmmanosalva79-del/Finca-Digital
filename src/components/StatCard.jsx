import styles from './Dashboard.module.css'; // Reusing dashboard styles for now

export default function StatCard({ id, title, sub, count, link, color, bg, icon, onClick, active }) {
  return (
    <div
      id={`stat-${id}`}
      className={`${styles.statCard} ${active ? styles.statCardActive : ''}`}
      onClick={onClick}
      style={{ '--card-color': color, '--card-bg': bg }}
    >
      <div className={styles.statLeft}>
        <div className={styles.statCount} style={{ color: color }}>{count}</div>
        <div className={styles.statTitle}>{title}</div>
        <div className={styles.statSub}>{sub}</div>
        <button 
          className={styles.statLink}
          onClick={(e) => {
            if (id === 'inventario') {
              // Note: The specific logic for inventory should be passed as a prop,
              // but we handle event propagation here.
            }
          }}
        >
          {link}
        </button>
      </div>
      <div className={styles.statIcon}>{icon}</div>
    </div>
  );
}
