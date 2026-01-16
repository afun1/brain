import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface WaveVisualizerProps {
  isPlaying: boolean;
  beatFrequency: number; // Used to pulse the visual
}

export function WaveVisualizer({ isPlaying, beatFrequency }: WaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const draw = () => {
      // Clear with trail effect
      ctx.fillStyle = "rgba(10, 10, 20, 0.1)"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Calculate pulse based on beat frequency (Hz)
      // Hz = cycles per second. 
      // time moves ~0.016 per frame (60fps). 
      const pulseSpeed = isPlaying ? (beatFrequency > 0 ? beatFrequency : 0.5) : 0.2;
      const pulse = Math.sin(time * pulseSpeed * 2) * 0.5 + 0.5; // 0 to 1

      // Draw Orb
      const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 150);
      gradient.addColorStop(0, `hsla(250, 60%, 75%, ${0.8 + pulse * 0.2})`);
      gradient.addColorStop(0.4, `hsla(250, 60%, 75%, ${0.1 + pulse * 0.1})`);
      gradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(centerX, centerY, 100 + (pulse * 20), 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw Rings
      if (isPlaying) {
        ctx.strokeStyle = `hsla(180, 40%, 60%, 0.3)`;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 3; i++) {
          const offset = (time * 50 + i * 100) % 300;
          const alpha = 1 - (offset / 300);
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, offset, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(180, 40%, 60%, ${alpha * 0.5})`;
          ctx.stroke();
        }
      }

      time += 0.01;
      animationId = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, beatFrequency]);

  return (
    <motion.canvas 
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    />
  );
}
