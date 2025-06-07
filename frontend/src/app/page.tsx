"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is authenticated, redirect to home
        router.push("/home");
      } else {
        // User is not authenticated, redirect to login
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  // Show nothing while loading or redirecting
  return null;
}
