import { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'star';
}

const COLORS = [
  '#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#f59e0b', '#f97316', '#ec4899', '#8b5cf6', '#eab308'
];

export function Confetti({ active, duration = 4000, onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create particles from bottom left and bottom right shooting upwards
    const particleCount = 140;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const fromLeft = i % 2 === 0;
      particles.push({
        x: fromLeft ? width * 0.15 + (Math.random() * 80 - 40) : width * 0.85 + (Math.random() * 80 - 40),
        y: height * 0.85 + Math.random() * 50,
        vx: fromLeft ? Math.random() * 9 + 4 : -(Math.random() * 9 + 4),
        vy: -(Math.random() * 16 + 12),
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        shape: Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'circle' : 'star',
      });
    }

    let animId: number;
    const startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        ctx.clearRect(0, 0, width, height);
        if (onComplete) onComplete();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Physics update
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.42; // gravity
        p.vx *= 0.985; // friction
        p.rotation += p.rotationSpeed;

        if (progress > 0.65) {
          p.opacity = Math.max(0, 1 - (progress - 0.65) / 0.35);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw mini star
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size);
            ctx.lineTo(Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size / 2));
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [active, duration, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100] w-full h-full"
    />
  );
}
