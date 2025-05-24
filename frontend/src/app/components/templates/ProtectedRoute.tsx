"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if current route is a public route (like login)
    const publicRoutes = ["/login", "/signup", "/forgot-password"];
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (!isLoading && !user && !isPublicRoute) {
      // If user is not authenticated and not on a public route, redirect
      router.push("/login");
    }
  }, [user, isLoading, router, pathname]);

  // Check if current route is a public route
  const publicRoutes = ["/login", "/signup", "/forgot-password"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Don't render sidebar-related content on public routes
  if (isPublicRoute) return null;

  // Don't render sidebar-related content if user is not authenticated (and not loading)
  if (!isLoading && !user) return null;

  return <>{children}</>;
}
