"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarInset,
} from "../organisms/sidebar";
import { ModalController } from "../organisms/ModalController";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Define public routes that don't need the sidebar
  const publicRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/auth/oauth-callback",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes to login
  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) {
      console.log(
        "User not authenticated, redirecting to login from:",
        pathname
      );
      router.push("/login");
    }
  }, [user, isLoading, isPublicRoute, pathname, router]);

  // If it's a public route, render without sidebar
  if (isPublicRoute) {
    return <main className="flex-1">{children}</main>;
  }

  // If loading, show nothing to prevent flash
  if (isLoading) {
    return null;
  }

  // If user is not authenticated and not on a public route, show nothing while redirecting
  if (!user) {
    return null;
  }

  // User is authenticated, render with sidebar
  return (
    <SidebarProvider>
      <Sidebar>
        <ModalController />
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
