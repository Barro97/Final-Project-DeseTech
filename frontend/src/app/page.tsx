"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const testBackendConnection = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8000/");
      const data = await response.json();
      setMessage(data.message);
    } catch {
      setError(
        "Failed to connect to the backend. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">
        Frontend-Backend Connection Test
      </h1>

      <button
        onClick={testBackendConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 mb-4"
      >
        {loading ? "Testing..." : "Test Backend Connection"}
      </button>

      {message && (
        <div className="p-4 bg-green-100 text-green-700 rounded mb-4">
          Response from backend: {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}
    </div>
  );
}
