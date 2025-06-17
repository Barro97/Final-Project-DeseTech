import axios, { AxiosInstance, AxiosError } from "axios";

// Create axios instance
const httpClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND || "http://localhost:8000",
  timeout: 10000,
});

// Request interceptor to add auth token
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors globally
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle authentication errors globally
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log(
        "Authentication error detected, clearing session and redirecting to login"
      );

      // Clear localStorage (consistent with AuthContext)
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refresh_token");

      // Also clear sessionStorage in case there are any stale tokens
      sessionStorage.removeItem("accessToken");

      // Force redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;
