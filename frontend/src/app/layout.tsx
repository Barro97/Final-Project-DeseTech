import QueryProvider from "@/app/providers/QueryProvider";
import { Toaster } from "@/app/features/toaster/components/toaster";
import "./globals.css";
import { AuthProvider } from "@/app/features/auth/context/AuthContext";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            <SidebarProvider>
              <AppSidebar />
              <main>
                <SidebarTrigger />
                {children}
              </main>
              <Toaster />
            </SidebarProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
