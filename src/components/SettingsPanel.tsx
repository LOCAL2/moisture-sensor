import { useState, useEffect } from 'react';
import type { Settings } from '../types';
import { SettingsIcon } from './Icons';
import styles from './SettingsPanel.module.css';

interface SettingsPanelProps {
  settings: Settings;
  onUpdate: (settings: Partial<Settings>) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onUpdate, onClose }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  const handleFontSizeChange = (newSize: number) => {
    const updated = { ...localSettings, fontSize: newSize };
    setLocalSettings(updated);
    // Apply immediately for realtime preview
    document.documentElement.style.setProperty('--font-scale', newSize.toString());
  };

  // Reset font size if user cancels
  useEffect(() => {
    return () => {
      // On unmount, restore the original settings font size
      document.documentElement.style.setProperty('--font-scale', settings.fontSize.toString());
    };
  }, [settings.fontSize]);

  const intervalOptions = [
    { value: 500, label: '0.5 วินาที' },
    { value: 1000, label: '1 วินาที' },
    { value: 2000, label: '2 วินาที' },
    { value: 5000, label: '5 วินาที' },
    { value: 10000, label: '10 วินาที' },
    { value: 30000, label: '30 วินาที' },
    { value: 60000, label: '1 นาที' },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2><SettingsIcon size={20} /> ตั้งค่า</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>โหมดการทำงาน</h3>
            
            <div className={styles.field}>
              <div className={styles.toggleRow}>
                <div>
                  <label>Demo Mode</label>
                  <span className={styles.hint}>จำลองข้อมูล sensor โดยไม่ต้องเชื่อมต่อ API</span>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${localSettings.demoMode ? styles.active : ''}`}
                  onClick={() => setLocalSettings(prev => ({ ...prev, demoMode: !prev.demoMode }))}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            </div>

            {localSettings.demoMode && (
              <>
                <div className={styles.field}>
                  <label>ค่าต่ำสุด (Demo)</label>
                  <div className={styles.rangeWrapper}>
                    <input
                      type="range"
                      min="0"
                      max="4095"
                      value={localSettings.demoMin}
                      onChange={e => setLocalSettings(prev => ({ ...prev, demoMin: Number(e.target.value) }))}
                    />
                    <span className={styles.rangeValue}>{localSettings.demoMin}</span>
                  </div>
                </div>

                <div className={styles.field}>
                  <label>ค่าสูงสุด (Demo)</label>
                  <div className={styles.rangeWrapper}>
                    <input
                      type="range"
                      min="0"
                      max="4095"
                      value={localSettings.demoMax}
                      onChange={e => setLocalSettings(prev => ({ ...prev, demoMax: Number(e.target.value) }))}
                    />
                    <span className={styles.rangeValue}>{localSettings.demoMax}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {!localSettings.demoMode && (
            <div className={styles.section}>
              <h3>การเชื่อมต่อ API</h3>
              
              <div className={styles.field}>
                <label>API URL</label>
                <input
                  type="text"
                  value={localSettings.apiUrl}
                  onChange={e => setLocalSettings(prev => ({ ...prev, apiUrl: e.target.value }))}
                  placeholder="http://192.168.1.100/api/sensor"
                />
                <span className={styles.hint}>URL ของ ESP32 API endpoint</span>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h3>ตั้งค่าทั่วไป</h3>

            <div className={styles.field}>
              <label>ขนาดตัวอักษร</label>
              <div className={styles.rangeWrapper}>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.1"
                  value={localSettings.fontSize}
                  onChange={e => handleFontSizeChange(Number(e.target.value))}
                />
                <span className={styles.rangeValue}>{localSettings.fontSize.toFixed(1)}x</span>
              </div>
              <span className={styles.hint}>ปรับขนาดตัวอักษรทั้งหมดในแอป</span>
            </div>

            <div className={styles.field}>
              <label>ความถี่อัพเดท</label>
              <select
                value={localSettings.updateInterval}
                onChange={e => setLocalSettings(prev => ({ ...prev, updateInterval: Number(e.target.value) }))}
              >
                {intervalOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.field}>
              <label>ค่าดินแห้ง (เปิดปั๊ม)</label>
              <div className={styles.rangeWrapper}>
                <input
                  type="range"
                  min="0"
                  max="4095"
                  value={localSettings.thresholdDry}
                  onChange={e => setLocalSettings(prev => ({ ...prev, thresholdDry: Number(e.target.value) }))}
                />
                <span className={styles.rangeValue}>{localSettings.thresholdDry}</span>
              </div>
              <span className={styles.hint}>เมื่อค่าต่ำกว่านี้จะเปิดปั๊มน้ำ</span>
            </div>

            <div className={styles.field}>
              <label>ค่าดินชื้น</label>
              <div className={styles.rangeWrapper}>
                <input
                  type="range"
                  min="0"
                  max="4095"
                  value={localSettings.thresholdWet}
                  onChange={e => setLocalSettings(prev => ({ ...prev, thresholdWet: Number(e.target.value) }))}
                />
                <span className={styles.rangeValue}>{localSettings.thresholdWet}</span>
              </div>
              <span className={styles.hint}>ค่าที่ถือว่าดินชื้นเพียงพอ</span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>ยกเลิก</button>
          <button className={styles.saveBtn} onClick={handleSave}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}
