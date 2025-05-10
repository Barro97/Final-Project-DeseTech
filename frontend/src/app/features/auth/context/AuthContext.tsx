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

  // Include other fields from the JWT payload like iat, exp, etc., if needed for typing
  // For example:
  // iat?: number;
  // exp?: number;
}

interface User {
  email: string;
  role: string;
  id: string;
  // Add other user properties as needed, derived or directly from token
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To handle initial loading of token from session storage

  useEffect(() => {
    const storedToken = sessionStorage.getItem("accessToken");
    if (storedToken) {
      try {
        const decoded = jwtDecode<DecodedToken>(storedToken);
        setUser({ email: decoded.email, role: decoded.role, id: decoded.id });
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
      const decoded = jwtDecode<DecodedToken>(newToken);
      sessionStorage.setItem("accessToken", newToken);
      setUser({ email: decoded.email, role: decoded.role, id: decoded.id });
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
    sessionStorage.removeItem("accessToken");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
