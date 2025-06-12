// Configuration utility with fallbacks
export const config = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND || "http://localhost:8000",
} as const;
