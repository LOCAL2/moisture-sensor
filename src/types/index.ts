export interface SensorData {
  value: number;
  timestamp: Date;
}

export interface Settings {
  apiUrl: string;
  updateInterval: number;
  thresholdDry: number;
  thresholdWet: number;
  demoMode: boolean;
  demoMin: number;
  demoMax: number;
  fontSize: number;
}

export interface HistoryEntry {
  value: number;
  timestamp: Date;
}
