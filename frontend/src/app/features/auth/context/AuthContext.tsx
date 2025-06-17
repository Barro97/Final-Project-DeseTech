"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode"; // Corrected import

interface DecodedToken {
  email: string;
  role: string;
  id: string;
  first_name?: string;
  last_name?: string;
  exp?: number; // Add expiration time
  // Include other fields from the JWT payload like iat, exp, etc., if needed for typing
  // For example:
  // iat?: number;
  // exp?: number;
}

interface User {
  email: string;
  role: string;
  id: string;
  first_name?: string;
  last_name?: string;
  // Add other user properties as needed, derived or directly from token
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  isCurrentTokenValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To handle initial loading of token from localStorage

  // Helper function to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (!decoded.exp) return false; // If no expiration, assume it's valid

      const currentTime = Date.now() / 1000; // Convert to seconds
      return decoded.exp < currentTime;
    } catch {
      return true; // If we can't decode it, consider it expired
    }
  };

  // Clear all authentication data
  const clearAuthData = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token"); // Clear old key if it exists
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("accessToken"); // Clear old sessionStorage if it exists
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    // Clear any stale sessionStorage tokens first
    const oldSessionToken = sessionStorage.getItem("accessToken");
    if (oldSessionToken) {
      sessionStorage.removeItem("accessToken");
    }

    const storedToken = localStorage.getItem("accessToken");

    if (storedToken) {
      try {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          clearAuthData();
          setIsLoading(false);
          return;
        }

        const decoded = jwtDecode<DecodedToken>(storedToken);

        setUser({
          email: decoded.email,
          role: decoded.role,
          id: decoded.id,
          first_name: decoded.first_name,
          last_name: decoded.last_name,
        });
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to decode token from localStorage:", error);
        clearAuthData();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    try {
      // Check if new token is expired
      if (isTokenExpired(newToken)) {
        console.error("Cannot login with expired token");
        return;
      }

      const decoded = jwtDecode<DecodedToken>(newToken);

      localStorage.setItem("accessToken", newToken);

      setUser({
        email: decoded.email,
        role: decoded.role,
        id: decoded.id,
        first_name: decoded.first_name,
        last_name: decoded.last_name,
      });
      setToken(newToken);
    } catch (error) {
      console.error("Failed to decode token during login:", error);
      // Handle login error, maybe clear token and user
      clearAuthData();
    }
  };

  const logout = () => {
    clearAuthData();
    // Force redirect to login page
    window.location.href = "/login";
  };

  // Method to check if current token is valid
  const isCurrentTokenValid = (): boolean => {
    if (!token) return false;
    return !isTokenExpired(token);
  };

  // Periodically check if token is expired (check every minute)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [token]);

  // Listen for storage changes to sync authentication across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        if (e.newValue === null) {
          // Token was removed in another tab
          setUser(null);
          setToken(null);
        } else if (e.newValue && e.newValue !== token) {
          // Token was updated in another tab
          try {
            if (!isTokenExpired(e.newValue)) {
              const decoded = jwtDecode<DecodedToken>(e.newValue);
              setUser({
                email: decoded.email,
                role: decoded.role,
                id: decoded.id,
                first_name: decoded.first_name,
                last_name: decoded.last_name,
              });
              setToken(e.newValue);
            }
          } catch (error) {
            console.error("Failed to decode token from storage event:", error);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isLoading, isCurrentTokenValid }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
