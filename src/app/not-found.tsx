"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import InteractiveCat from "./components/InteractiveCat";

export default function NotFound() {
  const router = useRouter();
  const [isGoingBack, setIsGoingBack] = useState(false);

  const handleGoBack = () => {
    setIsGoingBack(true);
    setTimeout(() => {
      router.back();
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-xl w-full p-8 border border-zinc-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm text-center shadow-2xl flex flex-col items-center"
      >
        
        {/* Cat illustration container */}
        <div className="relative w-full max-w-md aspect-square mx-auto mb-2 select-none z-10">
          <InteractiveCat />
        </div>
        
        {/* Error Text Block (Moved below the cat with negative margin to close the transparent gap) */}
        <div className="text-center mb-8 -mt-20 relative z-20">
          <h1 
            className="text-5xl sm:text-6xl font-black text-zinc-100 tracking-tighter mb-1 font-sans"
            style={{
              textShadow: "1px 1px 0 #71717a, 2px 2px 0 #71717a, 3px 3px 0 #52525b, 4px 4px 0 #52525b, 5px 5px 15px rgba(0,0,0,0.9)"
            }}
          >
            404
          </h1>
          <p 
            className="text-zinc-100 text-xs sm:text-sm font-black tracking-widest uppercase mt-2"
            style={{ textShadow: "1px 1px 0 #71717a, 2px 2px 0 #52525b, 3px 3px 10px rgba(0,0,0,0.8)" }}
          >
            Page Not Found
          </p>
        </div>
        
        <motion.button
          onClick={handleGoBack}
          disabled={isGoingBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-medium rounded-lg px-4 py-3 text-sm transition-colors shadow-lg mt-8 disabled:opacity-80"
        >
          <ArrowLeft className={`w-4 h-4 transition-transform ${isGoingBack ? "-translate-x-2" : ""}`} />
          {isGoingBack ? "Returning..." : "Go Back"}
        </motion.button>
      </motion.div>
    </div>
  );
}
