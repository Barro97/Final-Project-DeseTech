import QueryProvider from "@/app/providers/QueryProvider";
import { Toaster } from "@/app/features/toaster/components/toaster";
import "./globals.css";
import { AuthProvider } from "@/app/features/auth/context/AuthContext";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

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
                  <AppSidebar />
                  <SidebarTrigger />
                </ProtectedRoute>
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
