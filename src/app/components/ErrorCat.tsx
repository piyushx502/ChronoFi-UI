"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function ErrorCat() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ 
        repeat: Infinity, 
        duration: 4, 
        ease: "easeInOut" 
      }}
      className="relative w-28 h-28 mix-blend-screen select-none"
    >
      <Image
        src="/images/error-cat-2d.jpg"
        alt="Animated 2D error cat"
        fill
        className="object-contain"
        priority
      />
    </motion.div>
  );
}
