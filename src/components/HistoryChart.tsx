import { useMemo, useState } from 'react';
import type { HistoryEntry } from '../types';
import styles from './HistoryChart.module.css';

interface HistoryChartProps {
  data: HistoryEntry[];
  thresholdDry: number;
}

export function HistoryChart({ data, thresholdDry }: HistoryChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; entry: HistoryEntry } | null>(null);

  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const width = 100;
    const height = 100;
    const padding = { top: 10, right: 10, bottom: 20, left: 15 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(4095, ...data.map(d => d.value));
    const minValue = 0;

    const points = data.map((entry, i) => ({
      x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
      y: padding.top + chartHeight - ((entry.value - minValue) / (maxValue - minValue)) * chartHeight,
      entry,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    const thresholdY = padding.top + chartHeight - ((thresholdDry - minValue) / (maxValue - minValue)) * chartHeight;

    return { points, linePath, areaPath, thresholdY, padding, chartHeight, maxValue };
  }, [data, thresholdDry]);

  if (data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <span>📊</span>
          <span>ยังไม่มีข้อมูล</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
        <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(pct => {
            const y = chartData!.padding.top + (chartData!.chartHeight * (100 - pct)) / 100;
            return (
              <line
                key={pct}
                x1={chartData!.padding.left}
                y1={y}
                x2={100 - chartData!.padding.right}
                y2={y}
                className={styles.gridLine}
              />
            );
          })}

          {/* Threshold line */}
          <line
            x1={chartData!.padding.left}
            y1={chartData!.thresholdY}
            x2={100 - chartData!.padding.right}
            y2={chartData!.thresholdY}
            className={styles.thresholdLine}
          />

          {/* Area fill */}
          <path d={chartData!.areaPath} fill="url(#areaGradient)" className={styles.areaGradient} />

          {/* Line */}
          <path d={chartData!.linePath} className={styles.line} vectorEffect="non-scaling-stroke" />

          {/* Data points */}
          {chartData!.points.slice(-20).map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="0.8"
              className={styles.dot}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                if (rect) {
                  setTooltip({
                    x: (point.x / 100) * rect.width,
                    y: (point.y / 100) * rect.height,
                    entry: point.entry,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}

          {/* Y-axis labels */}
          <text x="2" y={chartData!.padding.top + 3} className={styles.axisLabel}>
            {chartData!.maxValue}
          </text>
          <text x="2" y={chartData!.padding.top + chartData!.chartHeight} className={styles.axisLabel}>
            0
          </text>
        </svg>

        {tooltip && (
          <div
            className={styles.tooltip}
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 40,
            }}
          >
            <strong>{tooltip.entry.value} ADC</strong>
            <span>{new Date(tooltip.entry.timestamp).toLocaleTimeString('th-TH')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
