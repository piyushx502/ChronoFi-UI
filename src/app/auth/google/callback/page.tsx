"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState("Finalizing Google authentication...");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    try {
      // 1. Extract parameters from hash (#id_token=...) or query string (?credential=...)
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const queryParams = new URLSearchParams(window.location.search);

      const idToken =
        hashParams.get("id_token") ||
        hashParams.get("credential") ||
        queryParams.get("id_token") ||
        queryParams.get("credential");

      const authError =
        hashParams.get("error") ||
        queryParams.get("error") ||
        hashParams.get("error_description") ||
        queryParams.get("error_description");

      if (authError) {
        const errorDetail = authError.replace(/_/g, " ");
        if (window.opener) {
          window.opener.postMessage(
            { type: "GOOGLE_AUTH_ERROR", error: errorDetail },
            window.location.origin
          );
          window.close();
          return;
        }
        setErrorMessage(errorDetail);
        setStatusText("Authentication error");
        setTimeout(() => router.push("/"), 2500);
        return;
      }

      if (!idToken) {
        const msg = "No identity token received from Google.";
        if (window.opener) {
          window.opener.postMessage(
            { type: "GOOGLE_AUTH_ERROR", error: msg },
            window.location.origin
          );
          window.close();
          return;
        }
        setErrorMessage(msg);
        setStatusText("Authentication failed");
        setTimeout(() => router.push("/"), 2500);
        return;
      }

      // If opened in popup by LoginPage, post message back to opener
      if (window.opener) {
        window.opener.postMessage(
          { type: "GOOGLE_AUTH_SUCCESS", id_token: idToken },
          window.location.origin
        );
        setStatusText("Authenticated! Closing popup...");
        window.close();
        return;
      }

      // If full-page redirect fallback was used (no window.opener)
      const completeDirectAuth = async () => {
        try {
          setStatusText("Verifying token with ChronoFi security server...");
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: idToken }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.detail || "Google authentication failed");
          }

          if (!data.access_token) {
            throw new Error("Missing authentication token from server response");
          }

          localStorage.setItem("token", data.access_token);
          localStorage.setItem("username", data.email || data.name || "Google User");
          setStatusText("Success! Navigating to dashboard...");
          window.location.href = "/dashboard";
        } catch (err: unknown) {
          setErrorMessage((err as Error).message || "Verification failed");
          setStatusText("Authentication failed");
          setTimeout(() => router.push("/"), 3000);
        }
      };

      completeDirectAuth();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "An unexpected error occurred");
      setStatusText("Authentication failed");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm p-6 border border-zinc-800 rounded-xl bg-zinc-900/60 backdrop-blur-sm text-center">
        <div className="flex justify-center mb-4">
          {!errorMessage ? (
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
              !
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-zinc-200 mb-1">{statusText}</p>
        {errorMessage && (
          <p className="text-xs text-red-400 mt-2 font-mono">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
