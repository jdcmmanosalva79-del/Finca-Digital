import styles from './Dashboard.module.css';

export default function StatCard({ id, title, sub, count, link, color, bg, icon, onClick, active }) {
  // Use premium design colors based on ID or default to color
  const gradientId = `gradient-${id}`;
  const stop1 = id === 'cultivos-activos' ? '#2a7d6f' : '#1a5f5a';
  const stop2 = id === 'cultivos-activos' ? '#1a5f5a' : '#0d3331';

  return (
    <div
      id={`stat-${id}`}
      className={`${styles.statCard} ${active ? styles.statCardActive : ''}`}
      onClick={onClick}
      style={{ color: '#fff', border: 'none' }}
    >
      <svg fill="none" viewBox="0 0 342 175" height="175" width="342" xmlns="http://www.w3.org/2000/svg" className={styles.statBackground}>
        <path fill={`url(#${gradientId})`} d="M0 66.4396C0 31.6455 0 14.2484 11.326 5.24044C22.6519 -3.76754 39.6026 0.147978 73.5041 7.97901L307.903 62.1238C324.259 65.9018 332.436 67.7909 337.218 73.8031C342 79.8154 342 88.2086 342 104.995V131C342 151.742 342 162.113 335.556 168.556C329.113 175 318.742 175 298 175H44C23.2582 175 12.8873 175 6.44365 168.556C0 162.113 0 151.742 0 131V66.4396Z"></path>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" y2="128" x2="354.142" y1="128" x1="0" id={gradientId}>
            <stop stopColor={stop1}></stop>
            <stop stopColor={stop2} offset="1"></stop>
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.statIcon}>{icon}</div>

      <div className={styles.statContent}>
        <div className={styles.statCount}>{count}</div>
        
        <div className={styles.statFooter}>
          <div className={styles.statFooterLeft}>
            <div className={styles.statFooterSub}>{sub}</div>
            <div className={styles.statFooterTitle}>{title}</div>
          </div>
          <div className={styles.statFooterRight}>
            {link}
          </div>
        </div>
      </div>
    </div>
  );
}
