import { useState } from 'react';
import { RobotIcon, DropletIcon } from './Icons';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  pumpState: boolean;
  autoMode: boolean;
  onPumpToggle: (state: boolean) => void;
  onAutoToggle: (state: boolean) => void;
  disabled?: boolean;
}

export function ControlPanel({ pumpState, autoMode, onPumpToggle, onAutoToggle, disabled }: ControlPanelProps) {
  const [loading, setLoading] = useState<'pump' | 'auto' | null>(null);

  const handlePumpToggle = async () => {
    if (autoMode || disabled) return;
    setLoading('pump');
    await onPumpToggle(!pumpState);
    setLoading(null);
  };

  const handleAutoToggle = async () => {
    if (disabled) return;
    setLoading('auto');
    await onAutoToggle(!autoMode);
    setLoading(null);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.control}>
        <div className={styles.info}>
          <span className={styles.icon}>
            <RobotIcon size={24} color="#00f5d4" />
          </span>
          <div>
            <span className={styles.label}>โหมดอัตโนมัติ</span>
            <span className={styles.hint}>เปิด/ปิดปั๊มตามค่าความชื้น</span>
          </div>
        </div>
        <button
          className={`${styles.toggle} ${autoMode ? styles.active : ''}`}
          onClick={handleAutoToggle}
          disabled={disabled || loading === 'auto'}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.control}>
        <div className={styles.info}>
          <span className={styles.icon}>
            <DropletIcon size={24} color="#5b9bd5" />
          </span>
          <div>
            <span className={styles.label}>ปั๊มน้ำ Manual</span>
            <span className={styles.hint}>{autoMode ? 'ปิดโหมด Auto ก่อน' : 'กดเพื่อเปิด/ปิดปั๊ม'}</span>
          </div>
        </div>
        <button
          className={`${styles.toggle} ${pumpState ? styles.active : ''} ${autoMode ? styles.disabled : ''}`}
          onClick={handlePumpToggle}
          disabled={disabled || autoMode || loading === 'pump'}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>
    </div>
  );
}
