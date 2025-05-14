import QueryProvider from "@/app/providers/QueryProvider";
import { Toaster } from "@/app/features/toaster/components/toaster";
import "./globals.css";
import { AuthProvider } from "@/app/features/auth/context/AuthContext";

import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthSessionManager from "@/app/features/auth/components/AuthSessionManager";
import { ModalController } from "./components/ModalController";

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
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
            </SidebarProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
