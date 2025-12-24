import { useMemo, useState, useRef } from 'react';
import type { HistoryEntry } from '../types';
import styles from './MoistureChart.module.css';

interface MoistureChartProps {
  data: HistoryEntry[];
  thresholdDry: number;
}

interface TooltipData {
  x: number;
  y: number;
  value: number;
  time: Date;
}

export function MoistureChart({ data, thresholdDry }: MoistureChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const chartData = useMemo(() => {
    if (data.length < 2) return null;

    const width = 100;
    const height = 50;
    const padding = { top: 5, right: 5, bottom: 5, left: 5 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = 4095;
    const minValue = 0;

    const points = data.map((entry, i) => ({
      x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
      y: padding.top + chartHeight - ((entry.value - minValue) / (maxValue - minValue)) * chartHeight,
      value: entry.value,
      time: entry.timestamp,
      index: i,
    }));

    // Smooth curve path
    const linePath = points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      
      const prev = points[i - 1];
      const cpX = (prev.x + point.x) / 2;
      return `${path} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
    }, '');

    // Area path
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    // Threshold line Y position
    const thresholdY = padding.top + chartHeight - ((thresholdDry - minValue) / (maxValue - minValue)) * chartHeight;

    return { points, linePath, areaPath, thresholdY, padding, chartHeight, chartWidth };
  }, [data, thresholdDry]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartData || !svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;

    // Find closest point
    let closestPoint = chartData.points[0];
    let minDist = Math.abs(x - closestPoint.x);

    for (const point of chartData.points) {
      const dist = Math.abs(x - point.x);
      if (dist < minDist) {
        minDist = dist;
        closestPoint = point;
      }
    }

    setTooltip({
      x: (closestPoint.x / 100) * rect.width,
      y: (closestPoint.y / 50) * rect.height,
      value: closestPoint.value,
      time: new Date(closestPoint.time),
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const currentValue = data.length > 0 ? data[data.length - 1].value : 0;
  const percentage = Math.round((currentValue / 4095) * 100);
  const isLow = percentage <= 30;

  if (data.length < 2) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h3>Moisture Level</h3>
            <span className={styles.badge} style={{ background: isLow ? '#ff475720' : '#5b9bd520', color: isLow ? '#ff4757' : '#5b9bd5' }}>
              {isLow ? 'LOW' : 'NORMAL'}
            </span>
          </div>
          <div className={styles.currentValue}>
            <span className={styles.valueNum}>{currentValue}</span>
            <span className={styles.valueUnit}>ADC</span>
          </div>
        </div>
        <div className={styles.empty}>
          <p>Collecting data...</p>
        </div>
      </div>
    );
  }

  const tooltipValue = tooltip ? tooltip.value : currentValue;
  const tooltipPercentage = Math.round((tooltipValue / 4095) * 100);
  const tooltipIsLow = tooltipPercentage <= 30;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3>Moisture Level</h3>
          <span className={styles.badge} style={{ background: tooltipIsLow ? '#ff475720' : '#5b9bd520', color: tooltipIsLow ? '#ff4757' : '#5b9bd5' }}>
            {tooltipIsLow ? 'LOW' : 'NORMAL'}
          </span>
        </div>
        <div className={styles.currentValue}>
          <span className={styles.valueNum} style={{ color: tooltipIsLow ? '#ff4757' : '#5b9bd5' }}>{tooltipValue}</span>
          <span className={styles.valueUnit}>ADC</span>
          <span className={styles.percentage}>({tooltipPercentage}%)</span>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <svg 
          ref={svgRef}
          className={styles.svg} 
          viewBox="0 0 100 50" 
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isLow ? '#ff4757' : '#5b9bd5'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isLow ? '#ff4757' : '#5b9bd5'} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={isLow ? '#ff4757' : '#5b9bd5'} stopOpacity="0.5" />
              <stop offset="100%" stopColor={isLow ? '#ff4757' : '#5b9bd5'} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = chartData!.padding.top + (chartData!.chartHeight * (100 - pct)) / 100;
            return (
              <line
                key={pct}
                x1={chartData!.padding.left}
                y1={y}
                x2={chartData!.padding.left + chartData!.chartWidth}
                y2={y}
                className={styles.gridLine}
              />
            );
          })}

          {/* Threshold line */}
          <line
            x1={chartData!.padding.left}
            y1={chartData!.thresholdY}
            x2={chartData!.padding.left + chartData!.chartWidth}
            y2={chartData!.thresholdY}
            className={styles.thresholdLine}
          />

          {/* Area fill */}
          <path d={chartData!.areaPath} fill="url(#chartGradient)" />

          {/* Line */}
          <path
            d={chartData!.linePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.line}
          />

          {/* Current point glow */}
          <circle
            cx={chartData!.points[chartData!.points.length - 1].x}
            cy={chartData!.points[chartData!.points.length - 1].y}
            r="1.5"
            fill={isLow ? '#ff4757' : '#5b9bd5'}
            className={styles.currentDot}
          />
        </svg>

        {/* Tooltip indicator line and dot */}
        {tooltip && (
          <>
            <div 
              className={styles.tooltipLine} 
              style={{ left: tooltip.x }}
            />
            <div 
              className={styles.tooltipDot} 
              style={{ 
                left: tooltip.x, 
                top: tooltip.y,
                background: tooltipIsLow ? '#ff4757' : '#5b9bd5',
                boxShadow: `0 0 10px ${tooltipIsLow ? '#ff4757' : '#5b9bd5'}`
              }}
            />
            <div 
              className={styles.tooltip}
              style={{ 
                left: tooltip.x,
                top: tooltip.y - 50,
              }}
            >
              <span className={styles.tooltipValue}>{tooltip.value} ADC</span>
              <span className={styles.tooltipTime}>
                {tooltip.time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </>
        )}

        {/* Y-axis labels */}
        <div className={styles.yAxis}>
          <span>4095</span>
          <span>2048</span>
          <span>0</span>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#ff4757' }} />
            Threshold ({thresholdDry})
          </span>
        </div>
        <span className={styles.dataPoints}>{data.length} data points</span>
      </div>
    </div>
  );
}
