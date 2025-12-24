import { SettingsIcon, LeafIcon } from './Icons';
import styles from './Header.module.css';

interface HeaderProps {
  isConnected: boolean;
  onSettingsClick: () => void;
}

export function Header({ isConnected, onSettingsClick }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <LeafIcon size={28} color="#00f5d4" />
        </div>
        <div className={styles.titleGroup}>
          <h1>Moisture Sensor</h1>
          <p>Smart Plant Watering System</p>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.statusBadge}>
          <span className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
          <span>{isConnected ? 'Online' : 'Offline'}</span>
        </div>
        
        <button
          className={styles.iconBtn}
          onClick={onSettingsClick}
          title="ตั้งค่า"
        >
          <SettingsIcon size={20} />
        </button>
      </div>
    </header>
  );
}
