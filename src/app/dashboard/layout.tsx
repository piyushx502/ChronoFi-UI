"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LogOut,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Calculator,
  SlidersHorizontal,
  User,
  Target,
  Compass,
  Sparkles,
} from "lucide-react";
import { CurrencyProvider } from "@/app/context/CurrencyContext";
import { ModeIntelligenceProvider, useModeIntelligence } from "@/app/context/ModeIntelligenceContext";
import { AutonomousModeBanner, ModeRadarModal } from "./components/AutonomousModeRadar";

const NAV_ITEMS = [
  { name: "Terminal", href: "/dashboard", icon: LayoutDashboard },
  { name: "Goal Chaser", href: "/dashboard/goals", icon: Target },
  { name: "Simulations", href: "/dashboard/simulations", icon: SlidersHorizontal },
  { name: "Quant Models", href: "/dashboard/models", icon: LineChart },
  { name: "AI Transcripts", href: "/dashboard/transcripts", icon: MessageSquare },
  { name: "Tax Planner", href: "/dashboard/tax", icon: Calculator },
];

function SidebarNav({ pathname }: { pathname: string }) {
  const { recommendedMode } = useModeIntelligence();

  return (
    <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const isRecommended =
          recommendedMode.href === item.href ||
          (item.href !== "/dashboard" && recommendedMode.href.startsWith(item.href));

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
              isActive
                ? "bg-zinc-800/60 text-zinc-100 shadow-sm ring-1 ring-zinc-700/50"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
            }`}
          >
            <div className="flex items-center">
              <item.icon
                className={`w-[18px] h-[18px] mr-3 transition-colors ${
                  isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-400"
                }`}
              />
              {item.name}
            </div>

            {isRecommended && (
              <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                Pick
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ pathname, handleLogout }: { pathname: string; handleLogout: () => void }) {
  const { setIsRadarOpen, recommendedMode } = useModeIntelligence();

  return (
    <div className="p-4 border-t border-zinc-800/50 flex flex-col gap-1.5">
      <button
        onClick={() => setIsRadarOpen(true)}
        type="button"
        className="group flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 bg-emerald-500/5 border border-emerald-500/20 rounded-lg transition-all outline-none"
      >
        <span className="flex items-center">
          <Compass className="w-3.5 h-3.5 mr-2 text-emerald-400 group-hover:rotate-45 transition-transform" />
          Mode Radar
        </span>
        <span className="font-mono text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded font-bold">
          {recommendedMode.matchScore}%
        </span>
      </button>

      <Link
        href="/dashboard/profile"
        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
          pathname === "/dashboard/profile"
            ? "bg-zinc-800/60 text-zinc-100 shadow-sm ring-1 ring-zinc-700/50"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
        }`}
      >
        <User
          className={`w-[18px] h-[18px] mr-3 transition-colors ${
            pathname === "/dashboard/profile" ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-400"
          }`}
        />
        Profile
      </Link>

      <button
        onClick={handleLogout}
        className="group flex items-center w-full px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      >
        <LogOut className="w-3.5 h-3.5 mr-2 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
        Disconnect
      </button>
    </div>
  );
}

function MobileHeader({ pathname, handleLogout }: { pathname: string; handleLogout: () => void }) {
  const { setIsRadarOpen, recommendedMode } = useModeIntelligence();

  return (
    <div className="md:hidden h-16 flex items-center justify-between px-6 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center">
        <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center mr-3 shadow-sm ring-1 ring-white/10">
          <span className="text-zinc-950 font-bold text-lg">C</span>
        </div>
        <span className="font-semibold tracking-tight text-zinc-100">ChronoFi</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsRadarOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-md"
          title="Mode Radar"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{recommendedMode.matchScore}%</span>
        </button>
        <Link
          href="/dashboard/profile"
          className={`p-2 rounded-md transition-colors ${
            pathname === "/dashboard/profile" ? "text-zinc-100 bg-zinc-800" : "text-zinc-400 hover:text-zinc-200"
          }`}
          title="Profile"
        >
          <User className="w-5 h-5" />
        </Link>
        <button
          onClick={handleLogout}
          className="text-zinc-400 p-2 hover:text-zinc-200 transition-colors rounded-md outline-none"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      if (urlToken) {
        localStorage.setItem("token", urlToken);
      }
    }
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
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  return (
    <CurrencyProvider>
      <ModeIntelligenceProvider>
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

            <SidebarNav pathname={pathname} />
            <SidebarFooter pathname={pathname} handleLogout={handleLogout} />
          </motion.aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto relative w-full z-10 flex flex-col">
            <MobileHeader pathname={pathname} handleLogout={handleLogout} />

            {/* Global animated background overlay for the content section */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] pointer-events-none" />

            {/* ChronoFi Autonomous Mode Autopilot Banner */}
            <AutonomousModeBanner />

            <div className="flex-1">
              {children}
            </div>

            {/* Global Radar Modal */}
            <ModeRadarModal />
          </main>
        </div>
      </ModeIntelligenceProvider>
    </CurrencyProvider>
  );
}
