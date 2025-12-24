import type { ReactNode } from 'react';
import styles from './StatusCard.module.css';

interface StatusCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: ReactNode;
  color?: string;
  trend?: 'up' | 'down';
}

export function StatusCard({ title, value, unit, icon, color, trend }: StatusCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper} style={color ? { color } : undefined}>
        {icon}
      </div>
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        <div className={styles.valueRow}>
          <span className={styles.value} style={color ? { color } : undefined}>
            {value}
          </span>
          {unit && <span className={styles.unit}>{unit}</span>}
          {trend && (
            <span className={`${styles.trend} ${styles[trend]}`}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>
      <div className={styles.glow} style={color ? { background: `${color}15` } : undefined} />
    </div>
  );
}
