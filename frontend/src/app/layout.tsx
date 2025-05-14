import QueryProvider from "@/app/providers/QueryProvider";
import { Toaster } from "@/app/features/toaster/components/toaster";
import "./globals.css";
import { AuthProvider } from "@/app/features/auth/context/AuthContext";
import AuthSessionManager from "@/app/features/auth/components/AuthSessionManager";
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
            <AuthSessionManager />
            <main>{children}</main>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
