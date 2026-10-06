"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, LayoutDashboard, LineChart, MessageSquare } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    } else {
      setMounted(true);
    }
  }, [router]);

  if (!mounted) return null; // Prevent hydration errors

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <div className="flex h-screen text-zinc-100 overflow-hidden">
      {/* Sidebar - Hidden on mobile, visible on md and up */}
      <motion.aside 
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex w-64 border-r border-zinc-900 bg-zinc-950/50 flex-col shrink-0 backdrop-blur-md"
      >
        <div className="h-16 flex items-center px-6 border-b border-zinc-900">
          <div className="h-8 w-8 bg-zinc-100 rounded flex items-center justify-center mr-3">
            <span className="text-zinc-900 font-bold text-lg">C</span>
          </div>
          <span className="font-semibold tracking-tight">ChronoFi</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium hover:bg-zinc-900/50 text-zinc-100 rounded-md transition-colors">
            <LayoutDashboard className="w-4 h-4 mr-3 text-zinc-400" />
            Terminal
          </Link>
          <Link href="/dashboard/models" className="flex items-center px-3 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 rounded-md transition-colors">
            <LineChart className="w-4 h-4 mr-3" />
            Quant Models
          </Link>
          <Link href="/dashboard/transcripts" className="flex items-center px-3 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 rounded-md transition-colors">
            <MessageSquare className="w-4 h-4 mr-3" />
            AI Transcripts
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Disconnect
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden h-16 flex items-center justify-between px-6 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-zinc-100 rounded flex items-center justify-center mr-3">
              <span className="text-zinc-900 font-bold text-lg">C</span>
            </div>
            <span className="font-semibold tracking-tight">ChronoFi</span>
          </div>
          <button onClick={handleLogout} className="text-zinc-400 p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
