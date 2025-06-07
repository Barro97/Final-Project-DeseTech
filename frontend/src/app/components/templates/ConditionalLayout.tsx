"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { usePathname } from "next/navigation";
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

  // Define public routes that don't need the sidebar
  const publicRoutes = ["/login", "/signup", "/forgot-password"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If it's a public route, render without sidebar
  if (isPublicRoute) {
    return <main className="flex-1">{children}</main>;
  }

  // If loading, show nothing to prevent flash
  if (isLoading) {
    return null;
  }

  // If user is not authenticated and not on a public route, don't render sidebar
  if (!user) {
    return <main className="flex-1">{children}</main>;
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
