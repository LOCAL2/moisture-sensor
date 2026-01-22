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
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const togglePump = useCallback(async (state: boolean) => {
    if (settingsRef.current.demoMode) {
      if (!autoModeRef.current) {
        setPumpState(state);
      }
      return;
    }

    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/pump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });

      if (response.ok) {
        const data = await response.json();
        setPumpState(data.pumpState);
      }
    } catch (err) {
      console.error('Failed to toggle pump:', err);
    }
  }, [getBaseUrl]);

  const toggleAuto = useCallback(async (state: boolean) => {
    if (settingsRef.current.demoMode) {
      setAutoMode(state);
      if (!state) {
        setPumpState(false);
      }
      return;
    }

    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });

      if (response.ok) {
        const data = await response.json();
        setAutoMode(data.autoMode);
        if (!data.autoMode) {
          setPumpState(false);
        }
      }
    } catch (err) {
      console.error('Failed to toggle auto mode:', err);
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
