import { useState } from 'react';
import { useSensorData } from '../hooks/useSensorData';
import { GaugeDisplay } from './GaugeDisplay';
import { StatusCard } from './StatusCard';
import { ControlPanel } from './ControlPanel';
import { MoistureChart } from './MoistureChart';
import { SettingsPanel } from './SettingsPanel';
import { Header } from './Header';
import { DropletIcon, PlantIcon, BoltIcon } from './Icons';
import styles from './Dashboard.module.css';
import { useEffect } from 'react';

export function Dashboard() {
  const {
    sensorData,
    history,
    settings,
    isConnected,
    error,
    pumpState,
    autoMode,
    updateSettings,
    togglePump,
    toggleAuto,
  } = useSensorData();

  const [showSettings, setShowSettings] = useState(false);

  // Apply font size to root element
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', settings.fontSize.toString());
  }, [settings.fontSize]);

  const getMoistureStatus = (value: number) => {
    const pct = Math.round((value / 4095) * 100);
    if (pct <= 30) return { status: 'dry', label: 'แห้ง', color: '#ff4757' };
    return { status: 'wet', label: 'ชื้น', color: '#5b9bd5' };
  };

  const moistureInfo = sensorData ? getMoistureStatus(sensorData.value) : null;
  const percentage = sensorData
    ? Math.round((sensorData.value / 4095) * 100)
    : 0;

  return (
    <div className={styles.dashboard}>
      <Header
        isConnected={isConnected}
        onSettingsClick={() => setShowSettings(true)}
      />

      <main className={styles.main}>
        <div className={styles.heroSection}>
          <GaugeDisplay
            value={sensorData?.value ?? 0}
            percentage={percentage}
            status={moistureInfo?.status ?? 'normal'}
            statusLabel={moistureInfo?.label ?? '-'}
            statusColor={moistureInfo?.color ?? '#ff4757'}
          />
        </div>

        <div className={styles.statsGrid}>
          <StatusCard
            title="ค่าความชื้น"
            value={sensorData?.value?.toString() ?? '0'}
            unit="ADC"
            icon={<DropletIcon size={24} />}
            color="#5b9bd5"
            trend={
              history.length > 1
                ? history[history.length - 1].value >
                  history[history.length - 2].value
                  ? 'up'
                  : 'down'
                : undefined
            }
          />
          <StatusCard
            title="สถานะดิน"
            value={moistureInfo?.label ?? '-'}
            icon={<PlantIcon size={24} />}
            color={moistureInfo?.color}
          />
          <StatusCard
            title="ปั๊มน้ำ"
            value={pumpState ? 'ทำงาน' : 'หยุด'}
            icon={<BoltIcon size={24} />}
            color={pumpState ? '#00f5a0' : '#ff4757'}
          />
        </div>

        <ControlPanel
          pumpState={pumpState}
          autoMode={autoMode}
          onPumpToggle={togglePump}
          onAutoToggle={toggleAuto}
          disabled={!isConnected}
        />

        <div className={styles.chartSection}>
          <MoistureChart data={history} thresholdDry={settings.thresholdDry} />
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>!</span>
            <span>{error}</span>
          </div>
        )}
      </main>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
