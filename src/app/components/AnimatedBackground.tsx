"use client";

import { useMemo, useEffect, useState } from "react";

const SYMBOLS = [
  "$", "€", "£", "¥", "₹", "₩", "₽", "₺", "₫", "₦", "₪", "₱", "฿", "₡", "₲", "₴", "₸", "₾", "₼", "₵", "₭", "₮",
  "★", "★", "★", "☆", "☆"
];

const SVG_SIZE = 1200;
const PAD = 50;

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function generateLayerSvg(seed: number, gridSize: number, layerIndex: number) {
  const random = mulberry32(seed);
  let svgContent = '';
  
  const cellSize = SVG_SIZE / gridSize;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let baseScale, baseOpacity;
      if (layerIndex === 0) {
        baseScale = 0.6 + random() * 0.4;
        baseOpacity = 0.10 + random() * 0.10;
      } else if (layerIndex === 1) {
        baseScale = 1.0 + random() * 0.6;
        baseOpacity = 0.20 + random() * 0.10;
      } else {
        baseScale = 1.6 + random() * 0.8;
        baseOpacity = 0.30 + random() * 0.20;
      }

      const char = SYMBOLS[Math.floor(random() * SYMBOLS.length)];
      
      const jitterX = (random() - 0.5) * (cellSize * 0.6);
      const jitterY = (random() - 0.5) * (cellSize * 0.6);
      
      const x = i * cellSize + (cellSize / 2) + jitterX;
      const y = j * cellSize + (cellSize / 2) + jitterY;
      
      const fontSize = 16 * baseScale;
      
      const positions = [[x, y]];
      if (x < PAD) positions.push([x + SVG_SIZE, y]);
      if (x > SVG_SIZE - PAD) positions.push([x - SVG_SIZE, y]);
      if (y < PAD) positions.push([x, y + SVG_SIZE]);
      if (y > SVG_SIZE - PAD) positions.push([x, y - SVG_SIZE]);
      
      if (x < PAD && y < PAD) positions.push([x + SVG_SIZE, y + SVG_SIZE]);
      if (x > SVG_SIZE - PAD && y < PAD) positions.push([x - SVG_SIZE, y + SVG_SIZE]);
      if (x < PAD && y > SVG_SIZE - PAD) positions.push([x + SVG_SIZE, y - SVG_SIZE]);
      if (x > SVG_SIZE - PAD && y > SVG_SIZE - PAD) positions.push([x - SVG_SIZE, y - SVG_SIZE]);

      for (const [px, py] of positions) {
        svgContent += `<text x="${px}" y="${py}" font-family="monospace" font-size="${fontSize}" fill="#ffffff" opacity="${baseOpacity}" text-anchor="middle" dominant-baseline="middle">${char}</text>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_SIZE}" height="${SVG_SIZE}">${svgContent}</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const layers = useMemo(() => {
    return [
      { id: 0, url: generateLayerSvg(12345, 16, 0), speed: 180, direction: -1 }, // 16x16 = 256 symbols
      { id: 1, url: generateLayerSvg(67890, 13, 1), speed: 120, direction: 1 },  // 13x13 = 169 symbols
      { id: 2, url: generateLayerSvg(54321, 9, 2), speed: 90, direction: -1 },   // 9x9 = 81 symbols
    ];
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-zinc-950">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flowDiag0 { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-${SVG_SIZE}px, -${SVG_SIZE}px, 0); } }
        @keyframes flowDiag1 { from { transform: translate3d(-${SVG_SIZE}px, 0, 0); } to { transform: translate3d(0, -${SVG_SIZE}px, 0); } }
        @keyframes flowDiag2 { from { transform: translate3d(0, -${SVG_SIZE}px, 0); } to { transform: translate3d(-${SVG_SIZE}px, 0, 0); } }
        
        .layer-flow {
          position: absolute;
          top: 0; left: 0;
          width: calc(100vw + ${SVG_SIZE}px);
          height: calc(100vh + ${SVG_SIZE}px);
          background-repeat: repeat;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .layer-flow {
            animation: none !important;
            transform: translate3d(0,0,0) !important;
          }
        }
      `}} />
      
      {layers.map((layer, idx) => {
        const blurAmount = [4, 2, 1][idx];
        return (
          <div
            key={layer.id}
            className="layer-flow"
            style={{
              backgroundImage: `url("${layer.url}")`,
              backgroundSize: `${SVG_SIZE}px ${SVG_SIZE}px`,
              animation: `flowDiag${idx} ${layer.speed}s linear infinite`,
              filter: `blur(${blurAmount}px)`
            }}
          />
        );
      })}
    </div>
  );
}
