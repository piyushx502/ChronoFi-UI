"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, LayoutDashboard, LineChart, MessageSquare, Calculator } from "lucide-react";

const NAV_ITEMS = [
  { name: 'Terminal', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quant Models', href: '/dashboard/models', icon: LineChart },
  { name: 'AI Transcripts', href: '/dashboard/transcripts', icon: MessageSquare },
  { name: 'Tax Planner', href: '/dashboard/tax', icon: Calculator },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
    <div className="flex h-screen text-zinc-100 overflow-hidden relative">
      {/* Sidebar - Hidden on mobile, visible on md and up */}
      <motion.aside 
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex w-64 border-r border-zinc-800/50 bg-zinc-950/60 flex-col shrink-0 backdrop-blur-sm relative z-20"
      >
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/50">
          <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center mr-3 shadow-sm ring-1 ring-white/10">
            <span className="text-zinc-950 font-bold text-lg">C</span>
          </div>
          <span className="font-semibold tracking-tight text-zinc-100">ChronoFi</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                  isActive 
                    ? "bg-zinc-800/60 text-zinc-100 shadow-sm ring-1 ring-zinc-700/50" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] mr-3 transition-colors ${isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <button 
            onClick={handleLogout}
            className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            <LogOut className="w-[18px] h-[18px] mr-3 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
            Disconnect
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative w-full z-10">
        {/* Mobile Header */}
        <div className="md:hidden h-16 flex items-center justify-between px-6 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center mr-3 shadow-sm ring-1 ring-white/10">
              <span className="text-zinc-950 font-bold text-lg">C</span>
            </div>
            <span className="font-semibold tracking-tight text-zinc-100">ChronoFi</span>
          </div>
          <button onClick={handleLogout} className="text-zinc-400 p-2 hover:text-zinc-200 transition-colors rounded-md outline-none focus-visible:ring-2 focus-visible:ring-zinc-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Global animated background overlay for the content section */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] pointer-events-none" />
        
        {children}
      </main>
    </div>
  );
}
