"use client";

import { useRef, useEffect } from "react";
import { useAnimationFrame } from "framer-motion";

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const extraPointsRef = useRef<{ x: number, y: number, char: string, timeAdded: number }[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleClick = (e: MouseEvent) => {
      const char = Math.random() > 0.5 ? "+" : ".";
      extraPointsRef.current.push({ x: e.clientX, y: e.clientY, char, timeAdded: Date.now() });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  useAnimationFrame((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Responsive canvas
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.fillStyle = "#09090b"; // bg-zinc-950
    ctx.fillRect(0, 0, width, height);

    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cols = Math.floor(width / 20);
    const rows = Math.floor(height / 20);

    const { x: mouseX, y: mouseY } = mouseRef.current;

    // Helper to draw a point with noise and repulsion
    const drawPoint = (baseX: number, baseY: number, i: number, j: number, char: string, alphaMultiplier: number = 1, scale: number = 1) => {
        let noiseX = Math.sin((time * 0.001) + (i * 0.1)) * 5;
        let noiseY = Math.cos((time * 0.001) + (j * 0.1)) * 5;

        const dx = mouseX - (baseX + noiseX);
        const dy = mouseY - (baseY + noiseY);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const maxDistance = 50; // Reduced disturbance radius
        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          noiseX -= (dx / distance) * force * 20;
          noiseY -= (dy / distance) * force * 20;
          ctx.fillStyle = `rgba(228, 228, 231, ${(0.8 + force * 0.2) * alphaMultiplier})`; // zinc-200, highly visible
        } else {
          ctx.fillStyle = `rgba(161, 161, 170, ${0.5 * alphaMultiplier})`; // zinc-400
        }
        
        ctx.font = `${14 * scale}px monospace`;
        ctx.fillText(char, baseX + noiseX, baseY + noiseY);
    };

    // Draw grid
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const baseX = i * 20;
        const baseY = j * 20;
        const char = (i + j) % 3 === 0 ? "+" : ".";
        drawPoint(baseX, baseY, i, j, char);
      }
    }

    // Draw user-clicked extra points
    const extraPoints = extraPointsRef.current;
    const now = Date.now();
    for (let k = extraPoints.length - 1; k >= 0; k--) {
      const pt = extraPoints[k];
      const age = now - pt.timeAdded;
      const lifespan = 5000; // 5 seconds
      
      if (age > lifespan) {
        extraPoints.splice(k, 1);
        continue;
      }
      
      const progress = age / lifespan;
      const alphaMultiplier = 1 - progress;
      
      // Scale starts at 4x (big), shrinks to 1x quickly over first 20% of lifespan
      const scale = progress < 0.2 ? 1 + (3 * (1 - (progress / 0.2))) : 1;

      const pseudoI = pt.x / 20;
      const pseudoJ = pt.y / 20;
      drawPoint(pt.x, pt.y, pseudoI, pseudoJ, pt.char, alphaMultiplier, scale);
    }
  });

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] pointer-events-none"
    />
  );
}
