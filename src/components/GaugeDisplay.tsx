import { useEffect, useRef } from 'react';
import styles from './GaugeDisplay.module.css';

interface GaugeDisplayProps {
  value: number;
  percentage: number;
  status: string;
  statusLabel: string;
  statusColor: string;
}

export function GaugeDisplay({ value, percentage, statusLabel, statusColor }: GaugeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedValue = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 130;

    const animate = () => {
      const diff = percentage - animatedValue.current;
      animatedValue.current += diff * 0.08;

      ctx.clearRect(0, 0, size, size);

      // Background arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI * 0.75, Math.PI * 2.25);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Progress arc with color based on percentage
      const progressAngle = Math.PI * 0.75 + (Math.PI * 1.5 * animatedValue.current) / 100;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI * 0.75, progressAngle);
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow effect
      ctx.shadowColor = statusColor;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, progressAngle - 0.1, progressAngle);
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner decorative rings
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 35, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 25, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tick marks
      for (let i = 0; i <= 10; i++) {
        const angle = Math.PI * 0.75 + (Math.PI * 1.5 * i) / 10;
        const innerR = radius + 30;
        const outerR = radius + (i % 5 === 0 ? 45 : 38);
        
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(angle) * innerR,
          centerY + Math.sin(angle) * innerR
        );
        ctx.lineTo(
          centerX + Math.cos(angle) * outerR,
          centerY + Math.sin(angle) * outerR
        );
        ctx.strokeStyle = i % 5 === 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = i % 5 === 0 ? 2 : 1;
        ctx.stroke();
      }

      if (Math.abs(diff) > 0.1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [percentage, statusColor]);

  return (
    <div className={styles.container}>
      <div className={styles.glowOrb} style={{ background: `radial-gradient(circle, ${statusColor}20 0%, transparent 70%)` }} />
      
      <canvas ref={canvasRef} className={styles.canvas} />
      
      <div className={styles.centerContent}>
        <div className={styles.percentage} style={{ color: statusColor }}>
          {percentage}%
        </div>
        <div className={styles.value}>
          {value.toLocaleString()} <span>ADC</span>
        </div>
        <div className={styles.status} style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
          {statusLabel}
        </div>
      </div>

      <div className={styles.particles}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              '--delay': `${i * 0.5}s`,
              '--color': statusColor,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
