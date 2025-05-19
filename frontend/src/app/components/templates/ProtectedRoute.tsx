"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { usePathname } from "next/navigation";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticatedRoute, setIsAuthenticatedRoute] = useState(false);

  useEffect(() => {
    // Check if current route is a public route (like login)
    const publicRoutes = ["/login", "/signup", "/forgot-password"];
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (!isLoading) {
      if (!user && !isPublicRoute) {
        // If user is not authenticated and not on a public route, redirect
        document.body.classList.remove("sidebar-visible");
        router.push("/login");
      } else if (user && !isPublicRoute) {
        // Only add sidebar-visible class if user is authenticated and not on public route
        document.body.classList.add("sidebar-visible");
        setIsAuthenticatedRoute(true);
      } else {
        // For public routes or unauthenticated users
        document.body.classList.remove("sidebar-visible");
        setIsAuthenticatedRoute(false);
      }
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove("sidebar-visible");
    };
  }, [user, isLoading, router, pathname]);

  if (isLoading) return <LoadingSpinner size="md" />;

  // Only render children when user is authenticated and we've confirmed we're on an authenticated route
  if (!user || !isAuthenticatedRoute) return null;

  return <>{children}</>;
}
