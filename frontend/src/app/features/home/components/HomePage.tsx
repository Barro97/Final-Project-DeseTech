"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext"; // Adjusted import path
import { useRouter } from "next/navigation"; // Corrected import for useRouter
import { useEffect } from "react";

function HomePage() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If still loading auth state or if there's no token (user not logged in), redirect to login
    // We check !isLoading to ensure we don't redirect before token is potentially loaded from session
    if (!isLoading && !token) {
      router.push("/login"); // Assuming your login page is at /login
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>; // Or some loading spinner
  }

  if (!user) {
    // This case should ideally be handled by the useEffect redirect,
    // but it's a good fallback or if you want to show a message before redirect.
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="container mx-auto mt-10">
      <h1 className="text-3xl font-bold">Welcome to the Home Page!</h1>
      {user && (
        <div className="mt-4">
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
          {/* Display other user information as needed */}
        </div>
      )}
      {token && (
        <p className="mt-2 text-sm text-gray-600">
          {/* Token: {token.substring(0, 30)}... */}
        </p>
      )}
      <button
        onClick={() => {
          logout();
          router.push("/login"); // Redirect to login after logout
        }}
        className="mt-6 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}

export default HomePage;
