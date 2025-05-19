import QueryProvider from "@/app/providers/QueryProvider";
import { Toaster } from "@/app/features/toaster/components/toaster";
import "./globals.css";
import { AuthProvider } from "@/app/features/auth/context/AuthContext";

import {
  SidebarProvider,
  SidebarTrigger,
} from "./components/organisms/sidebar";
import ProtectedRoute from "./components/templates/ProtectedRoute";
import AuthSessionManager from "@/app/features/auth/components/AuthSessionManager";
import { ModalController } from "./components/organisms/ModalController";
import { Suspense } from "react";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-background">
        <QueryProvider>
          <AuthProvider>
            <SidebarProvider>
              <div className="flex flex-1">
                <ProtectedRoute>
                  <ModalController />
                  <div className="sidebar">
                    <SidebarTrigger />
                  </div>
                </ProtectedRoute>
                <AuthSessionManager />
                <main className="flex-1">
                  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
                </main>
              </div>
              <Toaster />
            </SidebarProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
