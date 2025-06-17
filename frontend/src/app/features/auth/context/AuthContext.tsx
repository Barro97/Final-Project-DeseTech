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
  const [isLoading, setIsLoading] = useState(true); // To handle initial loading of token from session storage

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

  useEffect(() => {
    const storedToken = sessionStorage.getItem("accessToken");
    if (storedToken) {
      try {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.log("Stored token is expired, clearing authentication");
          sessionStorage.removeItem("accessToken");
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
        console.error("Failed to decode token from session storage:", error);
        sessionStorage.removeItem("accessToken"); // Clear invalid token
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
      sessionStorage.setItem("accessToken", newToken);
      setUser({
        email: decoded.email,
        role: decoded.role,
        id: decoded.id,
        first_name: decoded.first_name,
        last_name: decoded.last_name,
      });
      setToken(newToken);
    } catch (error) {
      console.error("Failed to decode token:", error);
      // Handle login error, maybe clear token and user
      setUser(null);
      setToken(null);
      sessionStorage.removeItem("accessToken");
    }
  };

  const logout = () => {
    console.log("Logging out user - clearing session and redirecting");
    sessionStorage.removeItem("accessToken");
    setUser(null);
    setToken(null);
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
        console.log("Token expired, logging out user");
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
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
