"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function GoogleLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSuccess, setGoogleSuccess] = useState(false);
  const router = useRouter();

  const isAuthenticating = loading || googleLoading || googleSuccess;
  const inFlightRef = useRef(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return;

    setLoading(true);
    setError("");

    try {
      const rawUsername = username.trim().toLowerCase();
      const email = rawUsername.includes("@")
        ? rawUsername
        : rawUsername === "admin"
        ? "admin@chronofi.com"
        : `${rawUsername}@chronofi.demo`;
      
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || "Invalid email or password");
      }

      if (!data.access_token) {
        throw new Error("Missing authentication token from server response");
      }
      
      // Store token securely
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", rawUsername);
      
      // Redirect cleanly to dashboard
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const processGoogleIdToken = useCallback(async (idToken: string) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setGoogleLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || "Google authentication failed.");
      }

      if (!data.access_token) {
        throw new Error("Missing authentication token from server response.");
      }

      setGoogleSuccess(true);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", data.email || data.name || "Google User");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 400);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to authenticate with Google.");
      setGoogleLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  const handleGoogleSignIn = () => {
    if (isAuthenticating || inFlightRef.current) return;
    setError("");

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google Sign-In is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.");
      return;
    }

    setGoogleLoading(true);

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const nonce = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2);

    const width = 500;
    const height = 600;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "id_token",
      scope: "openid email profile",
      nonce: nonce,
      prompt: "select_account",
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    const popup = window.open(
      authUrl,
      "chronofi_google_login",
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      // Fallback for popup blockers: perform full-page navigation
      window.location.href = authUrl;
      return;
    }

    let isResolved = false;

    const cleanup = () => {
      clearInterval(popupInterval);
      window.removeEventListener("message", handlePostMessage);
    };

    const handlePostMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "GOOGLE_AUTH_SUCCESS" && event.data.id_token) {
        isResolved = true;
        cleanup();
        await processGoogleIdToken(event.data.id_token);
      } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
        isResolved = true;
        cleanup();
        setError(event.data.error || "Google authentication was cancelled or failed.");
        setGoogleLoading(false);
      }
    };

    const popupInterval = setInterval(() => {
      if (popup.closed) {
        cleanup();
        if (!isResolved && !inFlightRef.current) {
          setError("Google sign-in was cancelled.");
          setGoogleLoading(false);
        }
      }
    }, 500);

    window.addEventListener("message", handlePostMessage);
  };

  // Optional: Initialize Google One Tap / GIS client if script is present and configured
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || typeof window === "undefined") return;

    interface GoogleGSI {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (res: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt?: () => void;
        };
      };
    }

    const initGIS = () => {
      const google = (window as unknown as { google?: GoogleGSI }).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (res: { credential?: string }) => {
            if (res?.credential) {
              processGoogleIdToken(res.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };

    if ((window as unknown as { google?: GoogleGSI }).google?.accounts?.id) {
      initGIS();
    } else {
      const existingScript = document.getElementById("google-gsi-client");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-gsi-client";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initGIS;
        document.head.appendChild(script);
      }
    }
  }, [processGoogleIdToken]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 border border-zinc-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm shadow-2xl"
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
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Username or Email</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin@chronofi.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
              required
              disabled={isAuthenticating}
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
              disabled={isAuthenticating}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                animate={{ opacity: 1, height: "auto", marginTop: 8 }} 
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                role="alert"
                className="text-red-500 text-xs font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button 
            type="submit" 
            disabled={isAuthenticating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </motion.button>
        </form>

        {/* Divider with subtle label */}
        <div className="relative my-5" aria-hidden="true">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-zinc-950 px-2.5 text-zinc-500 font-mono tracking-wider uppercase">OR</span>
          </div>
        </div>

        {/* Continue with Google Button */}
        <motion.button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isAuthenticating}
          whileHover={{ scale: isAuthenticating ? 1 : 1.02 }}
          whileTap={{ scale: isAuthenticating ? 1 : 0.98 }}
          aria-label="Continue with Google"
          aria-busy={googleLoading}
          className="w-full flex items-center justify-center gap-2.5 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 font-medium rounded-md px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50"
        >
          {googleLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
              <span>Connecting to Google...</span>
            </>
          ) : googleSuccess ? (
            <>
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Signed in! Redirecting...</span>
            </>
          ) : (
            <>
              <GoogleLogo className="w-4 h-4 shrink-0" />
              <span>Continue with Google</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
