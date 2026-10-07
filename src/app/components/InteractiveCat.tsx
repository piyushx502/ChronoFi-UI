"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

export default function InteractiveCat({ children }: { children?: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-200, 200], [25, -25]);
  const rotateY = useTransform(mouseXSpring, [-200, 200], [-25, 25]);
  const translateX = useTransform(mouseXSpring, [-200, 200], [-10, 10]);
  const translateY = useTransform(mouseYSpring, [-200, 200], [-10, 10]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div 
      className="w-full h-full relative" 
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cat layer: Organic breathing animation, NO 3D mouse rotation */}
      <motion.div
        animate={{ 
          y: [0, -6, 0],
          scaleY: [1, 0.98, 1],
          scaleX: [1, 1.01, 1]
        }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="w-full h-full relative cursor-pointer"
        whileTap={{ scale: 0.95 }}
      >
        <Image
          src="/images/error-cat-tuxedo-clean.png"
          alt="Laying cat"
          fill
          className="object-contain"
          style={{ 
            filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.8)) drop-shadow(-1px -1px 0px rgba(255,255,255,0.8)) drop-shadow(1px -1px 0px rgba(255,255,255,0.8)) drop-shadow(-1px 1px 0px rgba(255,255,255,0.8)) drop-shadow(0px 10px 15px rgba(0,0,0,0.8))'
          }}
          priority
        />
        
        {/* Blinking Frame */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
          transition={{
            duration: 3.5,
            times: [0, 0.94, 0.95, 0.98, 0.99, 1], // Faster, snappier blink every 3.5 seconds
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Image
            src="/images/cat-blink-ai.png"
            alt="Laying cat blinking"
            fill
            className="object-contain"
            priority
          />
        </motion.div>
      </motion.div>

      {/* Text layer: Receives the 3D mouse parallax to float over the belly! */}
      {children && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            x: translateX,
            y: translateY,
            rotateX: rotateX,
            rotateY: rotateY,
            transformStyle: "preserve-3d" 
          }}
        >
          <div style={{ transform: "translateZ(30px)" }} className="w-full h-full">
            {children}
          </div>
        </motion.div>
      )}
    </div>
  );
}
