"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const rawUsername = username.trim();
      const email = rawUsername.includes("@") ? rawUsername : `${rawUsername}@chronofi.demo`;
      
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      
      // Store token securely
      localStorage.setItem("token", data.access_token);
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 border border-zinc-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-10 w-10 bg-zinc-100 rounded flex items-center justify-center mb-4">
            <span className="text-zinc-900 font-bold text-xl">C</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">ChronoFi Terminal</h1>
          <p className="text-zinc-400 text-sm mt-1">Institutional-grade quantitative planning.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. arjun"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
              required
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                animate={{ opacity: 1, height: "auto", marginTop: 8 }} 
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="text-red-500 text-xs font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button 
            type="submit" 
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </motion.button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-500">
            Demo Accounts: <span className="text-zinc-300 font-medium">arjun</span> / <span className="text-zinc-300 font-medium">priya</span> (pw: <span className="text-zinc-300 font-medium">password123</span>)
          </p>
        </div>
      </motion.div>
    </div>
  );
}
