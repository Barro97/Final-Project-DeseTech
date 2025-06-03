"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useState } from "react";

interface TokenInfo {
  [key: string]: unknown;
}

interface AdminTestResult {
  status?: number;
  statusText?: string;
  data?: unknown;
  error?: string;
}

interface PromotionResult {
  message?: string;
  user_id?: number;
  new_role?: string;
  error?: string;
}

export default function DebugAuthPage() {
  const { user, token } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [adminTestResult, setAdminTestResult] =
    useState<AdminTestResult | null>(null);
  const [promotionResult, setPromotionResult] =
    useState<PromotionResult | null>(null);

  const decodeToken = () => {
    if (token) {
      try {
        // Simple JWT decode (not secure but fine for debugging)
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );

        const decoded = JSON.parse(jsonPayload) as TokenInfo;
        setTokenInfo(decoded);
      } catch {
        setTokenInfo({ error: "Failed to decode token" });
      }
    }
  };

  const testAdminEndpoint = async () => {
    try {
      const response = await fetch("http://localhost:8000/admin/health", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result: AdminTestResult = {
        status: response.status,
        statusText: response.statusText,
        data: response.ok ? await response.json() : await response.text(),
      };

      setAdminTestResult(result);
    } catch (error) {
      setAdminTestResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const testAdminStats = async () => {
    try {
      const response = await fetch("http://localhost:8000/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result: AdminTestResult = {
        status: response.status,
        statusText: response.statusText,
        data: response.ok ? await response.json() : await response.text(),
      };

      setAdminTestResult(result);
    } catch (error) {
      setAdminTestResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const testPendingDatasets = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/admin/datasets/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result: AdminTestResult = {
        status: response.status,
        statusText: response.statusText,
        data: response.ok ? await response.json() : await response.text(),
      };

      setAdminTestResult(result);
    } catch (error) {
      setAdminTestResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const makeMeAdmin = async () => {
    try {
      const response = await fetch("http://localhost:8000/auth/make-me-admin", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      setPromotionResult(result);

      if (response.ok) {
        // Force re-login to get new token with admin role
        alert(
          "You are now an admin! Please log out and log back in to get your new admin token."
        );
      }
    } catch (error) {
      setPromotionResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>

      <div className="space-y-6">
        {/* User State */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Current User State</h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* Token State */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Token State</h2>
          <p className="mb-4">
            <strong>Token exists:</strong> {token ? "Yes" : "No"}
          </p>
          {token && (
            <>
              <p className="mb-4">
                <strong>Token (first 50 chars):</strong>{" "}
                {token.substring(0, 50)}...
              </p>
              <button
                onClick={decodeToken}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Decode Token
              </button>
              {tokenInfo && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Decoded Token:</h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(tokenInfo, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Admin Promotion */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
            Admin Promotion (Debug Only)
          </h2>
          <p className="mb-4 text-yellow-700 dark:text-yellow-300">
            If your role is not &quot;admin&quot;, click below to promote
            yourself to admin role:
          </p>
          <button
            onClick={makeMeAdmin}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 mr-4"
            disabled={!token}
          >
            Make Me Admin
          </button>
          {promotionResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Promotion Result:</h3>
              <pre className="bg-yellow-100 dark:bg-yellow-900/40 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(promotionResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* SessionStorage Debug */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">SessionStorage Debug</h2>
          <p>
            <strong>sessionStorage accessToken:</strong>{" "}
            {typeof window !== "undefined"
              ? sessionStorage.getItem("accessToken")
                ? "Exists"
                : "Not found"
              : "SSR"}
          </p>
          <p>
            <strong>localStorage access_token:</strong>{" "}
            {typeof window !== "undefined"
              ? localStorage.getItem("access_token")
                ? "Exists"
                : "Not found"
              : "SSR"}
          </p>
        </div>

        {/* Admin Test */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Admin Endpoint Test</h2>
          <div className="space-x-2 mb-4">
            <button
              onClick={testAdminEndpoint}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              disabled={!token}
            >
              Test Admin Health
            </button>
            <button
              onClick={testAdminStats}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={!token}
            >
              Test Admin Stats
            </button>
            <button
              onClick={testPendingDatasets}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              disabled={!token}
            >
              Test Pending Datasets
            </button>
          </div>
          {adminTestResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Admin Test Result:</h3>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(adminTestResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
