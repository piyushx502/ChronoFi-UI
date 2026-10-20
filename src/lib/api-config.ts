/**
 * Configuration for connecting to the ChronoFi FastAPI Backend.
 * Reads BACKEND_URL or NEXT_PUBLIC_API_URL from environment variables,
 * falling back to local port 8000 for development.
 */
export const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";
