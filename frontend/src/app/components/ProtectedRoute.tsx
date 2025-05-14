"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "./ui/loading-spinner";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      document.body.classList.remove("sidebar-visible");
    } else if (user) {
      document.body.classList.add("sidebar-visible");
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove("sidebar-visible");
    };
  }, [user, isLoading, router]);

  if (isLoading) return <LoadingSpinner size="md" />;
  if (!user) return null;

  return <>{children}</>;
}
