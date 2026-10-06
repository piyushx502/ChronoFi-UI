"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      exit={{ opacity: 0, filter: "blur(8px)", y: -10 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="w-full h-full relative z-10"
    >
      {children}
    </motion.div>
  );
}
