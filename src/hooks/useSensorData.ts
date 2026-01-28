import { useState, useEffect, useCallback, useRef } from 'react';
import type { SensorData, Settings, HistoryEntry } from '../types';

const DEFAULT_SETTINGS: Settings = {
  apiUrl: '/api/sensor',
  updateInterval: 1000,
  thresholdDry: 1500,
  thresholdWet: 1500,
  demoMode: false,
  demoMin: 100,
  demoMax: 4000,
  fontSize: 1.3,
};

const STORAGE_KEY = 'moisture_sensor_settings_v4';
const MAX_HISTORY = 100;

export function useSensorData() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pumpState, setPumpState] = useState(false);
  const [autoMode, setAutoMode] = useState(true);

  const intervalRef = useRef<number | null>(null);
  const mockValueRef = useRef(2000);
  const settingsRef = useRef(settings);
  const pumpStateRef = useRef(pumpState);
  const autoModeRef = useRef(autoMode);

  // Keep refs in sync
  useEffect(() => {
    settingsRef.current = settings;
    // Reset mock value if out of range
    if (settings.demoMode) {
      if (mockValueRef.current < settings.demoMin || mockValueRef.current > settings.demoMax) {
        mockValueRef.current = Math.floor((settings.demoMin + settings.demoMax) / 2);
      }
    }
  }, [settings]);

  useEffect(() => {
    pumpStateRef.current = pumpState;
  }, [pumpState]);

  useEffect(() => {
    autoModeRef.current = autoMode;
  }, [autoMode]);

  const getBaseUrl = useCallback(() => {
    const url = settingsRef.current.apiUrl;
    if (url.startsWith('/')) {
      return '';
    }
    return url.replace('/api/sensor', '').replace('/api/value', '');
  }, []);

  // Demo mode: generate mock data
  const generateMockData = useCallback(() => {
    const s = settingsRef.current;
    const auto = autoModeRef.current;

    // สุ่มค่าแบบมั่วในช่วง min-max
    mockValueRef.current = s.demoMin + Math.floor(Math.random() * (s.demoMax - s.demoMin));

    const newEntry: SensorData = {
      value: mockValueRef.current,
      timestamp: new Date(),
    };

    setSensorData(newEntry);
    setHistory((prev) => {
      const updated = [...prev, { value: newEntry.value, timestamp: newEntry.timestamp }];
      return updated.slice(-MAX_HISTORY);
    });

    // Auto mode logic
    if (auto) {
      if (mockValueRef.current <= s.thresholdDry) {
        setPumpState(true);
      } else {
        setPumpState(false);
      }
    }

    setIsConnected(true);
    setError(null);
  }, []);

  // Real API fetch
  const fetchSensorData = useCallback(async () => {
    const url = settingsRef.current.apiUrl;
    if (!url) return;

    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const newEntry: SensorData = {
        value: data.value,
        timestamp: new Date(),
      };

      setSensorData(newEntry);
      setHistory((prev) => {
        const updated = [...prev, { value: newEntry.value, timestamp: newEntry.timestamp }];
        return updated.slice(-MAX_HISTORY);
      });

      if (data.pumpState !== undefined) setPumpState(data.pumpState);
      if (data.autoMode !== undefined) setAutoMode(data.autoMode);
      
      // อัพเดท threshold ถ้า Arduino ส่งมา
      if (data.thresholdDry !== undefined || data.thresholdWet !== undefined) {
        setSettings(prev => {
          const updated = { ...prev };
          if (data.thresholdDry !== undefined) updated.thresholdDry = data.thresholdDry;
          if (data.thresholdWet !== undefined) updated.thresholdWet = data.thresholdWet;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }

      setIsConnected(true);
      setError(null);
    } catch (err) {
      setIsConnected(false);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Main effect for data fetching/generation
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear history when switching modes
    setHistory([]);

    const tick = settings.demoMode ? generateMockData : fetchSensorData;
    tick();
    intervalRef.current = window.setInterval(tick, settings.updateInterval);

    // ส่งค่า threshold ไป Arduino เมื่อเริ่มต้น (ถ้าไม่ใช่ demo mode)
    if (!settings.demoMode && settings.apiUrl) {
      const sendInitialThresholds = async () => {
        try {
          const baseUrl = settings.apiUrl.replace('/api/sensor', '').replace('/api/value', '');
          await fetch(`${baseUrl}/api/thresholds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              thresholdDry: settings.thresholdDry,
              thresholdWet: settings.thresholdWet
            }),
          });
        } catch (err) {
          console.log('Could not send initial thresholds:', err);
        }
      };
      
      // ส่งหลังจาก delay เล็กน้อยเพื่อให้ Arduino พร้อม
      setTimeout(sendInitialThresholds, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings.demoMode, settings.updateInterval, generateMockData, fetchSensorData]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // ส่งค่า threshold ไป Arduino ถ้าไม่ใช่ demo mode
      if (!updated.demoMode && (newSettings.thresholdDry !== undefined || newSettings.thresholdWet !== undefined)) {
        const sendThresholds = async () => {
          try {
            const baseUrl = updated.apiUrl.replace('/api/sensor', '').replace('/api/value', '');
            const response = await fetch(`${baseUrl}/api/thresholds`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                thresholdDry: updated.thresholdDry,
                thresholdWet: updated.thresholdWet
              }),
            });
            
            if (response.ok) {
              console.log('Thresholds updated successfully');
            } else {
              console.error('Failed to update thresholds');
            }
          } catch (err) {
            console.error('Error updating thresholds:', err);
          }
        };
        
        sendThresholds();
      }
      
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const togglePump = useCallback(async (state: boolean) => {
    // Update state immediately for better UX
    if (!autoModeRef.current) {
      setPumpState(state);
    }

    if (settingsRef.current.demoMode) {
      return;
    }

    try {
      const baseUrl = getBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${baseUrl}/api/pump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setPumpState(data.pumpState);
      } else {
        // Revert state if API call failed
        if (!autoModeRef.current) {
          setPumpState(!state);
        }
      }
    } catch (err) {
      console.error('Failed to toggle pump:', err);
      // Revert state if API call failed
      if (!autoModeRef.current) {
        setPumpState(!state);
      }
    }
  }, [getBaseUrl]);

  const toggleAuto = useCallback(async (state: boolean) => {
    // Update state immediately for better UX
    setAutoMode(state);
    if (!state) {
      setPumpState(false);
    }

    if (settingsRef.current.demoMode) {
      return;
    }

    try {
      const baseUrl = getBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${baseUrl}/api/auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setAutoMode(data.autoMode);
        if (!data.autoMode) {
          setPumpState(false);
        }
      } else {
        // Revert state if API call failed
        setAutoMode(!state);
        if (state) {
          setPumpState(false);
        }
      }
    } catch (err) {
      console.error('Failed to toggle auto mode:', err);
      // Revert state if API call failed
      setAutoMode(!state);
      if (state) {
        setPumpState(false);
      }
    }
  }, [getBaseUrl]);

  return {
    sensorData,
    history,
    settings,
    isConnected,
    error,
    isLoading,
    pumpState,
    autoMode,
    updateSettings,
    clearHistory,
    refetch: settings.demoMode ? generateMockData : fetchSensorData,
    togglePump,
    toggleAuto,
  };
}
