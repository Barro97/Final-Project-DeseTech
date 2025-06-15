import QueryProvider from "@/app/providers/QueryProvider";
import NextAuthProvider from "@/app/providers/NextAuthProvider";
import { Toaster } from "@/app/features/toaster/components/toaster";
import "./globals.css";
import { AuthProvider } from "@/app/features/auth/context/AuthContext";
import AuthSessionManager from "@/app/features/auth/components/AuthSessionManager";
import ConditionalLayout from "./components/templates/ConditionalLayout";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-background">
        <NextAuthProvider>
          <QueryProvider>
            <AuthProvider>
              <AuthSessionManager />
              <ConditionalLayout>
                <Suspense fallback={null}>{children}</Suspense>
              </ConditionalLayout>
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
